const mongoose = require("mongoose");
const User = require("../models/User");
const QuickBooking = require("../models/QuickBooking");
const UserVoucher = require("../models/UserVoucher");

const BOOKING_COLLECTION = "đặt vé nhanh";
/** User được coi là online nếu ping trong khoảng này */
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

const success = (res, message, data, extra = {}) =>
  res.status(200).json({success: true, message, data, ...extra});

const fail = (res, status, message) =>
  res.status(status).json({success: false, message});

const toObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const mapProvider = (authProvider) =>
  authProvider === "google" ? "google" : "local";

const onlineSince = () => new Date(Date.now() - ONLINE_WINDOW_MS);

const isUserOnline = (doc) => {
  if (!doc?.lastSeen) return false;
  if (
    doc.forcedOfflineAt &&
    new Date(doc.forcedOfflineAt).getTime() >= new Date(doc.lastSeen).getTime()
  ) {
    return false;
  }
  return new Date(doc.lastSeen).getTime() >= Date.now() - ONLINE_WINDOW_MS;
};

/** Chưa soft-delete (kể cả user cũ không có field deleted) */
const notDeletedMatch = {
  $or: [{deleted: false}, {deleted: {$exists: false}}, {deleted: null}],
};

/** Email/mật khẩu: local hoặc thiếu authProvider (user cũ) */
const emailProviderMatch = {
  $or: [
    {authProvider: "local"},
    {authProvider: {$exists: false}},
    {authProvider: null},
    {authProvider: ""},
  ],
};

const googleProviderMatch = {authProvider: "google"};

/** Tài khoản không bị khóa */
const unlockedStatusMatch = {
  $or: [
    {status: "active"},
    {status: {$exists: false}},
    {status: null},
    {status: ""},
  ],
};

const lockedStatusMatch = {status: "blocked"};

const onlineMatch = () => ({
  lastSeen: {$gte: onlineSince()},
  $or: [
    {forcedOfflineAt: null},
    {forcedOfflineAt: {$exists: false}},
    {$expr: {$lt: ["$forcedOfflineAt", "$lastSeen"]}},
  ],
});

const formatUser = (doc, extras = {}) => {
  if (!doc) return null;
  const raw = doc.toObject ? doc.toObject() : {...doc};
  delete raw.password;
  const accountStatus = raw.status === "blocked" ? "blocked" : "active";
  const online = accountStatus !== "blocked" && isUserOnline(raw);
  return {
    ...raw,
    authProvider: mapProvider(raw.authProvider),
    provider: mapProvider(raw.authProvider),
    status: accountStatus,
    isOnline: online,
    totalOrders: extras.totalOrders ?? raw.totalOrders ?? 0,
    totalTickets: extras.totalTickets ?? raw.totalTickets ?? 0,
    totalSpent: extras.totalSpent ?? raw.totalSpent ?? 0,
    availableVouchers: extras.availableVouchers ?? raw.availableVouchers ?? 0,
    recentOrders: extras.recentOrders ?? raw.recentOrders ?? undefined,
  };
};

const buildMatch = (query) => {
  const {keyword, provider, status, role, online} = query;
  const and = [notDeletedMatch];

  if (online === "1" || online === "true") {
    and.push(onlineMatch());
    and.push(unlockedStatusMatch);
  } else if (status === "active") {
    and.push(unlockedStatusMatch);
  } else if (status === "blocked") {
    and.push(lockedStatusMatch);
  }

  if (role === "user" || role === "admin") {
    and.push({role});
  }

  if (provider === "google") {
    and.push(googleProviderMatch);
  } else if (provider === "local" || provider === "email") {
    and.push(emailProviderMatch);
  }

  if (keyword && String(keyword).trim()) {
    const q = String(keyword).trim();
    and.push({
      $or: [
        {fullName: {$regex: q, $options: "i"}},
        {email: {$regex: q, $options: "i"}},
        {phone: {$regex: q, $options: "i"}},
      ],
    });
  }

  return and.length === 1 ? and[0] : {$and: and};
};

const bookingStatsLookup = [
  {
    $lookup: {
      from: BOOKING_COLLECTION,
      let: {userId: "$_id"},
      pipeline: [
        {
          $match: {
            $expr: {$eq: ["$user", "$$userId"]},
            status: {$in: ["paid", "pending"]},
          },
        },
        {
          $group: {
            _id: null,
            totalOrders: {$sum: 1},
            totalTickets: {
              $sum: {
                $cond: [
                  {$eq: ["$status", "paid"]},
                  {$size: {$ifNull: ["$seats", []]}},
                  0,
                ],
              },
            },
            totalSpent: {
              $sum: {
                $cond: [{$eq: ["$status", "paid"]}, {$ifNull: ["$totalPrice", 0]}, 0],
              },
            },
          },
        },
      ],
      as: "bookingStats",
    },
  },
  {
    $addFields: {
      totalOrders: {
        $ifNull: [{$arrayElemAt: ["$bookingStats.totalOrders", 0]}, 0],
      },
      totalTickets: {
        $ifNull: [{$arrayElemAt: ["$bookingStats.totalTickets", 0]}, 0],
      },
      totalSpent: {
        $ifNull: [{$arrayElemAt: ["$bookingStats.totalSpent", 0]}, 0],
      },
    },
  },
  {$project: {bookingStats: 0, password: 0}},
];

const resolveSort = (sortKey) => {
  switch (sortKey) {
    case "oldest":
      return {createdAt: 1, _id: 1};
    case "mostTickets":
      return {totalTickets: -1, createdAt: -1};
    case "highestSpend":
      return {totalSpent: -1, createdAt: -1};
    case "newest":
    default:
      return {createdAt: -1, _id: -1};
  }
};

const getUserStats = async (_req, res) => {
  try {
    // Chuẩn hóa user cũ: thiếu authProvider → local (Email)
    await User.updateMany(
      {
        $or: [
          {authProvider: {$exists: false}},
          {authProvider: null},
          {authProvider: ""},
        ],
      },
      {$set: {authProvider: "local"}},
    );
    await User.updateMany(
      {
        $or: [{status: {$exists: false}}, {status: null}, {status: ""}],
      },
      {$set: {status: "active"}},
    );

    const [totalUsers, activeUsers, lockedUsers, googleUsers, emailUsers] =
      await Promise.all([
        User.countDocuments(notDeletedMatch),
        User.countDocuments({
          $and: [notDeletedMatch, unlockedStatusMatch, onlineMatch()],
        }),
        User.countDocuments({$and: [notDeletedMatch, lockedStatusMatch]}),
        User.countDocuments({$and: [notDeletedMatch, googleProviderMatch]}),
        User.countDocuments({$and: [notDeletedMatch, emailProviderMatch]}),
      ]);

    return success(res, "Thống kê người dùng", {
      totalUsers,
      activeUsers,
      onlineUsers: activeUsers,
      lockedUsers,
      googleUsers,
      emailUsers,
      onlineWindowSec: ONLINE_WINDOW_MS / 1000,
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const listUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const match = buildMatch(req.query);
    const sort = resolveSort(req.query.sort);

    const pipeline = [
      {$match: match},
      ...bookingStatsLookup,
      {$sort: sort},
      {
        $facet: {
          items: [{$skip: skip}, {$limit: limit}],
          total: [{$count: "count"}],
        },
      },
    ];

    const [result] = await User.aggregate(pipeline);
    const items = (result?.items || []).map((item) =>
      formatUser({
        ...item,
        provider: mapProvider(item.authProvider),
      }),
    );
    const total = result?.total?.[0]?.count || 0;

    return success(res, "Danh sách người dùng", items, {
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const getUserBookingExtras = async (userId) => {
  const oid = toObjectId(userId);
  const [stats] = await QuickBooking.aggregate([
    {
      $match: {
        user: oid,
        status: {$in: ["paid", "pending"]},
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: {$sum: 1},
        totalTickets: {
          $sum: {
            $cond: [
              {$eq: ["$status", "paid"]},
              {$size: {$ifNull: ["$seats", []]}},
              0,
            ],
          },
        },
        totalSpent: {
          $sum: {
            $cond: [{$eq: ["$status", "paid"]}, {$ifNull: ["$totalPrice", 0]}, 0],
          },
        },
      },
    },
  ]);

  const recentOrders = await QuickBooking.find({user: oid})
    .sort({createdAt: -1})
    .limit(5)
    .select("code movieTitle seats totalPrice status createdAt bookingDate bookingTime checkedIn")
    .lean();

  const availableVouchers = await UserVoucher.countDocuments({
    user: oid,
    status: "available",
  });

  return {
    totalOrders: stats?.totalOrders || 0,
    totalTickets: stats?.totalTickets || 0,
    totalSpent: stats?.totalSpent || 0,
    availableVouchers,
    recentOrders: recentOrders.map((order) => ({
      ...order,
      ticketCount: Array.isArray(order.seats) ? order.seats.length : 0,
    })),
  };
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      ...notDeletedMatch,
    })
      .populate("lockedBy", "fullName email")
      .populate("unlockedBy", "fullName email")
      .select("-password");

    if (!user) {
      return fail(res, 404, "Không tìm thấy người dùng");
    }

    const extras = await getUserBookingExtras(user._id);
    return success(res, "Chi tiết người dùng", formatUser(user, extras));
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      ...notDeletedMatch,
    });
    if (!user) {
      return fail(res, 404, "Không tìm thấy người dùng");
    }

    const {fullName, phone, gender, birthDate, role} = req.body;

    if (typeof fullName === "string") {
      const trimmed = fullName.trim();
      if (!trimmed) {
        return fail(res, 400, "Họ tên không được để trống");
      }
      user.fullName = trimmed;
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    if (typeof gender === "string") {
      user.gender = gender.trim();
    }

    if (birthDate === null || birthDate === "") {
      user.birthDate = null;
    } else if (birthDate !== undefined) {
      const parsed = new Date(birthDate);
      if (Number.isNaN(parsed.getTime())) {
        return fail(res, 400, "Ngày sinh không hợp lệ");
      }
      user.birthDate = parsed;
    }

    if (role === "user" || role === "admin") {
      if (String(user._id) === String(req.user._id) && role !== "admin") {
        return fail(res, 400, "Không thể tự hạ quyền admin của chính mình");
      }
      user.role = role;
    }

    await user.save();
    const extras = await getUserBookingExtras(user._id);
    return success(res, "Cập nhật người dùng thành công", formatUser(user, extras));
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const lockUser = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();
    if (!reason) {
      return fail(res, 400, "Vui lòng nhập lý do khóa tài khoản");
    }

    if (String(req.params.id) === String(req.user._id)) {
      return fail(res, 400, "Không thể khóa tài khoản đang đăng nhập");
    }

    const user = await User.findOne({
      _id: req.params.id,
      ...notDeletedMatch,
    });
    if (!user) {
      return fail(res, 404, "Không tìm thấy người dùng");
    }

    user.status = "blocked";
    user.lockedReason = reason;
    user.lockedAt = new Date();
    user.lockedBy = req.user._id;
    await user.save();

    return success(res, "Đã khóa tài khoản", formatUser(user));
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const unlockUser = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      ...notDeletedMatch,
    });
    if (!user) {
      return fail(res, 404, "Không tìm thấy người dùng");
    }

    user.status = "active";
    user.unlockedAt = new Date();
    user.unlockedBy = req.user._id;
    await user.save();

    return success(res, "Đã mở khóa tài khoản", formatUser(user));
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

const exportUsers = async (req, res) => {
  try {
    const match = buildMatch(req.query);
    const sort = resolveSort(req.query.sort || "newest");
    const items = await User.aggregate([
      {$match: match},
      ...bookingStatsLookup,
      {$sort: sort},
      {$limit: 5000},
    ]);

    const rows = items.map((item) => ({
      fullName: item.fullName || "",
      email: item.email || "",
      phone: item.phone || "",
      provider: mapProvider(item.authProvider),
      totalTickets: item.totalTickets || 0,
      totalSpent: item.totalSpent || 0,
      status: item.status === "blocked" ? "Bị khóa" : "Hoạt động",
    }));

    return success(res, "Export người dùng", rows);
  } catch (error) {
    return fail(res, 500, error.message);
  }
};

module.exports = {
  getUserStats,
  listUsers,
  getUserById,
  updateUser,
  lockUser,
  unlockUser,
  exportUsers,
};

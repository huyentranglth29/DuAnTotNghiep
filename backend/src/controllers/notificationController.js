const Notification = require("../models/Notification");

const serialize = (item, userId) => ({
  ...item,
  isRead: userId ? (item.readBy || []).some(id => String(id) === String(userId)) : false,
});

exports.getAll = async (req, res, next) => {
  try {
    const filter = req.user
      ? {
          $or: [
            { user: null },
            { user: { $exists: false } },
            { user: req.user._id },
          ],
        }
      : { $or: [{ user: null }, { user: { $exists: false } }] };
    const rows = await Notification.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    res.json({ success: true, data: rows.map(row => serialize(row, req.user?._id)) });
  } catch (error) { next(error); }
};

exports.getById = async (req, res, next) => {
  try {
    const row = await Notification.findById(req.params.id).lean();
    if (!row) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    if (row.user && String(row.user) !== String(req.user?._id)) return res.status(403).json({ success: false, message: "Không có quyền xem thông báo" });
    res.json({ success: true, data: serialize(row, req.user?._id) });
  } catch (error) { next(error); }
};

exports.markRead = async (req, res, next) => {
  try {
    const row = await Notification.findOneAndUpdate(
      { _id: req.params.id, $or: [{ user: null }, { user: req.user._id }] },
      { $addToSet: { readBy: req.user._id } }, { returnDocument: "after" }
    ).lean();
    if (!row) return res.status(404).json({ success: false, message: "Không tìm thấy thông báo" });
    res.json({ success: true, data: serialize(row, req.user._id) });
  } catch (error) { next(error); }
};

exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { $or: [{ user: null }, { user: req.user._id }] },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true, message: "Đã đọc tất cả thông báo" });
  } catch (error) { next(error); }
};

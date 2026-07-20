const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_SECRET is not configured",
      });
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Không có token",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Người dùng không tồn tại",
      });
    }

    if (user.deleted) {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị xóa",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    req.user = user;

    // Cập nhật online (throttle 20s) — không chặn request
    const lastSeenAt = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    if (Date.now() - lastSeenAt > 20 * 1000) {
      User.updateOne({_id: user._id}, {$set: {lastSeen: new Date()}}).catch(() => {});
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token không hợp lệ",
    });
  }
};

module.exports = authMiddleware;

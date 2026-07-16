const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = async (req, _res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ") || !process.env.JWT_SECRET) return next();
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId || decoded.id).select("-password");
  } catch (_) {
    req.user = null;
  }
  next();
};

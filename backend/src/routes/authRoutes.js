
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  googleLogin,
  setPassword,
  profile,
  updateProfile,
  heartbeat,
  goOffline,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Đăng nhập bằng Google
router.post("/google", googleLogin);
router.post("/google-login", googleLogin);
router.post("/set-password", authMiddleware, setPassword);

// Lấy / cập nhật thông tin cá nhân
router.get("/profile", authMiddleware, profile);
router.put("/profile", authMiddleware, updateProfile);
router.post("/heartbeat", authMiddleware, heartbeat);
router.post("/offline", authMiddleware, goOffline);

module.exports = router;

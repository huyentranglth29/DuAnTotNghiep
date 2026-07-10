
const express = require("express");
const router = express.Router();

const {
  register,
  login,
  profile,
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");

// Đăng ký
router.post("/register", register);

// Đăng nhập
router.post("/login", login);

// Lấy thông tin cá nhân
router.get("/profile", authMiddleware, profile);

module.exports = router;

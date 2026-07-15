const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  listActive,
  validate,
  claim,
  myVouchers,
  myHistory,
} = require("../controllers/userVoucherController");

const router = express.Router();

// Public — app user / đặt vé dùng được không cần admin
router.get("/active", listActive);
router.post("/validate", validate);

// User đã đăng nhập
router.get("/mine", authMiddleware, myVouchers);
router.post("/claim", authMiddleware, claim);
router.get("/history", authMiddleware, myHistory);

module.exports = router;

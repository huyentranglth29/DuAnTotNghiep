const express = require("express");
const controller = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

// Khách chưa đăng nhập vẫn được xem các đánh giá đã duyệt.
router.get("/", controller.getApproved);
router.get("/eligibility", optionalAuthMiddleware, controller.checkEligibility);
// ID người đánh giá luôn được lấy từ token, không nhận từ phía ứng dụng.
router.get("/mine", authMiddleware, controller.getMine);
router.post("/", authMiddleware, controller.saveMine);

module.exports = router;

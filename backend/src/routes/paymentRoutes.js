const express = require("express");
const controller = require("../controllers/paymentController");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
router.use(optionalAuthMiddleware);

router.post("/mock/create", authMiddleware, controller.createMockPayment);
router.post("/mock/:id/complete", authMiddleware, controller.completeMockPayment);
router.post("/mock/:id/fail", authMiddleware, controller.failMockPayment);
router.post("/vnpay/create", authMiddleware, controller.createVnpayPayment);
router.get("/vnpay/ipn", controller.vnpayIpn);
router.get("/vnpay/return", controller.vnpayReturn);
router.get("/:id/status", authMiddleware, controller.getPaymentStatus);
router.post("/:id/cancel", authMiddleware, controller.cancelPayment);

module.exports = router;

const express = require("express");
const controller = require("../controllers/paymentController");

const router = express.Router();

router.post("/mock/create", controller.createMockPayment);
router.post("/mock/:id/complete", controller.completeMockPayment);
router.post("/mock/:id/fail", controller.failMockPayment);
router.post("/vnpay/create", controller.createVnpayPayment);
router.get("/vnpay/ipn", controller.vnpayIpn);
router.get("/vnpay/return", controller.vnpayReturn);
router.get("/:id/status", controller.getPaymentStatus);
router.post("/:id/cancel", controller.cancelPayment);

module.exports = router;

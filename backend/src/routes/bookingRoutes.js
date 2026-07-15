const express = require("express");
const controller = require("../controllers/bookingController");
const { checkout, myBookings } = require("../controllers/userVoucherController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

// User
router.post("/checkout", authMiddleware, checkout);
router.get("/mine", authMiddleware, myBookings);

// Admin CRUD
router.get("/", authMiddleware, adminMiddleware, controller.getAll);
router.post("/", authMiddleware, adminMiddleware, controller.create);
router.get("/:id", authMiddleware, adminMiddleware, controller.getById);
router.put("/:id", authMiddleware, adminMiddleware, controller.update);
router.delete("/:id", authMiddleware, adminMiddleware, controller.remove);

module.exports = router;

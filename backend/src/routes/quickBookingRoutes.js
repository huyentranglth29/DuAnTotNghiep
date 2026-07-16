const express = require("express");
const controller = require("../controllers/quickBookingController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/sold-seats", controller.getSoldSeats);
router.get("/mine", authMiddleware, controller.getMine);
router.post("/", authMiddleware, controller.create);
router.get("/", authMiddleware, adminMiddleware, controller.getAll);
router.delete("/:id", authMiddleware, adminMiddleware, controller.remove);

module.exports = router;

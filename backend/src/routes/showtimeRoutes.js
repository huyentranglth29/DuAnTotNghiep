const express = require("express");
const router = express.Router();

const {
  getShowtimes,
  getShowtimeById,
  getShowtimeSeats,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} = require("../controllers/showtimeController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

router.get("/", getShowtimes);
router.get("/:id/seats", getShowtimeSeats);
router.get("/:id", getShowtimeById);
router.post("/", authMiddleware, adminMiddleware, createShowtime);
router.put("/:id", authMiddleware, adminMiddleware, updateShowtime);
router.delete("/:id", authMiddleware, adminMiddleware, deleteShowtime);

module.exports = router;

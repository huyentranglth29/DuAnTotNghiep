const express = require("express");
const router = express.Router();

const {
  getShowtimes,
  getShowtimeById,
  createShowtime,
  updateShowtime,
  deleteShowtime,
} = require("../controllers/showtimeController");

router.get("/", getShowtimes);
router.get("/:id", getShowtimeById);
router.post("/", createShowtime);
router.put("/:id", updateShowtime);
router.delete("/:id", deleteShowtime);

module.exports = router;

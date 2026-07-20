const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { holdSeats, releaseSeats } = require("../controllers/seatHoldController");

const router = express.Router();
router.use(authMiddleware);
router.post("/", holdSeats);
router.delete("/:holdToken", releaseSeats);
router.delete("/", releaseSeats);

module.exports = router;

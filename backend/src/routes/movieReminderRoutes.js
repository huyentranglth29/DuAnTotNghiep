const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const controller = require("../controllers/movieReminderController");

const router = express.Router();
router.use(authMiddleware);
router.get("/", controller.list);
router.post("/:movieId", controller.subscribe);
router.delete("/:movieId", controller.unsubscribe);

module.exports = router;

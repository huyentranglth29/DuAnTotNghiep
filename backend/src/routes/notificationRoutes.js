const express = require("express");
const controller = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.get("/", optionalAuthMiddleware, controller.getAll);
router.post("/read-all", authMiddleware, controller.markAllRead);
router.post("/:id/read", authMiddleware, controller.markRead);
router.get("/:id", optionalAuthMiddleware, controller.getById);

router.use(authMiddleware, adminMiddleware);

// CRUD quản trị thông báo đi qua /api/admin/notifications.

module.exports = router;

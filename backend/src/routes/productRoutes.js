const express = require("express");
const controller = require("../controllers/productController");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.use(authMiddleware, adminMiddleware);

router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

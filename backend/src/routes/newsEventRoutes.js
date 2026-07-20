const router = require("express").Router();
const controller = require("../controllers/newsEventController");

router.get("/", controller.listPublished);
router.get("/:id", controller.getPublishedById);

module.exports = router;

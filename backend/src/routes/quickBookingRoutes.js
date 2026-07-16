const express = require("express");
const controller = require("../controllers/quickBookingController");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/sold-seats", controller.getSoldSeats);
router.post("/", controller.create);
router.delete("/:id", controller.remove);

module.exports = router;

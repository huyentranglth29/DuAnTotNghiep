const Seat = require("../models/Seat");
const createCrudController = require("./crudController");

module.exports = createCrudController(Seat, { populate: "room" });

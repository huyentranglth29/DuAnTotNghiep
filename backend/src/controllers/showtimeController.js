const Showtime = require("../models/Showtime");
const createCrudController = require("./crudController");

module.exports = createCrudController(Showtime, { populate: "movie room" });

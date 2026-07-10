const Ticket = require("../models/Ticket");
const createCrudController = require("./crudController");

module.exports = createCrudController(Ticket, { populate: "booking showtime seat" });

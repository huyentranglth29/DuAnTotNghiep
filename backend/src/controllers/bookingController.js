const Booking = require("../models/Booking");
const createCrudController = require("./crudController");

module.exports = createCrudController(Booking, { populate: "user showtime seats voucher" });

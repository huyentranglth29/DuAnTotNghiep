const Notification = require("../models/Notification");
const createCrudController = require("./crudController");

module.exports = createCrudController(Notification);

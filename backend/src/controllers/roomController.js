const Room = require("../models/Room");
const createCrudController = require("./crudController");

module.exports = createCrudController(Room);

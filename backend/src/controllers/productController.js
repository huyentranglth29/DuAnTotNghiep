const Product = require("../models/Product");
const createCrudController = require("./crudController");

module.exports = createCrudController(Product);

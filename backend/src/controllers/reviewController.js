const Review = require("../models/Review");
const createCrudController = require("./crudController");

module.exports = createCrudController(Review, { populate: "movie user" });

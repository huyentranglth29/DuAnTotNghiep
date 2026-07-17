const Product = require("../models/Product");
const createCrudController = require("./crudController");

const controller = createCrudController(Product);

controller.getAll = async (req, res, next) => {
  try {
    const products = await Product.find({
      isActive: true,
      image: { $not: /example\.com/i },
    }).sort({ createdAt: -1 });
    return res.json(products);
  } catch (error) {
    next(error);
  }
};

module.exports = controller;

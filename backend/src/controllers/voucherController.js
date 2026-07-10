const Voucher = require("../models/Voucher");
const createCrudController = require("./crudController");

module.exports = createCrudController(Voucher);

const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: String,

    image: String,

    price: Number,

    stock: Number,

    description: String,

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, collection: "các sản phẩm" }
);

module.exports = mongoose.model("Product", productSchema);

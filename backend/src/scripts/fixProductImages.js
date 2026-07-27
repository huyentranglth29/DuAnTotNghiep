require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

const map = {
  "Bắp rang bơ":
    "https://images.unsplash.com/photo-1578849278619-e73505e9610f?q=80&w=400",
  "Nước ngọt":
    "https://images.unsplash.com/photo-1629203851122-3726ecdf080e?q=80&w=400",
  "Combo FilmGo":
    "https://images.unsplash.com/photo-1585647347483-22b66260dfff?q=80&w=400",
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  for (const [name, image] of Object.entries(map)) {
    const result = await Product.updateOne({ name }, { $set: { image } });
    console.log(name, result.matchedCount, result.modifiedCount);
  }
  await mongoose.disconnect();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});

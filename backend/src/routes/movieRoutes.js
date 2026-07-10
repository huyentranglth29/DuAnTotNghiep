const express = require("express");
const router = express.Router();

const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require("../controllers/movieController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ===== Public =====
router.get("/", getMovies);
router.get("/:id", getMovieById);

// ===== Admin =====
router.post("/", authMiddleware, adminMiddleware, createMovie);
router.put("/:id", authMiddleware, adminMiddleware, updateMovie);
router.delete("/:id", authMiddleware, adminMiddleware, deleteMovie);

module.exports = router;
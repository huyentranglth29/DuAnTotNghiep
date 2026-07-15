const jwt = require("jsonwebtoken");

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return process.env.JWT_SECRET;
};

/**
 * Sinh JWT Token
 * @param {String} userId - ID của người dùng
 * @param {String} role - Vai trò (admin hoặc user)
 * @returns {String} JWT Token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    {
      id: userId,
      userId,
      role: role,
    },
    getJwtSecret(),
    {
      expiresIn: "7d",
    }
  );
};

module.exports = generateToken;

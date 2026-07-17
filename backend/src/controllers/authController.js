const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

const sanitizeUser = (user) => {
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  return data;
};

// Đăng ký
const register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;

    // Kiểm tra email đã tồn tại
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email đã tồn tại",
      });
    }

    // Tạo tài khoản
    const user = await User.create({
      fullName,
      email,
      password,
      phone,
      role: "user",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công",
      user: sanitizeUser(user),
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Đăng nhập
const login = async (req, res) => {
  try {

    const { email, password } = req.body;

    // Tìm user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Email không tồn tại",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản đã bị khóa",
      });
    }

    // So sánh mật khẩu
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Sai mật khẩu",
      });
    }

    // Tạo JWT
    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: sanitizeUser(user),
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

// Đăng nhập / đăng ký bằng Google
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Thiếu idToken từ Google",
      });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_WEB_CLIENT_ID;

    if (!clientId) {
      return res.status(500).json({
        success: false,
        message: "GOOGLE_CLIENT_ID chưa được cấu hình trên server",
      });
    }

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      return res.status(400).json({
        success: false,
        message: "Không lấy được thông tin email từ Google",
      });
    }

    const email = payload.email.toLowerCase();
    const fullName = payload.name || payload.given_name || email.split("@")[0];

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName,
        email,
        password: crypto.randomBytes(24).toString("hex"),
        role: "user",
        status: "active",
        authProvider: "google",
        googleId: payload.sub,
      });
    } else {
      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản đã bị khóa",
        });
      }

      if (!user.googleId && payload.sub) {
        user.googleId = payload.sub;
        user.authProvider = "google";
        await user.save();
      }
    }

    const token = generateToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: "Đăng nhập bằng Google thành công",
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    const isGoogleTokenError =
      error?.message?.includes("Token used too late") ||
      error?.message?.includes("Wrong recipient") ||
      error?.message?.includes("Invalid token signature") ||
      error?.message?.includes("No pem found");

    res.status(isGoogleTokenError ? 401 : 500).json({
      success: false,
      message: isGoogleTokenError
        ? "Token Google không hợp lệ hoặc đã hết hạn"
        : error.message,
    });
  }
};

// Lấy thông tin cá nhân
const profile = async (req, res) => {

  try {

    const user = await User.findById(req.user._id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

module.exports = {
  register,
  login,
  googleLogin,
  profile,
};

const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { sendLoginNotification, sendFailedLoginNotification } = require("../services/emailService");

const failedLoginAttempts = new Map();
const FAILED_LOGIN_THRESHOLD = 3;
const FAILED_LOGIN_WINDOW_MS = 15 * 60 * 1000;

const sanitizeUser = (user) => {
  const data = user.toObject ? user.toObject() : { ...user };
  delete data.password;
  data.hasPassword = Boolean(user.password);
  return data;
};

const setPassword = async (req, res) => {
  try {
    const {password, confirmPassword} = req.body;
    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).json({success: false, message: "Mật khẩu phải có ít nhất 6 ký tự"});
    }
    if (password !== confirmPassword) {
      return res.status(400).json({success: false, message: "Mật khẩu xác nhận không khớp"});
    }
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({success: false, message: "Không tìm thấy tài khoản"});
    user.password = password;
    user.authProvider = user.googleId ? "google" : "local";
    await user.save();
    return res.json({success: true, message: "Đã tạo mật khẩu FilmGo", user: sanitizeUser(user)});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
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
      const key = String(user.email).toLowerCase();
      const previous = failedLoginAttempts.get(key);
      const attempts = previous && previous.expiresAt > Date.now() ? previous.count + 1 : 1;
      failedLoginAttempts.set(key, {count: attempts, expiresAt: Date.now() + FAILED_LOGIN_WINDOW_MS});
      if (attempts === FAILED_LOGIN_THRESHOLD) {
        sendFailedLoginNotification({
          email: user.email,
          provider: "email và mật khẩu",
          ipAddress: req.ip,
        }).catch((error) => console.warn("Không gửi được email cảnh báo:", error.message));
      }
      return res.status(401).json({
        success: false,
        message: "Sai mật khẩu",
      });
    }

    // Tạo JWT
    failedLoginAttempts.delete(String(user.email).toLowerCase());
    const token = generateToken(user._id, user.role);
    sendLoginNotification({
      email: user.email,
      fullName: user.fullName,
      provider: "email và mật khẩu",
    }).catch((error) =>
      console.warn("Không gửi được email đăng nhập:", error.message),
    );

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

// Đăng nhập / đăng ký bằng Google (verify idToken phía server)
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

    if (payload.email_verified === false) {
      return res.status(401).json({
        success: false,
        message: "Email Google chưa được xác minh",
      });
    }

    const email = payload.email.toLowerCase();
    const fullName = payload.name || payload.given_name || email.split("@")[0];
    const googleId = payload.sub;
    const avatar = payload.picture || "";

    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        fullName,
        email,
        password: crypto.randomBytes(24).toString("hex"),
        role: "user",
        status: "active",
        authProvider: "google",
        googleId,
        avatar,
      });
    } else {
      if (user.status !== "active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản đã bị khóa",
        });
      }

      // Email đã tồn tại (local hoặc google) → không tạo user mới, chỉ gắn Google
      let changed = false;
      if (googleId && user.googleId !== googleId) {
        user.googleId = googleId;
        changed = true;
      }
      if (user.authProvider !== "google") {
        user.authProvider = "google";
        changed = true;
      }
      if (avatar && user.avatar !== avatar) {
        user.avatar = avatar;
        changed = true;
      }
      if (fullName && !user.fullName) {
        user.fullName = fullName;
        changed = true;
      }
      if (changed) {
        await user.save();
      }
    }

    const token = generateToken(user._id, user.role);
    sendLoginNotification({
      email: user.email,
      fullName: user.fullName,
      provider: "Google",
    }).catch((error) =>
      console.warn("Không gửi được email đăng nhập Google:", error.message),
    );

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
      user: sanitizeUser(user),
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }

};

const ALLOWED_GENDERS = new Set(["", "Nam", "Nữ", "Khác"]);

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({success: false, message: "Không tìm thấy tài khoản"});
    }

    const {
      fullName,
      phone,
      gender,
      birthDate,
      idCard,
      province,
      district,
      address,
    } = req.body;

    if (typeof fullName === "string") {
      const trimmed = fullName.trim();
      if (!trimmed) {
        return res.status(400).json({success: false, message: "Họ và tên không được để trống"});
      }
      user.fullName = trimmed;
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    if (typeof gender === "string") {
      const nextGender = gender.trim();
      if (!ALLOWED_GENDERS.has(nextGender)) {
        return res.status(400).json({success: false, message: "Giới tính không hợp lệ"});
      }
      user.gender = nextGender;
    }

    if (birthDate === null || birthDate === "") {
      user.birthDate = null;
    } else if (birthDate !== undefined) {
      const parsed = new Date(birthDate);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({success: false, message: "Ngày sinh không hợp lệ"});
      }
      user.birthDate = parsed;
    }

    if (typeof idCard === "string") user.idCard = idCard.trim();
    if (typeof province === "string") user.province = province.trim();
    if (typeof district === "string") user.district = district.trim();
    if (typeof address === "string") user.address = address.trim();

    await user.save();

    return res.json({
      success: true,
      message: "Cập nhật thông tin thành công",
      user: sanitizeUser(user),
    });
  } catch (error) {
    return res.status(500).json({success: false, message: error.message});
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  setPassword,
  profile,
  updateProfile,
};

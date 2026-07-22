const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      default: null,
    },
    phone: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      trim: true,
      default: "",
    },
    birthDate: {
      type: Date,
      default: null,
    },
    idCard: {
      type: String,
      trim: true,
      default: "",
    },
    province: {
      type: String,
      trim: true,
      default: "",
    },
    district: {
      type: String,
      trim: true,
      default: "",
    },
    address: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
    /** local = Email/mật khẩu, google = Google Sign-In */
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      trim: true,
      sparse: true,
    },
    avatar: {
      type: String,
      trim: true,
      default: "",
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    /** Ping gần nhất từ app — dùng để xác định đang online */
    lastSeen: {
      type: Date,
      default: null,
      index: true,
    },
    lockedReason: {
      type: String,
      trim: true,
      default: "",
    },
    lockedAt: {
      type: Date,
      default: null,
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    unlockedAt: {
      type: Date,
      default: null,
    },
    unlockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    rewardPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(password, this.password);
};

userSchema.set("toJSON", {
  transform(doc, ret) {
    delete ret.password;
    ret.provider = ret.authProvider === "google" ? "google" : "local";
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema, "người dùng");

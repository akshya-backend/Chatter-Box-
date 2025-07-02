import mongoose from "mongoose";
import validator from "validator";
import moment from "moment";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
 import {faker} from "@faker-js/faker"

dotenv.config(); // Load environment variables

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: [30, "Name cannot exceed 30 characters"],
      default: function () {
        return `${faker.person.firstName()} ${faker.person.lastName()}`;
      },
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, "Invalid email address"],
    },
    dob: {
      type: String,
      validate: {
        validator: (v) => moment(v, "DD/MM/YYYY", true).isValid(),
        message: "Invalid date format (DD/MM/YYYY required)",
      },
    },
    
    avatar: {
      url: {
        type: String,
        default: "/assets/images/user.png",
      },
      isHidden: {
        type: Boolean,
        default: false,
      },
    },
    publicKey: {
      type: String,
      unique: true,
    },
    privateKey: {
      type: String,
      select: false,
    },
    identifier: {
      type: String,
      select: false,
    },
    appLock: {
      enabled: { type: Boolean, default: false },
      pin: {
        type: String,
      },
    },
    lastSeen: {
      enabled: { type: Boolean, default: true },
      lastSeenAt: { type: Date, default: Date.now },
     
    },
    loginAlert: {
      type: Boolean,
      default: false,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// 🔐 Pre-save Hook (Simplified)
userSchema.pre("save", async function (next) {
  if (!this.publicId) {
    this.publicId = this._id.toString();
  }

  if (!this.privateKey) {
    const newKey = crypto.randomBytes(32).toString("hex");
    this.privateKey = encryptData(newKey);
  }

  if (!this.identifier) {
    const randomValue = crypto.randomBytes(16).toString("hex");
    this.identifier = `${randomValue}-${Date.now()}`;
  }

  if (this.isModified("appLock.pin") && this.appLock.pin) {
    const salt = await bcrypt.genSalt(10);
    this.appLock.pin = await bcrypt.hash(this.appLock.pin, salt);
  }

  next();
});

// 🔓 Decrypt Private Key
userSchema.methods.getDecryptedPrivateKey = function () {
  if (!this.privateKey) return null;
  return decryptData(this.privateKey);
};

// 🔑 Validate PIN
userSchema.methods.validatePin = async function (pin) {
  const isMatch = await bcrypt.compare(pin, this.appLock.pin);
  if (!isMatch) {
    throw new Error("Invalid PIN.");
  }
  return true;
};

// 🔒 Helper Functions
function encryptData(data) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_SECRET),
    Buffer.alloc(16, 0)
  );
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

function decryptData(encryptedData) {
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_SECRET),
    Buffer.alloc(16, 0)
  );
  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// 📌 Export
const User = mongoose.model("User", userSchema);
export default User;

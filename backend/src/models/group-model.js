import mongoose from "mongoose";
import validator from "validator";
import crypto from "crypto";

const generateAESKey = () => crypto.randomBytes(32).toString("hex");

// Define Schema
const groupSchema = new mongoose.Schema(
  {
    groupName: {
      type: String,
      required: [true, "Group name is required"],
      trim: true,
      maxlength: [50, "Group name cannot exceed 50 characters"],
    },
    picture: {
      type: String,
    
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, "Description cannot exceed 200 characters"],
      default: "Welcome to the group! Chat freely and respectfully.",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "CreatedBy is required"],
      validate: {
        validator: (value) => mongoose.Types.ObjectId.isValid(value),
        message: "Invalid createdBy userId",
      },
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin is required"],
      validate: {
        validator: (value) => mongoose.Types.ObjectId.isValid(value),
        message: "Invalid admin userId",
      },
    },
    key:{
      type: String,
      required: true,
    },
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      validate: {
        validator: (value) => mongoose.Types.ObjectId.isValid(value),
        message: "Invalid chatId",
      },
    },
    // encryptionKey: { type: String, required: true, default: generateAESKey, select: false },
    members: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "UserId is required"],
          validate: {
            validator: (value) => mongoose.Types.ObjectId.isValid(value),
            message: "Invalid userId",
          },
        },
        isAdmin: { type: Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
        encryptedKey: { type: String, required: true },
        iv:{type:String,required:true} // AES key encrypted with user's public key
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// 🔹 **Indexes for Performance**
groupSchema.index({ createdBy: 1 });
groupSchema.index({ "members.userId": 1 });
const Group= mongoose.model("Group", groupSchema);
export default Group;

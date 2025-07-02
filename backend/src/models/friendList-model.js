import mongoose from "mongoose";
import validator from "validator";

const friendSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required"],
      index: true,
      validate: {
        validator: (value) => mongoose.Types.ObjectId.isValid(value),
        message: "Invalid userId",
      },
    },
    friends: [
      {
        friendId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "FriendId is required"],
          validate: {
            validator: (value) => mongoose.Types.ObjectId.isValid(value),
            message: "Invalid friendId",
          },
        },
        isBlocked: { type: Boolean, default: false },
        isBlockedbyOther: { type: Boolean, default: false },
        addedAt: { type: Date, default: Date.now },
        chatId: {
          type: mongoose.Schema.Types.ObjectId, 

          ref: "Conversation",
          validate: {
            validator: (value) => mongoose.Types.ObjectId.isValid(value),
            message: "Invalid chatId",
          },
        },
      },
    ],
    friendRequests: [
      {
        requesterId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "RequesterId is required"],
          validate: {
            validator: (value) => mongoose.Types.ObjectId.isValid(value),
            message: "Invalid requesterId",
          },
        },
        message: { type: String, trim: true, maxlength: 200 },
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected", "cancelled"],
          default: "pending",
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);




// Indexes
friendSchema.index({ userId: 1 }); // Index for userId
const Friend = mongoose.model("Friend", friendSchema);
export default Friend;
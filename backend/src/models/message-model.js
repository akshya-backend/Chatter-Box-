import { de } from "@faker-js/faker";
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true, // Index for quick retrieval by chatId
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, "Message content cannot be empty"],
    maxlength: [1000, "Message cannot exceed 1000 characters"],
  },
  type: {
    type: String,
    enum: ["text", "image", "video"],
    default: "text",
  },
  iv:{
    type:String,
    
  },
  seenBy: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      seenAt: { type: Date, default: null }, // Timestamp when the message was seen
    },
  ],
  deliveryTo: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      deliveredAt: { type: Date, default: null }, // Timestamp when the message was delivered
    },
  ],
  isdeletedBy:{
    type:Boolean,
    default:false
  },
 
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, 
  },
});

// Compound index for chatId and timestamp (for sorting messages in a chat)
messageSchema.index({ chatId: 1, timestamp: 1 });

const Message= mongoose.model("Message", messageSchema);
export default Message;
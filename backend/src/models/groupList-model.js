import mongoose from "mongoose";
import Group from "./group-model.js";

const groupListSchema = new mongoose.Schema(
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
    groups: [
      {
        groupId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Group",
          required: [true, "GroupId is required"],
          validate: {
            validator: (value) => mongoose.Types.ObjectId.isValid(value),
            message: "Invalid groupId",
          },
        },
       
        isblocked:{type:Boolean, default: false },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);


// Indexes
groupListSchema.index({ userId: 1 }); // Index for userId
groupListSchema.index({ "groups.groupId": 1 }); // Index for groups.groupId
const   GroupList =mongoose.model("GroupList", groupListSchema);
export default GroupList;
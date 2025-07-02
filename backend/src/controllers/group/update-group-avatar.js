import path from "path";
import { extractAuthenticatedUserId } from "../../utils/helper/JsonWebToken-handler.js";
import { resizeAndCompressImage } from "../../config/multer.js";
import cloudinaryUpload from "../../config/cloudinary.js";
import logger from "../../utils/logger/winston-logger.js";
import Group from "../../models/group-model.js";
import { redisClient } from "../../config/redis.js";

const changeGroupImage = async (req, res) => {
  try {
    // Extract user ID from the token
    const userId = extractAuthenticatedUserId(req);
     const groupId = req.body.groupId;
    // Validate uploaded file
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        status: false,
        message: "No file uploaded",
      });
    }

    // Process and upload the image
    let uploadedImageUrl;
    try {
      const inputPath = file.path;
      const outputPath = inputPath.replace(
        path.extname(inputPath),
        `-processed${path.extname(inputPath)}`
      );

      logger.info(`Processing image: ${inputPath}`);
      await resizeAndCompressImage(inputPath, outputPath);

      logger.info(`Uploading image to Cloudinary: ${outputPath}`);
      uploadedImageUrl = await cloudinaryUpload(outputPath);
    } catch (err) {
      logger.error("Image processing or upload failed:", err);
      return res.status(500).json({
        status: false,
        message: "Failed to process or upload the image",
        error: err.message,
      });
    }

    // Update user's avatar URL in the database
    const updatedUser = await Group.findByIdAndUpdate(
      groupId,
      { picture: uploadedImageUrl },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }
   // remove redis
    const isredis = await redisClient.del(`group:${userId}`);
    if (isredis === 0) {
      logger.info("No cache found for group data");
    } else {
      logger.info("Cache cleared for group data");
    }
    // Respond with success
    res.status(200).json({
      status: true,
      message: "Profile picture updated successfully",
      url:uploadedImageUrl,

    });
  } catch (error) {
    logger.error("Server error:", error);
    res.status(500).json({
      status: false,
      message: "Server error",
      error: error.message,
    });
  }
};

export default changeGroupImage;
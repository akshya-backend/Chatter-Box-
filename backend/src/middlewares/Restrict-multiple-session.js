import { redisClient } from "../config/redis.js";
import logger from "../utils/logger/winston-logger.js";
import { customError } from "./Global-error-handler.js"; // Import customError for consistency

const restrictMultipleDevice = async (req, res, next) => {
  try {
    const activeSession = await redisClient.get(`user:${req.user.id}`);

    if (activeSession) {
      logger.warn(`User ${req.user.id} attempted to log in from another device.`);

      return customError(
        "Multiple Sessions Detected",
        403,
        "You are already logged in on another device. Please log out before continuing.",
        next
      );
    }

    next();
  } catch (error) {
    logger.error(`Single Device Enforcement Error: ${error.message}`);

    return customError(
      "Session Management Error",
      500,
      "An unexpected error occurred while verifying your session.",
      next
    );
  }
};

export default restrictMultipleDevice;

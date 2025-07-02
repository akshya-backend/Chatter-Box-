import cors from "cors";
import logger from "../utils/logger/winston-logger.js";
import { customError } from "./Global-error-handler.js"; // Import customError for consistency

const corsMiddleware = (req, res, next) => {
  try {
    cors({
      origin: process.env.CLIENT_URL,
      credentials: true,
    })(req, res, (err) => {
      if (err) {
        logger.warn(`CORS POLICY BLOCKED: ${req.originalUrl} - ${req.ip}`);

        return customError(
          "CORS Policy Violation",
          400,
          "Cross-Origin Request Blocked. Your request is not allowed.",
          next
        );
      }
      next();
    });
  } catch (error) {
    logger.error(`CORS Middleware Error: ${error.message}`);

    return customError(
      "CORS Middleware Failure",
      500,
      "An error occurred while processing CORS settings.",
      next
    );
  }
};

export default corsMiddleware;

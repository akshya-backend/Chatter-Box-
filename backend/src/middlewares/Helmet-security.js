import helmet from "helmet";
import logger from "../utils/logger/winston-logger.js";
import { customError } from "./Global-error-handler.js"; // Import customError for consistency

const helmetMiddleware = (req, res, next) => {
  try {
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
          styleSrc: ["'self'", "https://cdn.jsdelivr.net", "'unsafe-inline'"],
          fontSrc: ["'self'", "https://cdn.jsdelivr.net", "data:"],
          imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
          connectSrc: ["'self'", "wss:"],
          frameSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
    })(req, res, (err) => {
      if (err) {
        logger.warn(`SECURITY POLICY BLOCKED: ${req.originalUrl} - ${req.ip}`);

        return customError(
          "Security Policy Violation",
          400,
          "Your request was blocked due to security restrictions.",
          next
        );
      }
      next();
    });
  } catch (error) {
    logger.error(`Helmet Middleware Error: ${error.message}`);

    return customError(
      "Security Middleware Failure",
      500,
      "An error occurred while enforcing security policies.",
      
    );
  }
};

export default helmetMiddleware;

import rateLimit from "express-rate-limit";
import logger from "../utils/logger/winston-logger.js";
import { customError } from "./Global-error-handler.js"; // Import customError for consistency
import { redisClient } from "../config/redis.js";

const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX_ATTEMPTS = 100;
const CUSTOM_RATE_LIMIT_KEY_EXPIRY = 3600; // 1 hour
const MAX_CUSTOM_ATTEMPTS = 5;

// ✅ Application-wide Rate Limiter
const appRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_ATTEMPTS,
  message: "Too Many Requests. Please try again later.",
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,

  skip: (req) => {
    const excludedExtensions = [
      ".js",
      ".css",
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".svg",
      ".ico",
      ".woff",
      ".woff2",
      ".ttf",
      ".otf",
    ];
    const excludedPaths = ["/css/", "/js/", "/images/", "/fonts/", "/static/"];
    const excludedCDNs = [
      "res.cloudinary.com",
      "cdnjs.cloudflare.com",
      "cdn.jsdelivr.net",
      "fonts.googleapis.com",
      "fonts.gstatic.com",
    ];

    return (
      excludedExtensions.some((ext) => req.url.endsWith(ext)) ||
      excludedPaths.some((path) => req.url.startsWith(path)) ||
      excludedCDNs.some((cdn) => req.url.includes(cdn))
    );
  },

  handler: (req, res, next) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    return customError(
      "Too Many Requests",
      429,
      "You have exceeded the allowed request limit. Try again later.",
      next
    );
  },
});

// ✅ PIN Reset Rate Limiter
const resetPinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 1,
  message: { message: "You can only request a PIN reset link once every 10 minutes." },
  standardHeaders: true,
  legacyHeaders: false,

  handler: (req, res, next) => {
    logger.warn(`PIN reset rate limit exceeded for IP: ${req.ip}`);
    return customError(
      "Too Many Requests",
      429,
      "You can only request a PIN reset once every 10 minutes.",
      next
    );
  },
});

// ✅ Email-based Rate Limiter
const emailRateLimiter = async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return customError(
      "Email Missing",
      400,
      "Email is required to perform this action.",
      next
    );
  }

  const rateLimitKey = `rateLimit:${email}`;

  try {
    const attempts = await redisClient.incr(rateLimitKey);

    if (attempts === 1) {
      await redisClient.expire(rateLimitKey, CUSTOM_RATE_LIMIT_KEY_EXPIRY);
    }

    if (attempts > MAX_CUSTOM_ATTEMPTS) {
      logger.info(`Rate limit exceeded for email: ${email}`);
      return customError(
        "Too Many Requests",
        429,
        "You have exceeded the maximum number of attempts. Try again in 1 hour.",
        next
      );
    }

    next();
  } catch (error) {
    logger.error(`Redis error during rate limit check: ${error.message}`);
    return customError(
      "Internal Server Error",
      500,
      "An error occurred while processing your request. Please try again later.",
      next
    );
  }
};

export { resetPinLimiter, appRateLimiter, emailRateLimiter };

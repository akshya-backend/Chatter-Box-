import session from "express-session";
import dotenv from "dotenv";
import logger from "../utils/logger/winston-logger.js";
import { customError } from "./Global-error-handler.js";

dotenv.config();

// ✅ Session Middleware Configuration
const sessionMiddleware = session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  },
});


// ✅ Middleware: Ensure Session is Verified
const ensureSessionVerified = (req, res, next) => {
  try {
    if (req.session?.verified) {
      
      return next(); // Proceed if session is verified
    }
    return res.redirect("/"); // Redirect to home if session is not verified
  } catch (error) {
    customError(
      "Session Verification Error",
      500,
      "An unexpected error occurred during session verification.",
      next
    );
  }
};

// ✅ Middleware: Prevent Access to Signup After Login
const preventAccessToSignup = (req, res, next) => {
  try {
    if (req.session?.user || req.cookies?.chatterbox) {
      return res.redirect("/"); // Redirect to dashboard if already logged in
    }
    next();
  } catch (error) {
    customError(
      "Signup Access Prevention Error",
      500,
      "An unexpected error occurred while preventing signup access.",
      next
    );
  }
};

// ✅ Middleware: Clear Cache Headers
const clearCacheHeaders = (req, res, next) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
      "Surrogate-Control": "no-store",
    });
    next();
  } catch (error) {
    customError(
      "Cache Clearing Error",
      500,
      "An unexpected error occurred while clearing cache headers.",
      next
    );
  }
};

// ✅ Export All Middlewares
export {
  sessionMiddleware,
  ensureSessionVerified,
  preventAccessToSignup,
  clearCacheHeaders,
};

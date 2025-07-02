import logger from "../utils/logger/winston-logger.js";
import jwt from "jsonwebtoken";
import { customError } from "./Global-error-handler.js";

const authenticateUserToken = (req, res, next) => {
  try {
    const token = req.cookies?.chatterbox;
  
    if (!token) {
      return res.redirect("/api/v1/auth/sign-new-user");
    }
    // Verify JWT token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);    
    req.user = decodedToken;
    next();
    
  } catch (error) {
    logger.error(`JWT Authentication Error: ${error.message}`);
    res.clearCookie("chatterbox");

    return customError(
      "JWT Authentication Error",
      401,
      "Invalid or expired authentication token. Please log in again.",
      next
    );
  }
};

export default authenticateUserToken;

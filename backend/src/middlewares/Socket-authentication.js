import jwt from "jsonwebtoken";
import logger from "../utils/logger/winston-logger.js";

const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
   console.log(token);
   
    if (!token) {
      logger.warn("No authentication token found in socket auth.");
      throw new Error("Unauthorized Access");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded JWT: ", decoded);
    
    socket.user = decoded.id;

    next(); // allow connection
  } catch (error) {
    console.log("Socket.IO Authentication Error: ", error.message);
    
    const customError = new Error();
    customError.status = 401;

    switch (error.name) {
      case "TokenExpiredError":
        customError.message = "Session Expired";
        customError.description = "Your session has expired. Please log in again.";
        break;
      case "JsonWebTokenError":
        customError.message = "Invalid Token";
        customError.description = "Your authentication token is invalid. Please log in again.";
        break;
      default:
        customError.message = "Unauthorized Access";
        customError.description = "Invalid or expired authentication token. Please log in again.";
        break;
    }

    logger.error(`Socket.IO Auth Error: ${customError.message} - ${customError.description}`);
    next(customError);
  }
};

export default authenticateSocket;

import logger from "../utils/logger/winston-logger.js";

// Centralized Error Handler Middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500; // Default to 500 if no status is provided
  const errorMessage = err.message || "Internal Server Error"; // Default error message
  const errorDescription = err.description || "An unexpected error occurred. Please try again later."; // Default description

  // Log the error
  logger.error(`[${new Date().toISOString()}] ${errorMessage}: ${errorDescription}`);

 

  // Handle JSON requests (e.g., Fetch API)
  if (req.headers.accept && req.headers.accept.includes("application/json")) {
    console.error("Error Handler Middleware: JSON Request");
    return res.status(statusCode).json({
      status: false,
      message: errorMessage,
      description: errorDescription,
    });
  }

  // Handle HTML requests (e.g., browser navigation)
  console.error("Error Handler Middleware: HTML Request");
  res.status(statusCode).render("error-Page", {
    title: "Error",
    errorCode: statusCode || 500,
    errorMessage: errorMessage|| "Internal Server Error",
    errorDescription:errorDescription || "An unexpected error occurred. Please try again later.",
  });
};

// Reusable Function to Create and Pass Errors
const customError = (errorMessage, statusCode = 500, description = "An unexpected error occurred.", next) => {
  const error = new Error(errorMessage);
  error.status = statusCode;
  error.description = description;

  // Log the error
  logger.error(`[${new Date().toISOString()}] ${errorMessage}: ${description}`);

  // Pass the error to the next middleware
  next(error);
};

export { errorHandler, customError };

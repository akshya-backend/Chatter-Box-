import { createLogger, format, transports } from "winston";
const { combine, timestamp, colorize, printf } = format;

import fs from "fs";
import path from "path";

const logDirectory = path.join(process.cwd(), "/src/utils/logger");

// Create the logs directory if it doesn't exist
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory);
}

// Custom log format to include stack trace
const customFormat = printf(({ level, message, timestamp, stack }) => {
  // If stack is available (for errors), include it in the log
  return stack
    ? `${timestamp} ${level}: ${message}\nStack Trace: ${stack}`
    : `${timestamp} ${level}: ${message}`;
});

const logger = createLogger({
  level: "info",
  format: combine(
    colorize(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.errors({ stack: true }), // Enable stack trace for errors
    customFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(logDirectory, "error.log"),
      level: "error",
    }),
  ],
});

export default logger;
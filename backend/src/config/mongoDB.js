import mongoose from 'mongoose';
import logger from '../utils/logger/winston-logger.js';



const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 3000;


const connectDataBase = async () => {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(process.env.MONGODB_URL);
      logger.info('MongoDB connected successfully.');
      return;
    } catch (error) {
      retries++;
      logger.warn(`MongoDB connection attempt ${retries} failed: ${error.message}`);

      if (retries < MAX_RETRIES) {
        logger.info(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        logger.error('MongoDB connection failed after maximum retries.', {
          error: error.message,
          stack: error.stack,
        });
        throw new Error('MongoDB connection failed after maximum retries.');
      }
    }
  }
};


// Initialize MongoDB connection and event listeners
 export const initializeDatabase = async () => {
  try {
    await connectDataBase();
  } catch (error) {
    logger.error('Database initialization failed:', { error: error.message, stack: error.stack });
    process.exit(1);
  }
};


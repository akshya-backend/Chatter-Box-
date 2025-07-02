import multer from 'multer';
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from 'url';
import logger from '../utils/logger/winston-logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage configuration for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
  cb(null, path.join(__dirname, '../','utils/multer-uploads/'));
  },

  // Set unique filename for each uploaded file
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Export Multer upload instance
export const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
});


 export const resizeAndCompressImage = async (inputPath, outputPath) => {
  try {
    await sharp(inputPath)
      .resize(800)
      .jpeg({ quality: 80 }) 
      .toFile(outputPath); 
    logger.info('Image compressed and resized successfully!');
  } catch (error) {
    logger.error('Error during image processing:', error);
    throw error;
  }
};
// Custom middleware to handle errors from multer and log them
 export const multerMiddleware = (err, req, res, next) => {
  console.log('Error handler activated:', err);

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File is too large. Max size is 10MB',
      });
    }
    return res.status(400).json({
      message: `Multer error: ${err.message}`,
    });
  } else if (err) {
    return res.status(500).json({
      message: 'An unexpected error occurred during file upload.',
      error: err.message, 
    });
  }
  next();
};


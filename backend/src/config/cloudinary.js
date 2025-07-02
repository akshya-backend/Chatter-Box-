import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs/promises';
import dotenv from 'dotenv';
import exp from 'constants';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

 const cloudinaryUpload = async (filePathOrUrl, resourceType = 'auto') => {
  try {
    let result;

    // Check if the input is a URL (e.g., Google profile picture)
    if (filePathOrUrl.startsWith('http')) {
      result = await cloudinary.uploader.upload(filePathOrUrl, { resource_type: resourceType });
    } else {
      result = await cloudinary.uploader.upload(filePathOrUrl, { resource_type: resourceType });
      await fs.unlink(filePathOrUrl).catch(() => null);
    }

    return result.secure_url; // Return the secure URL
  } catch (error) {
    console.error('Cloudinary Upload Error:', error.message);
    return null;
  }
};
export default cloudinaryUpload;
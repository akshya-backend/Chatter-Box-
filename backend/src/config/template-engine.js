import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const setupStaticFilesAndViews = (app) => {
  try {
    // Check if running inside Docker or locally
    const isDocker = process.env.IN_DOCKER === 'true';

    const viewsPath = isDocker
      ? "/frontend/views"
      : path.join(__dirname, '..', '..', '..', 'frontend', 'views');

    const publicPath = isDocker
      ? "/frontend/public"
      : path.join(__dirname, '..', '..', '..', 'frontend', 'public');

    app.use(express.static(publicPath));
    app.set('views', viewsPath);
    app.set('view engine', 'ejs');

    console.log("✅ Static files and views configured");
  } catch (error) {
    console.error(`❌ Error setting up static files and views:\n${error.stack}`);
  }
};

export default setupStaticFilesAndViews;

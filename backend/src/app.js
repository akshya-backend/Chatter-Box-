import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cookieParser from 'cookie-parser';
import setupStaticFilesAndViews from './config/template-engine.js';

import routes from './routes/index-route.js';
import { errorHandler } from './middlewares/Global-error-handler.js';
import { sessionMiddleware } from './middlewares/Session-middleware.js';
import corsMiddleware from './middlewares/Cors-security.js';
// import helmetMiddleware from './middlewares/Helmet-security.js';
// import {  setupCors, setupHelmet } from './middlewares/authentication-middleware.js';
// import { appRateLimiter } from './middlewares/rate-limiting-middleware.js';
// import { sessionMiddleware } from './middlewares/express-session-middleware.js';


const app = express();

// // Security middleware
// app.use(helmetMiddleware());
// app.use(appRateLimiter);
// app.use(corsMiddleware);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);

// Setup static files and views
setupStaticFilesAndViews(app);

// Define routes
routes(app);

// // Error handling middleware for 404
// app.use((req, res, next) => {
//     const error = new Error('Page Not Found');
//     error.status = 404;
//     error.description = 'The page you are looking for does not exist.';    
//     next(error);
// }); 

// // // Global error handler middleware
// app.use(errorHandler);

export default app;

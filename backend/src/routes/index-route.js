import { isAppLocked } from "../controllers/auth/access-control-handler.js";
import authenticateUserToken from "../middlewares/JsonWebToken-authentication.js";
import restrictMultipleDevice from "../middlewares/Restrict-multiple-session.js";
import { clearCacheHeaders, ensureSessionVerified } from "../middlewares/Session-middleware.js";
import authRoutes from "./auth-routes.js";
import chatRoutes from "./chat-routes.js";
import userRoutes from "./user-routes.js";

const routes = (app) => {
  try {
  
  app.use('/api/v1/auth',clearCacheHeaders, authRoutes);
  app.use('/api/v1/chat',authenticateUserToken,ensureSessionVerified,chatRoutes);
  app.use('/api/v1/user',authenticateUserToken,ensureSessionVerified,userRoutes)
  app.get('/', authenticateUserToken,isAppLocked);
  } catch (error) {
  logger.error(`Error setting up  route: ${error.stack}`);

  }
 
};

export default routes;

// import { configureRedisSocketAdapter } from "./redis.config.js";
// import { logger } from "../utils/Helpers/logger.js";
// import { handleTypingEvents } from "../services/REDIS SERVICES/handleTypingNotification.js";
// import { handleUserConnection } from "../services/REDIS SERVICES/handleUserConnection.js";
// import { handleUserDisconnection } from "../services/REDIS SERVICES/handleUserDisconection.js";
// import { handleSocketImageSharing } from "../services/REDIS SERVICES/handleImageSharingEvent.js";
// import { handleSocketVideoSharing } from "../services/REDIS SERVICES/handleVideoSharing.js";
// import { handleSocketFileSharing } from "../services/REDIS SERVICES/handleFileSharingEvent.js";

// import { personalChatEvents } from "../services/socket-io/personal-chat-event-service.js";
import authenticateSocket from "../middlewares/Socket-authentication.js";
import { groupChatEvents } from "../services/socket/groupChatEvent.js";
import { attachmentHandler } from "../services/socket/handle-attachment.js";
import { handleUserConnection, handleUserDisconnection } from "../services/socket/handle-connection.js";
import { handleTypingEvents } from "../services/socket/handle-typing-indicator.js";
import { handleVideoCallEvent } from "../services/socket/handle-videoCall.js";
import { personalChatEvents } from "../services/socket/personaleChatEvent.js";
import logger from "../utils/logger/winston-logger.js";

export let socketInstance =null;
export const initializeSocket = (io) => {
  try {
   
    io.use(authenticateSocket)
    // configureRedisSocketAdapter(io);

    io.on("connection", (socket)=> {
      socketInstance=socket;
      try {
        console.log(`New socket connection: ${socket.id} connected. Connected users: ${io.engine.clientsCount}`);

        handleUserConnection(io, socket);
        personalChatEvents(io, socket);
        attachmentHandler(io,socket)
        handleTypingEvents(io,socket);
        groupChatEvents(io,socket)
        handleVideoCallEvent(io,socket)
        // handleUserDisconnection(io, socket);
        // handleSocketImageSharing(socket,io)
        // handleSocketVideoSharing(socket,io)  
        // handleSocketFileSharing(socket,io)          
      } catch (err) {
        // handleSocketError(err, socket);
        logger.error(`Error in connection lifecycle: ${err.message}`);
        socket.disconnect();
      }

      socket.on("disconnect",  async (reason) => {
         await handleUserDisconnection(io, socket);
          logger.info(`Socket disconnected: ${socket.id}, Reason: ${reason}`);

      });
      
    });
    logger.info("Socket.io initialized successfully.");
  } catch (err) {
    logger.error(`Error initializing Socket.io: ${err.message}`);
  }
};


const handleSocketError = (error, socket) => {
  logger.error(`Socket error: ${error.message}`);
  socket.emit("error", { message: "An error occurred. Please try again." });
};

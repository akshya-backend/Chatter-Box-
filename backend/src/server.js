import app from './app.js';
import http from 'http';
import logger from './utils/logger/winston-logger.js';
import { Server as SocketServer } from 'socket.io';
import { ExpressPeerServer } from 'peer';
import { initializeDatabase } from './config/mongoDB.js';
import { initializeRedis, redisClient } from './config/redis.js';
import { initializeSocket } from './config/socket-io.js';
import { initializeKafka } from './config/kafka.js';
import { startGroupConsumer, startKafkaConsumers } from './services/kafka/kafka-consumer.js';


// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io on the server
 export const io = new SocketServer(server, {
  cors: {
    origin: ['http://localhost:2000'], 
    credentials: true,
  },

});

 const peerServer = ExpressPeerServer(server, {
  path: '/',  
    origin: '*', 
  }
});


// Initialize database, Redis, Kafka, and Socket
(async () => {
    try {
              initializeSocket(io);
        await initializeDatabase();
        await initializeRedis();
        await initializeKafka();
        await startKafkaConsumers()
        logger.info('Database, Redis, Socket, and Kafka initialized successfully!');
    } catch (error) {
        logger.error('Initialization error:', { message: error.message, stack: error.stack });
        process.exit(1);
    }
})();

// Start server
const PORT = process.env.PORT || 2000;
server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT signal received: closing HTTP server');
    server.close(() => {
        logger.warn('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    logger.info('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        logger.warn('HTTP server closed');
        process.exit(0);
    });
});

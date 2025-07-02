import { createClient, createCluster } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
// Redis Configuration
import dotenv from 'dotenv';
import logger from '../utils/logger/winston-logger.js';
dotenv.config();


// Utility to create a standalone Redis client
const createStandaloneRedisClient = (url) => {
  const client = createClient({ url });
  client.on('error', (err) => {
    console.log("Standalone Redis Client Error:++++ ",err);
    logger.error('Standalone Redis Client Error:', err)}
  );
  client.on('connect', () => logger.info('Standalone Redis Client connected successfully.'));
  return client;
};

// Utility to create a Redis Cluster client
const createRedisClusterClient = (nodes) => {
  const cluster = createCluster({
    rootNodes: nodes,
    defaults: {
      socket: {
        connectTimeout: 15000, 
        tls: false, 
      },
    },
  });
  cluster.on('error', (err) =>{
    console.log("cluster error",err);
    
     logger.error('Redis Cluster Client Error:', err)})
  cluster.on('connect', () => logger.info('Redis Cluster Client connected successfully.'));
  return cluster;
};

// Redis Standalone Client for Session Management
export const redisClient= createStandaloneRedisClient(process.env.REDIS_SESSION_URL);

// Redis Cluster Client for Message Queue and Caching
export const redisCache = createRedisClusterClient(process.env.REDIS_CLUSTER_NODES);

// Pub/Sub Clients for Socket.IO Adapter (Standalone Redis)
const pubClient = redisClient.duplicate();
const subClient = redisClient.duplicate();

// Function to initialize Redis clients
export const initializeRedis= async () => {
  try {
    // Connect standalone Redis and Pub/Sub clients
    await Promise.all([
      redisClient.connect(),
      pubClient.connect(),
      subClient.connect(),
      // messageRedisCluster.connect(),
    ]);
    logger.info('All Redis clients connected successfully.');
  } catch (error) {
    logger.error('Error initializing Redis clients:', error);
    process.exit(1); 
  }
};

// Function to set up Redis adapter for Socket.IO
export const configureRedisSocketAdapter = (io) => {
  try {
    io.adapter(createAdapter(pubClient, subClient)); 
    logger.info('Socket.IO Redis Pub/Sub adapter configured successfully.');
  } catch (error) {
    logger.error('Error configuring Socket.IO Redis adapter:', error);
  }
};

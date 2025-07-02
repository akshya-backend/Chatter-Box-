import { Kafka } from "kafkajs";
import logger from "../utils/logger/winston-logger.js";

// Kafka Configuration
const kafkaConfig = {
  clientId: "my-app",
  brokers:["kafka:9092"],
  privateTopic: process.env.KAFKA_PRIVATE_TOPIC || "private-messages",
  groupTopic: process.env.KAFKA_GROUP_TOPIC || "group-messages",
  privateGroupId: process.env.KAFKA_PRIVATE_CONSUMER_GROUP || "private-consumer-group",
  groupGroupId: process.env.KAFKA_GROUP_CONSUMER_GROUP || "group-consumer-group",
  retryDelay: 2000,
  maxRetries: 3,
};

const kafka = new Kafka({
  clientId: kafkaConfig.clientId,
  brokers: kafkaConfig.brokers,
});

const producer = kafka.producer();
const privateConsumer = kafka.consumer({ groupId: kafkaConfig.privateGroupId });
const groupConsumer = kafka.consumer({ groupId: kafkaConfig.groupGroupId });

const connectWithRetry = async (client, clientType) => {
  let retries = kafkaConfig.maxRetries;
  while (retries > 0) {
    try {
      await client.connect();
      logger.info(`${clientType} connected successfully`);
      return;
    } catch (error) {
      retries--;
      logger.warn(
        `Error connecting ${clientType} | Retries left: ${retries} | Error: ${error.message}`
      );
      
      if (retries === 0) {
        logger.error(`❌ Failed to connect ${clientType} after ${kafkaConfig.maxRetries} attempts`);
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, kafkaConfig.retryDelay));
    }
  }
};

const initializeKafka = async () => {
  try {
    await connectWithRetry(producer, "Kafka Producer");
    await connectWithRetry(privateConsumer, "Private Kafka Consumer");
    await connectWithRetry(groupConsumer, "Group Kafka Consumer");
  } catch (error) {
    logger.error("🚨 Error initializing Kafka:", error);
    throw error;
  }
};

const shutdownKafka = async () => {
  try {
    await privateConsumer.disconnect();
    await groupConsumer.disconnect();
    await producer.disconnect();
    logger.info("✅ Kafka Producer and Consumers disconnected gracefully");
  } catch (error) {
    logger.error("❌ Error during Kafka shutdown:", error);
  } finally {
    process.exit(0);
  }
};

process.on("SIGINT", shutdownKafka);
process.on("SIGTERM", shutdownKafka);

export {
  kafkaConfig,
  producer,
  privateConsumer,
  groupConsumer,
  initializeKafka,
};

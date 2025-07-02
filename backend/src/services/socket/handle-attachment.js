import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import mongoose from 'mongoose';
import cloudinaryUpload from '../../config/cloudinary.js';
import { redisClient } from '../../config/redis.js';
import { producer } from '../../config/kafka.js';
import Conversation from '../../models/conversation-model.js';
import User from '../../models/user-model.js';
import { extractAuthenticatedUserId } from '../../utils/helper/JsonWebToken-handler.js';

const uploadsDir = path.resolve('temp-uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const fileBufferMap = new Map();
const fileTimeouts = new Map();
const CLEANUP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Constants (same as in private chat)
const RECENT_MESSAGES_TTL = 3600;
const PENDING_MESSAGE_TTL = 604800;

// Helper functions (same as in private chat)
const getRecentMessagesKey = (chatId) => `recent:${chatId}`;
const getPendingMessagesKey = (recipient, chatId) => `pending:${recipient}:${chatId}`;
const toKafkaTimestamp = (date) => {
  return typeof date === 'string' 
    ? new Date(date).getTime().toString()
    : date.getTime().toString();
};

async function handleRecipientStatus(socket, recipient, chatId) {
  const recipientSocketData = await redisClient.get(`user:${recipient}`);
  if (!recipientSocketData) return { isOnline: false };

  const parsedData = JSON.parse(recipientSocketData);
  return {
    isOnline: true,
    socketId: parsedData.socketId,
    isViewingChat: parsedData.chatStatus?.chatId === chatId
  };
}

async function updateRedisCaches({ chatId, message, recipient, shouldStorePending }) {
  const multi = redisClient.multi();
  
  multi.zAdd(
    getRecentMessagesKey(chatId),
    { score: message.timestamp.getTime(), value: JSON.stringify(message) }
  );
  multi.expire(getRecentMessagesKey(chatId), RECENT_MESSAGES_TTL);

  if (shouldStorePending) {
    multi.lPush(getPendingMessagesKey(recipient, chatId), message._id.toString());
    multi.expire(getPendingMessagesKey(recipient, chatId), PENDING_MESSAGE_TTL);
  }

  await multi.exec();
}

export function attachmentHandler(io, socket) {
  socket.on('send-attachment-chunks', async (data, callback) => {
    const sender = socket.user;

    try {
      const {
        chunk,
        currentChunk,
        totalChunks,
        fileName,
        type,
        chatId,
        recipient,
        isGroup ,
      } = data;

      // Validation (same as before)
      if (
        typeof currentChunk !== 'number' ||
        typeof totalChunks !== 'number' ||
        typeof fileName !== 'string' ||
        typeof type !== 'string' ||
        typeof chatId !== 'string' ||
        typeof recipient !== 'string' ||
        (!Buffer.isBuffer(chunk) && typeof chunk !== 'string')
      ) {
        return callback({ success: false, error: 'Invalid or missing chunk data' });
      }

      const fileKey = `${recipient}-${chatId}-${fileName}`;

      // File chunk handling (same as before)
      if (!fileBufferMap.has(fileKey)) {
        fileBufferMap.set(fileKey, Array.from({ length: totalChunks }));
      }

      const chunks = fileBufferMap.get(fileKey);
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, 'base64');
      chunks[currentChunk] = bufferChunk;

      // Reset cleanup timer
      if (fileTimeouts.has(fileKey)) clearTimeout(fileTimeouts.get(fileKey));
      fileTimeouts.set(fileKey, setTimeout(() => cleanupFileBuffers(fileKey), CLEANUP_TIMEOUT_MS));

      const allChunksReceived = chunks.every(c => c !== undefined);
      if (!allChunksReceived) return callback({ success: true, message: 'Chunk received' });

      // Assemble file (same as before)
      const fullBuffer = Buffer.concat(chunks);
      if (fullBuffer.length > MAX_FILE_SIZE) {
        cleanupFileBuffers(fileKey);
        return callback({ success: false, error: 'File size exceeds 10MB limit' });
      }

      const tempFilePath = path.join(uploadsDir, `${uuid()}-${fileName}`);
      await fs.promises.writeFile(tempFilePath, fullBuffer);

      // Upload to Cloudinary (same as before)
      const resourceType = ['image', 'video'].includes(type) ? type : 'raw';
      const url = await cloudinaryUpload(tempFilePath, resourceType);
      if (!url) throw new Error('Upload to Cloudinary failed');

      const userInfo = await User.findById(sender).select('name avatar');
      const messageId = new mongoose.Types.ObjectId();
      const timestamp = new Date();

      // Get recipient status (similar to private chat)
      const { isOnline, socketId, isViewingChat } = isGroup 
        ? { isOnline: false, socketId: null, isViewingChat: false } // Groups handle differently
        : await handleRecipientStatus(socket, recipient, chatId);

      // Create message payload with consistent status fields
      const message = {
        _id: messageId,
        sender,
        isGroup,
        recipient: isGroup ? recipient : sender, // For groups, recipient is null
        chatId,
        content: url,
        type,
        timestamp,
        pending: !isOnline || !isViewingChat,
        seenBy: isViewingChat ? [{ userId: recipient, timestamp }] : [],
        deliveryTo: isOnline ? [{ userId: recipient, deliveredAt: timestamp }] : [],
        seen: isViewingChat,
        deliver: isOnline,
        senderInfo: {
          _id: sender,
          name: userInfo.name,
          profile: userInfo.avatar.isHidden
            ? '/assets/images/user.png'
            : userInfo.avatar.url
        }
      };

      // Handle message delivery based on recipient status
      if (isGroup) {
        // Group handling (similar to your existing logic but with consistent fields)
        const members = await getGroupMembers(chatId);
        for (const member of members) {
          if (member.toString() === sender.toString()) continue;
          
          const memberStatus = await handleRecipientStatus(socket, member, chatId);
          if (memberStatus.isOnline) {
            
            if (memberStatus.isViewingChat) {
              message.seenBy.push({ userId: member, timestamp });
              message.seen = true;
               message.deliveryTo.push({ userId: member, deliveredAt: timestamp });
              message.deliver = true;
            } else {
              message.deliveryTo.push({ userId: member, deliveredAt: timestamp });
              message.deliver = true;
            }
             io.to(memberStatus.socketId).emit('receive-attachment', message);

          }
        }
      } else if (isOnline) {
        // Private chat delivery
        io.to(socketId).emit('receive-attachment', message);
      }

      // Update Redis caches (similar to private chat)
      await updateRedisCaches({
        chatId,
        message,
        recipient: isGroup ? null : recipient,
        shouldStorePending: !isOnline || !isViewingChat
      });

      // Send to Kafka
      await producer.send({
        topic: isGroup
          ? process.env.KAFKA_GROUP_TOPIC || 'group-messages'
          : process.env.KAFKA_PRIVATE_TOPIC || 'private-messages',
        messages: [{
          value: JSON.stringify({
            ...message,
            time: toKafkaTimestamp(timestamp)
          })
        }]
      });

      // Cleanup temp file
      try {
        await fs.promises.access(tempFilePath);
        await fs.promises.unlink(tempFilePath);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error('Failed to delete temp file:', tempFilePath, err.message);
        }
      }

      cleanupFileBuffers(fileKey);

      callback({
        success: true,
        url,
        messageId: messageId.toString(),
        seen: message.seen,
        deliver: message.deliver,
        isLast: currentChunk + 1 === totalChunks,
      });

    } catch (err) {
      console.error('Error in send-attachment-chunks:', err.message);
      callback({ success: false, error: err.message });
    }
  });
}

async function getGroupMembers(groupId) {
  const group = await Conversation.findById(groupId);
  if (!group || !group.participants) return [];
  return group.participants.map(p => p.userId.toString());
}

function cleanupFileBuffers(fileKey) {
  fileBufferMap.delete(fileKey);
  if (fileTimeouts.has(fileKey)) {
    clearTimeout(fileTimeouts.get(fileKey));
    fileTimeouts.delete(fileKey);
  }
}
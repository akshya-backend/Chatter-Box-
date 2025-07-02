import { redisClient } from "../../config/redis.js";

export   function handleTypingEvents(io,socket) {
    socket.on('typing', async ({ chatId, isGroup, receiverId }) => {
  if (isGroup) {
    socket.to(chatId).emit('display typing', { chatId, senderId: socket.userId });
  } else {
    const receiverSocketId = await redisClient.get(`user:${receiverId}`);
    if (receiverSocketId) {
       const parse = JSON.parse(receiverSocketId)

      io.to(parse.socketId).emit('display typing', { chatId, senderId: socket.userId });
    }
  }
});

socket.on('stop typing', async ({ chatId, isGroup, receiverId }) => {
  if (isGroup) {
    socket.to(chatId).emit('hide typing', { chatId, senderId: socket.userId });
  } else {
   
    const receiverSocketId = await redisClient.get(`user:${receiverId}`);
    if (receiverSocketId) {
       const parse = JSON.parse(receiverSocketId)
      io.to(parse.socketId).emit('hide typing', { chatId, senderId: socket.userId });
    }
  }
});

}
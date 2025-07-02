import { redisClient } from "../../config/redis.js";

export function handleVideoCallEvent(io, socket) {
    // Handle call declined
    socket.on("call-declined", async (data) => {
        const { callerId, recipientId } = data;
        
        const redisInfo = await redisClient.get(`user:${callerId}`);
        if (!redisInfo) return;
        const { socketId } = JSON.parse(redisInfo);
        
        io.to(socketId).emit("call-declined-friend", {
            callerId: callerId
        });
    });

    // Handle call busy
    socket.on("call-busy", async (data) => {
        const { callerId, recipientId } = data;
        
        const redisInfo = await redisClient.get(`user:${callerId}`);
        if (!redisInfo) return;
        const { socketId } = JSON.parse(redisInfo);
        
        io.to(socketId).emit("call-busy", {
            callerId: callerId
        });
    });

    // Handle call timeout
    socket.on("call-timeout", async (data) => {
        const { callerId, recipientId } = data;
        
        const redisInfo = await redisClient.get(`user:${callerId}`);
        if (!redisInfo) return;
        const { socketId } = JSON.parse(redisInfo);
        
        io.to(socketId).emit("call-timeout", {
            callerId: callerId
        });
    });

    // Handle incoming call notification
    socket.on("incoming-call", async (data) => {
        const { recipientId, callerName, callerAvatar } = data;
        
        const redisInfo = await redisClient.get(`user:${recipientId}`);
        if (!redisInfo) return;
        const { socketId } = JSON.parse(redisInfo);
        
        io.to(socketId).emit("incoming-call-notification", {
            callerId: socket.userId,
            callerName,
            callerAvatar
        });
    });
}
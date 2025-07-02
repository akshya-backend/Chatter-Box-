import { setupSocketHandlers } from "../modules/video-Call/video-calling.js";
import { handleAttachment } from "./handle-attachment.js";
import { handleFriendOfflineStatus, handleFriendOnlineStatus } from "./handle-friendOnlineStatus.js";
import { handleGroupEvent, handleGroupIncomingMessage } from "./handle-group-messaging.js";
import { handleMessageSeen } from "./handle-messageSeen.js";
import { handlePrivateMesssage, handlePrivateSocket } from "./handle-private-messaging.js";
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return null;
}
export let socket = null;

export function initSocketConnection() {
  const token = getCookie('chatterbox');

  socket = io({
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('✅ Connected to server with token',socket.id);

  setupSocketHandlers(socket)
  socket.on("message-seen",(msg)=>handleMessageSeen(msg))
  socket.on("receive-message", (msg) => handlePrivateMesssage(msg));
  socket.on("receive-attachment", (msg) => handleAttachment(msg));
  socket.on("group-message-received", (msg) => handleGroupIncomingMessage(msg));
  socket.on("friend-online", (message)=>handleFriendOnlineStatus({ userId: message.userId }));
  socket.on("friend-offline", (message)=>handleFriendOfflineStatus({ userId: message.userId }));
  socket.on('display typing', ({ chatId, senderId }) => {
      const typingEl = document.querySelector(`#typing-${chatId}`);
      if (typingEl) typingEl.style.display = 'block';
    });
 socket.on('hide typing', ({ chatId, senderId }) => {      
      const typingEl = document.querySelector(`#typing-${chatId}`);
      if (typingEl) typingEl.style.display = 'none';
    });
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Connection failed:', err.message);
  });
}

 




export function sendMessages(message) {
  const data = sessionStorage.getItem('currentChat');
  const parseData = JSON.parse(data); 
  console.log("sendMessages:",  parseData);
  
  if (!parseData.isGroup) {
    handlePrivateSocket(socket, parseData.id, message, parseData.chatId);
  } else {
    handleGroupEvent(socket, parseData.id, message, parseData.chatId);
  }
}


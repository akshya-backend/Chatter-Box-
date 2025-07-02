import { socket } from "./socket-connection.js";

    let typingTimeout;
const TYPING_TIMER_LENGTH = 2000; // 3 seconds
 export function typingIndicator (){
 
     const userChat=sessionStorage.getItem("currentChat")
      const parsedata= JSON.parse(userChat)
  const chatId = parsedata.chatId,
  isGroup = parsedata.isGroup,
  receiverId = parsedata.id;
   console.log("typing indicator",chatId,isGroup,receiverId);
  socket.emit('typing', { chatId, isGroup, receiverId });

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop typing', { chatId, isGroup, receiverId });
  }, TYPING_TIMER_LENGTH);

 }
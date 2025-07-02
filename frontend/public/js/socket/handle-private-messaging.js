import { renderChat } from "../components/chat/chat-messages.js";
import { decryptMessage, encryptMessage } from "../utils/encryption/encryption.js";
import showAlertNotification from "../utils/helpers/alert-notificaion.js"

 export async  function  handlePrivateSocket(socket,userId,message,chatId,time= new Date()) {
  if (message.length > 0) {
   const sessionData= sessionStorage.getItem('currentChat')
   const parseData= JSON.parse(sessionData)   
   if (!parseData.key) {
      
      return showAlertNotification("Unable to send message",false)

   }
   const { ciphertext, iv } = await encryptMessage(message, userId, parseData.key);

     socket.emit("private-message",{recipient:userId,content:ciphertext,iv,chatId,time},(response)=>{
       if (response.success) {
         
         
        const data={
         messages:[ 
            {
             _id:response.messageId,
             senderId:"me",
             recipient:response.id,
             content:message,
             timestamp:time.toISOString(),
             seen:response.seen,
             deliver:response.deliver,
             type:"text",
            }
         ]
        }
        renderChat(data,false,true,false)
       }else{
        showAlertNotification("Unable to send message",false)
       }
     })
  }
}


 export async  function handlePrivateMesssage(mssge) {
   console.log("handlePrivateMesssage:", mssge);
   let text="text message received"
   try {
      if (!mssge) {
      showAlertNotification("Unable to open the Message , Please refresh the page",false)
      return;
   }
     const currentChat = sessionStorage.getItem('currentChat');
     const parseChat = JSON.parse(currentChat);
          
     if (parseChat?.id == mssge.sender) {
     const decryptText= await decryptMessage(mssge.content,mssge.iv,mssge.sender,parseChat.key)
          text=decryptText

        const data={
         chatId:mssge.chatId,
         messages:[
            {
             _id:mssge._id,
             senderId:{id:mssge.sender},
             userId:mssge.recipient,
             content:decryptText,
             timestamp:mssge.timestamp,
             status:mssge.status,
             type:"text",
            }
         ]
        }
   
   renderChat(data,false,true,false)
 }else{
   const getUndread=document.querySelector("#badge-"+mssge.sender);
   if (getUndread){
      getUndread.style.display = "block";
     const count = parseInt(getUndread.textContent) || 0;
     getUndread.textContent = count + 1;
   }
}
   } catch (error) {
      console.log("Error in handlePrivateMesssage:", error);
      
       showAlertNotification("An error occurred while handling the message", false);
       console.error("Error in handlePrivateMesssage:", error);
   }finally {
    // update last message  in ui 
      const lastMessageElement = document.querySelector(`#contact-last-msg-${mssge.sender}`);
      if (lastMessageElement) {
        lastMessageElement.textContent = getLastMessageText("text", text) || "No content";
      }
   
   }
   
}
export const getLastMessageText = (msg,content) => {
    
    if (!msg) return null;
    switch (msg) {
        case 'text':

            return  "last message: " + (content || "No content");
        case 'image':
           
            return "📷 Image";
        case 'video':
            
            return "🎥 Video";
        default:
            return "message";
    }
};

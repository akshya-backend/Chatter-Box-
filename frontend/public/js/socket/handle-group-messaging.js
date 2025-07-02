import { renderChat } from "../components/chat/chat-messages.js";
import { decryptGroupMessage, encryptGroupMessage, importAESKeyFromBase64, importPublicKey } from "../utils/encryption/groupEncryption.js";
import showAlertNotification from "../utils/helpers/alert-notificaion.js"

 export   async function handleGroupEvent(socket,groupId,message,chatId,time=new Date()){
   if (message.length > 0) {    
     const currentChat = sessionStorage.getItem('currentChat');
     const parseChat = JSON.parse(currentChat);
     const aesKey = await importAESKeyFromBase64(parseChat.key);
      const { encrypted: ciphertext, iv } = await encryptGroupMessage(message,  aesKey);     
     socket.emit("group-message-sent",{groupId,content:ciphertext,iv,chatId,time},(response)=>{
       if (response.success) {
        const data={
         messages:[
            {
             _id:response.messageId,
             senderId:"me",
             recipient:response.groupId,
             content:message,
             timestamp:time.toISOString(),
             status:response.status,
             chatId,
             seen:response.seen,
             deliver:response.deliver,
             
            }
         ]
        }
        renderChat(data,false,true,false)
       }else{
        console.log(response);

        showAlertNotification("Unable to send message",false)
       }
     })
  }
     
 
 }
   export async  function handleGroupIncomingMessage(response) {
 
   if (response) {
    const currentChat= sessionStorage.getItem('currentChat');
   const parseChat = JSON.parse(currentChat);
    if (parseChat.id == response.groupId) {
      const decryptText=  await decryptGroupMessage(response.content,response.iv,parseChat.key);;
    const data={
        chatId:response.chatId, 
        isGroup: true,
         messages:[ 
          {
             _id:response._id,
             senderId:{id:response.sender},
             recipient:response.groupId,
             content:decryptText,
             timestamp:response.timestamp,
             chatId:response.chatId,
             name:response.name,
             profile:response.profile,
             isdeletedBy: false,
            
             name:response.senderInfo.name,
             profile:response.senderInfo.avatar


            
            }
         ]
        }
        renderChat(data,false,true,false)
      }else{
        const getUndread=document.querySelector("#badge-"+response.groupId);
        if (getUndread){
          getUndread.style.display = "block";
          const count = parseInt(getUndread.textContent) || 0;
          getUndread.textContent = count + 1;
        }
      }
      
       }else{  
        console.log("Error in group message response:", response);
              
        showAlertNotification("Unable to send message",false)
       }
  
      }
  
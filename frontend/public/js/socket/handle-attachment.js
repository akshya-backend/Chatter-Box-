import { renderChat } from "../components/chat/chat-messages.js";
import showAlertNotification from "../utils/helpers/alert-notificaion.js"


  export function handleAttachment(mssge) {
    
    if (!mssge) {
      showAlertNotification("Unable to open the Attachment, Please refresh the page", false);
      return;
    }
    const currentChat = sessionStorage.getItem('currentChat');
    const parseChat = JSON.parse(currentChat);
    
    if (parseChat.chatId == mssge.chatId) {

    const data = {
      chatId: mssge.chatId,
      isGroup: true,
      messages: [
        {
          _id: mssge._id,
          senderId: {id :mssge.sender},
          userId: mssge.recipient,
          content: mssge.content,
          timestamp: mssge.timestamp,
          status: mssge.status,
          chatId: mssge.chatId,
          name: mssge.senderInfo?.name,
          type: mssge.type,
          profile: mssge.senderInfo?.profile,
          isdeletedBy: false,
          isGroup:mssge.isGroup,
        }
      ]
    };
    renderChat(data, false,true,false);
    }else{
      const getUndread=document.querySelector("#badge-"+mssge.recipient);
      if (getUndread){
        getUndread.style.display = "block";
        const count = parseInt(getUndread.textContent) || 0;
        getUndread.textContent = count + 1;
      }
    }
  }
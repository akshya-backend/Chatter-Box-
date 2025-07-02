import { renderChatFooter } from "../../components/chat/chat-footer.js";
import { renderChatHeader } from "../../components/chat/chat-header.js";
import { renderChat } from "../../components/chat/chat-messages.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

 let chatPaginationMap = {};
  
 export const loadChat= async(user)=>{
  const  mainSection = document.getElementById('chat-area');
  mainSection.innerHTML = '';
  const header = renderChatHeader(user)
  const body = document.createElement('div');
  body.classList.add('chat-messages');
  body.id = 'chat-messages';
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.id = 'empty-state-icon';
    
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    
    const title = document.createElement('div');
    title.className = 'empty-state-title';
    
    const description = document.createElement('div');
    description.className = 'empty-state-description';
        icon.innerHTML = '<i class="ri-question-answer-line"></i>';
        title.textContent = 'No chats';
        description.textContent = 'Start a new conversation';
emptyState.appendChild(icon);
    emptyState.appendChild(title);
    emptyState.appendChild(description);
    body.appendChild(emptyState);

  const footer= renderChatFooter()
  mainSection.appendChild(header);
  mainSection.appendChild(body);
  mainSection.appendChild(footer);  
   
  return body 

 }

export async function loadMessages(chatId, isDivider = true, isPagination = true) {
  const chatContainer = document.getElementById('chat-messages');

  // Initialize or reuse chat pagination
  if (!chatPaginationMap[chatId]) {
    chatPaginationMap = {};
    chatPaginationMap[chatId] = { page: 1, isLastPage: false };
  }

  const { page, isLastPage } = chatPaginationMap[chatId];

  // ✅ Avoid extra calls if already on the last page
  if (isLastPage) {
    return;
  }

  const limit = 10;
  const url = `/api/v1/chat/messages/${chatId}?page=${page}&limit=${limit}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
   
    if (!data.status) {
      showAlertNotification("Unable to fetch messages", false);
      window.location.reload();
      return;
    }

    const messages = data.messages;

    if (messages.length > 0) {
      // Clear container on first load
      if (page === 1) {
        chatContainer.innerHTML = '';
      }
     console.log("messages:", data);
     
      // ✅ Render the chat
      renderChat(data, isDivider, isPagination);

      // ✅ Update pagination state
      chatPaginationMap[chatId].page += 1;
      chatPaginationMap[chatId].isLastPage = data.meta?.isLastPage || false;
    } else {
      // ❗ If 0 messages returned, mark as last page
      chatPaginationMap[chatId].isLastPage = true;
    }
  } catch (err) {
    console.error("❌ Error loading messages:", err);
    showAlertNotification("Something went wrong while loading messages", false);
  }
}



import { loadChat, loadMessages } from "../modules/chat/pagination.js";
import { setActiveView } from "./contact-panel-handler.js";

// Initialize the active panel and previous chat
export function initActivePanel() {
  let activePanel = 'chats';
  setActiveView(activePanel);
  // Delay to ensure DOM is ready
  setTimeout(initPreviousChat, 100);
}

// Try to restore the previous chat from sessionStorage
export const initPreviousChat = async () => {
  const chatData = sessionStorage.getItem('currentChat');
  if (!chatData) return;

  const chat = JSON.parse(chatData);  
  const id = `${chat.isGroup ? "group" : "friend"}-all-${chat.id}`;
  let element = document.getElementById(id);
    
  if (!element) {
    // Load chat and try to click again after a delay
    await loadChat(chat);
    await loadMessages(chat.id);
    setTimeout(() => {
      const retryElement = document.getElementById(id);
      if (retryElement) retryElement.click();
    }, 100);
  } else {    
    element.click();
  }
};

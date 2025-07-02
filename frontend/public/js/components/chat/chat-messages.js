import { loadMessages } from "../../modules/chat/pagination.js";
import { decryptMessage } from "../../utils/encryption/encryption.js";
import { decryptGroupMessage } from "../../utils/encryption/groupEncryption.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

let isLoading = false;

export async function renderChat(chat, isDivider = true, scrollToBottom = true, isEncrypt = true) {
  try {
    const chatMessages = document.getElementById('chat-messages');
    document.getElementById("empty-state-icon")?.remove();
    const sessionData = sessionStorage.getItem('currentChat');
    const parseData = JSON.parse(sessionData);

    // Store initial scroll position for later adjustment
    const initialScrollHeight = chatMessages.scrollHeight;
    const initialScrollTop = chatMessages.scrollTop;

    // Process all messages first (decrypt if needed)
    const messagePromises = chat.messages.map(async (message) => {
      if (document.getElementById(message._id)) {
        return null; // Skip duplicates
      }

      const isSentByMe = message.senderId.toString() === 'me' || message.senderId?.id === chat.userId;
      let key = parseData.key;
      
      let content = message.content;

      // Only decrypt text messages that aren't deleted
      if (isEncrypt && !message.isdeletedBy && message.type === 'text') {
        try {
          content = chat.isGroup
            ? await decryptGroupMessage(message.content, message.iv, key)
            : await decryptMessage(message.content, message.iv, message.senderId?.id, key);
        } catch (error) {
          console.error('Decryption error:', error);
          content = "[Unable to decrypt message]";
        }
      }

      return {
        ...message,
        processedContent: content,
        isSentByMe
      };
    });

    // Wait for all messages to be processed
    const processedMessages = (await Promise.all(messagePromises)).filter(msg => msg !== null);

    // Create document fragment for batch DOM updates
    const fragment = document.createDocumentFragment();

    // Render all processed messages
    processedMessages.forEach(message => {
      const messageWrapper = document.createElement('div');
      messageWrapper.className = `message-wrapper ${message.isSentByMe ? 'sent' : 'received'}`;
      messageWrapper.id = message._id;

      if (chat.isGroup) {
        messageWrapper.style.marginTop = message.isSentByMe ? '0' : '30px';
      }

      const messageElement = document.createElement('div');
      messageElement.className = `message message-${message.isSentByMe ? 'sent' : 'received'}`;

      // Add sender info for group messages
      console.log("message.isSentByMe:", message.isSentByMe,
        "chat.isGroup:", chat.isGroup
      );
      
      if (chat.isGroup ) {
        if (!message.isSentByMe) {
        
        const userMeta = document.createElement('div');
        userMeta.className = 'message-user-meta';

        const avatar = document.createElement('img');
        avatar.className = 'message-avatar';
        avatar.src = message.profile || '/assets/images/user.png';
        avatar.alt = `${message.name || 'User'}'s avatar`;
        avatar.onerror = () => { avatar.src = '/assets/images/user.png'; };

        const name = document.createElement('span');
        name.className = 'message-sender-name';
        name.textContent = message.name || 'Unknown';

        userMeta.appendChild(avatar);
        userMeta.appendChild(name);
        messageElement.appendChild(userMeta);
      }
      }

      // Create message content
      const messageContent = document.createElement('div');
      messageContent.className = 'message-content';

      if (message.isdeletedBy) {
        messageContent.textContent = "This message has been deleted.";
        messageContent.style.color = "#c96464";
      } else {
        switch (message.type) {
          case 'image':
            const img = document.createElement('img');
            img.src = message.content;
            img.alt = "Sent image";
            img.className = 'chat-image';
            img.loading = 'lazy';
            messageContent.appendChild(img);
            break;
          case 'video':
            const video = document.createElement('video');
            video.src = message.content;
            video.controls = true;
            video.className = 'chat-video';
            messageContent.appendChild(video);
            break;
          default:
            messageContent.textContent = message.processedContent;
        }
      }

      // Create message metadata
      const messageMeta = document.createElement('div');
      messageMeta.className = 'message-meta';

      const timeElement = document.createElement('span');
      timeElement.className = 'message-time';
      timeElement.textContent = formatDateTime(message.timestamp);
      messageMeta.appendChild(timeElement);

      if (message.isSentByMe) {
        const statusElement = document.createElement('span');
        statusElement.className = 'message-status';
         console.log("message.status:", message.seen, message.delivery);
         
        const statusIcon = document.createElement('i');
        statusIcon.className = message.deliver? 'ri-check-double-line':'ri-check-line' ; 
        statusIcon.style.color = message.seen ? 'green' : 'gray';

        statusElement.appendChild(statusIcon);
        messageMeta.appendChild(statusElement);
      }

      // Create message actions menu
      const messageActions = document.createElement('div');
      messageActions.className = 'message-actions';

      if (!message.isdeletedBy) {
        const actionsButton = document.createElement('button');
        actionsButton.className = 'message-actions-btn';
        actionsButton.innerHTML = '<i class="ri-more-2-fill"></i>';

        const actionsMenu = document.createElement('div');
        actionsMenu.className = 'message-actions-menu';
        actionsMenu.innerHTML = `
          <button class="action-item" data-action="copy"><i class="ri-file-copy-line"></i> Copy</button>
          <button class="action-item" data-action="delete"><i class="ri-delete-bin-line"></i> Delete</button>
        `;

        actionsButton.addEventListener('click', (e) => {
          e.stopPropagation();
          document.querySelectorAll('.message-actions-menu').forEach(menu => {
            if (menu !== actionsMenu) menu.style.display = 'none';
          });
          actionsMenu.style.display = actionsMenu.style.display === 'block' ? 'none' : 'block';
        });

        actionsMenu.querySelectorAll('.action-item').forEach(item => {
          item.addEventListener('click', async (e) => {
            e.stopPropagation();
            const action = item.getAttribute('data-action');
            await handleMessageAction(action, message, chat);
            actionsMenu.style.display = 'none';
          });
        });

        // Close menu when clicking outside
        setTimeout(() => {
          document.addEventListener('click', function closeMenu(e) {
            if (!actionsMenu.contains(e.target)) {
              actionsMenu.style.display = 'none';
              document.removeEventListener('click', closeMenu);
            }
          });
        });

        messageActions.appendChild(actionsButton);
        messageActions.appendChild(actionsMenu);
      }

      // Assemble message elements
      messageElement.appendChild(messageContent);
      messageElement.appendChild(messageMeta);

      if (message.isSentByMe) {
        messageWrapper.appendChild(messageActions);
        messageWrapper.appendChild(messageElement);
      } else {
        messageWrapper.appendChild(messageElement);
        messageWrapper.appendChild(messageActions);
      }

      fragment.appendChild(messageWrapper);
    });

    // Add all messages to DOM at once
    if (isDivider || scrollToBottom) {
      chatMessages.appendChild(fragment);
    } else {
      chatMessages.insertBefore(fragment, chatMessages.firstChild);
    }

    // Handle scrolling
    if (scrollToBottom) {
      setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }, 50);
    } else {
      const newScrollHeight = chatMessages.scrollHeight;
      const scrollDiff = newScrollHeight - initialScrollHeight;
      chatMessages.scrollTop = initialScrollTop + scrollDiff;
    }

    // Pagination handler
    chatMessages.onscroll = async () => {
      if (chatMessages.scrollTop === 0 && !isLoading) {
        isLoading = true;
        const data = sessionStorage.getItem("currentChat");
        const chatData = JSON.parse(data);
        await loadMessages(chatData.chatId, false, false);
        isLoading = false;
      }
    };

  } catch (error) {
    console.error('Error rendering chat:', error);
    showAlertNotification('Failed to load messages', false);
  }
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

async function handleMessageAction(action, message, chat) {
  switch (action) {
    case 'copy':
      try {
        await navigator.clipboard.writeText(message.content);
        showAlertNotification("Message copied to clipboard", true);
      } catch (error) {
        console.error('Failed to copy:', error);
        showAlertNotification("Failed to copy message", false);
      }
      break;

    case 'delete':
      try {
        const res = await fetch(`/api/v1/chat/delete-message`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messageId: message._id })
        });
        const data = await res.json();
        if (data.status) {
          const messageElement = document.getElementById(message._id);
          if (messageElement) {
            const contentElement = messageElement.querySelector('.message-content');
            if (contentElement) {
              contentElement.textContent = "This message has been deleted.";
              contentElement.style.color = "#c96464";
              // Remove actions menu
              const actionsElement = messageElement.querySelector('.message-actions');
              if (actionsElement) {
                actionsElement.remove();
              }
            }
          }
        } else {
          showAlertNotification(data.message, false);
        }
      } catch (error) {
        console.error('Delete error:', error);
        showAlertNotification("Failed to delete message", false);
      }
      break;

    default:
      console.warn("Unknown action:", action);
  }
}
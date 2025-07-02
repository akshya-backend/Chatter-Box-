import { sendMessages, socket } from "../../socket/socket-connection.js";
import { typingIndicator } from "../../socket/socket-typing-indicator.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";
import { renderChat } from "./chat-messages.js";

let isLoading = false;

export function renderChatFooter() {
  const chatInputContainer = document.createElement('div');
  chatInputContainer.className = 'chat-input-container';
  chatInputContainer.style.position = 'relative';

  const chatInputWrapper = document.createElement('div');
  chatInputWrapper.className = 'chat-input-wrapper';

  const emojiBtn = document.createElement('button');
  emojiBtn.className = 'emoji-btn';
  emojiBtn.innerHTML = '<i class="ri-emotion-happy-line"></i>';

  const messageInput = document.createElement('textarea');
  messageInput.className = 'message-input';
  messageInput.placeholder = 'Type a message...';
  messageInput.rows = 1;
  messageInput.id = 'message-input';
  messageInput.addEventListener('input', typingIndicator);

  const emojiPicker = document.createElement('emoji-picker');
  emojiPicker.style.position = 'absolute';
  emojiPicker.style.bottom = '60px';
  emojiPicker.style.left = '10px';
  emojiPicker.style.zIndex = '1000';
  emojiPicker.style.display = 'none';

  emojiPicker.addEventListener('emoji-click', event => {
    messageInput.value += event.detail.unicode;
    emojiPicker.style.display = 'none';
  });

  emojiBtn.addEventListener('click', e => {
    e.stopPropagation();
    emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'block' : 'none';
  });

  document.addEventListener('click', e => {
    if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
      emojiPicker.style.display = 'none';
    }
  });

  const attachmentBtn = document.createElement('button');
  attachmentBtn.className = 'attachment-btn';
  attachmentBtn.id = 'attachment-btn';
  attachmentBtn.innerHTML = '<i class="ri-attachment-2"></i>';

  const sendBtn = document.createElement('button');
  sendBtn.className = 'send-btn';
  sendBtn.id = 'send-btn';
  sendBtn.innerHTML = '<i class="ri-send-plane-2-fill"></i>';

  sendBtn.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message) sendMessages(message);
    messageInput.value = '';
  });

  chatInputWrapper.appendChild(emojiBtn);
  chatInputWrapper.appendChild(messageInput);
  chatInputWrapper.appendChild(attachmentBtn);
  chatInputWrapper.appendChild(sendBtn);

  const attachmentMenu = document.createElement('div');
  attachmentMenu.className = 'attachment-menu';
  attachmentMenu.id = 'attachment-menu';
  attachmentMenu.style.display = 'none';

  const attachmentItems = [
    { icon: 'ri-image-line', text: 'Image', accept: 'image/*' },
    { icon: 'ri-video-line', text: 'Video', accept: 'video/*' },
  ];

  attachmentItems.forEach(item => {
    const attachmentItem = document.createElement('div');
    attachmentItem.className = 'attachment-item';

    const itemIcon = document.createElement('i');
    itemIcon.className = item.icon;

    const itemText = document.createElement('span');
    itemText.textContent = item.text;

    attachmentItem.appendChild(itemIcon);
    attachmentItem.appendChild(itemText);

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = item.accept;
    fileInput.style.display = 'none';

    fileInput.addEventListener('change', () => handleAttachmentFileUpload(fileInput, item, attachmentBtn));
    attachmentItem.appendChild(fileInput);

    attachmentItem.addEventListener('click', () => {
      const input = attachmentItem.querySelector('input[type="file"]');
      if (input) input.click();
    });

    attachmentMenu.appendChild(attachmentItem);
  });

  attachmentBtn.addEventListener('click', e => {
    e.stopPropagation();
    attachmentMenu.style.display = attachmentMenu.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', e => {
    const btn = document.getElementById('attachment-btn');
    if (!attachmentMenu.contains(e.target) && !btn.contains(e.target)) {
      attachmentMenu.style.display = 'none';
    }
  });

  chatInputContainer.appendChild(chatInputWrapper);
  chatInputContainer.appendChild(attachmentMenu);
  chatInputContainer.appendChild(emojiPicker);
  return chatInputContainer;
}

function handleAttachmentFileUpload(input, item, btn) {
  btn.click();
  const data = sessionStorage.getItem('currentChat');

  const { chatId, id: recipient, isGroup } = JSON.parse(data);
  console.log("chatId:", chatId, "recipient:", recipient, "isGroup:", isGroup);
  
  const file = input.files[0];
  if (!file) return;

  if (file.size > 10 * 1024 * 1024) {
    showAlertNotification('❌ File size exceeds 10MB limit.', false);
    return;
  }

  const fileType = item.text.toLowerCase();

  const preview = document.createElement('div');
  preview.className = 'attachment-preview sent-message-bubble';
  preview.style.alignSelf = 'flex-end';
  preview.style.backgroundColor = "#4338ca";
  preview.style.borderRadius = '12px';
  preview.style.padding = '10px';
  preview.style.margin = '6px 0';
  preview.style.maxWidth = '70%';
  preview.style.display = 'flex';
  preview.style.flexDirection = 'column';
  preview.style.alignItems = 'flex-end';
  preview.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';

  const spinner = document.createElement('div');
  spinner.className = 'spinner';
  spinner.style.width = '50px';
  spinner.style.height = '50px';
  spinner.style.border = '3px solid #ccc';
  spinner.style.borderTop = '3px solid #4caf50';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';
  spinner.style.marginBottom = '6px';

  const fileLabel = document.createElement('span');
  fileLabel.textContent = file.name;
  fileLabel.style.fontSize = '14px';
  fileLabel.style.color = '#999';
  fileLabel.style.wordBreak = 'break-word';

  preview.appendChild(spinner);
  preview.appendChild(fileLabel);

  const chatMessages = document.getElementById('chat-messages');
  chatMessages.appendChild(preview);
  preview.scrollIntoView({ behavior: 'smooth', block: 'end' });

  const chunkSize = 1024 * 100;
  const totalChunks = Math.ceil(file.size / chunkSize);
  let currentChunk = 0;

  function loadNextChunk() {
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const blob = file.slice(start, end);

    const reader = new FileReader();
    reader.onload = async e => {
      const chunkData = e.target.result;

      await socket.emit("send-attachment-chunks", {
        chunk: chunkData,
        recipient,
        chatId,
        currentChunk,
        totalChunks,
        fileName: file.name,
        type: fileType,
        isGroup,
        time: new Date()
      }, response => {
        if (response.success) {
          const data = {
            messages: [
              {
                _id: response.messageId,
                senderId: "me",
                recipient,
                content: response.url,
                timestamp: new Date().toISOString(),
                type: fileType,
                isdeletedBy: false,
                seen:response.seen,
                deliver:response.deliver,
                

              }
            ]
          };
           if (response.isLast) {
            preview.remove();
            renderChat(data, false, true,false);}
        } else {
          preview.remove();
          showAlertNotification("❌ Attachment upload failed", false);
        }
      });

      currentChunk++;
      if (currentChunk < totalChunks) {
        loadNextChunk();
      }
    };

    reader.readAsArrayBuffer(blob);
  }

  loadNextChunk();
}
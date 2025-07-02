export function handleMessageSeen(data) {
    console.log("handleMessageSeen:", data);
    
    const sessionInfo = sessionStorage.getItem('currentChat');
    if (!sessionInfo) return;
    
    const parseData = JSON.parse(sessionInfo);
    if (parseData.chatId !== data.chatId) return;
   console.log("parseData:", parseData);
    
    // Get all received messages in the chat (messages from others)
    const receivedMessages = document.querySelectorAll('.message-wrapper.sent');
    console.log("receivedMessages:", receivedMessages);
    
    receivedMessages.forEach(messageWrapper => {
        const statusElement = messageWrapper.querySelector('.message-status');   
        statusElement.innerHTML = '<i class="ri-check-double-line" style="color: green;"></i>';
        
    });
}
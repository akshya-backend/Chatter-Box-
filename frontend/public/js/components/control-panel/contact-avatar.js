import { currentView } from "../../app/contact-panel-handler.js";
import { decryptMessage } from "../../utils/encryption/encryption.js";
import { decryptGroupMessage } from "../../utils/encryption/groupEncryption.js";

function createContactAvatar(item, tab) {
    const avatar = document.createElement('div');
    avatar.className = `contact-avatar`
    avatar.id = 'contact-avatar-' + item.id;
    
    if (item.avatar) {
        const img = document.createElement('img');
        img.className = 'list-avatar-img';
        img.src = item.avatar;
        img.alt = item.name;
        avatar.appendChild(img);
    } else if (item.initials) {
    const initials = item.initials.toUpperCase();
        avatar.textContent = initials;
    } else {
        const initials = item.name.split(' ').map(n => n[0]).join('').toUpperCase()
        avatar.textContent = initials;
    }
       if (!item.isGroup) {        
         const statusDot = document.createElement('span');
         statusDot.id = 'status-dot-' + item.id;
        statusDot.className = 'status-dot ' + (item.isOnline ? 'online' : 'offline');
        avatar.appendChild(statusDot);
       }
       
    
    return avatar;
}

async function createContactInfo(item, tab, typing=true) {    
    const info = document.createElement('div');
    info.className = 'contact-info';
    
    const name = document.createElement('div');
    name.className = 'contact-name';
    name.id = 'contact-name-' + item.id;
    name.textContent = item.name;
    info.appendChild(name);

        
        
     if (item.lastMessage) {

        const lastMsg = document.createElement('div');
        lastMsg.id = 'contact-last-msg-' + item.id;
        lastMsg.className = 'contact-last-msg';
        lastMsg.textContent = "last message : " +  await getLastMessage(item);
        lastMsg.style.marginBottom = '5px';
        info.appendChild(lastMsg);
    } else if (tab === 'requests' && currentView === 'friends' && item.message) {
        const message = document.createElement('div');
        message.className = 'contact-last-msg';
        message.textContent = item.message;
        info.appendChild(message);
    } else if (tab === 'requests' && currentView === 'friends' && item.mutualFriends) {
        const mutual = document.createElement('div');
        mutual.className = 'contact-last-msg';
        mutual.textContent = item.mutualFriends + ' mutual friends';
        info.appendChild(mutual);
    } else if (tab === 'requests' && currentView === 'groups' && item.admin) {
        const admin = document.createElement('div');
        admin.className = 'contact-last-msg';
        admin.textContent = 'Admin: ' + item.admin;
        info.appendChild(admin);
    } else if (tab === 'blocked') {
        const blockedText = document.createElement('div');
        blockedText.className = 'contact-last-msg';
        blockedText.textContent = 'Blocked';
        info.appendChild(blockedText);
    }
    const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator-'+ item.chatId;
        typingDiv.id = 'typing-' + item.chatId;
        typingDiv.style.display = 'none';
        typingDiv.innerHTML = '<div class="typing-dots"><span style= "background-color:#50f150"></span><span style= "background-color:#50f150"></span><span style= "background-color:#50f150"></span></div>';
        info.appendChild(typingDiv);
    return info;
}
export const getLastMessage = async (item) => {
     const msg=item.lastMessage
    if (!msg) return null;
    switch (msg.type) {
        case 'text':
            if (msg.isdeletedBy) {
                return "This message has been deleted.";
            }
            let decryptText=null
            if (item.isGroup) {
                decryptText=await decryptGroupMessage(msg.content,msg.iv,item.key)
            }else{
                decryptText=await decryptMessage(msg.content, msg.iv,item.id,item.key)
            }
            
            return decryptText
        case 'image':
            if (msg.isdeletedBy) {
                return "This image has been deleted.";
            }
            return "📷 Image";
        case 'video':
            if (msg.isdeletedBy) {
                return "This video has been deleted.";
            }
            return "🎥 Video";
        default:
            return "message";
    }
};
export { createContactAvatar, createContactInfo };
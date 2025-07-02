import { currentView } from "../../app/contact-panel-handler.js";
import { loadChat, loadMessages } from "../../modules/chat/pagination.js";
// import { loadMessages } from "../../modules/chat/pagination.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";
import { createContactAvatar, createContactInfo } from "./contact-avatar.js";
import { createContactMeta } from "./contact-metaData.js";

function showEmptyState(tab) {
    const contactsList = document.getElementById('contacts-list');
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    const icon = document.createElement('div');
    icon.className = 'empty-state-icon';
    
    const title = document.createElement('div');
    title.className = 'empty-state-title';
    
    const description = document.createElement('div');
    description.className = 'empty-state-description';
    
    if (tab === 'requests' && currentView === 'friends') {
        icon.innerHTML = '<i class="ri-user-search-line"></i>';
        title.textContent = 'No friend requests';
        description.textContent = 'You have no pending friend requests';
    } else if (tab === 'requests' && currentView === 'groups') {
        icon.innerHTML = '<i class="ri-group-line"></i>';
        title.textContent = 'No group invitations';
        description.textContent = 'You have no pending group invitations';
    } else if (tab === 'blocked') {
        icon.innerHTML = '<i class="ri-forbid-line"></i>';
        title.textContent = `No ${currentView === 'friends' ? 'blocked friends' : 'blocked groups'}`;
        description.textContent = `You haven't blocked any ${currentView === 'friends' ? 'friends' : 'groups'}`;
    } else if (currentView === 'friends') {
        icon.innerHTML = '<i class="ri-user-search-line"></i>';
        title.textContent = 'No friends';
        description.textContent = 'Add friends to start chatting';
    } else if (currentView === 'groups') {
        icon.innerHTML = '<i class="ri-group-line"></i>';
        title.textContent = 'No groups';
        description.textContent = 'Create or join a group to get started';
    } else {
        icon.innerHTML = '<i class="ri-message-line"></i>';
        title.textContent = 'No conversations';
        description.textContent = 'Start a new conversation to see messages here';
    }
    
    emptyState.appendChild(icon);
    emptyState.appendChild(title);
    emptyState.appendChild(description);
    contactsList.appendChild(emptyState);
}
 async function   createContactItem(item, tab) {
    
    const contactItem = document.createElement('div');
    contactItem.className = 'contact-item';
    contactItem.id = `${item.isGroup ? "group" : "friend"}-${tab}-${item.id}`;

    if (tab !== 'blocked') {

     contactItem.addEventListener("click",async ()=>{
        if (item.isBlocked) return showAlertNotification(`This ${item.isGroup?"Group":"Friend"} is blocked. Unblock To Start Chat `, false);
        
        
        const undreadDiv=document.getElementById(`badge-${item.id}`)
        undreadDiv.innerHTML="0"
        undreadDiv.style.display="none"
        
                if (window.innerWidth <= 769) {
                    const contactPanel = document.getElementById('contacts-panel');                    
                    contactPanel.classList.remove('show');
                    
                }
         const currentChat = sessionStorage.getItem("currentChat");
          const ischatting = document.querySelector('.chat-messages');
        
         if (currentChat && JSON.parse(currentChat).chatId == item.chatId && ischatting) {
            return;
          }
          const result = loadChat(item)
          if(result){
         const chat_Id= item.chatId?._id ||item.chatId          
            sessionStorage.setItem("currentChat", JSON.stringify({isGroup : item.isGroup? true:false, id : item.id, chatId:chat_Id, name : item.name,avatar:item.avatar ,email:item.email,key:item.key}));
            await loadMessages(chat_Id);
            }else{
              showAlertNotification("Failed to load chat. Please try again later.  ", false);
            }
     })
    }
    
    const avatar = createContactAvatar(item, tab);
    contactItem.appendChild(avatar);
    
    const info =  await createContactInfo(item, tab);
    contactItem.appendChild(info);
    
    const meta = createContactMeta(item, tab,contactItem);
    contactItem.appendChild(meta);
    
    contactItem.addEventListener('click', () => {
        if (tab === 'blocked') return;
        
        document.querySelectorAll('.contact-item').forEach(ci => ci.classList.remove('active'));
        contactItem.classList.add('active');
        
        // Chat handling logic would go here
    });
    
    return contactItem;
}

export { showEmptyState,createContactItem };
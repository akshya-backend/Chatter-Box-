import { AddFriendModal } from "../components/friend/addFriendModel-section.js";
import { createGroupModal } from "../components/group/create-group-model.js";
// import { loadMessages } from "../modules/chat/pagination.js";

  export function globalEventListners() {
     document.getElementById('friendIcon')?.addEventListener('click', AddFriendModal);
     document.getElementById('groupIcon')?.addEventListener('click', createGroupModal);

    const searchInput = document.getElementById('contacts-search');
     const flags = document.querySelectorAll('#contacts-title')?.innerhtml?.toLowerCase() || '';
      searchInput?.addEventListener('input', (e) => {
          const value = e.target.value.trim().toLowerCase();
          const contactsList = document.getElementById('contacts-list');
          const contactsItems = contactsList.querySelectorAll('.contact-item');
  
          contactsItems.forEach(item => {
              const name = item.querySelector('.contact-name')?.textContent?.toLowerCase() || '';
              item.style.display = name.startsWith(value) ? 'flex' : 'none';
          });
      });
   

 }
 
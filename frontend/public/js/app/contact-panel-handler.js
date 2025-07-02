import { createContactItem, showEmptyState } from "../components/control-panel/show-emptyStatus.js";
import { grouplistData } from "../components/group/fetch-grouplist.js";
import { renderSettingsContent } from "../components/settings/main-setting-handler.js";
import { RecentChats } from "../modules/chat/recent-chat.js";
import { getFriendList } from "../modules/friends/get-friendList.js";

let currentView;
let showSettings;

function initSideNav() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const panelId = item.id.split('-')[0];
             sessionStorage.setItem('activePanel', panelId);
            
            setActiveView(panelId);
        });
    });
}


  function setActiveView(view) {
     const chatArea= document.getElementById("chat-area")
    const friendIcon = document.getElementById("friendIcon");
    const groupIcon = document.getElementById("groupIcon");
    const navItems = document.querySelectorAll('.nav-item');
    const searchDiv = document.getElementById('search-btn');

    navItems.forEach(nav => nav.classList.remove('active'));
    document.getElementById(`${view}-nav`).classList.add('active');
    
    currentView = view;
    showSettings = view === 'settings';
    
    updateContactsView();
    
    if (view === 'settings') {
        searchDiv.style.display = "none";
    } else {
        searchDiv.style.display = "block";
    }
    
    if (view === 'friends') {
        friendIcon.style.display = "inline";
        groupIcon.style.display = "none";
    } else if (view === 'groups') {
        friendIcon.style.display = "none";
        groupIcon.style.display = "inline";
    } else {
        friendIcon.style.display = "none";
        groupIcon.style.display = "none";
    }
    
    if (window.innerWidth <= 768) {
        const contactsPanel = document.getElementById('contacts-panel');
        contactsPanel.classList.add('show');
    }
}



 async function renderContactsTabs(tabs) {
   const data = currentView === 'friends' ? await getFriendList() : currentView === 'groups' ? await grouplistData() : currentView === "chats" ? await RecentChats() : await RecentChats();
   
   const contactsTabs = document.getElementById('contacts-tabs');
    contactsTabs.innerHTML = '';
    
    tabs.forEach(tab => {
        const tabElement = document.createElement('button');
        tabElement.className = 'contacts-tab';
        tabElement.textContent = tab.charAt(0).toUpperCase() + tab.slice(1);
        tabElement.dataset.tab = tab;
        
        if (tab === 'requests' && currentView === 'friends' && data.requests.length > 0) {
            const badge = document.createElement('span');
            badge.className = 'contacts-tab-badge';
            badge.id = 'friends-requests-tab';
            badge.textContent = data.requests.length;
            tabElement.appendChild(badge);
        }
        
        if ( currentView === 'groups' && data.blocked.length > 0) {
            const badge = document.createElement('span');
            badge.className = 'contacts-tab-badge';
            badge.id = 'groups-blocked-tab';
            badge.textContent = data.blocked.length;
            tabElement.appendChild(badge);
        }
        
        tabElement.addEventListener('click', () => {
            document.querySelectorAll('.contacts-tab').forEach(t => t.classList.remove('active'));
            tabElement.classList.add('active');
            
            if (currentView === 'chats') {
                renderContactsList('chats');
            } else if (currentView === 'friends') {
                renderContactsList( tab);
            } else if (currentView === 'groups') {
                renderContactsList(tab);
            }
        });
        
        contactsTabs.appendChild(tabElement);
    });
    
    if (contactsTabs.firstChild) {
        contactsTabs.firstChild.classList.add('active');
    }
}

 async function updateContactsView() {
    const contactsTitle = document.getElementById('contacts-title');
    const contactsTabs = document.getElementById('contacts-tabs');
    const contactsList = document.getElementById('contacts-list');
    const settingsContent = document.getElementById('settings-content');

    if (showSettings) {
        contactsTitle.textContent = 'Settings';
        contactsTabs.style.display = 'none';
        contactsList.style.display = 'none';
        settingsContent.style.display = 'block';
        renderSettingsContent('profile');
        return;
    }
    
    contactsTitle.textContent = currentView.charAt(0).toUpperCase() + currentView.slice(1);
    contactsTabs.style.display = 'flex';
    contactsList.style.display = 'block';
    settingsContent.style.display = 'none';
    
    switch(currentView) {
        case 'chats':
            renderContactsTabs(['chats']);
            renderContactsList();
            break;
        case 'friends': 
            renderContactsTabs(['all', 'requests', 'blocked']); 
            renderContactsList();
            break;
        case 'groups':

            
            renderContactsTabs(['all', 'blocked']);
            renderContactsList();
            break;
    }
}

 async function renderContactsList(tab = 'all') {
    const data = currentView === 'friends' ? await getFriendList() : currentView === 'groups' ? await grouplistData() : currentView === "chats" ? await RecentChats(): await RecentChats(); 
    // set in frontend  in session storage in each  viw
    
    const contactsList = document.getElementById('contacts-list');
    contactsList.innerHTML = '';
    
    const items = data[tab] || [];
    
    if (items.length === 0) {
        showEmptyState(tab);
        return;
    }
    console.log("----------->",items);
    
    items.forEach(async item => {
        if(!item.isRemoved){
        const contactItem = await createContactItem(item, tab);
        contactsList.appendChild(contactItem);}
    });
}


export { initSideNav, setActiveView, currentView, showSettings,renderContactsTabs,renderContactsList };
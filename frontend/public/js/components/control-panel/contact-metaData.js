import { currentView } from "../../app/contact-panel-handler.js";
import { accept_FriendRequest, reject_FriendRequest } from "../../modules/friends/accpet-decline-friendRequest.js";
import { unblockGroup } from "../../modules/groups/block-group.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";
import { unblockFriend } from "../friend/block-remove-handler.js";

function createContactMeta(item, tab,element) {
    const meta = document.createElement('div');
    meta.className = 'contact-meta';
    meta.id = 'contact-meta-' + item.id;
    
    if (item.lastUpdated  && !item.isGroup) {
        const time = document.createElement('div');
        time.className = 'contact-time';
        time.id = 'ago-' + item.id;
        time.textContent = getTimeAgo(item.lastUpdated || item.time);
         if (!item.isOnline) meta.appendChild(time);
    }    
   
    if ( tab !== 'blocked'   &&  tab !== 'requests') {
        const badge = document.createElement('div');
        badge.className = 'unread-badge';
        badge.id = `badge-${item.id}`;
        if (item.unread) {
            badge.classList.add('active');  
        } else {
            badge.classList.remove('active');
        }
        if (item.unread < 1) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'block';
        }   
        badge.textContent = item.unread;
        meta.appendChild(badge);
    }
    
    if (tab === 'requests') {
        const actions = document.createElement('div');
        actions.className = 'contact-actions' ;
        
        if (currentView === 'friends') {
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'contact-action-btn';
            acceptBtn.innerHTML = '<i class="ri-check-line" style="color: var(--success-color)"></i>';
            acceptBtn.title = 'Accept';
            
            
            acceptBtn.addEventListener('click', async (e) => {
                e.stopPropagation();
                 const res = await accept_FriendRequest(item.id);
                if(res){
                    const tab = document.querySelector('#friends-requests-tab');
                 
                    const friendDiv = document.querySelector(`#friend-requests-${item.id}` );
                      friendDiv.style.display = 'none';
                    if (tab) {
                        const decreaseCount = parseInt(tab.textContent);
                        if (decreaseCount > 1) {    
                            tab.textContent = decreaseCount - 1;
                            friendDiv.remove();
                        } else {
                            tab.remove();
                        }
                    }
                    const element = document.querySelector(`[data-id="requests-` + item.id + `"]`);
                    showAlertNotification(`Now you are friends with ${item.name} and can start chatting!`);
                    element.remove();
                }
            });
            actions.appendChild(acceptBtn);
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'contact-action-btn';
            rejectBtn.innerHTML = '<i class="ri-close-line" style="color: var(--danger-color)"></i>';
            rejectBtn.title = 'Reject';
            rejectBtn.addEventListener('click',async  (e) => {
                e.stopPropagation();
                const res= await reject_FriendRequest(item.id);
                if(res){
                    const tab = document.querySelector('#friends-requests-tab');
                    if (tab) {
                        const  decreaseCount = parseInt(tab.textContent)
                        if (decreaseCount > 1) {
                            tab.textContent = decreaseCount - 1;    
                        } else {
                            tab.remove();
                        }
                    }
                    showAlertNotification(`Friend request to ${item.name} has been rejected.`,false);
                    element.remove();
                
                }

            });
            actions.appendChild(rejectBtn);
        } else if (currentView === 'groups') {
            const acceptBtn = document.createElement('button');
            acceptBtn.className = 'contact-action-btn';
            acceptBtn.innerHTML = '<i class="ri-check-line" style="color: var(--success-color)"></i>';
            acceptBtn.title = 'Accept';
            acceptBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showToast(`Accepted group invitation to ${item.name}`);
            });
            actions.appendChild(acceptBtn);
            
            const rejectBtn = document.createElement('button');
            rejectBtn.className = 'contact-action-btn';
            rejectBtn.innerHTML = '<i class="ri-close-line" style="color: var(--danger-color)"></i>';
            rejectBtn.title = 'Reject';
            rejectBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                showToast(`Rejected group invitation to ${item.name}`);
            });
            actions.appendChild(rejectBtn);
        }
        
        meta.appendChild(actions);
    }
    
    if (tab === 'blocked') {
        const unblockBtn = document.createElement('button');
        unblockBtn.className = 'contact-action-btn';
        unblockBtn.innerHTML = '<i  class="ri-prohibited-2-line style="color: var(--primary-color)"></i>';
        unblockBtn.title = 'Unblock';
        unblockBtn.addEventListener('click', async  (e) => {
            e.stopPropagation();
            let res;
            if(currentView == 'groups'){
               res= await unblockGroup(item.id);
            }else{
              res = await unblockFriend(item.email);
            }
            if (res.status) {
                showAlertNotification(res.message, true);
                window.location.reload();
            } else {
                showAlertNotification(res.message, false);
            }
            
        });
        
        meta.appendChild(unblockBtn);
    }
    
    return meta;
}
export function getTimeAgo(isoDateString) {
console.log("ISO Date String:", isoDateString);
  const past = new Date(isoDateString);
  const now = new Date();

  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) {
    const mins = Math.floor(diffInSeconds / 60);
    return `${mins} min${mins !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 86400) {
    const hrs = Math.floor(diffInSeconds / 3600);
    return `${hrs} hr${hrs !== 1 ? "s" : ""} ago`;
  }
  if (diffInSeconds < 172800) return "yesterday";

  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days !== 1 ? "s" : ""} ago`;
}


export { createContactMeta };
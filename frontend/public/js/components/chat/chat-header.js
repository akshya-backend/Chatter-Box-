import { peer } from "../../app/main.js";
import { blockGroup } from "../../modules/groups/block-group.js";
import fetchGroupInfo from "../../modules/groups/fetch-group-info.js";
import { startOutgoingCall } from "../../modules/video-Call/video-calling.js";
import { socket } from "../../socket/socket-connection.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";
import { blockFriend, removeFriend } from "../friend/block-remove-handler.js";
import { groupProfile } from "../group/group-profile.js";

export function renderChatHeader(user) {
  
  const chatHeader = document.createElement('div');
  chatHeader.className = 'chat-header';

  const chatUser = document.createElement('div');
  chatUser.className = 'chat-user';

  const chatAvatar = document.createElement('div');
  chatAvatar.className = 'chat-avatar';

  const avatarImg = document.createElement('img');
  avatarImg.id = 'chat-avatar-img';
  avatarImg.src = user.avatar !== "" ? user.avatar : '/assets/images/user.png';
  avatarImg.alt = user.name;
  chatAvatar.appendChild(avatarImg);

  const chatInfo = document.createElement('div');
  chatInfo.className = 'chat-info';

  const chatName = document.createElement('div');
  chatName.id = 'chat-name';
  chatName.className = 'chat-name';
  chatName.textContent = user.name || 'Unknown User';
  chatInfo.appendChild(chatName);

  chatUser.appendChild(chatAvatar);
  chatUser.appendChild(chatInfo);

  const chatActions = document.createElement('div');
  chatActions.className = 'chat-actions';

  const actions = [];

  if (!user.isGroup) {
    actions.push({ icon: 'ri-vidicon-line', id: 'video-call-btn' });
  }

  actions.push({ id: 'chat-more-btn', icon: 'ri-more-2-line' });

  const contextMenu = document.createElement('div');
  contextMenu.className = 'context-menu hidden';
  contextMenu.id = 'chat-context-menu';

  const menuItems = user.isGroup
    ? [
        { icon: 'ri-user-3-line', text: 'View Group Profile' },
        { icon: 'ri-user-unfollow-line', text: 'Block Group',}
      ]
    : [
        { icon: 'ri-user-unfollow-line', text: 'Block Friend', },
        { icon: 'ri-delete-bin-7-line', text: 'Remove Friend',  }
      ];

  menuItems.forEach(item => {
    const menuItem = document.createElement('div');
    menuItem.className = `context-menu-item ${item.danger ? 'danger' : ''}`;

    const icon = document.createElement('i');
    icon.className = item.icon;

    const text = document.createElement('span');
    text.textContent = item.text;

    menuItem.appendChild(icon);
    menuItem.appendChild(text);

    menuItem.addEventListener('click', async (e) => {
      e.stopPropagation();

      try {
        if (item.text === "View Group Profile") {
          const groupInfo = await fetchGroupInfo(user.id);
          if (!groupInfo.status) {
            showAlertNotification(groupInfo.message, false);
            return;
          }

          const groupProfileModal = document.getElementById('chat-area');
          const data1 = groupProfile(groupInfo.group);
          groupProfileModal.appendChild(data1);

        } else if (item.text === "Block Friend") {
          const response = await blockFriend(user.email);
          handleBlockResponse(response);

        } else if (item.text === "Block Group") {
          const response = await blockGroup(user.id);
          handleBlockResponse(response);

        } else if (item.text === "Remove Friend") {
          const response = await removeFriend(user.email);
          handleBlockResponse(response);
        }

      } catch (error) {
        console.error("Action error:", error);
        showAlertNotification("An unexpected error occurred.", false);
      }
    });

    contextMenu.appendChild(menuItem);
  });

  actions.forEach(action => {
    const button = document.createElement('button');
    button.className = 'chat-action-btn';
    if (action.id) button.id = action.id;

    button.addEventListener('click', (e) => {
      e.stopPropagation();

      if (action.id === 'video-call-btn') {
    const checkVideoCallUI = document.getElementById('video-call-ui');
    if (checkVideoCallUI) {
      showAlertNotification("You are already in a video call. End the current call before starting a new one.", false);
      return;
    }
     const onlineStatusDot= document.getElementById(`status-dot-${user.id}`);
     if (onlineStatusDot && onlineStatusDot.classList.contains('offline')) {
        showAlertNotification("The user is currently offline. You cannot start a video call.", false);
        return;
      }

      startOutgoingCall(peer,user.id, user.name, user.avatar, socket);

        // Handle video call...
      } else if (action.id === 'chat-more-btn') {
        contextMenu.classList.toggle('hidden');
      }
    });

    const icon = document.createElement('i');
    icon.className = action.icon;
    button.appendChild(icon);
    chatActions.appendChild(button);
  });

  document.addEventListener('click', () => {
    contextMenu.classList.add('hidden');
  });

  contextMenu.addEventListener('click', (e) => e.stopPropagation());

  chatHeader.appendChild(chatUser);
  chatHeader.appendChild(chatActions);
  chatHeader.appendChild(contextMenu);

  return chatHeader;
}

function handleBlockResponse(response) {
  if (response.status) {
    showAlertNotification(response.message, true);
    sessionStorage.removeItem("currentChat");
    window.location.reload();
  } else {
    showAlertNotification(response.message, false);
  }
}

// Render friends for group addition
 export function renderFriendsForGroup() {
    groupFriendsToAdd.innerHTML = '';
    
    friendsData.all.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.className = 'contact-item';
        friendItem.dataset.id = friend.id;
        
        friendItem.innerHTML = `
            <div class="contact-avatar">
                ${friend.avatar ? `<img src="${friend.avatar}" alt="${friend.name}">` : friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                <span class="status-dot ${friend.status === 'online' ? 'online' : ''}"></span>
            </div>
            <div class="contact-info">
                <div class="contact-name">${friend.name}</div>
                <div class="contact-last-msg">${friend.status === 'online' ? 'Online' : 'Offline'}</div>
            </div>
            <div class="contact-meta">
                <label class="toggle-switch">
                    <input type="checkbox" class="group-friend-checkbox">
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        groupFriendsToAdd.appendChild(friendItem);
    });
}

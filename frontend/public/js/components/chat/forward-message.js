
// Open forward modal
 export function openForwardModal(messageElement) {
    forwardModal.classList.add('active');
    forwardFriendsList.innerHTML = '';
    
    friendsData.all.forEach(friend => {
        const friendItem = document.createElement('div');
        friendItem.className = 'contact-item forward-friend';
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
        `;
        
        friendItem.addEventListener('click', () => {
            document.querySelectorAll('.forward-friend').forEach(f => f.classList.remove('selected'));
            friendItem.classList.add('selected');
        });
        
        forwardFriendsList.appendChild(friendItem);
    });
}

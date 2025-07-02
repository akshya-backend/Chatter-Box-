function handleFriendOnlineStatus({ userId }) {
  const dot = document.querySelector(`#status-dot-${userId}`);
  const contactMeta = document.getElementById(`contact-meta-${userId}`);
  const agoDiv = contactMeta?.querySelector(`#ago-${userId}`);
  
  if (dot) {
    if (agoDiv) agoDiv.remove();
    dot.classList.remove('offline');
    dot.classList.add('online');
  } else {
    console.warn(`Online dot not found for userId: ${userId}`);
  }
}

function handleFriendOfflineStatus({ userId }) {
  const dot = document.querySelector(`#status-dot-${userId}`);
  const contactMeta = document.getElementById(`contact-meta-${userId}`);
  const agoClass = `ago-${userId}`;
  const existingAgoDiv = contactMeta?.querySelector(`.${agoClass}`);

  if (dot) {
    dot.classList.remove('online');
    dot.classList.add('offline');

    if (!existingAgoDiv && contactMeta) {
      const agoDiv = document.createElement('div');
      agoDiv.className = "contact-time " ;
      agoDiv.textContent = 'just now';
      agoDiv.id = agoClass;
      contactMeta.prepend(agoDiv);
    }
  } else {
    console.warn(`Offline dot not found for userId: ${userId}`);
  }
}

export { handleFriendOnlineStatus, handleFriendOfflineStatus };

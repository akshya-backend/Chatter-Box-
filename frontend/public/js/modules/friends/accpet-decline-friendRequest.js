import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

  export  async function accept_FriendRequest(id) {
     // Fetch user profile information
     const response = await fetch('/api/v1/user/accept-friend-request', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ friendId: id }),
     });
     const data = await response.json();

     return data.status

     
 }


 export  async function reject_FriendRequest(id) {
    // Fetch user profile information
    const response = await fetch('/api/v1/user/reject-friend-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: id }),
    });
    
    const data = await response.json();

    // Handle the response
    if (data.status) {
       return true
    } else {
        showAlertNotification('Failed to reject friend request', false);
        console.error('Failed to reject friend request');
    }
}
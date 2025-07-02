import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

async function getFriendList() {
    try {
        const response = await fetch('/api/v1/chat/friend-list', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
            throw new Error(`HTTP Error! Status: ${response.status}`);
        }

        const res = await response.json();
     
        if (res.status) {            
            return res.data;
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error fetching friend list:", error.message);
        showAlertNotification("Unable to fetch friend list", false);
    }
}



export { getFriendList };

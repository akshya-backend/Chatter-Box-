import showAlertNotification from "../../utils/helpers/alert-notificaion.js"

  export async  function blockFriend(email)  {
     if (!email) {
        showAlertNotification("Please enter a valid email address", false);
        return;
         }
          const  res= await fetch("/api/v1/user/friend/block", 
            {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });
          const data = await res.json();
          return data;
        
        }

export async function removeFriend(email) {
    if (!email) {
        showAlertNotification("Please enter a valid email address", false);
        return;
    }
    const res = await fetch("/api/v1/user/friend/removed", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
   return data;
}

export async function unblockFriend(email) {
    if (!email) {
        showAlertNotification("Please enter a valid email address", false);
        return;
    }
    const res = await fetch("/api/v1/user/friend/unblock", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
    });
    const data = await res.json();
    return data;
}
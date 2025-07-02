import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

 export  async function sendfriendRequest(email, message,model) {
   if (!email) {
    showAlertNotification("Please enter a valid email address", false);
    return;
   }
   const res=await fetch(`/api/v1/user/send-friend-request`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ email, message }),
   });

   const data=await res.json();
   if (data.status) {
    model.remove();
     showAlertNotification("Friend request sent successfully", true);
   } else {
    model.remove();

     showAlertNotification(data.message, false);
   }
 }
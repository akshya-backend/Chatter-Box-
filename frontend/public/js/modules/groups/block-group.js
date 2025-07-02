import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

export async function blockGroup(id) {
  try {
    const response = await fetch("/api/v1/chat/block-group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId: id }),
    });

    const data = await response.json();
    return data; // Should contain { status: boolean, message: string }
  } catch (error) {
    console.error("Error blocking friend:", error);
    showAlertNotification("An error occurred while blocking friend.", false);
    return { status: false, message: "An unexpected error occurred." };
  }
}
 export async function unblockGroup(id) {
  console.log("unblocking",id);
  
  try {
    const response = await fetch("/api/v1/chat/unblock-group", {
         method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ groupId: id }),
    })
    const data = await response.json();
    console.log(data);
    
    return data; 
  }catch(error){
 console.error("Error blocking friend:", error);
    showAlertNotification("An error occurred while blocking friend.", false);
    return { status: false, message: "An unexpected error occurred." };
  }
}
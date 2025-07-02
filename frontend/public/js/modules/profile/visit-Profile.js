import { renderProfilePage } from "../../components/settings/index-container.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

export async function visit_Profile() {
    try {
        // Fetch user profile information
        const response = await fetch('/api/v1/user/user-profile', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
      
        // Check if the response is successful
        if (!response.ok) {
            throw new Error(`Failed to fetch profile info: ${response.status} ${response.statusText}`);
        }

        const res = await response.json();

        // Handle successful response
        if (res.status) {
            const objectElement = renderProfilePage(res.data); // Assuming `profile` is a function that generates DOM elements
            const groupsSection = document.querySelector('.groups-section');

            if (groupsSection) {
                groupsSection.innerHTML = ''; 
                groupsSection.append(objectElement); 
            } else {
                showAlertNotification("Groups section not found in the DOM.", false)
            }
        } else {            
            showAlertNotification(res.message || "Failed to fetch profile information.", falsw)
        }
    } catch (error) {
        showAlertNotification(error.message || "An unexpected error occurred. Please try again.", false)
    }
}
export default visit_Profile;
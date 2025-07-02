import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

export function renderPrivacySettings(settingsContent, data) {
    console.log("Rendering privacy settings with data:", data);
    
    const privacySection = document.createElement('div');
    privacySection.innerHTML = `
        <div class="settings-section">
            <div class="settings-section-title"><i class="ri-eye-line"></i> Privacy Settings</div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Online Status</div>
                    <div class="settings-item-description">allow  other to  see your online status</div>
                </div>
                 <label class="toggle-switch">
                    <input type="checkbox" id="onlineStatusToggle" ${data.showOnlineStatus ? "checked" : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
           
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Profile Photo</div>
                    <div class="settings-item-description">allow other see your profile photo</div>
                </div>
              <label class="toggle-switch">
                    <input type="checkbox" id="profilePicToggle" ${data.showProfilePic ?  '': "checked"}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
    `;
    settingsContent.appendChild(privacySection);

    // Add event listeners for toggle switches
    document.getElementById('onlineStatusToggle').addEventListener('change', (e) => {
        updatePrivacySetting('showOnlineStatus', e.target.checked);
    });

    
    document.getElementById('profilePicToggle').addEventListener('change', (e) => {
        updatePrivacySetting('showProfilePic', e.target.checked);
    })

    async function updatePrivacySetting(settingType, value) {
        try {
            const response = await fetch('/api/v1/auth/privacy-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ settingType, value })
            });

            const result = await response.json();

            if (!result.status) {
                throw new Error(result.message);
            }

            // Show success feedback
            showAlertNotification('Privacy settings updated successfully');
            sessionStorage.removeItem('chat-settings');

        } catch (error) {
            console.error('Error updating privacy setting:', error);
            showAlertNotification(error.message || 'Failed to update privacy settings', false);
            
            // Revert the toggle if the request failed
            const toggle = document.getElementById(`${settingType}Toggle`);
            if (toggle) {
                toggle.checked = !value;
            }
        }
    }

  
}
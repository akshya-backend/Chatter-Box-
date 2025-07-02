import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

async function updateProfile() {
    // Get form values
    const profileData = {
        name: document.getElementById('profile-name').value.trim(),
        gender: document.getElementById('profile-gender').value,
        dob: document.getElementById('profile-dob').value,
        bio: document.getElementById('profile-bio').value.trim()
    };
   
    // Validation checks
    if (!profileData.name) {
        showAlertNotification("Name cannot be empty", false);
        return;
    }

    if (profileData.name.length < 4 || profileData.name.length > 20) {
        showAlertNotification("Name must be between 4 and 20 characters long", false);
        return;
    }

    if (profileData.bio && profileData.bio.length > 300) {
        showAlertNotification("Bio must not exceed 300 characters", false);
        return;
    }

    try {
        const response = await fetch('/api/v1/user/update-profile', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();
       if (!response.ok) {
         showAlertNotification("Profile updated unsuccessfully",);
       }
        if (!data.status) {
            throw new Error(data.message || 'Profile update failed');
        }
                    sessionStorage.removeItem('chat-settings');

        showAlertNotification("Profile updated successfully", "success");
  
    } catch (error) {
        console.log(error);
        
        console.error('Error updating profile:', error);
        showAlertNotification(error.message || "An error occurred while updating profile", false);
    }
}

async function updateAvatar(event, imageElement, container, cameraIcon) {
    const userImgTag = document.querySelector("#user-img-tag");
    
    // Create a more elegant spinner overlay
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.className = 'avatar-upload-spinner';
    spinnerOverlay.innerHTML = `
        <div class="spinner-container">
            <div class="spinner" style="height:45px;width:45px"></div>
        </div>
    `;
     
    // Add styles to the container
    container.style.position = 'relative';
    container.appendChild(spinnerOverlay);
    cameraIcon.style.opacity = '0';
    
    try {
        const file = event.target.files[0];
        if (!file) return;

        // Preview the image immediately for better UX
        const reader = new FileReader();
        reader.onload = (e) => {
            imageElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
        const formData = new FormData();
        formData.append("profileImage", file);
        // Send the file to the server
        const response = await fetch("/api/v1/user/upload-profile-image", {
            method: "POST",
            body: formData,
        })

          
        const result = await response.json();

        if (response.ok && result.status) {
            // Update the profile image with the server response URL
            if (userImgTag) userImgTag.src = result.imageUrl;
            imageElement.src = result.imageUrl;
            
            showAlertNotification("Profile image updated successfully", "success");
            sessionStorage.removeItem('chat-settings');
        } else {
            throw new Error(result.message || "Failed to upload profile image");
        }
    } catch (error) {
        console.log("Error uploading profile image:", error);
        showAlertNotification(error.message || "An error occurred while uploading the image", false);
    } finally {
        spinnerOverlay.style.opacity = '0';
        setTimeout(() => {
            spinnerOverlay.remove();
            cameraIcon.style.opacity = '1';
        }, 300); 
    }
}

export { updateProfile, updateAvatar };

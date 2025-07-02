import { updateAvatar, updateProfile } from "../../modules/profile/personal-Info-handler.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";
// Profile Update Module
export function renderProfileSettings(data) {  
      
    const profileSection = createProfileSection(data);
    const settingsContent = document.getElementById('settings-content');
    settingsContent.appendChild(profileSection);

    setupAvatarUpload();
    setupDatePicker(data.dob);
    setupEmailCopy();
    setupProfileUpdate();
}

function createProfileSection(data) {
    
    const profileSection = document.createElement('div');
    profileSection.classList.add('settings-section-container');

    // Avatar Section
    profileSection.appendChild(createAvatarSection(data));

    // Profile Info Section
    profileSection.appendChild(createProfileInfoSection(data));

    return profileSection;
}

function createAvatarSection(data) {
    const avatarSection = document.createElement('div');
    avatarSection.classList.add('settings-section');
    avatarSection.innerHTML = `
        <div class="profile-avatar">
            <img id="profile-avatar-img" src="${data.avatar}" alt="User">
            <div class="profile-avatar-edit">
                <i class="ri-camera-line"></i>
                <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
            </div>
        </div>
        <div class="profile-name" id="display-name">${data.name}</div>
        <div class="profile-status online"><i class="ri-checkbox-blank-circle-fill"></i> Online</div>
    `;
    return avatarSection;
}

function createProfileInfoSection(data) {
    
    const profileInfoSection = document.createElement('div');
    profileInfoSection.classList.add('settings-section');

    profileInfoSection.innerHTML = `
        <div class="settings-section-title">
            <i class="ri-user-line"></i> Profile Information
        </div>

        <div class="form-group">
            <label class="form-label">Name</label>
            <input type="text" id="profile-name" class="form-control" value="${data.name}">
        </div>

        <div class="form-group">
            <label class="form-label">Gender</label>
            <select id="profile-gender" class="form-control">
                <option value="male" ${data.gender === 'male' ? 'selected' : ''}>Male</option>
                <option value="female" ${data.gender === 'female' ? 'selected' : ''}>Female</option>
                <option value="other" ${data.gender === 'other' ? 'selected' : ''}>Other</option>
            </select>
        </div>

        <div class="form-group">
            <label class="form-label">Date of Birth</label>
            <div class="dob-input-wrapper">
                <input type="text" value='${ formatDate(data.dob)}' class="form-control formatted-date" readonly>
                <input type="date" id="profile-dob" class="real-date">
                <i class="ri-calendar-line calendar-icon"></i>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Email</label>
            <div class="email-input-wrapper">
                <input type="email" id="profile-email" class="form-control" value="${data.email}" readonly>
                <i class="ri-file-copy-line copy-icon" title="Copy Email"></i>
            </div>
        </div>

        <div class="form-group">
            <label class="form-label">Bio</label>
            <textarea id="profile-bio" value='${data.bio}' class="form-control" rows="3"></textarea>
        </div>

        <div class="btn-group">
            <button id="update-profile-info" class="btn btn-primary">Save Changes</button>
        </div>
    `;

    return profileInfoSection;
}

function setupDatePicker(dob) {
    const realDateInput = document.getElementById('profile-dob');
    const formattedInput = document.querySelector('.formatted-date');
    const calendarIcon = document.querySelector('.calendar-icon');

    // Set default date and format it
    let defaultDOB = '2004-07-08';
    if (dob) defaultDOB = dob;
    realDateInput.value = defaultDOB;
    
    formattedInput.value = formatDate(defaultDOB);

    realDateInput.addEventListener('change', () => {
        formattedInput.value = formatDate(realDateInput.value);
    });

    const openDatePicker = () => realDateInput.showPicker?.() || realDateInput.focus();
    formattedInput.addEventListener('click', openDatePicker);
    calendarIcon.addEventListener('click', openDatePicker);
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
}

function setupEmailCopy() {
    const copyIcon = document.querySelector('.copy-icon');
    const emailInput = document.getElementById('profile-email');

    copyIcon.addEventListener('click', () => {
        navigator.clipboard.writeText(emailInput.value).then(() => {
            showAlertNotification("Email copied to clipboard");
            copyIcon.classList.replace('ri-file-copy-line', 'ri-check-line');
            setTimeout(() => {
                copyIcon.classList.replace('ri-check-line', 'ri-file-copy-line');
            }, 1500);
        });
    });
}

function setupAvatarUpload() {
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarImg = document.getElementById('profile-avatar-img');
    const avatarEdit = document.querySelector('.profile-avatar-edit');
    const container = document.querySelector('.profile-avatar');
    const cameraIcon = avatarEdit.querySelector('.ri-camera-line');


    avatarEdit.addEventListener('click', () => avatarUpload.click());

    avatarUpload.addEventListener('change', async (e) => {
        // Upload to backend
        await updateAvatar(e,avatarImg,container,cameraIcon);
    });
}


function setupProfileUpdate() {
    const updateBtn = document.getElementById('update-profile-info');
    updateBtn.addEventListener('click', updateProfile);
}


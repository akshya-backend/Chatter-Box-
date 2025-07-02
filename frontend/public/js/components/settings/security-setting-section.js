import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

// Security Settings Module - Final Working Version
export function renderSecuritySettings(settingsContent, data) {
    const securitySection = document.createElement('div');
    securitySection.className = 'security-settings';
    
    securitySection.innerHTML = `
        <div class="settings-section">
            <div class="settings-section-title"><i class="ri-shield-keyhole-line"></i> Account Security</div>
            
            <div class="settings-item app-lock-item">
                <div style="width:100%">
                    <div style='display:flex; justify-content:space-between'>
                        <div>
                            <div class="settings-item-label">App Lock</div>
                            <div class="settings-item-description">Add an extra layer of security to your account</div>
                        </div>
                        <label class="toggle-switch">
                            <input type="checkbox" class="app-lock-toggle" ${data.appLock ? "checked" : ""}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="pin-setup-container" style="display:none">
                        <input type="password" style='margin-top:15px' id='set-pin-input' class="search-input" 
                               placeholder="${data.appLock ? 'Change 4-digit PIN' : 'Enter 4-digit PIN'}" 
                               maxlength="4" minlength="4" inputmode="numeric" pattern="[0-9]*">
                        <div class="pin-actions" style='margin:10px'>
                            ${data.appLock ? '<button class="btn btn-danger btn-sm remove-pin-btn">Remove PIN</button>' : ''}
                            <button class="btn btn-secondary btn-sm cancel-pin-btn" ${data.appLock ? 'style="display:none"' : ''}>Cancel</button>
                            <button class="btn btn-primary btn-sm setup-pin-btn">${data.appLock ? 'Update PIN' : 'Set PIN'}</button>
                        </div>
                        <p class="pin-error-msg" style="color: red; display: none;"></p>
                    </div>
                </div>
            </div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Login Alerts</div>
                    <div class="settings-item-description">Get notified when your account is accessed from a new device</div>
                </div>
                <label class="toggle-switch">
                    <input type="checkbox" class="login-alert-toggle" ${data.loginAlert ? "checked" : ""}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        </div>
        
        <div class="settings-section">
            <div class="settings-section-title"><i class="ri-lock-line"></i> Password</div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Change Password</div>
                    <div class="settings-item-description">Update your account password</div>
                </div>
                <button class="btn btn-primary btn-sm change-password-btn">Change</button>
            </div>
        </div>
        
        <!-- Modal Backdrop -->
        <div class="modal-backdrop" style="display: none"></div>
        
        <!-- Password Change Modal -->
        <div class="modal" id="passwordModal" style="display: none ;padding:30px">
            <div class="modal-content">
                <h3 style='border-bottom:1px solid #334155;margin-bottom:30px;padding-bottom:10px'>Change Password</h3>
                <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" minlength="4" maxlength="4" class="current-password search-input" placeholder="Enter current password">
                </div>
                <div class="form-group">
                    <label>New Password</label>
                    <input type="password" minlength="4" maxlength="4" class="new-password search-input" placeholder="Enter new password">
                </div>
                <div class="form-group">
                    <label>Confirm New Password</label>
                    <input type="password" minlength="4" maxlength="4" class="confirm-password search-input" placeholder="Confirm new password">
                </div>
                <div class="modal-actions">
                    <button class="btn btn-secondary btn-sm cancel-password-btn">Cancel</button>
                    <button class="btn btn-primary btn-sm update-password-btn">Update Password</button>
                </div>
                <p class="password-error-msg" style="color: red; display: none;"></p>
            </div>
        </div>
    `;
    
    settingsContent.appendChild(securitySection);
    
    // Initialize event listeners
    initSecuritySettings(data);
}

// Initialize security settings functionality
function initSecuritySettings(data) {
    const appLockToggle = document.querySelector('.app-lock-toggle');
    const loginAlertToggle = document.querySelector('.login-alert-toggle');
    const setupPinBtn = document.querySelector('.setup-pin-btn');
    const removePinBtn = document.querySelector('.remove-pin-btn');
    const cancelPinBtn = document.querySelector('.cancel-pin-btn');
    const pinInput = document.querySelector('#set-pin-input');
    const pinSetupContainer = document.querySelector('.pin-setup-container');
    const pinErrorMsg = document.querySelector('.pin-error-msg');

    // App Lock Toggle
    appLockToggle.addEventListener('change',async  function() {
        if (appLockToggle.checked) {
            const isAlready= await fetch('/api/v1/auth/check-app-lock',{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            
            })
            const res=await isAlready.json();
            if (res.status) {
                sessionStorage.removeItem('chat-settings')
               showAlertNotification('App  lock enabled successfully!');
               return;
            }
            pinSetupContainer.style.display = 'block';
            pinInput.focus();
        } else {
            const disableAppLock=await fetch('/api/v1/auth/disable-app-lock',{  
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const res=await disableAppLock.json();
            if (res.status) {
                sessionStorage.removeItem('chat-settings')
                showAlertNotification('App lock  disabled successfully!' ,false);
            }
        }
    });

    // Setup PIN Button
    setupPinBtn?.addEventListener('click', async function() {
        const pin = pinInput.value;
        if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
            try {
                await enableAppLock(pin);
                 appLockToggle.checked = true;
                pinSetupContainer.style.display = 'none';
                sessionStorage.removeItem('chat-settings')
                showAlertNotification('PIN set successfully!');
            } catch (error) {
                pinErrorMsg.textContent = error.message || 'Failed to set PIN';
                pinErrorMsg.style.display = 'block';
            }
        } else {
            pinErrorMsg.textContent = 'Please enter a valid 4-digit PIN';
            pinErrorMsg.style.display = 'block';
        }
    });

    // Remove PIN Button
    removePinBtn?.addEventListener('click', async function() {
        try {
            await disableAppLock();
            data.appLock = false;
            pinSetupContainer.style.display = 'none';
            pinInput.value = '';
            appLockToggle.checked = false;
            pinErrorMsg.style.display = 'none';
            showToast('PIN removed successfully!');
        } catch (error) {
            pinErrorMsg.textContent = error.message || 'Failed to remove PIN';
            pinErrorMsg.style.display = 'block';
        }
    });

    // Cancel PIN Button
    cancelPinBtn?.addEventListener('click', function() {
        pinSetupContainer.style.display = 'none';
        pinInput.value = '';
        pinErrorMsg.style.display = 'none';
        appLockToggle.checked = false;
    });

    // PIN Input validation
    pinInput?.addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9]/g, '');
        pinErrorMsg.style.display = 'none';
    });
    
    // Login Alert Toggle
    loginAlertToggle.addEventListener('change', function() {
        updateLoginAlert(this.checked);
    });
    
    // Setup Password Modal Handlers
    setupPasswordModal(data);
}

function setupPasswordModal(data) {
    const modal = document.getElementById('passwordModal');
    const backdrop = document.querySelector('.modal-backdrop');
    const cancelBtn = modal.querySelector('.cancel-password-btn');
    const updateBtn = modal.querySelector('.update-password-btn');
    const errorMsg = modal.querySelector('.password-error-msg');
    const changePasswordBtn = document.querySelector('.change-password-btn');
    
    // Show modal function
    const showModal = () => {
        modal.style.display = 'block';
        backdrop.style.display = 'block';
        modal.querySelector('.current-password').focus();
    };
    
    // Hide modal function
    const hideModal = () => {
        modal.style.display = 'none';
        backdrop.style.display = 'none';
        errorMsg.style.display = 'none';
        modal.querySelectorAll('input').forEach(input => input.value = '');
    };
    
    // Change password button click handler
    changePasswordBtn.addEventListener('click', showModal);
    
    // Cancel button click handler
    cancelBtn.addEventListener('click', hideModal);
    
    // Update button click handler
    updateBtn.addEventListener('click', async () => {
        const currentPassword = modal.querySelector('.current-password').value;
        const newPassword = modal.querySelector('.new-password').value;
        const confirmPassword = modal.querySelector('.confirm-password').value;
        
        if (!currentPassword || !newPassword || !confirmPassword) {
            errorMsg.textContent = 'Please fill in all fields';
            errorMsg.style.display = 'block';
            return;
        }
        
        if (newPassword !== confirmPassword) {
            errorMsg.textContent = 'New passwords do not match';
            errorMsg.style.display = 'block';
            return;
        }
        
        if (newPassword.length !== 4) { 
            errorMsg.textContent = 'Password must be  exactly  4 characters';
            errorMsg.style.display = 'block';
            return;
        }
        
        try {
            await changePassword(currentPassword, newPassword);
            hideModal();
            showToast('Password changed successfully!');
        } catch (error) {
            errorMsg.textContent = error.message || 'Failed to change password';
            errorMsg.style.display = 'block';
        }
    });
    
    // Close modal when clicking on backdrop
    backdrop.addEventListener('click', hideModal);
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            hideModal();
        }
    });
}

// Show PIN verification modal
function showPinVerificationModal() {
    return new Promise((resolve, reject) => {
        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        backdrop.style.display = 'block';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.style.padding = '20px';
        modal.style.maxWidth = '300px';
        modal.style.width = '100%';
        
        modal.innerHTML = `
            <div class="modal-content">
                <h3 style="margin-top: 0">Enter Your PIN</h3>
                <input type="password" class="pin-input search-input" placeholder="Enter 4-digit PIN" 
                       maxlength="4" minlength="4" inputmode="numeric" pattern="[0-9]*" 
                       style="width: 100%; margin: 10px 0">
                <p class="pin-error-msg" style="color: red; display: none; margin-bottom: 10px;"></p>
                <div style="display: flex; justify-content: space-between; gap: 10px">
                    <button class="btn btn-secondary cancel-pin-btn" style="flex: 1">Cancel</button>
                    <button class="btn btn-primary verify-pin-btn" style="flex: 1">Verify</button>
                </div>
            </div>
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(modal);
        
        const pinInput = modal.querySelector('.pin-input');
        const verifyBtn = modal.querySelector('.verify-pin-btn');
        const cancelBtn = modal.querySelector('.cancel-pin-btn');
        const errorMsg = modal.querySelector('.pin-error-msg');

        pinInput.focus();

        verifyBtn.onclick = async function() {
            const pin = pinInput.value;
            if (pin && pin.length === 4 && /^\d+$/.test(pin)) {
                try {
                    await verifyPin(pin);
                    document.body.removeChild(backdrop);
                    document.body.removeChild(modal);
                    resolve();
                } catch (error) {
                    errorMsg.textContent = 'Incorrect PIN. Please try again.';
                    errorMsg.style.display = 'block';
                    pinInput.value = '';
                    pinInput.focus();
                }
            } else {
                errorMsg.textContent = 'Please enter a valid 4-digit PIN';
                errorMsg.style.display = 'block';
            }
        };

        cancelBtn.onclick = function() {
            document.body.removeChild(backdrop);
            document.body.removeChild(modal);
            reject(new Error('PIN verification cancelled'));
        };
        
        // Close on backdrop click
        backdrop.onclick = function() {
            document.body.removeChild(backdrop);
            document.body.removeChild(modal);
            reject(new Error('PIN verification cancelled'));
        };
        
        // Close on Escape key
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', handleKeyDown);
                document.body.removeChild(backdrop);
                document.body.removeChild(modal);
                reject(new Error('PIN verification cancelled'));
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
    });
}

// Helper function to show toast messages
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast-message';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
}

// API Integration Functions (mock implementations - replace with actual API calls)
async function enableAppLock(pin) {
 const res= await fetch('/api/v1/auth/set-app-lock', { 
     method: 'POST',
     headers: { 
         'Content-Type': 'application/json'
     },
     body: JSON.stringify({ pin })
}) 
const reply= await res.json();
if(reply.status) return Promise.resolve(); 
}

async function disableAppLock() {
    // In a real app, this would call your backend API
    console.log('Disabling app lock');
    localStorage.removeItem('appLockPin');
    return Promise.resolve();
}

async function verifyPin(pin) {
    // In a real app, this would call your backend API
    const storedPin = localStorage.getItem('appLockPin');
    if (pin !== storedPin) {
        return Promise.reject(new Error('Invalid PIN'));
    }
    return Promise.resolve();
}

async function updateLoginAlert(enabled) {
    // In a real app, this would call your backend API
     const res= await fetch('/api/v1/auth/set-login-alerts', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
    })
     const  response= await  res.json();
     if(response.status) {
        showAlertNotification('Login alerts '+ (enabled? 'enabled' : 'disabled'),enabled);

        return Promise.resolve();
    }
}

async function changePassword(currentPin, newPin) {
    // In a real app, this would call your backend API
     const res= await fetch('/api/v1/auth/update-pin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ currentPin, newPin })
    })
    const  response= await  res.json();
    if(response.status) {
        showAlertNotification('Password changed successfully', true);
        return Promise.resolve();
    }else{
        showAlertNotification(response.message || 'Failed to change password', false);
    }
   
}
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

export function renderHelpSettings(settingsContent) {
    const helpSection = document.createElement('div');
    helpSection.innerHTML = `
        <div class="settings-section">
            <div class="settings-section-title"><i class="ri-question-line"></i> Help & Support</div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Help Center</div>
                    <div class="settings-item-description">Find answers to common questions</div>
                </div>
                <button class="btn btn-secondary btn-sm" data-action="help">Open</button>
            </div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Contact Support</div>
                    <div class="settings-item-description">Get help from our support team</div>
                </div>
                <button class="btn btn-secondary btn-sm" data-action="contact">Contact</button>
            </div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Report a Problem</div>
                    <div class="settings-item-description">Let us know about any issues</div>
                </div>
                <button class="btn btn-secondary btn-sm" data-action="report">Report</button>
            </div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Terms of Service</div>
                    <div class="settings-item-description">Read our terms and conditions</div>
                </div>
                <button class="btn btn-secondary btn-sm" data-action="terms">View</button>
            </div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Privacy Policy</div>
                    <div class="settings-item-description">Learn how we handle your data</div>
                </div>
                <button class="btn btn-secondary btn-sm" data-action="privacy">View</button>
            </div>
        </div>
        
        <div class="settings-section">
            <div class="settings-section-title"><i class="ri-information-line"></i> About</div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Version</div>
                    <div class="settings-item-description">ChatterBox v2.4.1</div>
                </div>
            </div>
            
            <div class="settings-item">
                <div>
                    <div class="settings-item-label">Log Out</div>
                    <div class="settings-item-description">Sign out of your account</div>
                </div>
                <button class="btn btn-danger btn-sm" id="logout-btn">Log Out</button>
            </div>
        </div>
    `;

    settingsContent.appendChild(helpSection);

    // Attach button click handlers
    helpSection.querySelectorAll("button").forEach(button => {
        const action = button.dataset.action;
        if (action) {
            button.addEventListener("click", () => {
                showAlertNotification(`Demo Message: You clicked on "${action}" button.`);
            });
        }
    });

    // Logout functionality
    const logoutBtn = helpSection.querySelector("#logout-btn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", async () => {
            const confirmLogout = confirm("Are you sure you want to log out?");
            if (!confirmLogout) return;

            try {
                const response = await fetch("/api/v1/user/logout", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                 const data = await response.json();
                if (data.status) {
                       sessionStorage.removeItem("currentChat");
                       sessionStorage.removeItem("activePanel");
                       sessionStorage.removeItem("userInfo"); 
                      sessionStorage.removeItem("chat-settings");
                    window.location.reload()
                } else {
                    showAlertNotification(data.message, false);
                }
            } catch (error) {
                console.error("Logout error:", error);
                showAlertNotification("Logout failed. Please try again.",false);
            }
        });
    }
}

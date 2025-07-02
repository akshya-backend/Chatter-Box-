import { renderHelpSettings } from "./help-support-section.js";
import { renderPrivacySettings } from "./privacy-setting-section.js";
import { renderProfileSettings } from "./profile-section.js";
import { renderSecuritySettings } from "./security-setting-section.js";

async function renderSettingsContent(tab) {
    let user = null;

    try {
        const chatSettings = sessionStorage.getItem('chat-settings');

        if (chatSettings) {
            user = JSON.parse(chatSettings);
        } else {
            const response = await fetch('/api/v1/user/user-profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const rawData = await response.json();

            if (rawData.status) {
                user = rawData.data;
                sessionStorage.setItem('chat-settings', JSON.stringify(user));
            } else {
                throw new Error(rawData.message || 'Failed to fetch user profile.');
            }
        }

        const settingsContent = document.getElementById('settings-content');
        settingsContent.innerHTML = '';

        const settingsTabs = document.createElement('div');
        settingsTabs.className = 'contacts-tabs';
        settingsTabs.style.marginBottom = '16px';

        const tabs = [
            { id: 'profile', icon: 'ri-user-line', label: 'Profile' },
            { id: 'security', icon: 'ri-shield-keyhole-line', label: 'Security' },
            { id: 'privacy', icon: 'ri-eye-line', label: 'Privacy' },
            { id: 'help', icon: 'ri-question-line', label: 'Help' }
        ];

        tabs.forEach(tabInfo => {
            const tabElement = document.createElement('button');
            tabElement.className = 'contacts-tab';
            tabElement.innerHTML = `<i class="${tabInfo.icon}"></i> ${tabInfo.label}`;
            tabElement.dataset.tab = tabInfo.id;

            tabElement.addEventListener('click', () => {
                renderSettingsContent(tabInfo.id);
            });

            settingsTabs.appendChild(tabElement);
        });

        settingsContent.appendChild(settingsTabs);

        switch (tab) {
            case 'profile':
                renderProfileSettings(user?.personal || {});
                break;
            case 'security':
                renderSecuritySettings(settingsContent, user?.security || {});
                break;
            case 'privacy':
                renderPrivacySettings(settingsContent, user?.privacy || {});
                break;
            case 'help':
                renderHelpSettings(settingsContent);
                break;
        }

        document.querySelector(`.contacts-tab[data-tab="${tab}"]`)?.classList.add('active');

    } catch (error) {
        console.error("Error loading settings content:", error);

        const settingsContent = document.getElementById('settings-content');
        if (settingsContent) {
            settingsContent.innerHTML = `
                <div class="error-message">
                    <p>⚠️ Unable to load settings. Please try again later.</p>
                    <button class="btn btn-primary" onclick="location.reload()">Reload</button>
                </div>
            `;
        }
    }
}

export { renderSettingsContent };

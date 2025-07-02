// import createHelpSection from "./help-support-section.js";
// import { createPersonalInfoSection } from "./personal-Info-section.js";
// import createPrivacySettingsSection from "./privacy-setting-section.js";
// import createProfileFooter from "./profile-footer-section.js";
// import createProfileHeader from "./profile-header-section.js";
// import { createSecuritySection } from "./security-setting-section.js";

// // Render the settings page
// export const renderProfilePage = (data) => {
//   const settingsContainer = createSettingsContainer(data);
//   return settingsContainer;
// };

// // Function to create the settings container
// function createSettingsContainer(data) {
//   const settingsContainer = document.createElement("div");
//   settingsContainer.id = "settingsContainer";
//   settingsContainer.classList.add("settings-container");

//   const header = createProfileHeader(data);
//   const content= createContent(data)
//   const footer = createProfileFooter();

//   settingsContainer.append(header, content,footer);
//   return settingsContainer;
// }

// // Function to create the header
// function createContent(data) {
//   const content = document.createElement("div");
//   content.style.marginTop="-50%"
//   const personalInfoSection = createPersonalInfoSection(data);
//   const securitySection = createSecuritySection(data);
//   const privacySettingsSection = createPrivacySettingsSection(data);
//   const helpSection = createHelpSection();

//   content.append(personalInfoSection, securitySection, privacySettingsSection, helpSection);

//   return content;
// }




// // Function to create a dropdown section
//  export function createDropdownSection(title, id, content) {
//   const section = document.createElement("div");
//   section.classList.add("dropdown-section");

//   const header = document.createElement("div");
//   header.classList.add("dropdown-header");
//   header.innerHTML = `<h3>${title}</h3><span>▼</span>`;
//   header.addEventListener("click", () => toggleDropdown(id));

//   const dropdownContent = document.createElement("div");
//   dropdownContent.id = id;
//   dropdownContent.classList.add("dropdown-content");
//   content.forEach((item) => dropdownContent.appendChild(item));

//   section.append(header, dropdownContent);
//   return section;
// }


// // Function to create a toggle field
// function createToggleField(label, id, onChangeHandler, initialState = false) {
//   const container = document.createElement("label");
//   container.classList.add("switch-btn-toggle");
//   container.innerHTML = `
//     ${label}
//     <div class="toggle-switch">
//       <input type="checkbox" id="${id}" ${initialState ? "checked" : ""}>
//       <span class="slider"></span>
//     </div>
//   `;

//   const input = container.querySelector("input");
//   input.addEventListener("change", (e) => onChangeHandler(e, id));
//   return container;
// }

// // Function to create a password input field
// function createPasswordInput(id, placeholder, maxLength) {
//   const container = document.createElement("div");
//   container.id = `${id}-container`;
//   container.style.display = "none"; // Hidden by default
//   container.style.marginTop = "10px";

//   const input = document.createElement("input");
//   input.type = "password";
//   input.id = id;
//   input.placeholder = placeholder;
//   input.maxLength = maxLength;

//   // Auto-save when 4 digits are entered
//   input.addEventListener("input", async (e) => {
//     if (e.target.value.length === maxLength) {
//       try {
//         const response = await fetch("/api/set-app-lock-password", {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ password: e.target.value }),
//         });

//         const data = await response.json();

//         if (data.success) {
//           showAlertNotification("Password set successfully", "success");
//         } else {
//           e.target.value = ""; // Clear the input on failure
//           showAlertNotification(data.message || "Password update failed", "error");
//         }
//       } catch (error) {
//         showAlertNotification("Network error", "error");
//       }
//     }
//   });

//   container.appendChild(input);
//   return container;
// }

// // Function to create a "Change App Lock" button
// function createChangeAppLockButton() {
//   const container = document.createElement("div");
//   container.classList.add("change-app");

//   const spanElement = document.createElement("span");
//   spanElement.textContent = "Change App Lock";

//   const button = document.createElement("button");
//   button.textContent = "Change";
//   button.classList.add("add-friend-btn2");
//   button.style.padding = "1px 10px";
//   button.addEventListener("click", handleChangeAppLock);

//   container.append(spanElement, button);
//   return container;
// }
// // Function to handle changing app lock password
// async function handleChangeAppLock() {
//   const toggle = document.getElementById("app-lock-toggle");
//   const isAppLockEnabled = toggle.checked;

//   if (!isAppLockEnabled) {
//     showAlertNotification("App Lock is not enabled.", "error");
//     return;
//   }

//   const currentPassword = prompt("Enter your current 4-digit password:");
//   if (!currentPassword || currentPassword.length !== 4) {
//     showAlertNotification("Invalid current password.", "error");
//     return;
//   }

//   try {
//     // Verify the current password
//     const verifyResponse = await fetch("/api/verify-app-lock-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ password: currentPassword }),
//     });

//     const verifyData = await verifyResponse.json();

//     if (!verifyData.success) {
//       showAlertNotification("Incorrect current password.", "error");
//       return;
//     }

//     // Prompt for new password
//     const newPassword = prompt("Enter your new 4-digit password:");
//     if (!newPassword || newPassword.length !== 4) {
//       showAlertNotification("Invalid new password.", "error");
//       return;
//     }

//     // Update the app lock password
//     const updateResponse = await fetch("/api/update-app-lock-password", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ newPassword }),
//     });

//     const updateData = await updateResponse.json();

//     if (updateData.success) {
//       showAlertNotification("App Lock password updated successfully.", "success");
//     } else {
//       showAlertNotification("Failed to update App Lock password.", "error");
//     }
//   } catch (error) {
//     showAlertNotification("An error occurred while updating the password.", "error");
//   }
// }

// // Function to handle App Lock toggle
// async function handleAppLockToggle(e, id) {
//   const passwordContainer = document.getElementById("app-lock-password-container");
//   const passwordInput = document.getElementById("app-lock-password");

//   if (e.target.checked) {
//     passwordContainer.style.display = "block";
//     passwordInput.focus();

//     passwordInput.addEventListener("blur", () => handleAppLockEnable(passwordInput, e));
//     passwordInput.addEventListener("keypress", (event) => {
//       if (event.key === "Enter") handleAppLockEnable(passwordInput, e);
//     });
//   } else {
//     const confirmation = confirm("Are you sure you want to disable App Lock?");
//     if (!confirmation) {
//       e.target.checked = true;
//       return;
//     }

//     handleAppLockDisable(passwordInput, e);
//   }
// }

// // Function to handle enabling App Lock
// async function handleAppLockEnable(passwordInput, e) {
//   if (passwordInput.value.length !== 4 || isNaN(passwordInput.value)) {
//     showAlertNotification("Please enter a valid 4-digit PIN", "error");
//     e.target.checked = false;
//     return;
//   }

//   try {
//     const response = await fetch("/api/v1/auth/update-app-lock", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ enabled: true, password: passwordInput.value }),
//     });

//     const data = await response.json();

//     if (data.success) {
//       showAlertNotification("App Lock enabled successfully", "success");
//       passwordInput.value = "";
//     } else {
//       e.target.checked = false;
//       showAlertNotification(data.message || "Update failed", "error");
//     }
//   } catch {
//     e.target.checked = false;
//     showAlertNotification("Network error", "error");
//   }
// }

// // Function to handle disabling App Lock
// async function handleAppLockDisable(passwordInput, e) {
//   try {
//     const response = await fetch("/api/v1/auth/update-app-lock", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ enabled: false }),
//     });

//     const data = await response.json();

//     if (data.success) {
//       showAlertNotification("App Lock disabled successfully", "success");
//       passwordInput.value = "";
//     } else {
//       e.target.checked = true;
//       showAlertNotification(data.message || "Failed to disable App Lock", "error");
//     }
//   } catch {
//     e.target.checked = true;
//     showAlertNotification("Network error", "error");
//   }
// }

// // Function to handle privacy toggles
// async function handlePrivacyToggle(e, settingType) {
//   try {
//     const response = await fetch("/api/update-privacy-settings", {
//       method: "POST",
//       body: JSON.stringify({
//         setting: settingType,
//         enabled: e.target.checked,
//       }),
//     });

//     const data = await response.json();

//     if (!data.success) {
//       e.target.checked = !e.target.checked;
//       showAlertNotification(data.message || "Update failed", "error");
//     } else {
//       showAlertNotification("Settings updated", "success");
//     }
//   } catch (error) {
//     e.target.checked = !e.target.checked;
//     showAlertNotification("Network error", "error");
//   }
// }

// // Function to handle logout
// function logout() {
//   fetch("/api/v1/user/logout", {
//     method: "POST",
//   })
//     .then((response) => response.json())
//     .then((data) => {
//       if (data.success) {
//         const isAlreadyNotified = sessionStorage.getItem("isNotified");
//       if (isAlreadyNotified) {
//         sessionStorage.removeItem("isNotified"); // Remove the item if it is present
//       }
//       window.location.reload(true); 
//       } else {
//         showAlertNotification("Failed to logout", "error");
//       }
//     })
//     .catch((error) => {
//       console.error("Error:", error);
//       showAlertNotification("An error occurred", "error");
//     });
// }


// // Function to toggle dropdowns
// function toggleDropdown(id) {
//   const dropdowns = document.querySelectorAll(".dropdown-content");
//   dropdowns.forEach((dropdown) => {
//     if (dropdown.id !== id) {
//       dropdown.classList.remove("show");
//     }
//   });

//   const dropdown = document.getElementById(id);
//   dropdown.classList.toggle("show");
// }
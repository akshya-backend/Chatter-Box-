import showAlertNotification from "../utils/helpers/alert-notificaion.js";

export async function handlePrivacyToggle(e, settingType) {
  const checkbox = e.target;
  const previousState = !checkbox.checked; // Store previous state in case of failure

  // Define API URL based on the setting type
  const apiUrl =
    settingType === "last-seen-toggle"
      ? "/api/v1/auth/update-last-seen"
      : "/api/v1/auth/update-profile-picture-visibility";

  try {
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: checkbox.checked }),
    });

    const data = await response.json();

    if (!data.success) {
      checkbox.checked = previousState; // Revert toggle state
      showAlertNotification(data.message || "Update failed", false);
    } else {
      showAlertNotification(data.message);
    }
  } catch (error) {
    checkbox.checked = previousState; // Revert toggle state
    showAlertNotification("Network error", false);
  }
}

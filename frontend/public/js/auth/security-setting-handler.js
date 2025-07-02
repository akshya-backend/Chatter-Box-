import { showPasswordDialog } from "../../components/settings/security-setting-section.js";
import showAlertNotification from "../../utils/helpers/alert-notificaion.js";

const BASE_URL = "/api/v1/auth";

// API Functions
const fetchAPI = async (endpoint, method, body) => {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    return { status: false, message: "Network error" };
  }
};

export const verifyAppLockPin = async (pin) => {
  return fetchAPI("verify-app-lock-request", "POST", { pin });
};

export const changeAppLockPin = async (newPin) => {
  return fetchAPI("change-app-lock-request", "PUT", { pin: newPin });
};

export const toggleAppLock = async (enable, pin = null) => {
  return fetchAPI("toggle-app-lock", "POST", { enable, pin });
};

// Business Logic
export const validatePin = (pin) => {
  if (!pin || pin.length !== 4 || !/^\d+$/.test(pin)) {
    showAlertNotification("PIN must be 4 digits", false);
    return false;
  }
  return true;
};

export const getConfirmedPin = async () => {
  const newPin = await showPasswordDialog("Set new 4-digit PIN", "Continue");
  if (!newPin) return null;
  
  const confirmPin = await showPasswordDialog("Confirm PIN", "Confirm");
  if (!confirmPin) return null;
  
  if (newPin !== confirmPin) {
    showAlertNotification("PINs don't match", false);
    return null;
  }
  
  return newPin;
};

export const handleAppLockToggle = async (e) => {
  const { checked } = e.target;
  
  if (checked) {
    const newPin = await getConfirmedPin();
    if (!newPin) {
      e.target.checked = false;
      return;
    }

    const result = await toggleAppLock(true, newPin);
    if (!result.status) {
      e.target.checked = false;
      showAlertNotification(result.message || "Enable failed", false);
    }
  } else {
    const currentPin = await showPasswordDialog("Enter current PIN to disable", "Disable");
    if (!currentPin) {
      e.target.checked = true;
      return;
    }

    const result = await toggleAppLock(false, currentPin);
    if (!result.status) {
      e.target.checked = true;
      showAlertNotification(result.message || "Disable failed", false);
    }
  }
};

export const handleChangeAppLock = async () => {
  const currentPin = await showPasswordDialog("Enter current PIN", "Verify");
  if (!currentPin) return false;

  const verifyResult = await verifyAppLockPin(currentPin);
  if (!verifyResult.status) {
    showAlertNotification(verifyResult.message, false);
    return false;
  }

  const newPin = await getConfirmedPin();
  if (!newPin) return false;

  const updateResult = await changeAppLockPin(newPin);
  if (updateResult.status) {
    showAlertNotification("PIN updated", "success");
    return true;
  } else {
    showAlertNotification(updateResult.message || "Update failed", false);
    return false;
  }
};
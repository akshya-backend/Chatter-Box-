import showAlertNotification from "../utils/helpers/alert-notificaion.js";

document.addEventListener("DOMContentLoaded", () => {
   
  const pinManager = createPinManager();
  pinManager.init();
});

function createPinManager() {
  const elements = {
    pinInputs: document.querySelectorAll(".pin-input"),
    otpInputs: document.querySelectorAll(".otp-input"),
    newPinInputs: document.querySelectorAll(".new-pin-input"),
    pinEntry: document.getElementById("pinEntry"),
    otpVerification: document.getElementById("otpVerification"),
    newPinPage: document.getElementById("newPinPage"),
    successMessage: document.getElementById("successMessage"),
    body: document.body,
  };

  const getCodeFromInputs = (inputs) =>
    Array.from(inputs).map((input) => input.value).join("");

  const validateCode = (code, expectedLength, type = "PIN") => {
    if (code.length !== expectedLength) {
      showAlertNotification(`Enter a complete ${expectedLength}-digit ${type}`, false);
      return false;
    }
    return true;
  };

  const clearInputs = (inputs) => inputs.forEach((input) => (input.value = ""));

  const focusFirstInput = (inputs) => inputs[0]?.focus();

  const callAPI = async (endpoint, body) => {
    try {
      const response = await fetch(`/api/v1/auth/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
       const data=await response.json();
      return  data
    } catch (error) {        
      showAlertNotification(error.message || "Network error", false);
      throw error;
    }
  };

  const togglePages = (hidePage, showPage, themeClass) => {
    hidePage?.classList.remove("active");
    showPage?.classList.add("active");
    elements.body.className = themeClass || "";
  };

  const showOTPPage = () => togglePages(elements.pinEntry, elements.otpVerification, "otp-theme");
  const showNewPinPage = () => togglePages(elements.otpVerification, elements.newPinPage, "new-pin-theme");
  const showPinPage = () => {
    togglePages(elements.newPinPage, elements.pinEntry);
    showAlertNotification("PIN updated successfully", true);
    clearInputs(elements.pinInputs);
    focusFirstInput(elements.pinInputs);
  };

  const setupInputNavigation = (inputs, callback) => {
    inputs.forEach((input, index) => {
      input.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "");
        if (e.target.value && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
        if ([...inputs].every((i) => i.value)) callback(getCodeFromInputs(inputs));
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !e.target.value && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });
  };

  const verifyAppLock = async (pin) => {
    if (!validateCode(pin, elements.pinInputs.length)) return;
    try {
      const data = await callAPI("verify-app-lock", { pin });
      console.log(data);
      
      if (data.status) window.location.href = "/api/v1/chat/index";
      else {
        clearInputs(elements.pinInputs);
        focusFirstInput(elements.pinInputs)
        showAlertNotification(data.message, false);
    }
    } catch(e){        
      clearInputs(elements.pinInputs);
      focusFirstInput(elements.pinInputs);
    }
  };

  const verifyOTP = async (otp) => {
    if (!validateCode(otp, elements.otpInputs.length, "OTP")) return;
    try {
      const data = await callAPI("pin-otp-verification", { otp });
      console.log(data);
      
      if (!data.status) throw new Error("Invalid OTP");
      showNewPinPage();
    } catch {
      clearInputs(elements.otpInputs);
      focusFirstInput(elements.otpInputs);
    }
  };

  const saveNewPIN = async (newPin) => {
    if (!validateCode(newPin, elements.newPinInputs.length)) return;
    try {
      const data = await callAPI("new-pin", { newPin });
      if (!data.status) throw new Error("Failed to save PIN");
      showAlertNotification("PIN updated successfully", true);
      showPinPage();
    } catch {
      clearInputs(elements.newPinInputs);
      focusFirstInput(elements.newPinInputs);
    }
  };

  const handleForgotPin = async () => {
    try {
      const data = await callAPI("forget-pin", {});
      if (!data.status) throw new Error("Failed to send reset link");
      showAlertNotification("Reset link sent to your email", true);
      showOTPPage();
    } catch {}
  };

  const init = () => {
    document.getElementById("forgotPinLink")?.addEventListener("click", handleForgotPin);
    document.getElementById("verifyOTPBtn")?.addEventListener("click", verifyOTP);
    document.getElementById("saveNewPINBtn")?.addEventListener("click", saveNewPIN);
    
    setupInputNavigation(elements.pinInputs, verifyAppLock);
    setupInputNavigation(elements.otpInputs, verifyOTP);
    setupInputNavigation(elements.newPinInputs, saveNewPIN);
    focusFirstInput(elements.pinInputs);
  };

  return { init };
}

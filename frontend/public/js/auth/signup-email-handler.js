import {  indexedDBSave } from "../utils/encryption/create_key.js";
import showAlertNotification from "../utils/helpers/alert-notificaion.js";

document.addEventListener("DOMContentLoaded", () => {
    const emailInput = document.getElementById("email");
    const otpContainer = document.getElementById("otpContainer");
    const otpInputs = document.querySelectorAll(".otp-input");
    const timerContainer = document.getElementById("timerContainer");
    const resendLink = document.getElementById("resend");
    const googleSignInButton = document.getElementById("googleSignIn");

    let timerInterval;
    let canResend = false;
    let hasSentOTP = false;
    let debounceTimer;
    let isRequestInProgress = false; 

    const debounce = (func, delay) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(func, delay);
    };

    function validateEmail(email) {
        const regex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        return regex.test(email);
      }
      
    const showOTPUI = () => {
        emailInput.classList.add("hidden");
        emailInput.setAttribute("readonly", true);
        otpContainer.style.display = "flex";
        setTimeout(() => otpContainer.classList.add("visible"), 10);
        timerContainer.style.display = "block";
        setTimeout(() => timerContainer.classList.add("visible"), 10);
        otpInputs[0].focus();
    };

    const startTimer = () => {
        let timeLeft = 120;
        resendLink.style.display = "none";
        document.getElementById("time").style.display = "inline";

        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeft--;
            document.getElementById("time").textContent = `${String(Math.floor(timeLeft / 60)).padStart(2, "0")}:${String(timeLeft % 60).padStart(2, "0")}`;

            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                document.getElementById("time").style.display = "none";
                resendLink.style.display = "inline";
                canResend = true;
            }
        }, 1000);
    };

    const handleEmailSubmit = async () => {
        if (!validateEmail(emailInput.value.trim()) || hasSentOTP || isRequestInProgress) return;

        // Show UI immediately
        showOTPUI();
        startTimer();
        showAlertNotification("Sending OTP...", true);

        hasSentOTP = true;
        isRequestInProgress = true;

        try {
            const response = await fetch("/api/v1/auth/email-authentication", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim() }),
            });

            const data = await response.json();

            if (data.status) {
                showAlertNotification("OTP sent successfully", true);
            } else {
                showAlertNotification(data.message, false);
            }
        } catch (error) {
            showAlertNotification("Failed to send OTP. Please try again.", false);
        } finally {
            isRequestInProgress = false;
        }
    };

    const verifyOTP = async () => {
        const otp = Array.from(otpInputs).map((input) => input.value).join("");
        if (otp.length !== 4) {
            showAlertNotification("Please enter a valid 4-digit OTP", false);
            return;
        }

        try {
            const response = await fetch("/api/v1/auth/email-otp-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim(), otp }),
            });
            const data = await response.json();

            if (data.status) {
                 await indexedDBSave("privateKey", data.keys.privateKey); // binary data
                 await indexedDBSave("publicKey",data.keys. publicKey);

                 setTimeout(() =>showAlertNotification("OTP verified successfully!", true), 1000);
                  setTimeout(() => { window.location.href = "/";}, 2000)
            } else {
                showAlertNotification(data.message, false);
            }
        } catch(e) {
            showAlertNotification("Failed to verify OTP. Please try again.", false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend || isRequestInProgress) {
            showAlertNotification("Please wait until the timer expires.", false);
            return;
        }

        isRequestInProgress = true;

        try {
            const response = await fetch("/api/v1/auth/email-authentication", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailInput.value.trim() }),
            });
            const data = await response.json();

            if (data.status) {
                showAlertNotification("New OTP sent successfully!", true);
                startTimer();
                canResend = false;
            } else {
                showAlertNotification(data.message, false);
            }
        } catch {
            showAlertNotification("Failed to resend OTP.", false);
        } finally {
            isRequestInProgress = false;
        }
    };

    // Event: Listen for valid email and trigger OTP
    emailInput.addEventListener("input", () => {        
        const email = emailInput.value.trim();
        if (validateEmail(email)) {
            debounce(handleEmailSubmit, 400);
        }
    });

    emailInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
        const email = emailInput.value.trim();
        if (validateEmail(email)) {
            debounce(handleEmailSubmit, 400);
        }else{
            showAlertNotification("Invalid email address.", false);
        }
    }  
    })
        
    // Event: OTP Input Navigation
    otpInputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }

            if (index === otpInputs.length - 1 && e.target.value.length === 1) {
                verifyOTP();
            }
        });

        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && index > 0 && !e.target.value) {
                otpInputs[index - 1].focus();
            }
        });
    });

    emailInput.addEventListener("keyup", (e) => {
        if (e.key === "Enter") handleEmailSubmit();
    });

    resendLink.addEventListener("click", handleResendOTP);

    googleSignInButton.addEventListener("click", () => {
        window.location.href = "/api/v1/auth/google-authentication";
    });
});


// send a api request to set public private key
  
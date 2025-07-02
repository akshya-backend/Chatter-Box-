import Queue from "bull";
import nodemailer from 'nodemailer';
import logger from "../../utils/logger/winston-logger.js";

const emailQueue = new Queue("emailQueue", "redis://redis:6379");


// Create a reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address from .env
    pass: process.env.EMAIL_PASS, // Your Gmail app password from .env
  },
});


emailQueue.process(async (job) => {
  const { email, otp,isNew } = job.data;
  try {
    await sendVerificationOtp(email, otp,isNew);
    logger.info(`✅ OTP sent to ${email} is ${otp}`);
  } catch (error) {
    logger.error(`❌ Failed to send OTP to ${email}:`, error);
    throw error;
  }
});



const sendVerificationOtp = async (recipientEmail, otp, isNew) => {
  try {
    // Determine subject and message content based on the scenario
    const emailSubject = isNew
      ? 'Verify Your Email for ChatterBox App'
      : 'Reset Your ChatterBox App Password';

    const emailMessage = isNew
      ? `
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 20px;">
          Welcome to the ChatterBox app! To complete your registration, please use the following verification code:
        </p>
      `
      : `
        <p style="font-size: 16px; color: #555; line-height: 1.6; margin: 0 0 20px;">
          You have requested to reset your password for the ChatterBox app. Please use the following OTP to proceed:
        </p>
      `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipientEmail,
      subject: `ChatterBox App - ${emailSubject}`,
      html: `
        <div style="max-width: 600px; margin: auto; padding: 20px; font-family: 'Arial', sans-serif; background-color: #f9f9f9;">
          <div style="text-align: center; padding: 20px 0;">
            <img src="https://via.placeholder.com/150x50?text=ChatterBox+App" alt="ChatterBox App Logo" style="max-width: 150px;">
          </div>
          <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);">
            <h2 style="text-align: center; color: #4CAF50; font-size: 24px; margin-bottom: 20px;">${emailSubject}</h2>
            ${emailMessage}
            <div style="text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; padding: 15px 30px; background-color: #f4f4f4; border-radius: 8px; border: 1px solid #ddd; display: inline-block; font-weight: bold; color: #333;">${otp}</span>
            </div>
            <p style="text-align: center; color: #777; font-size: 14px; margin: 0;">
              This code is valid for <strong>10 minutes</strong>. Please do not share it with anyone.
            </p>
          </div>
          <div style="margin-top: 30px; text-align: center; font-size: 14px; color: #777;">
            <p>If you didn't request this, please ignore this email or contact our support team if you have any concerns.</p>
            <p>Thank you,<br><strong>ChatterBox App Team</strong></p>
          </div>
          <footer style="margin-top: 30px; text-align: center; font-size: 12px; color: #aaa;">
            <p>© ${new Date().getFullYear()} ChatterBox App. All rights reserved.</p>
            <p>
              <a href="https://chatterbox.com/privacy-policy" style="color: #4CAF50; text-decoration: none;">Privacy Policy</a> | 
              <a href="https://chatterbox.com/terms" style="color: #4CAF50; text-decoration: none;">Terms of Service</a>
            </p>
          </footer>
        </div>
      `,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return { success: true, otp }; // Return OTP for further use, if needed
  } catch (error) {
    logger.error('Error sending email:', error);
    return { success: false, error };
  }
};






export  default  emailQueue


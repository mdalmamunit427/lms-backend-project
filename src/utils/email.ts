import dotenv from "dotenv";
dotenv.config();

import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";

// Create a reusable transporter for your SMTP service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.NODE_ENV === "production", // Use secure connection in production
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Sends a dynamic email using a template.
 * @param to The recipient's email address.
 * @param subject The subject line of the email.
 * @param templateName The name of the EJS template file (e.g., 'activation', 'enrollment').
 * @param data The data object to pass to the EJS template.
 */
export const sendEmail = async (
  to: string,
  subject: string,
  templateName: string,
  data: object
) => {
  try {
    // Dynamically resolve the template path
    const templatePath = path.join(__dirname, `../templates/${templateName}.ejs`);

    // Render the EJS template with the provided data
    const html = await ejs.renderFile(templatePath, data);

    // Send the email
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to} with subject: ${subject}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    // You should add robust error logging here
    throw new Error(`Failed to send email: ${error}`);
  }
};

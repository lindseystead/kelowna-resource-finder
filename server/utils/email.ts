/**
 * @fileoverview Email utility for sending notifications
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Handles email notifications for resource update requests using Nodemailer.
 */

import nodemailer from "nodemailer";
import { logger } from "./logger";

// Reusable transporter - nodemailer handles connection pooling
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export interface UpdateRequestEmailData {
  resourceName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
  requestType: "update" | "new" | "remove";
  details: string;
}

export async function sendUpdateRequestEmail(data: UpdateRequestEmailData): Promise<void> {
  // Gracefully skip if email isn't configured (optional feature)
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    logger.warn("SMTP not configured. Email notification skipped.");
    return;
  }

  const requestTypeLabels = {
    update: "Update Existing Listing",
    new: "Add New Service",
    remove: "Remove Listing",
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
          .field { margin-bottom: 15px; }
          .label { font-weight: bold; color: #374151; margin-bottom: 5px; }
          .value { color: #6b7280; }
          .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2 style="margin: 0;">New Resource Update Request</h2>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Request Type:</div>
              <div class="value">${requestTypeLabels[data.requestType]}</div>
            </div>
            <div class="field">
              <div class="label">Organization/Service Name:</div>
              <div class="value">${data.resourceName}</div>
            </div>
            <div class="field">
              <div class="label">Contact Name:</div>
              <div class="value">${data.contactName}</div>
            </div>
            <div class="field">
              <div class="label">Contact Email:</div>
              <div class="value"><a href="mailto:${data.contactEmail}">${data.contactEmail}</a></div>
            </div>
            ${data.contactPhone ? `
            <div class="field">
              <div class="label">Contact Phone:</div>
              <div class="value"><a href="tel:${data.contactPhone}">${data.contactPhone}</a></div>
            </div>
            ` : ""}
            <div class="field">
              <div class="label">Details:</div>
              <div class="value" style="white-space: pre-wrap;">${data.details}</div>
            </div>
            <div class="footer">
              <p>This request was submitted through the Help Kelowna resource update form.</p>
              <p>Please review and process this request in the admin panel.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;

  const textContent = `
New Resource Update Request

Request Type: ${requestTypeLabels[data.requestType]}
Organization/Service Name: ${data.resourceName}
Contact Name: ${data.contactName}
Contact Email: ${data.contactEmail}
${data.contactPhone ? `Contact Phone: ${data.contactPhone}` : ""}

Details:
${data.details}

---
This request was submitted through the Help Kelowna resource update form.
  `.trim();

  const supportEmail = process.env.SUPPORT_EMAIL || "support@lifesavertech.ca";

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Help Kelowna" <${process.env.SMTP_USER}>`,
      to: supportEmail,
      subject: `Help Kelowna - ${requestTypeLabels[data.requestType]}: ${data.resourceName}`,
      text: textContent,
      html: htmlContent,
      replyTo: data.contactEmail,
    });
    logger.info(`Update request email sent for: ${data.resourceName}`);
  } catch (error) {
    logger.error("Error sending update request email", error, {
      resourceName: data.resourceName,
      contactEmail: data.contactEmail,
    });
    // Don't throw - we don't want to fail the request if email fails
  }
}

/**
 * Test email function to verify SMTP configuration
 * Sends a simple test email to support@lifesavertech.ca
 */
export async function sendTestEmail(): Promise<{ success: boolean; message: string; error?: string }> {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    return {
      success: false,
      message: "SMTP not configured",
      error: "SMTP_USER and SMTP_PASSWORD environment variables are required"
    };
  }

  try {
    // Verify SMTP connection
    await transporter.verify();
    
    const supportEmail = process.env.SUPPORT_EMAIL || "support@lifesavertech.ca";

    // Send test email
    const testResult = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Help Kelowna" <${process.env.SMTP_USER}>`,
      to: supportEmail,
      subject: "Help Kelowna - Email Service Test",
      text: `
This is a test email from Help Kelowna.

If you receive this email, your SMTP configuration is working correctly!

Configuration Details:
- SMTP Host: ${process.env.SMTP_HOST || "smtp.gmail.com"}
- SMTP Port: ${process.env.SMTP_PORT || "587"}
- From: ${process.env.SMTP_USER}
- To: ${supportEmail}

Time: ${new Date().toISOString()}
      `.trim(),
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .success { background: #10b981; color: white; padding: 15px; border-radius: 8px; margin: 20px 0; }
              .details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
              .label { font-weight: bold; color: #374151; }
              .value { color: #6b7280; margin-left: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2 style="margin: 0;">✅ Test Email - Help Kelowna</h2>
              </div>
              <div class="content">
                <div class="success">
                  <strong>Success!</strong> Your SMTP configuration is working correctly.
                </div>
                <p>If you receive this email, your email service is properly configured and ready for production.</p>
                <div class="details">
                  <p><span class="label">SMTP Host:</span><span class="value">${process.env.SMTP_HOST || "smtp.gmail.com"}</span></p>
                  <p><span class="label">SMTP Port:</span><span class="value">${process.env.SMTP_PORT || "587"}</span></p>
                  <p><span class="label">From:</span><span class="value">${process.env.SMTP_USER}</span></p>
                  <p><span class="label">To:</span><span class="value">${supportEmail}</span></p>
                  <p><span class="label">Time:</span><span class="value">${new Date().toLocaleString()}</span></p>
                </div>
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">
                  This is an automated test email. Resource update requests will be sent to this address.
                </p>
              </div>
            </div>
          </body>
        </html>
      `
    });

    return {
      success: true,
      message: `Test email sent successfully! Message ID: ${testResult.messageId}`
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error("Error sending test email", error);
    return {
      success: false,
      message: "Failed to send test email",
      error: errorMessage
    };
  }
}


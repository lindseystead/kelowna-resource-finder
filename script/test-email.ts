/**
 * @fileoverview Email testing script
 * @author Lindsey - Lifesaver Technology Services
 * @copyright 2025 Lifesaver Technology Services
 * @license MIT
 * 
 * Standalone script to test email configuration and sending.
 * Run with: tsx script/test-email.ts
 */

import { config } from "dotenv";
import nodemailer from "nodemailer";

// Load environment variables
config();

async function testEmail() {
  console.log("🧪 Testing Email Configuration...\n");

  // Check configuration
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "587");
  const smtpUser = process.env.SMTP_USER;
  const smtpPassword = process.env.SMTP_PASSWORD;
  const smtpSecure = process.env.SMTP_SECURE === "true";

  console.log("Configuration:");
  console.log(`  SMTP Host: ${smtpHost}`);
  console.log(`  SMTP Port: ${smtpPort}`);
  console.log(`  SMTP Secure: ${smtpSecure}`);
  console.log(`  SMTP User: ${smtpUser ? "✅ Set" : "❌ Missing"}`);
  console.log(`  SMTP Password: ${smtpPassword ? "✅ Set" : "❌ Missing"}`);
  console.log(`  Target Email: support@lifesavertech.ca\n`);

  if (!smtpUser || !smtpPassword) {
    console.error("❌ ERROR: SMTP_USER and SMTP_PASSWORD must be set in .env file");
    console.error("\nRequired .env variables:");
    console.error("  SMTP_HOST=smtp.gmail.com");
    console.error("  SMTP_PORT=587");
    console.error("  SMTP_SECURE=false");
    console.error("  SMTP_USER=your-email@gmail.com");
    console.error("  SMTP_PASSWORD=your-app-password");
    console.error("  SMTP_FROM=\"Help Kelowna\" <your-email@gmail.com>");
    process.exit(1);
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPassword,
    },
  });

  try {
    // Step 1: Verify SMTP connection
    console.log("Step 1: Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!\n");

    // Step 2: Send test email
    console.log("Step 2: Sending test email to support@lifesavertech.ca...");
    const testResult = await transporter.sendMail({
      from: process.env.SMTP_FROM || `"Help Kelowna" <${smtpUser}>`,
      to: "support@lifesavertech.ca",
      subject: "✅ Test Email - Help Kelowna Email Service",
      text: `
This is a test email from Help Kelowna.

If you receive this email, your SMTP configuration is working correctly!

Configuration Details:
- SMTP Host: ${smtpHost}
- SMTP Port: ${smtpPort}
- From: ${smtpUser}
- To: support@lifesavertech.ca

Time: ${new Date().toISOString()}

This email was sent from the test-email.ts script.
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
                  <p><span class="label">SMTP Host:</span><span class="value">${smtpHost}</span></p>
                  <p><span class="label">SMTP Port:</span><span class="value">${smtpPort}</span></p>
                  <p><span class="label">From:</span><span class="value">${smtpUser}</span></p>
                  <p><span class="label">To:</span><span class="value">support@lifesavertech.ca</span></p>
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

    console.log("✅ Test email sent successfully!");
    console.log(`   Message ID: ${testResult.messageId}`);
    console.log(`   Response: ${testResult.response}\n`);
    console.log("📧 Check support@lifesavertech.ca inbox for the test email.\n");
    console.log("✅ Email service is ready for production!\n");

  } catch (error) {
    console.error("\n❌ ERROR: Failed to send test email\n");
    
    if (error instanceof Error) {
      console.error("Error details:");
      console.error(`  Message: ${error.message}`);
      
      // Common error messages and solutions
      if (error.message.includes("Invalid login")) {
        console.error("\n💡 Solution: Check your SMTP_USER and SMTP_PASSWORD");
        console.error("   For Gmail, make sure you're using an App Password, not your regular password.");
        console.error("   Get an App Password at: https://myaccount.google.com/apppasswords");
      } else if (error.message.includes("Connection")) {
        console.error("\n💡 Solution: Check your SMTP_HOST and SMTP_PORT settings");
        console.error("   Verify your network connection and firewall settings");
      } else if (error.message.includes("timeout")) {
        console.error("\n💡 Solution: Check your network connection and SMTP server availability");
      }
      
      console.error(`\n  Full error: ${error.stack || error.message}`);
    } else {
      console.error("  Unknown error:", error);
    }
    
    process.exit(1);
  }
}

// Run the test
testEmail().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});


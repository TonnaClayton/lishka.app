// Email service configuration and utilities
// This file handles the email sending functionality using Resend
import { config } from "@/lib/config";
import { log } from "./logging";

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
}

// Email service class
export class EmailService {
  private static instance: EmailService;
  private apiKey: string;
  private fromEmail: string;

  private constructor() {
    this.apiKey = "re_TRz7U2dm_FvqmirQcqNAtG2S63wYaG7Ru";
    this.fromEmail = "noreply@lishka.app"; // Replace with your verified domain
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(
    template: EmailTemplate,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // For development/demo purposes, we'll log the email instead of sending
      if (config.DEV) {
        log("📧 Email would be sent:", {
          to: template.to,
          subject: template.subject,
          preview: template.html.substring(0, 200) + "...",
        });

        // Simulate email sending delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        return { success: true };
      }

      // In production, you would implement actual email sending
      // This requires a backend API endpoint since Resend can't be called directly from the browser
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: template.to,
          subject: template.subject,
          html: template.html,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to send email");
      }

      return { success: true };
    } catch (error: any) {
      error("Email sending error:", error);
      return { success: false, error: error.message };
    }
  }

  // Email template generators
  generateConfirmationEmail(
    confirmationUrl: string,
    userEmail: string,
  ): EmailTemplate {
    return {
      to: userEmail,
      subject: "Confirm Your Email - Lishka",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirm Your Email - Lishka</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎣 Welcome to Lishka!</h1>
            <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your AI Fishing Companion</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Confirm Your Email Address</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Thanks for signing up for Lishka! To complete your registration and start exploring the best fishing spots and techniques, please confirm your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${confirmationUrl}" style="background: #3b82f6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Confirm Email Address</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6; font-size: 14px; background: #f1f5f9; padding: 10px; border-radius: 4px; margin-bottom: 20px;">${confirmationUrl}</p>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">This confirmation link will expire in 24 hours for security reasons.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
              If you didn't create an account with Lishka, you can safely ignore this email.
            </p>
            
            <p style="font-size: 14px; color: #64748b;">
              Happy fishing! 🐟<br>
              The Lishka Team
            </p>
          </div>
        </body>
        </html>
      `,
    };
  }

  generatePasswordResetEmail(
    resetUrl: string,
    userEmail: string,
  ): EmailTemplate {
    return {
      to: userEmail,
      subject: "Reset Your Password - Lishka",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password - Lishka</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎣 Lishka</h1>
            <p style="color: #fecaca; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e2e8f0;">
            <h2 style="color: #1e293b; margin-top: 0; font-size: 24px;">Reset Your Password</h2>
            
            <p style="font-size: 16px; margin-bottom: 20px;">Hi there!</p>
            
            <p style="font-size: 16px; margin-bottom: 20px;">We received a request to reset the password for your Lishka account (<strong>${userEmail}</strong>). Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #dc2626; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">Reset Password</a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 20px;">If the button doesn't work, you can also copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #dc2626; font-size: 14px; background: #f1f5f9; padding: 10px; border-radius: 4px; margin-bottom: 20px;">${resetUrl}</p>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 30px;">This password reset link will expire in 1 hour for security reasons.</p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 10px;">
              If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="font-size: 14px; color: #64748b;">
              Best regards,<br>
              The Lishka Team
            </p>
          </div>
        </body>
        </html>
      `,
    };
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();

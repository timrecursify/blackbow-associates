/**
 * Email Service using Resend API
 * Handles all transactional emails for Black Bow Associates
 */

import { Resend } from "resend";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { prisma } from "../config/database.js";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = `${process.env.DEFAULT_FROM_NAME || "Black Bow Associates"} <${process.env.DEFAULT_FROM_EMAIL || "noreply@blackbowassociates.com"}>`;

function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  // Simple, practical validation (Resend will still validate too)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

class EmailService {
  static generateToken() {
    return crypto.randomBytes(32).toString("hex");
  }

  static readTemplate(templateName) {
    const templatePath = path.join(__dirname, "../../templates", templateName);
    return fs.readFileSync(templatePath, "utf8");
  }

  static replaceVariables(template, variables) {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, value || "");
    }
    result = result.replace(/{{#if\s+\w+}}[\s\S]*?{{\/if}}/g, "");
    return result;
  }

  static async sendEmail(to, subject, html) {
    try {
      const recipients = Array.isArray(to) ? to : [to];
      const normalized = recipients.map(r => (r || "").trim()).filter(isValidEmail);
      if (normalized.length === 0) {
        logger.warn("Email skipped (no valid recipients)", { subject });
        return { success: false, skipped: true };
      }

      const result = await resend.emails.send({
        from: FROM_EMAIL,
        to: normalized,
        subject,
        html
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      logger.info("Email sent", { to: normalized, subject, emailId: result.data?.id || result.id });
      return { success: true, emailId: result.data?.id || result.id };
    } catch (error) {
      logger.error("Failed to send email", { to, subject, error: error.message });
      throw error;
    }
  }

  static async getAdminNotificationEmails() {
    const envEmails = (process.env.ADMIN_NOTIFICATION_EMAILS || "")
      .split(",")
      .map(e => e.trim())
      .filter(isValidEmail);

    if (envEmails.length > 0) return envEmails;

    // Fallback: all verified, active admins
    try {
      const admins = await prisma.user.findMany({
        where: {
          isAdmin: true,
          adminVerifiedAt: { not: null },
          isBlocked: false
        },
        select: { email: true }
      });

      const dbEmails = admins.map(a => (a.email || "").trim()).filter(isValidEmail);
      if (dbEmails.length === 0) {
        logger.warn("No admin emails found (env unset, DB returned none)");
      }
      return dbEmails;
    } catch (error) {
      logger.error("Failed to resolve admin emails", { error: error.message });
      return [];
    }
  }

  static async sendConfirmationEmail(email, businessName, token) {
    const template = this.readTemplate("email-confirmation.html");
    const confirmationUrl = `https://blackbowassociates.com/confirm-email?token=${token}`;
    const html = this.replaceVariables(template, { businessName, confirmationUrl });
    return this.sendEmail(email, "Confirm Your Email - Black Bow Associates", html);
  }

  static async sendPasswordResetEmail(email, businessName, token) {
    const template = this.readTemplate("password-reset.html");
    const resetUrl = `https://blackbowassociates.com/reset-password?token=${token}`;
    const html = this.replaceVariables(template, { businessName, resetUrl });
    return this.sendEmail(email, "Reset Your Password - Black Bow Associates", html);
  }

  static async sendDepositConfirmation(email, businessName, amount, newBalance, transactionId) {
    const template = this.readTemplate("deposit-confirmation.html");
    const html = this.replaceVariables(template, {
      businessName,
      amount: parseFloat(amount).toFixed(2),
      newBalance: parseFloat(newBalance).toFixed(2),
      transactionId,
      date: new Date().toLocaleDateString("en-US", { 
        weekday: "long", year: "numeric", month: "long", day: "numeric", 
        hour: "2-digit", minute: "2-digit" 
      })
    });
    return this.sendEmail(email, "Deposit Confirmed - Black Bow Associates", html);
  }

  static async sendPurchaseReceipt(email, businessName, leadData, amount, remainingBalance) {
    const template = this.readTemplate("purchase-receipt.html");
    const html = this.replaceVariables(template, {
      businessName,
      leadId: leadData.id,
      location: leadData.location || "Not specified",
      weddingDate: leadData.weddingDate ? new Date(leadData.weddingDate).toLocaleDateString("en-US", { 
        year: "numeric", month: "long", day: "numeric" 
      }) : "TBD",
      contactName: leadData.personName || "Not specified",
      contactEmail: leadData.email || "Not specified",
      contactPhone: leadData.phone || "Not specified",
      amount: parseFloat(amount).toFixed(2),
      remainingBalance: parseFloat(remainingBalance).toFixed(2),
      date: new Date().toLocaleDateString("en-US", { 
        weekday: "long", year: "numeric", month: "long", day: "numeric" 
      })
    });
    return this.sendEmail(email, "Lead Purchase Receipt - Black Bow Associates", html);
  }

  static async sendPayoutConfirmation(email, businessName, amount, payoutMethod, payoutId) {
    const template = this.readTemplate("payout-confirmation.html");
    const html = this.replaceVariables(template, {
      businessName,
      amount: parseFloat(amount).toFixed(2),
      payoutMethod: payoutMethod || "Bank Transfer",
      payoutId,
      date: new Date().toLocaleDateString("en-US", { 
        weekday: "long", year: "numeric", month: "long", day: "numeric" 
      })
    });
    return this.sendEmail(email, "Payout Request Received - Black Bow Associates", html);
  }

  static async sendPayoutRequestToAdmin(userEmail, businessName, userId, amount, payoutDetails, commissionsCount, payoutId) {
    let template = this.readTemplate("payout-request-admin.html");
    
    if (payoutDetails.method === "ZELLE") {
      template = template.replace(/{{#if isZelle}}([\s\S]*?){{\/if}}/g, "$1");
      template = template.replace(/{{#if isACH}}[\s\S]*?{{\/if}}/g, "");
    } else {
      template = template.replace(/{{#if isACH}}([\s\S]*?){{\/if}}/g, "$1");
      template = template.replace(/{{#if isZelle}}[\s\S]*?{{\/if}}/g, "");
    }
    
    const html = this.replaceVariables(template, {
      businessName,
      userEmail,
      userId,
      amount: parseFloat(amount).toFixed(2),
      payoutMethod: payoutDetails.method || "Not specified",
      payoutEmail: payoutDetails.email || "",
      bankName: payoutDetails.bankName || "",
      routingNumber: payoutDetails.routingNumber || "",
      accountNumber: payoutDetails.accountNumber ? "****" + payoutDetails.accountNumber.slice(-4) : "",
      commissionsCount: commissionsCount.toString(),
      payoutId,
      date: new Date().toLocaleDateString("en-US", { 
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    });
    const adminEmails = await this.getAdminNotificationEmails();
    return this.sendEmail(adminEmails, `New Payout Request - $${parseFloat(amount).toFixed(2)} - ${businessName}`, html);
  }

  static async sendPayoutPaidEmail(email, businessName, amount, payoutMethod, payoutId) {
    const template = this.readTemplate("payout-paid.html");
    const html = this.replaceVariables(template, {
      businessName,
      amount: parseFloat(amount).toFixed(2),
      payoutMethod: payoutMethod || "Bank Transfer",
      payoutId,
      date: new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    });
    return this.sendEmail(email, "Payout Completed - Black Bow Associates", html);
  }

  static generateConfirmationToken() { return this.generateToken(); }
  static generatePasswordResetToken() { return this.generateToken(); }
}

export default EmailService;

/**
 * Email Service using Resend API
 * Handles email confirmation and other transactional emails
 */

import { Resend } from "resend";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

class EmailService {
  /**
   * Generate a secure confirmation token
   * @returns {string} - Random 32-byte hex string
   */
  static generateConfirmationToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Send email confirmation
   * @param {string} email - Recipient email
   * @param {string} businessName - Business name for personalization
   * @param {string} token - Confirmation token
   * @returns {Promise<object>} - Resend API response
   */
  static async sendConfirmationEmail(email, businessName, token) {
    try {
      // Read email template
      const templatePath = path.join(__dirname, '../../templates/email-confirmation.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Build confirmation URL
      const confirmationUrl = `https://blackbowassociates.com/confirm-email?token=${token}`;

      // Replace placeholders
      htmlTemplate = htmlTemplate
        .replace(/{{businessName}}/g, businessName)
        .replace(/{{confirmationUrl}}/g, confirmationUrl);

      // Send email via Resend
      const result = await resend.emails.send({
        from: `${process.env.DEFAULT_FROM_NAME} <${process.env.DEFAULT_FROM_EMAIL}>`,
        to: email,
        subject: 'Confirm Your Email - Black Bow Associates',
        html: htmlTemplate
      });

      // Check for errors
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      logger.info('Confirmation email sent', {
        email,
        emailId: result.data?.id || result.id
      });

      return {
        success: true,
        emailId: result.data?.id || result.id
      };

    } catch (error) {
      logger.error('Failed to send confirmation email', {
        email,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} businessName - Business name for personalization
   * @param {string} token - Password reset token
   * @returns {Promise<object>} - Resend API response
   */
  static async sendPasswordResetEmail(email, businessName, token) {
    try {
      // Read email template
      const templatePath = path.join(__dirname, '../../templates/password-reset.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Build reset URL
      const resetUrl = `https://blackbowassociates.com/reset-password?token=${token}`;

      // Replace placeholders
      htmlTemplate = htmlTemplate
        .replace(/{{businessName}}/g, businessName)
        .replace(/{{resetUrl}}/g, resetUrl);

      // Send email via Resend
      const result = await resend.emails.send({
        from: `${process.env.DEFAULT_FROM_NAME} <${process.env.DEFAULT_FROM_EMAIL}>`,
        to: email,
        subject: 'Reset Your Password - Black Bow Associates',
        html: htmlTemplate
      });

      // Check for errors
      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      logger.info('Password reset email sent', {
        email,
        emailId: result.data?.id || result.id
      });

      return {
        success: true,
        emailId: result.data?.id || result.id
      };

    } catch (error) {
      logger.error('Failed to send password reset email', {
        email,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Generate a secure password reset token
   * @returns {string} - Random 32-byte hex string
   */
  static generatePasswordResetToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

export default EmailService;

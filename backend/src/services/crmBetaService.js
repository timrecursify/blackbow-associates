/**
 * CRM Beta Signup Service
 * Handles beta signup registrations, notifications, and management
 */

import prisma from '../config/database.js';
import EmailService from './emailService.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const resend = new Resend(process.env.RESEND_API_KEY);

class CrmBetaService {
  /**
   * Create a new CRM beta signup
   * @param {object} signupData - Signup information
   * @returns {Promise<object>} - Created signup record
   */
  static async createSignup(signupData) {
    try {
      const { name, email, phone, companyName, companyWebsite, vendorType, message } = signupData;

      // Check for duplicate email
      const existingSignup = await prisma.crmBetaSignup.findUnique({
        where: { email }
      });

      if (existingSignup) {
        throw new Error('EMAIL_ALREADY_REGISTERED');
      }

      // Create signup record
      const signup = await prisma.crmBetaSignup.create({
        data: {
          name,
          email,
          phone,
          companyName,
          companyWebsite: companyWebsite || null,
          vendorType: vendorType || null,
          message: message || null,
          status: 'pending'
        }
      });

      logger.info('CRM Beta signup created', {
        signupId: signup.id,
        email: signup.email,
        companyName: signup.companyName
      });

      // Send confirmation email to applicant (async, don't block response)
      this.sendConfirmationEmail(signup).catch(err => {
        logger.error('Failed to send beta confirmation email', {
          signupId: signup.id,
          error: err.message
        });
      });

      // Send notification to admin (async, don't block response)
      this.sendAdminNotification(signup).catch(err => {
        logger.error('Failed to send admin notification email', {
          signupId: signup.id,
          error: err.message
        });
      });

      // Send Telegram notification (async, don't block response)
      this.sendTelegramNotification(signup).catch(err => {
        logger.error('Failed to send Telegram notification', {
          signupId: signup.id,
          error: err.message
        });
      });

      return signup;

    } catch (error) {
      logger.error('Failed to create CRM beta signup', {
        email: signupData.email,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send confirmation email to beta applicant
   * @param {object} signup - Signup record
   * @returns {Promise<object>} - Email result
   */
  static async sendConfirmationEmail(signup) {
    try {
      const templatePath = path.join(__dirname, '../../templates/crm-beta-confirmation.html');
      let htmlTemplate = fs.readFileSync(templatePath, 'utf8');

      // Replace placeholders
      htmlTemplate = htmlTemplate
        .replace(/{{name}}/g, signup.name)
        .replace(/{{companyName}}/g, signup.companyName);

      const result = await resend.emails.send({
        from: `${process.env.DEFAULT_FROM_NAME} <${process.env.DEFAULT_FROM_EMAIL}>`,
        to: signup.email,
        subject: "We're Reviewing Your CRM Beta Application",
        html: htmlTemplate
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      logger.info('Beta confirmation email sent', {
        signupId: signup.id,
        email: signup.email,
        emailId: result.data?.id || result.id
      });

      return { success: true, emailId: result.data?.id || result.id };

    } catch (error) {
      logger.error('Failed to send beta confirmation email', {
        signupId: signup.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send notification email to admin about new beta signup
   * @param {object} signup - Signup record
   * @returns {Promise<object>} - Email result
   */
  static async sendAdminNotification(signup) {
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@blackbowassociates.com';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #000;">🎯 New CRM Beta Signup</h2>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Name:</strong> ${signup.name}</p>
            <p><strong>Company:</strong> ${signup.companyName}</p>
            <p><strong>Email:</strong> ${signup.email}</p>
            <p><strong>Phone:</strong> ${signup.phone}</p>
            ${signup.companyWebsite ? `<p><strong>Website:</strong> <a href="${signup.companyWebsite}">${signup.companyWebsite}</a></p>` : ''}
            ${signup.vendorType ? `<p><strong>Vendor Type:</strong> ${signup.vendorType}</p>` : ''}
            ${signup.message ? `<p><strong>Message:</strong> ${signup.message}</p>` : ''}
            <p><strong>Submitted:</strong> ${new Date(signup.createdAt).toLocaleString()}</p>
          </div>
          <p>View all beta signups in the <a href="https://blackbowassociates.com/admin">admin dashboard</a>.</p>
        </div>
      `;

      const result = await resend.emails.send({
        from: `${process.env.DEFAULT_FROM_NAME} <${process.env.DEFAULT_FROM_EMAIL}>`,
        to: adminEmail,
        subject: `New CRM Beta Signup: ${signup.companyName}`,
        html: htmlContent
      });

      if (result.error) {
        throw new Error(`Resend API error: ${result.error.message || JSON.stringify(result.error)}`);
      }

      logger.info('Admin notification email sent', {
        signupId: signup.id,
        adminEmail,
        emailId: result.data?.id || result.id
      });

      return { success: true, emailId: result.data?.id || result.id };

    } catch (error) {
      logger.error('Failed to send admin notification email', {
        signupId: signup.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Send Telegram notification about new beta signup
   * @param {object} signup - Signup record
   * @returns {Promise<void>}
   */
  static async sendTelegramNotification(signup) {
    try {
      const message = `**New CRM Beta Signup**\n\n` +
        `👤 **Name:** ${signup.name}\n` +
        `🏢 **Company:** ${signup.companyName}\n` +
        `📧 **Email:** ${signup.email}\n` +
        `📱 **Phone:** ${signup.phone}\n` +
        `${signup.vendorType ? `💍 **Vendor Type:** ${signup.vendorType}\n` : ''}` +
        `⏰ **Time:** ${new Date(signup.createdAt).toLocaleString()}`;

      await notifyTelegram(message, 'success');

      logger.info('Telegram notification sent', { signupId: signup.id });

    } catch (error) {
      logger.error('Failed to send Telegram notification', {
        signupId: signup.id,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get all beta signups with pagination and filtering
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Results per page (default: 20)
   * @param {string} status - Filter by status (optional)
   * @returns {Promise<object>} - Paginated signups
   */
  static async getAllSignups(page = 1, limit = 20, status = null) {
    try {
      const skip = (page - 1) * limit;

      const where = status ? { status } : {};

      const [signups, total] = await Promise.all([
        prisma.crmBetaSignup.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.crmBetaSignup.count({ where })
      ]);

      logger.info('Retrieved beta signups', {
        page,
        limit,
        status,
        total,
        returned: signups.length
      });

      return {
        signups,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };

    } catch (error) {
      logger.error('Failed to retrieve beta signups', { error: error.message });
      throw error;
    }
  }

  /**
   * Update beta signup status
   * @param {string} signupId - Signup ID
   * @param {string} status - New status
   * @returns {Promise<object>} - Updated signup
   */
  static async updateSignupStatus(signupId, status) {
    try {
      const validStatuses = ['pending', 'contacted', 'approved', 'rejected'];

      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const signup = await prisma.crmBetaSignup.update({
        where: { id: signupId },
        data: { status }
      });

      logger.info('Beta signup status updated', {
        signupId,
        status,
        email: signup.email
      });

      return signup;

    } catch (error) {
      logger.error('Failed to update beta signup status', {
        signupId,
        status,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get beta signup by ID
   * @param {string} signupId - Signup ID
   * @returns {Promise<object>} - Signup record
   */
  static async getSignupById(signupId) {
    try {
      const signup = await prisma.crmBetaSignup.findUnique({
        where: { id: signupId }
      });

      if (!signup) {
        throw new Error('SIGNUP_NOT_FOUND');
      }

      return signup;

    } catch (error) {
      logger.error('Failed to retrieve beta signup', {
        signupId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Export all signups to CSV format
   * @returns {Promise<string>} - CSV content
   */
  static async exportSignupsToCSV() {
    try {
      const signups = await prisma.crmBetaSignup.findMany({
        orderBy: { createdAt: 'desc' }
      });

      // CSV headers
      const headers = [
        'ID',
        'Name',
        'Email',
        'Phone',
        'Company Name',
        'Company Website',
        'Vendor Type',
        'Message',
        'Status',
        'Created At',
        'Updated At'
      ];

      // CSV rows
      const rows = signups.map(signup => [
        signup.id,
        signup.name,
        signup.email,
        signup.phone,
        signup.companyName,
        signup.companyWebsite || '',
        signup.vendorType || '',
        signup.message || '',
        signup.status,
        new Date(signup.createdAt).toISOString(),
        new Date(signup.updatedAt).toISOString()
      ]);

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      logger.info('Beta signups exported to CSV', { count: signups.length });

      return csvContent;

    } catch (error) {
      logger.error('Failed to export beta signups to CSV', { error: error.message });
      throw error;
    }
  }
}

export default CrmBetaService;

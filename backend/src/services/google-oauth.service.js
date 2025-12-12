import { google } from 'googleapis';
import { logger } from '../utils/logger.js';

class GoogleOAuthService {
  constructor() {
    this.oauth2Client = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI
      );

      this.initialized = true;
      logger.info('Google OAuth client initialized successfully', {
        redirectUri: process.env.GOOGLE_REDIRECT_URI
      });
    } catch (error) {
      logger.error('Failed to initialize Google OAuth client', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Generate Google authorization URL
   * @returns {string} Authorization URL
   */
  generateAuthUrl() {
    this.initialize();

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ],
      prompt: 'consent' // Force consent screen to get refresh token
    });

    logger.info('Generated Google authorization URL');

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from Google
   * @returns {Promise<Object>} Token response with user info
   */
  async exchangeCode(code) {
    this.initialize();

    try {
      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      logger.info('Successfully exchanged code for tokens', {
        hasIdToken: !!tokens.id_token,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date
      });

      // Get user info from Google
      const oauth2 = google.oauth2({
        auth: this.oauth2Client,
        version: 'v2'
      });

      const { data: userInfo } = await oauth2.userinfo.get();

      logger.info('Retrieved user info from Google', {
        email: userInfo.email,
        verified: userInfo.verified_email
      });

      return {
        tokens,
        userInfo: {
          googleUserId: userInfo.id,
          email: userInfo.email,
          emailVerified: userInfo.verified_email || false,
          name: userInfo.name,
          givenName: userInfo.given_name,
          familyName: userInfo.family_name,
          picture: userInfo.picture,
          locale: userInfo.locale
        }
      };
    } catch (error) {
      logger.error('Failed to exchange authorization code', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    this.initialize();

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      logger.info('Successfully refreshed Google access token', {
        hasAccessToken: !!credentials.access_token,
        expiresIn: credentials.expiry_date
      });

      return credentials;
    } catch (error) {
      logger.error('Failed to refresh Google access token', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Revoke tokens (logout)
   * @param {string} accessToken - Access token to revoke
   * @returns {Promise<void>}
   */
  async revokeToken(accessToken) {
    this.initialize();

    try {
      await this.oauth2Client.revokeToken(accessToken);
      logger.info('Successfully revoked Google access token');
    } catch (error) {
      logger.error('Failed to revoke Google access token', {
        error: error.message
      });
      throw error;
    }
  }
}

// Create singleton instance
const googleOAuthService = new GoogleOAuthService();

export default googleOAuthService;

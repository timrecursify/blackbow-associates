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
   * @param {string|null} referralCode - Optional referral code to preserve through OAuth flow
   * @returns {string} Authorization URL
   */
  generateAuthUrl(referralCode = null) {
    this.initialize();

    // Encode referral code in state parameter (JSON encoded for extensibility)
    const stateData = referralCode ? JSON.stringify({ ref: referralCode }) : null;

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
        'openid'
      ],
      prompt: 'consent',
      state: stateData
    });

    logger.info('Generated Google authorization URL', {
      hasReferralCode: !!referralCode,
      referralCode: referralCode || null
    });

    return authUrl;
  }

  /**
   * Parse the state parameter from OAuth callback
   * @param {string|null} state - State parameter from callback
   * @returns {Object} Parsed state object with referral code if present
   */
  parseState(state) {
    if (!state) {
      return { ref: null };
    }

    try {
      return JSON.parse(state);
    } catch (error) {
      logger.warn('Failed to parse OAuth state parameter', {
        state,
        error: error.message
      });
      return { ref: null };
    }
  }

  /**
   * Exchange authorization code for tokens
   * @param {string} code - Authorization code from Google
   * @returns {Promise<Object>} Token response with user info
   */
  async exchangeCode(code) {
    this.initialize();

    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);

      logger.info('Successfully exchanged code for tokens', {
        hasIdToken: !!tokens.id_token,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresIn: tokens.expiry_date
      });

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

const googleOAuthService = new GoogleOAuthService();

export default googleOAuthService;

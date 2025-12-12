import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.blackbowassociates.com';

// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// User interface
export interface User {
  id: string;
  email: string;
  businessName?: string;
  vendorType?: string;
  balance?: number;
  isAdmin?: boolean;
  onboardingCompleted?: boolean;
  emailConfirmed?: boolean;
  createdAt?: string;
}

// Auth response interface
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Registration data interface
export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Login credentials interface
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Store tokens in localStorage
 */
export const setTokens = (accessToken: string, refreshToken: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

/**
 * Get access token from localStorage
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Get refresh token from localStorage
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Clear all tokens from localStorage
 */
export const clearTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if user is authenticated (has valid access token OR cookies)
 * Note: For cookie-based auth (OAuth), we need to call getCurrentUser() to verify
 */
export const isAuthenticated = (): boolean => {
  // If we have localStorage token, user is authenticated (email/password login)
  return !!getAccessToken();
  // Note: For OAuth cookie auth, we rely on getCurrentUser() being called
  // which will work automatically with cookies
};

/**
 * Authentication API service
 */
export const authAPI = {
  /**
   * Register a new user
   */
  register: async (data: RegisterData): Promise<AuthTokens> => {
    const response = await axios.post<AuthTokens>(`${API_URL}/api/auth/register`, {
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Store tokens
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Login with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await axios.post<AuthTokens>(`${API_URL}/api/auth/login`, credentials);

    // Store tokens
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Logout current user
   */
  logout: async (): Promise<void> => {
    try {
      const accessToken = getAccessToken();
      if (accessToken) {
        await axios.post(
          `${API_URL}/api/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
      }
    } finally {
      // Always clear tokens, even if API call fails
      clearTokens();
    }
  },

  /**
   * Refresh access token using refresh token
   */
  refreshToken: async (): Promise<AuthTokens> => {
    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post<AuthTokens>(`${API_URL}/api/auth/refresh`, {
      refreshToken,
    });

    // Store new tokens
    if (response.data.accessToken && response.data.refreshToken) {
      setTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response.data;
  },

  /**
   * Get current authenticated user
   * Works with both localStorage tokens AND HTTP-only cookies (OAuth)
   */
  getCurrentUser: async (): Promise<User> => {
    const accessToken = getAccessToken();

    const config: any = {
      withCredentials: true, // Send cookies automatically (for OAuth)
    };

    // If we have a token in localStorage, use it (email/password login)
    if (accessToken) {
      config.headers = {
        Authorization: `Bearer ${accessToken}`,
      };
    }

    const response = await axios.get<{ success: boolean; user: User }>(`${API_URL}/api/auth/me`, config);

    return response.data.user;
  },

  /**
   * Confirm email with token
   */
  confirmEmail: async (token: string): Promise<void> => {
    await axios.get(`${API_URL}/api/auth/confirm-email/${token}`);
  },

  /**
   * Request password reset
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
  },

  /**
   * Reset password with token
   */
  resetPassword: async (token: string, newPassword: string): Promise<void> => {
    await axios.post(`${API_URL}/api/auth/reset-password`, {
      token,
      newPassword,
    });
  },

  /**
   * Resend confirmation email
   */
  resendConfirmation: async (email: string): Promise<void> => {
    await axios.post(`${API_URL}/api/auth/resend-confirmation`, { email });
  },

  /**
   * Send initial confirmation email
   */
  sendInitialConfirmation: async (data: { email: string; businessName: string }): Promise<void> => {
    await axios.post(`${API_URL}/api/auth/send-confirmation`, data);
  },
};

export default authAPI;

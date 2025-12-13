import axios from 'axios';
import { getAccessToken, clearTokens, authAPI } from './authAPI';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.blackbowassociates.com/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests (for OAuth)
});

// Request interceptor: Add JWT token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Handle 401 errors and refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the token refresh to complete
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return apiClient(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token
        const response = await authAPI.refreshToken();
        processQueue(null, response.accessToken);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        processQueue(refreshError as Error, null);
        clearTokens();

        // Redirect to login page
        window.location.href = '/sign-in';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Set auth token (legacy support - now handled by interceptor)
export const setAuthToken = (token: string | (() => string) | null) => {
  // This function is kept for backward compatibility but tokens are now managed via authAPI
  if (token) {
    console.warn('setAuthToken is deprecated. Use authAPI.login() or authAPI.register() instead.');
  }
};

// Auth API
export const authAPI = {
  syncUser: (userData: { clerkUserId: string; email: string }) =>
    apiClient.post("/auth/sync", userData),
  getCurrentUser: () => apiClient.get("/auth/me"),
  sendInitialConfirmation: (data: { email: string; businessName: string }) =>
    apiClient.post("/auth/send-confirmation", data),
  confirmEmail: (token: string) => apiClient.get(`/auth/confirm-email/${token}`),
  resendConfirmation: (email: string) => apiClient.post("/auth/resend-confirmation", { email }),
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: any) => apiClient.put('/users/profile', data),
  completeOnboarding: (data: any) => apiClient.put('/users/profile', { ...data, onboardingCompleted: true }),
  getTransactions: (page = 1, limit = 50) =>
    apiClient.get('/users/transactions', { params: { page, limit } }),
  getPurchasedLeads: (page = 1, limit = 50) =>
    apiClient.get('/users/purchased-leads', { params: { page, limit } }),
  updateLeadNote: (leadId: string, note: string) =>
    apiClient.put(`/users/leads/${leadId}/note`, { note }),
  updateBillingAddress: (data: {
    firstName: string;
    lastName: string;
    companyName?: string;
    isCompany?: boolean;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zip: string;
  }) => apiClient.put('/users/billing-address', data),
};

// Leads API
export const leadsAPI = {
  getLeads: (params?: any) => apiClient.get('/leads', { params }),
  getLead: (id: string) => apiClient.get(`/leads/${id}`),
  purchaseLead: (id: string) => apiClient.post(`/leads/${id}/purchase`),
  getFavorites: () => apiClient.get('/leads/favorites/list'),
  addFavorite: (leadId: string) => apiClient.post(`/leads/${leadId}/favorite`),
  removeFavorite: (leadId: string) => apiClient.delete(`/leads/${leadId}/favorite`),
  submitFeedback: (leadId: string, feedback: any) => apiClient.post(`/leads/${leadId}/feedback`, feedback),
};

// Payments API
export const paymentsAPI = {
  createDeposit: (amount: number) => apiClient.post('/payments/deposit', { amount }),
  verifyPayment: (paymentIntentId: string) =>
    apiClient.post('/payments/verify', { paymentIntentId }),
  getPaymentMethods: () => apiClient.get('/payments/methods'),
  addPaymentMethod: (paymentMethodId: string) =>
    apiClient.post('/payments/methods', { paymentMethodId }),
  removePaymentMethod: (paymentMethodId: string) =>
    apiClient.delete(`/payments/methods/${paymentMethodId}`),
};

// Referral API
export const referralAPI = {
  getStats: () => apiClient.get('/referrals/stats'),
  getLink: () => apiClient.get('/referrals/link'),
  getReferredUsers: (page = 1, limit = 20) =>
    apiClient.get('/referrals/referred-users', { params: { page, limit } }),
  getCommissions: (page = 1, limit = 50) =>
    apiClient.get('/referrals/commissions', { params: { page, limit } }),
  requestPayout: () => apiClient.post('/referrals/request-payout'),
  getPayoutHistory: (page = 1, limit = 20) =>
    apiClient.get('/referrals/payouts', { params: { page, limit } }),
};

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: (page = 1, limit = 100) => apiClient.get('/admin/users', { params: { page, limit } }),
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),

  // Lead management
  getAllLeads: (page = 1, limit = 100) => apiClient.get('/admin/leads', { params: { page, limit } }),
  getLeads: (params?: any) => apiClient.get('/admin/leads', { params }),
  createLead: (data: any) => apiClient.post('/admin/leads', data),
  updateLead: (id: string, data: any) => apiClient.put(`/admin/leads/${id}`, data),
  updateLeadStatus: (id: string, status: string) => apiClient.put(`/admin/leads/${id}/status`, { status }),
  deleteLead: (id: string) => apiClient.delete(`/admin/leads/${id}`),
  importLeads: (leads: any[]) => apiClient.post('/admin/leads/import', { leads }),

  // Balance adjustment
  adjustBalance: (userId: string, amount: number, reason: string) =>
    apiClient.post(`/admin/users/${userId}/adjust-balance`, { amount, reason }),
  // User management actions
  blockUser: (userId: string, reason: string) =>
    apiClient.post(`/admin/users/${userId}/block`, { reason }),
  unblockUser: (userId: string) =>
    apiClient.post(`/admin/users/${userId}/unblock`),
  deleteUser: (userId: string) =>
    apiClient.delete(`/admin/users/${userId}`),

  // Analytics
  getOverview: (params?: any) => apiClient.get('/admin/analytics/overview', { params }),
  getRevenueAnalytics: (params?: any) => apiClient.get('/admin/analytics/revenue', { params }),
  getUserAnalytics: (params?: any) => apiClient.get('/admin/analytics/users', { params }),
  getLeadAnalytics: (params?: any) => apiClient.get('/admin/analytics/leads', { params }),
  getFeedbackAnalytics: (params?: any) => apiClient.get('/admin/analytics/feedback', { params }),
  getRevenueGrowth: (params?: any) => apiClient.get('/admin/analytics/revenue-growth', { params }),
  getUserEngagement: (params?: any) => apiClient.get('/admin/analytics/user-engagement', { params }),
  exportAnalytics: (params?: any) => apiClient.get('/admin/analytics/export', { params, responseType: 'blob' }),

  // CRM Beta Signups management
  getCrmBetaSignups: (page: number = 1, limit: number = 20, status?: string) =>
    apiClient.get('/admin/crm-beta-signups', { params: { page, limit, status } }),
  getCrmBetaSignupById: (signupId: string) =>
    apiClient.get(`/admin/crm-beta-signups/${signupId}`),
  updateCrmBetaSignupStatus: (signupId: string, status: string) =>
    apiClient.patch(`/admin/crm-beta-signups/${signupId}/status`, { status }),
  exportCrmBetaSignups: () =>
    apiClient.get('/admin/crm-beta-signups/export', { responseType: 'blob' }),

  // Referrals
  getReferralOverview: () => apiClient.get('/admin/referrals/overview'),
  getAllReferrers: (page = 1, limit = 50, search?: string) =>
    apiClient.get('/admin/referrals/referrers', { params: { page, limit, search } }),
  getReferrerDetails: (userId: string) =>
    apiClient.get(`/admin/referrals/referrers/${userId}`),
  getPendingPayouts: (page = 1, limit = 50) =>
    apiClient.get('/admin/referrals/payouts', { params: { page, limit } }),
  markPayoutAsPaid: (payoutId: string, notes?: string) =>
    apiClient.post(`/admin/referrals/payouts/${payoutId}/mark-paid`, { notes }),
  toggleUserReferral: (userId: string) =>
    apiClient.post(`/admin/referrals/users/${userId}/toggle-referral`),
};

export default {
  authAPI,
  usersAPI,
  leadsAPI,
  paymentsAPI,
  referralAPI,
  adminAPI,
};

import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.blackbowassociates.com/api';

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add Supabase auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Set auth token (supports function for dynamic token retrieval)
export const setAuthToken = (token: string | (() => string) | null) => {
  if (typeof token === 'function') {
    // Dynamic token getter
    apiClient.interceptors.request.use(async (config) => {
      const tokenValue = token();
      if (tokenValue) {
        config.headers.Authorization = `Bearer ${tokenValue}`;
      }
      return config;
    });
  } else if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Auth API
export const authAPI = {
  syncUser: (userData: { clerkUserId: string; email: string }) =>
    apiClient.post('/auth/sync', userData),
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
};

// Leads API
export const leadsAPI = {
  getLeads: (params?: any) => apiClient.get('/leads', { params }),
  getLead: (id: string) => apiClient.get(`/leads/${id}`),
  purchaseLead: (id: string) => apiClient.post(`/leads/${id}/purchase`),
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

// Admin API
export const adminAPI = {
  getUsers: (params?: any) => apiClient.get('/admin/users', { params }),
  getLeads: (params?: any) => apiClient.get('/admin/leads', { params }),
  createLead: (data: any) => apiClient.post('/admin/leads', data),
  updateLead: (id: string, data: any) => apiClient.put(`/admin/leads/${id}`, data),
  deleteLead: (id: string) => apiClient.delete(`/admin/leads/${id}`),
  updateUserBalance: (userId: string, amount: number, reason: string) =>
    apiClient.post('/admin/adjust-balance', { userId, amount, reason }),
};

export default {
  authAPI,
  usersAPI,
  leadsAPI,
  paymentsAPI,
  adminAPI,
};

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3450';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to get Clerk token
let getToken: (() => Promise<string | null>) | null = null;

export const setAuthToken = (tokenGetter: () => Promise<string | null>) => {
  getToken = tokenGetter;
};

// Request interceptor to add auth token
apiClient.interceptors.request.use(async (config) => {
  if (getToken) {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Auth API
export const authAPI = {
  getCurrentUser: () => apiClient.get('/auth/me'),
  verifyAdmin: (code: string) => apiClient.post('/auth/verify-admin', { verificationCode: code })
};

// Users API
export const usersAPI = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data: { businessName?: string; vendorType?: string }) =>
    apiClient.put('/users/profile', data),
  getTransactions: (page = 1, limit = 50) =>
    apiClient.get(`/users/transactions?page=${page}&limit=${limit}`),
  getPurchasedLeads: (page = 1, limit = 20) =>
    apiClient.get(`/users/purchases?page=${page}&limit=${limit}`)
};

// Leads API
export const leadsAPI = {
  getLeads: (filters: {
    status?: string;
    location?: string;
    servicesNeeded?: string;
    minBudget?: number;
    maxBudget?: number;
    page?: number;
    limit?: number;
  } = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) params.append(key, String(value));
    });
    return apiClient.get(`/leads?${params.toString()}`);
  },
  getLead: (id: string) => apiClient.get(`/leads/${id}`),
  purchaseLead: (id: string) => apiClient.post(`/leads/${id}/purchase`)
};

// Payments API
export const paymentsAPI = {
  createDeposit: (amount: number) => apiClient.post('/payments/deposit', { amount }),
  getPaymentMethods: () => apiClient.get('/payments/methods'),
  addPaymentMethod: (paymentMethodId: string) =>
    apiClient.post('/payments/methods', { paymentMethodId }),
  removePaymentMethod: (id: string) => apiClient.delete(`/payments/methods/${id}`)
};

// Admin API
export const adminAPI = {
  getAllUsers: (page = 1, limit = 50) =>
    apiClient.get(`/admin/users?page=${page}&limit=${limit}`),
  getAllLeads: (status?: string, page = 1, limit = 50) =>
    apiClient.get(`/admin/leads?${status ? `status=${status}&` : ''}page=${page}&limit=${limit}`),
  importLeads: (leads: any[]) => apiClient.post('/admin/leads/import', { leads }),
  adjustBalance: (userId: string, amount: number, reason: string) =>
    apiClient.post(`/admin/users/${userId}/adjust-balance`, { amount, reason })
};

export default {
  auth: authAPI,
  users: usersAPI,
  leads: leadsAPI,
  payments: paymentsAPI,
  admin: adminAPI
};
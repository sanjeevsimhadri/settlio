import axios, { AxiosResponse } from 'axios';
import { LoginCredentials, RegisterCredentials, AuthResponse, User } from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token and prevent caching
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add cache-busting headers for GET requests
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if unauthorized
      localStorage.removeItem('token');
      // Let React Router handle navigation - don't force redirect here
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Register new user
  register: async (credentials: RegisterCredentials): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/register', credentials);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Registration failed' };
    }
  },

  // Login user
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Login failed' };
    }
  },

  // Get current user info
  getCurrentUser: async (): Promise<{ success: boolean; data: User }> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Failed to fetch user info' };
    }
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<{ success: boolean; data: User }> => {
    try {
      const response = await api.put('/auth/me', userData);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { success: false, error: 'Profile update failed' };
    }
  }
};

// Health check
export const healthCheck = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { success: false, message: 'Health check failed' };
  }
};

export default api;
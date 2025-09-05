// frontend/src/services/api.js
import { getAuthToken, refreshAccessToken, logout } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API helper function with automatic token refresh
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Add auth token if available
  let token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
    
    // Handle token expiration
    if (response.status === 401 && token) {
      try {
        // Try to refresh the token
        token = await refreshAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
        
        // Retry the original request
        const retryResponse = await fetch(url, config);
        const retryData = await retryResponse.json();
        
        if (!retryResponse.ok) {
          throw new Error(retryData.error?.message || retryData.message || 'Request failed');
        }
        
        return retryData;
      } catch (refreshError) {
        // If refresh fails, logout and throw error
        logout();
        throw new Error('Session expired. Please log in again.');
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || data.message || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

// Job API functions
export const jobsAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    return apiRequest('/api/jobs/dashboard-stats');
  },

  // Get all jobs
  getJobs: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/api/jobs?${searchParams}`);
  },

  // Get job by ID
  getJob: async (id) => {
    return apiRequest(`/api/jobs/${id}`);
  },

  // Create new job
  createJob: async (jobData) => {
    return apiRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update job
  updateJob: async (id, jobData) => {
    return apiRequest(`/api/jobs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete job
  deleteJob: async (id) => {
    return apiRequest(`/api/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  // Toggle job status
  toggleJob: async (id) => {
    return apiRequest(`/api/jobs/${id}/toggle`, {
      method: 'PATCH',
    });
  },

  // Trigger job manually
  triggerJob: async (id) => {
    return apiRequest(`/api/jobs/${id}/trigger`, {
      method: 'POST',
    });
  },

  // Get job logs
  getJobLogs: async (id, params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/api/jobs/${id}/logs?${searchParams}`);
  },

  // Get all executions (for logs page)
  getAllExecutions: async (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/api/jobs/executions?${searchParams}`);
  }
};

// User API functions
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return apiRequest('/api/users/profile');
  },

  // Update profile
  updateProfile: async (userData) => {
    return apiRequest('/api/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Change password
  changePassword: async (passwordData) => {
    return apiRequest('/api/users/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },

  // Get user statistics
  getStats: async () => {
    return apiRequest('/api/users/stats');
  }
};

// Auth API functions (these are already in auth.js, but including for completeness)
export const authAPI = {
  // Login
  login: async (email, password) => {
    return apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Register
  register: async (userData) => {
    return apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Refresh token
  refresh: async (refreshToken) => {
    return apiRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  // Logout
  logout: async (refreshToken) => {
    return apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  },

  // Validate token
  validate: async () => {
    return apiRequest('/api/auth/validate');
  }
};

// System API functions
export const systemAPI = {
  // Health check
  health: async () => {
    return apiRequest('/health');
  },

  // Keep alive
  keepAlive: async () => {
    return apiRequest('/keep-alive');
  }
};

export default apiRequest;
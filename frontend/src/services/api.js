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

  // Get all executions (for logs page) - fetch from all user jobs
  getAllExecutions: async (params = {}) => {
    try {
      // First get all jobs for the user
      const jobsResponse = await apiRequest('/api/jobs');
      
      if (!jobsResponse.success || !jobsResponse.data?.jobs?.length) {
        return { 
          success: true, 
          data: { 
            executions: [],
            total: 0,
            page: 1,
            limit: 50
          } 
        };
      }
      
      const allExecutions = [];
      const searchParams = new URLSearchParams(params);
      
      // Get logs for each job
      for (const job of jobsResponse.data.jobs) {
        try {
          const logsResponse = await apiRequest(`/api/jobs/${job.id}/logs?${searchParams}`);
          
          if (logsResponse.success && logsResponse.data?.executions) {
            // Add job information to each execution for easier display
            const executionsWithJobInfo = logsResponse.data.executions.map(execution => ({
              ...execution,
              job_name: job.name,
              job_url: job.url,
              job_method: job.method
            }));
            
            allExecutions.push(...executionsWithJobInfo);
          }
        } catch (error) {
          console.warn(`Failed to fetch logs for job ${job.id} (${job.name}):`, error);
          // Continue with other jobs even if one fails
        }
      }
      
      // Sort by execution date (newest first)
      allExecutions.sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at));
      
      // Apply any filtering if specified in params
      let filteredExecutions = allExecutions;
      
      // Filter by status if specified
      if (params.status && params.status !== 'all') {
        filteredExecutions = filteredExecutions.filter(exec => exec.status === params.status);
      }
      
      // Filter by job if specified
      if (params.jobId && params.jobId !== 'all') {
        filteredExecutions = filteredExecutions.filter(exec => exec.job_id.toString() === params.jobId);
      }
      
      // Apply pagination if specified
      const page = parseInt(params.page) || 1;
      const limit = parseInt(params.limit) || 50;
      const offset = (page - 1) * limit;
      const paginatedExecutions = filteredExecutions.slice(offset, offset + limit);
      
      return { 
        success: true, 
        data: { 
          executions: paginatedExecutions,
          total: filteredExecutions.length,
          page: page,
          limit: limit,
          totalPages: Math.ceil(filteredExecutions.length / limit)
        } 
      };
      
    } catch (error) {
      console.error('Failed to fetch all executions:', error);
      throw new Error(`Failed to fetch execution logs: ${error.message}`);
    }
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
// auth.js - Authentication utilities connected to backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// API helper function
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
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, config);
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

// Login function
export const loginUser = async (email, password) => {
  try {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store tokens in localStorage
    localStorage.setItem('cronmaster_access_token', data.data.tokens.access_token);
    localStorage.setItem('cronmaster_refresh_token', data.data.tokens.refresh_token);
    localStorage.setItem('cronmaster_user', JSON.stringify(data.data.user));

    return data.data.user;
  } catch (error) {
    throw error;
  }
};

// Signup function
export const signupUser = async (name, email, password) => {
  try {
    const data = await apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ 
        name, 
        email, 
        password, 
        confirmPassword: password 
      }),
    });

    // Store tokens in localStorage
    localStorage.setItem('cronmaster_access_token', data.data.tokens.access_token);
    localStorage.setItem('cronmaster_refresh_token', data.data.tokens.refresh_token);
    localStorage.setItem('cronmaster_user', JSON.stringify(data.data.user));

    return data.data.user;
  } catch (error) {
    throw error;
  }
};

// Get current user from localStorage
export const getCurrentUser = () => {
  try {
    const user = localStorage.getItem('cronmaster_user');
    const token = localStorage.getItem('cronmaster_access_token');
    
    if (user && token) {
      return JSON.parse(user);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Logout function
export const logout = async () => {
  try {
    const refreshToken = localStorage.getItem('cronmaster_refresh_token');
    
    if (refreshToken) {
      // Call backend logout endpoint
      await apiRequest('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with local logout even if backend call fails
  } finally {
    // Clear local storage
    localStorage.removeItem('cronmaster_access_token');
    localStorage.removeItem('cronmaster_refresh_token');
    localStorage.removeItem('cronmaster_user');
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('cronmaster_access_token');
  const user = localStorage.getItem('cronmaster_user');
  return !!(token && user);
};

// Get auth token
export const getAuthToken = () => {
  return localStorage.getItem('cronmaster_access_token');
};

// Refresh access token
export const refreshAccessToken = async () => {
  try {
    const refreshToken = localStorage.getItem('cronmaster_refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const data = await apiRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    // Update tokens
    localStorage.setItem('cronmaster_access_token', data.data.tokens.access_token);
    localStorage.setItem('cronmaster_refresh_token', data.data.tokens.refresh_token);

    return data.data.tokens.access_token;
  } catch (error) {
    // If refresh fails, logout user
    logout();
    throw error;
  }
};

// Validate email format
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Password strength indicator
export const getPasswordStrength = (password) => {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (/(?=.*[a-z])/.test(password)) score++;
  if (/(?=.*[A-Z])/.test(password)) score++;
  if (/(?=.*\d)/.test(password)) score++;
  if (/(?=.*[@$!%*?&])/.test(password)) score++;
  
  if (score <= 1) return { strength: 'weak', color: 'red' };
  if (score <= 3) return { strength: 'medium', color: 'yellow' };
  return { strength: 'strong', color: 'green' };
};

// Auto-refresh token on API calls
const setupTokenRefresh = () => {
  // Intercept 401 responses and try to refresh token
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const response = await originalFetch(...args);
    
    if (response.status === 401 && args[0].includes(API_URL)) {
      try {
        await refreshAccessToken();
        
        // Retry the original request with new token
        const newToken = getAuthToken();
        if (newToken && args[1]) {
          args[1].headers = {
            ...args[1].headers,
            Authorization: `Bearer ${newToken}`,
          };
          return originalFetch(...args);
        }
      } catch (error) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
      }
    }
    
    return response;
  };
};

// Initialize token refresh setup
if (typeof window !== 'undefined') {
  setupTokenRefresh();
}
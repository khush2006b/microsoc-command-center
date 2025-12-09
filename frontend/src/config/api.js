/**
 * API Configuration
 * Centralized API base URL configuration for all API calls
 */

// Get API URL from environment variable with fallback to localhost
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const API_URL = `${API_BASE_URL}/api`;

// WebSocket URL (same as API base but with ws:// or wss://)
export const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

// Helper function to get auth headers
export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

// Helper function for API calls with auth
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
};

console.log('🔗 API Configuration:', {
  baseURL: API_BASE_URL,
  apiURL: API_URL,
  wsURL: WS_URL
});

export default {
  API_BASE_URL,
  API_URL,
  WS_URL,
  getAuthHeaders,
  apiCall
};

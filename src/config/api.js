// API configuration
export const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3001';

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

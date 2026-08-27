/**
 * Axios HTTP Client Instance configured with CSRF Cookie handling
 * 
 * [PRESENTATION-TAG: AXIOS-CLIENT]
 * [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
 */

import axios from 'axios';

// Detect environment and configure base API endpoint
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined && import.meta.env.VITE_API_BASE_URL !== ''
  ? import.meta.env.VITE_API_BASE_URL 
  : (isLocalhost ? 'http://localhost:8080' : 'https://student-portal-llel.onrender.com');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// CSRF Cookie extraction helper
function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
}

// Request Interceptor: Attach CSRF Token header for modifying HTTP methods (POST, PUT, DELETE, PATCH)
apiClient.interceptors.request.use(
  (config) => {
    const method = config.method ? config.method.toUpperCase() : 'GET';
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const csrfToken = getCookie('csrf_token');
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;

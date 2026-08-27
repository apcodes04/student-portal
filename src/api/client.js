/**
 * Production Axios HTTP Client with Security Interceptors
 * 
 * [PRESENTATION-TAG: AXIOS-CLIENT]
 * [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
 * [PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
 */

import axios from 'axios';

// Use relative URL when deployed on Vercel or environment override
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined 
  ? import.meta.env.VITE_API_BASE_URL 
  : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:8000' : '');

// [PRESENTATION-TAG: AXIOS-CLIENT] Axios HTTP Client Instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

/**
 * Utility to extract cookie value by name
 */
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

/**
 * [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
 * Helper to fetch fresh CSRF token from server
 */
export async function refreshCsrfToken() {
  try {
    const response = await apiClient.get('/applications/csrf-token');
    return response.data.csrf_token;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
    return null;
  }
}

/**
 * [PRESENTATION-TAG: AXIOS-CLIENT]
 * [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
 * [PRESENTATION-TAG: IDEMPOTENCY-ENGINE]
 * Request Interceptor: Inject Anti-CSRF and Idempotency Headers
 */
apiClient.interceptors.request.use(
  async (config) => {
    const method = config.method?.toUpperCase();
    
    // Inject headers for mutating requests (POST, PUT, PATCH, DELETE)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      let csrfToken = getCookie('csrf_token');
      
      // Auto-bootstrap CSRF token if missing
      if (!csrfToken) {
        csrfToken = await refreshCsrfToken();
      }

      // [PRESENTATION-TAG: ANTI-CSRF-PROTECTION] Attach Double-Submit CSRF header
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }

      // [PRESENTATION-TAG: IDEMPOTENCY-ENGINE] Generate payload hash Idempotency-Key
      if (method === 'POST' && config.data) {
        const payloadString = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
        const idempotencyKey = btoa(encodeURIComponent(payloadString)).substring(0, 64);
        config.headers['Idempotency-Key'] = `key-${idempotencyKey}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * [PRESENTATION-TAG: AXIOS-CLIENT]
 * [PRESENTATION-TAG: ANTI-CSRF-PROTECTION]
 * Response Interceptor: Handles 403 CSRF token refresh retries
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry once if CSRF token expired or invalid (403)
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true;
      const newToken = await refreshCsrfToken();
      if (newToken) {
        originalRequest.headers['X-CSRF-Token'] = newToken;
        return apiClient(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

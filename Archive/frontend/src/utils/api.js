import axios from 'axios';

// Default to production URL, fallback to localhost for development
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://archive-mi73.onrender.com');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Required for CORS with credentials
});

// Enhanced request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    if (import.meta.env.DEV) {
      console.debug('Full request config:', config);
    }
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
apiClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.debug('[API] Response:', response);
    }
    return response;
  },
  (error) => {
    const errorData = {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url
    };
    
    console.error('[API] Error:', errorData);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Handle unauthorized
    } else if (error.code === 'ECONNABORTED') {
      errorData.message = 'Request timeout - server took too long to respond';
    } else if (!error.response) {
      errorData.message = 'Network error - could not connect to server';
    }
    
    return Promise.reject(errorData);
  }
);

// Add function to check backend connectivity
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return {
      connected: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Connection failed'
    };
  }
};

export { API_BASE_URL };
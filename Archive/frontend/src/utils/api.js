import axios from 'axios';

// API Configuration for Production Deployment
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://archive-mi73.onrender.com');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased for Render cold starts
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

// Enhanced response interceptor with better error handling
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
      errorData.message = 'Unauthorized access';
    } else if (error.response?.status === 403) {
      errorData.message = 'Access forbidden';
    } else if (error.response?.status === 404) {
      errorData.message = 'Resource not found';
    } else if (error.response?.status === 429) {
      errorData.message = 'Too many requests - please wait and try again';
    } else if (error.response?.status >= 500) {
      errorData.message = 'Server error - please try again later';
    } else if (error.code === 'ECONNABORTED') {
      errorData.message = 'Request timeout - server took too long to respond (this is normal for Render free tier)';
    } else if (!error.response) {
      errorData.message = 'Network error - could not connect to server';
    }
    
    return Promise.reject(errorData);
  }
);

// API Service Functions
export const apiService = {
  // Health check
  checkHealth: async () => {
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
  },

  // Get all semesters
  getSemesters: async () => {
    const response = await apiClient.get('/api/semesters');
    return response.data;
  },

  // Get types by semester
  getTypes: async (semesterId) => {
    const response = await apiClient.get(`/api/semesters/${semesterId}/types`);
    return response.data;
  },

  // Get subjects by semester and type
  getSubjects: async (semesterId, typeId) => {
    const response = await apiClient.get(`/api/semesters/${semesterId}/types/${typeId}/subjects`);
    return response.data;
  },

  // Get years by semester, type, and subject
  getYears: async (semesterId, typeId, subjectId) => {
    const response = await apiClient.get(`/api/semesters/${semesterId}/types/${typeId}/subjects/${subjectId}/years`);
    return response.data;
  },

  // Get files by year
  getFilesByYear: async (yearId) => {
    const response = await apiClient.get(`/api/years/${yearId}/files`);
    return response.data;
  },

  // Get all files with pagination and filtering
  getFiles: async (params = {}) => {
    const response = await apiClient.get('/api/files', { params });
    return response.data;
  },

  // Upload file
  uploadFile: async (formData, onProgress) => {
    const response = await apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    });
    return response.data;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const response = await apiClient.delete(`/api/files/${fileId}`);
    return response.data;
  },

  // Get admin statistics
  getAdminStats: async () => {
    const response = await apiClient.get('/api/admin/stats');
    return response.data;
  },

  // Get file view URL
  getFileViewUrl: (fileId) => {
    return `${API_BASE_URL}/api/files/${fileId}/view`;
  },

  // Get file download URL
  getFileDownloadUrl: (fileId) => {
    return `${API_BASE_URL}/api/files/${fileId}/download`;
  },

  // Get direct file URL (for uploads path)
  getDirectFileUrl: (filePath) => {
    if (filePath.startsWith('http')) {
      return filePath;
    }
    return `${API_BASE_URL}${filePath.startsWith('/') ? filePath : '/' + filePath}`;
  }
};

// Utility function to check backend connectivity
export const checkBackendHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return {
      connected: true,
      status: response.status,
      data: response.data,
      url: API_BASE_URL
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message || 'Connection failed',
      url: API_BASE_URL
    };
  }
};

// Export the base URL for components that need it
export { API_BASE_URL };

// Default export
export default apiService;
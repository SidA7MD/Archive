import axios from 'axios';

// API Configuration for Production Debugging
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
  (import.meta.env.DEV ? 'http://localhost:5000' : 'https://archive-mi73.onrender.com');

console.log('🔧 API Configuration:', {
  isDev: import.meta.env.DEV,
  envBackendUrl: import.meta.env.VITE_BACKEND_URL,
  finalApiUrl: API_BASE_URL,
  currentOrigin: window.location.origin
});

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // Increased for Render cold starts
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Enhanced request interceptor with detailed logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[API] 📤 ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    if (import.meta.env.DEV) {
      console.debug('Full request config:', config);
    }
    return config;
  },
  (error) => {
    console.error('[API] ❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    if (import.meta.env.DEV) {
      console.debug('Response data:', response.data);
    }
    return response;
  },
  (error) => {
    const errorInfo = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      baseURL: error.config?.baseURL
    };
    
    console.error(`[API] ❌ ${errorInfo.status || 'Network'} Error:`, errorInfo);
    
    // Enhanced error messages
    let userMessage = error.message;
    if (error.response?.status === 404) {
      userMessage = 'File not found on server';
    } else if (error.response?.status === 403) {
      userMessage = 'Access denied - check CORS configuration';
    } else if (error.response?.status === 500) {
      userMessage = 'Server error - backend may be down';
    } else if (error.code === 'ECONNABORTED') {
      userMessage = 'Request timeout - Render server is waking up, please try again';
    } else if (error.code === 'ERR_NETWORK') {
      userMessage = 'Network error - cannot reach backend server';
    } else if (!error.response) {
      userMessage = 'Cannot connect to server - check if backend is running';
    }
    
    return Promise.reject({
      ...errorInfo,
      userMessage
    });
  }
);

// API Service Functions with enhanced debugging
export const apiService = {
  // Health check with detailed logging
  checkHealth: async () => {
    try {
      console.log('🏥 Checking backend health...');
      const response = await apiClient.get('/api/health');
      console.log('✅ Backend is healthy:', response.data);
      return {
        connected: true,
        status: response.status,
        data: response.data,
        url: API_BASE_URL
      };
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return {
        connected: false,
        error: error.userMessage || error.message || 'Connection failed',
        url: API_BASE_URL
      };
    }
  },

  // Get all files with enhanced logging
  getFiles: async (params = {}) => {
    try {
      console.log('📁 Fetching files with params:', params);
      const response = await apiClient.get('/api/files', { params });
      console.log(`📁 Received ${response.data.files?.length || 0} files`);
      return response.data;
    } catch (error) {
      console.error('❌ Failed to fetch files:', error);
      throw error;
    }
  },

  // Upload file with progress tracking
  uploadFile: async (formData, onProgress) => {
    try {
      console.log('📤 Uploading file...');
      const response = await apiClient.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`📤 Upload progress: ${progress}%`);
          if (onProgress) onProgress(progressEvent);
        },
      });
      console.log('✅ File uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Upload failed:', error);
      throw error;
    }
  },

  // Enhanced file URL methods with debugging
  getFileViewUrl: (file) => {
    let url;
    
    if (file.viewUrl && file.viewUrl.startsWith('http')) {
      // Already a full URL
      url = file.viewUrl;
    } else if (file.viewUrl && file.viewUrl.startsWith('/uploads')) {
      // Relative path from backend
      url = `${API_BASE_URL}${file.viewUrl}`;
    } else if (file._id) {
      // Use API view endpoint
      url = `${API_BASE_URL}/api/files/${file._id}/view`;
    } else if (file.filePath) {
      // Direct file path
      url = file.filePath.startsWith('http') ? file.filePath : `${API_BASE_URL}${file.filePath}`;
    } else {
      console.error('❌ Cannot determine file view URL:', file);
      return null;
    }
    
    console.log('👁️ File view URL:', url);
    return url;
  },

  getFileDownloadUrl: (file) => {
    let url;
    
    if (file.downloadUrl && file.downloadUrl.startsWith('http')) {
      // Already a full URL
      url = file.downloadUrl;
    } else if (file._id) {
      // Use API download endpoint (preferred)
      url = `${API_BASE_URL}/api/files/${file._id}/download`;
    } else if (file.filePath) {
      // Direct file path
      url = file.filePath.startsWith('http') ? file.filePath : `${API_BASE_URL}${file.filePath}`;
    } else {
      console.error('❌ Cannot determine file download URL:', file);
      return null;
    }
    
    console.log('⬇️ File download URL:', url);
    return url;
  },

  // Test file access
  testFileAccess: async (fileUrl) => {
    try {
      console.log('🧪 Testing file access:', fileUrl);
      const response = await fetch(fileUrl, {
        method: 'HEAD',
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('🧪 File access test result:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      return {
        accessible: response.ok,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      console.error('🧪 File access test failed:', error);
      return {
        accessible: false,
        error: error.message
      };
    }
  }
};

// Debug utility to test backend connectivity
export const debugBackendConnection = async () => {
  console.log('🔍 Starting backend connectivity debug...');
  
  const results = {
    apiBaseUrl: API_BASE_URL,
    frontendOrigin: window.location.origin,
    tests: {}
  };
  
  // Test 1: Basic connectivity
  try {
    console.log('🔍 Test 1: Basic connectivity');
    const healthCheck = await apiService.checkHealth();
    results.tests.health = healthCheck;
  } catch (error) {
    results.tests.health = { error: error.message };
  }
  
  // Test 2: CORS preflight
  try {
    console.log('🔍 Test 2: CORS preflight');
    const corsResponse = await fetch(`${API_BASE_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    results.tests.cors = {
      status: corsResponse.status,
      headers: Object.fromEntries(corsResponse.headers.entries())
    };
  } catch (error) {
    results.tests.cors = { error: error.message };
  }
  
  // Test 3: Files endpoint
  try {
    console.log('🔍 Test 3: Files endpoint');
    const filesResponse = await apiService.getFiles({ limit: 1 });
    results.tests.files = {
      success: true,
      totalFiles: filesResponse.total,
      sampleFile: filesResponse.files?.[0] || null
    };
  } catch (error) {
    results.tests.files = { error: error.userMessage || error.message };
  }
  
  console.log('🔍 Debug results:', results);
  return results;
};

// Enhanced file handlers for your components
export const createFileHandlers = (file, apiBaseUrl) => {
  const handleView = async () => {
    try {
      console.log('👁️ Attempting to view file:', file.originalName);
      
      const viewUrl = apiService.getFileViewUrl(file);
      if (!viewUrl) {
        throw new Error('Could not determine file URL');
      }
      
      // Test file accessibility first
      const accessTest = await apiService.testFileAccess(viewUrl);
      if (!accessTest.accessible) {
        throw new Error(`File not accessible (${accessTest.status || 'Network Error'})`);
      }
      
      console.log('👁️ Opening file in new tab:', viewUrl);
      window.open(viewUrl, '_blank');
      
    } catch (error) {
      console.error('❌ View error:', error);
      alert(`Cannot view file: ${error.message}`);
    }
  };

  const handleDownload = async () => {
    try {
      console.log('⬇️ Attempting to download file:', file.originalName);
      
      const downloadUrl = apiService.getFileDownloadUrl(file);
      if (!downloadUrl) {
        throw new Error('Could not determine download URL');
      }
      
      console.log('⬇️ Downloading from:', downloadUrl);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || 'document.pdf';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      alert(`Cannot download file: ${error.message}`);
    }
  };

  return { handleView, handleDownload };
};

export { API_BASE_URL };
export default apiService;
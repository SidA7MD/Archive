// src/config/api.js - Updated for mobile compatibility
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

console.log('API_BASE_URL:', API_BASE_URL);

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Device detection utility
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent) || window.innerWidth < 768;
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  const isChrome = /chrome/.test(userAgent);
  
  return { isIOS, isAndroid, isMobile, isSafari, isChrome };
};

// Add request interceptor for debugging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Enhanced file download function with mobile support
export const downloadFile = async (fileId, originalName) => {
  try {
    console.log('Downloading file:', fileId, 'from:', `${API_BASE_URL}/api/files/${fileId}/download`);
    
    const deviceInfo = getDeviceInfo();
    const downloadUrl = `${API_BASE_URL}/api/files/${fileId}/download`;

    if (deviceInfo.isMobile) {
      // Mobile approach - direct navigation
      console.log('Mobile device detected, using direct navigation');
      window.location.href = downloadUrl;
      return;
    }

    // Desktop approach - fetch and create blob
    const response = await fetch(downloadUrl, {
      method: 'GET',
      credentials: 'omit', // Don't send cookies for file downloads
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log('Download completed successfully');
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download file: ' + error.message);
  }
};

// Enhanced file view function with mobile support
export const viewFile = async (fileId, originalName = 'document.pdf') => {
  try {
    const deviceInfo = getDeviceInfo();
    const fileUrl = `${API_BASE_URL}/api/files/${fileId}/view`;
    
    console.log('Opening file at:', fileUrl);
    console.log('Device info:', deviceInfo);

    if (deviceInfo.isMobile) {
      // Mobile-specific handling
      if (originalName.toLowerCase().endsWith('.pdf')) {
        return await handleMobilePDF(fileId, originalName, fileUrl);
      } else {
        // Non-PDF files on mobile
        window.location.href = fileUrl;
      }
    } else {
      // Desktop - open in new tab
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('View file error:', error);
    alert('Failed to open file: ' + error.message);
  }
};

// Handle PDF viewing on mobile devices
const handleMobilePDF = async (fileId, originalName, fileUrl) => {
  const deviceInfo = getDeviceInfo();
  
  try {
    if (deviceInfo.isIOS && deviceInfo.isSafari) {
      // iOS Safari - fetch and create blob URL
      console.log('iOS Safari detected - using blob URL approach');
      
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Create a temporary link to open the PDF
      const link = document.createElement('a');
      link.href = blobUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up after a delay
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
      
    } else if (deviceInfo.isAndroid) {
      // Android - try direct link first, fallback to download
      console.log('Android device detected');
      
      try {
        // Try opening in new tab
        const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
        
        // If popup blocked or failed, fallback to download
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          console.log('Popup blocked, falling back to download');
          await downloadFile(fileId, originalName);
        }
      } catch (error) {
        console.log('Direct view failed, falling back to download');
        await downloadFile(fileId, originalName);
      }
    } else {
      // Other mobile browsers
      console.log('Other mobile browser detected');
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  } catch (error) {
    console.error('Mobile PDF handling error:', error);
    // Fallback to download
    await downloadFile(fileId, originalName);
  }
};

// Check if PDF.js is available (for future use)
export const isPDFJSAvailable = () => {
  return typeof window !== 'undefined' && window.pdfjsLib;
};

// API functions
export const api = {
  // Fetch semesters
  getSemesters: () => apiClient.get('/api/semesters').then(res => res.data),
  
  // Fetch types by semester
  getTypes: (semesterId) => 
    apiClient.get(`/api/semesters/${semesterId}/types`).then(res => res.data),
  
  // Fetch subjects
  getSubjects: (semesterId, typeId) => 
    apiClient.get(`/api/semesters/${semesterId}/types/${typeId}/subjects`).then(res => res.data),
  
  // Fetch years
  getYears: (semesterId, typeId, subjectId) => 
    apiClient.get(`/api/semesters/${semesterId}/types/${typeId}/subjects/${subjectId}/years`).then(res => res.data),
  
  // Fetch files
  getFiles: (yearId) => 
    apiClient.get(`/api/years/${yearId}/files`).then(res => res.data),
  
  // Upload file
  uploadFile: (formData) => {
    return apiClient.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(res => res.data);
  },
  
  // Download file
  downloadFile: downloadFile,
  
  // View file
  viewFile: viewFile,
  
  // Check file accessibility (for mobile optimization)
  checkFileAccess: async (fileId) => {
    try {
      const response = await apiClient.head(`/api/files/${fileId}/view`);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  },
  
  // Get file info
  getFileInfo: (fileId) => 
    apiClient.get(`/api/files/${fileId}/info`).then(res => res.data),
  
  // Stream file (for mobile)
  getStreamUrl: (fileId) => `${API_BASE_URL}/api/files/${fileId}/stream`
};

export { API_BASE_URL };
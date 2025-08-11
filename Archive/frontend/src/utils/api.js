// src/config/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

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

// File download function
export const downloadFile = async (fileId, originalName) => {
  try {
    console.log('Downloading file:', fileId, 'from:', `${API_BASE_URL}/api/files/${fileId}/download`);
    
    const response = await fetch(`${API_BASE_URL}/api/files/${fileId}/download`, {
      method: 'GET',
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

// File view function (opens in new tab)
export const viewFile = (fileId) => {
  const fileUrl = `${API_BASE_URL}/api/files/${fileId}/view`;
  console.log('Opening file at:', fileUrl);
  window.open(fileUrl, '_blank');
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
  viewFile: viewFile
};

export { API_BASE_URL };
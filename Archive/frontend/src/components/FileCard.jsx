import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, AlertCircle, ExternalLink } from 'lucide-react';

// Enhanced API Configuration for production deployment
const API_CONFIG = {
  getBaseURL: () => {
    if (typeof window === 'undefined') return '';
    
    // For development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Environment variable (highest priority)
    const envApiUrl = import.meta.env?.VITE_BACKEND_URL || 
                     import.meta.env?.REACT_APP_BACKEND_URL ||
                     import.meta.env?.VITE_API_URL;
    if (envApiUrl) {
      return envApiUrl;
    }
    
    // Production fallback - your actual backend URL
    return 'https://archive-mi73.onrender.com';
  },
  
  getURL: (path) => {
    const baseURL = API_CONFIG.getBaseURL();
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${baseURL}${cleanPath}`;
  },

  // Enhanced connection test with better error handling
  testConnection: async () => {
    try {
      const baseURL = API_CONFIG.getBaseURL();
      console.log('Testing API connection to:', baseURL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${baseURL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors'
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.warn(`API health check returned ${response.status}: ${response.statusText}`);
        return false;
      }
      
      const data = await response.json();
      console.log('API Health Check Success:', data.status);
      return data.status === 'OK';
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
};

// Enhanced FileCard with better error recovery
export const FileCard = ({ file, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Enhanced URL generation with multiple fallbacks
  const getFileURL = (type = 'view') => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    
    if (file._id) {
      return `${baseUrl}/api/files/${file._id}/${type}`;
    }
    
    // Fallback to provided URLs
    if (type === 'view' && file.viewUrl) return file.viewUrl;
    if (type === 'download' && file.downloadUrl) return file.downloadUrl;
    
    return null;
  };

  // Enhanced view handler with better error recovery
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const viewUrl = getFileURL('view');
      if (!viewUrl) {
        throw new Error('URL de visualisation non disponible');
      }

      console.log('Opening PDF:', viewUrl);

      // Test accessibility first
      try {
        const testResponse = await fetch(viewUrl, {
          method: 'HEAD',
          mode: 'cors',
          signal: AbortSignal.timeout(5000)
        });
        
        if (!testResponse.ok) {
          throw new Error(`Serveur inaccessible (${testResponse.status})`);
        }
      } catch (testError) {
        console.warn('HEAD test failed, proceeding with direct open:', testError.message);
        // Continue anyway - some servers don't support HEAD
      }

      // Open in new tab/window
      const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        // Popup blocked - use fallback
        const link = document.createElement('a');
        link.href = viewUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setDebugInfo({
        viewUrl,
        method: 'Direct browser open',
        timestamp: new Date().toISOString(),
        fileId: file._id
      });
      
    } catch (err) {
      console.error('View error:', err);
      setError(`Erreur: ${err.message}`);
      
      setDebugInfo({
        error: err.message,
        suggestion: 'Essayez de télécharger le fichier directement',
        viewUrl: getFileURL('view'),
        downloadUrl: getFileURL('download')
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download handler
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const downloadUrl = getFileURL('download');
      if (!downloadUrl) {
        throw new Error('URL de téléchargement non disponible');
      }

      console.log('Starting download:', downloadUrl);

      // Try fetch approach first
      try {
        const response = await fetch(downloadUrl, {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(30000) // 30 second timeout
        });

        if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        
      } catch (fetchError) {
        // Fallback to direct download
        console.warn('Fetch failed, using direct method:', fetchError.message);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = file.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      setDebugInfo({
        downloadUrl,
        method: 'Direct download',
        timestamp: new Date().toISOString(),
        fileId: file._id
      });
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Téléchargement impossible: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTheme = (fileName) => {
    const fileThemes = [
      { 
        gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b7a 40%, #ff3838 100%)',
        color: '#ff4757',
        shadow: 'rgba(255, 71, 87, 0.4)',
      },
      { 
        gradient: 'linear-gradient(135deg, #5352ed 0%, #706fd3 40%, #40407a 100%)',
        color: '#5352ed',
        shadow: 'rgba(83, 82, 237, 0.4)',
      },
      { 
        gradient: 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 40%, #2f3542 100%)',
        color: '#00d2d3',
        shadow: 'rgba(0, 210, 211, 0.4)',
      }
    ];
    
    let hash = 0;
    for (let i = 0; i < fileName.length; i++) {
      const char = fileName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return fileThemes[Math.abs(hash) % fileThemes.length];
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const iconProps = { size: 48, strokeWidth: 1.5 };
    
    switch (extension) {
      case 'pdf':
        return <FileText {...iconProps} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <Image {...iconProps} />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music {...iconProps} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return <Video {...iconProps} />;
      case 'zip':
      case 'rar':
      case '7z':
        return <Archive {...iconProps} />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'py':
        return <Code {...iconProps} />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <FileSpreadsheet {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };

  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.pdf');

  const containerStyles = {
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: `0 8px 32px ${theme.shadow}`,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
  };

  const headerStyles = {
    background: theme.gradient,
    borderRadius: '12px',
    padding: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
    color: 'white',
    minHeight: '80px',
  };

  const titleStyles = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
    lineHeight: '1.4',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  };

  const errorStyles = {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#dc2626',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const debugStyles = {
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#1d4ed8',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.625rem',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
  };

  const buttonsContainerStyles = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
  };

  const buttonBaseStyles = {
    flex: 1,
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '500',
    fontSize: '0.875rem',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    opacity: loading ? 0.6 : 1,
  };

  const viewButtonStyles = {
    ...buttonBaseStyles,
    background: theme.gradient,
    color: 'white',
  };

  const downloadButtonStyles = {
    ...buttonBaseStyles,
    background: 'rgba(0,0,0,0.05)',
    color: '#374151',
    border: '1px solid rgba(0,0,0,0.1)',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        {fileIcon}
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={titleStyles}>
          {file.originalName || 'Document sans nom'}
        </h3>
        
        <div style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280', 
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>📊</span>
          {formatFileSize(file.fileSize || 0)}
        </div>

        {/* Debug information for development */}
        {(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && debugInfo && (
          <div style={debugStyles}>
            <div><strong>Debug Info:</strong></div>
            {debugInfo.viewUrl && <div>View URL: {debugInfo.viewUrl}</div>}
            {debugInfo.downloadUrl && <div>Download URL: {debugInfo.downloadUrl}</div>}
            {debugInfo.method && <div>Method: {debugInfo.method}</div>}
            {debugInfo.error && <div>Error: {debugInfo.error}</div>}
            {debugInfo.suggestion && <div>Suggestion: {debugInfo.suggestion}</div>}
          </div>
        )}

        {error && (
          <div style={errorStyles}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div style={buttonsContainerStyles}>
          <button
            style={viewButtonStyles}
            onClick={handleView}
            disabled={loading}
            title={`Visualiser ${file.originalName} dans un nouvel onglet`}
          >
            <Eye size={18} />
            {loading ? 'Ouverture...' : 'Visualiser'}
          </button>
          
          <button
            style={downloadButtonStyles}
            onClick={handleDownload}
            disabled={loading}
            title={`Télécharger ${file.originalName}`}
          >
            <Download size={18} />
            {loading ? 'Téléchargement...' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Export the API_CONFIG for use in other components
export { API_CONFIG };

// Optional: Default export for convenience
export default FileCard;
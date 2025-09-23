import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, AlertCircle, ExternalLink } from 'lucide-react';

// Enhanced API Configuration with better deployment support
const API_CONFIG = {
  getBaseURL: () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return '';
    
    // For localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production - Priority order for deployment detection
    // 1. Environment variable (most reliable)
    const envApiUrl = import.meta.env?.VITE_BACKEND_URL || import.meta.env?.REACT_APP_BACKEND_URL;
    if (envApiUrl) {
      return envApiUrl;
    }
    
    // 2. Try to detect common deployment patterns
    const hostname = window.location.hostname;
    
    // Render.com deployment
    if (hostname.includes('onrender.com') || hostname.includes('.render.com')) {
      return `https://${hostname.replace(/^.*?\./, 'archive-mi73.')}`; // Assumes your service name
    }
    
    // Vercel deployment
    if (hostname.includes('vercel.app')) {
      return 'https://archive-mi73.onrender.com'; // Your backend URL
    }
    
    // Netlify deployment
    if (hostname.includes('netlify.app')) {
      return 'https://archive-mi73.onrender.com'; // Your backend URL
    }
    
    // 3. Fallback to your known production API URL
    return 'https://archive-mi73.onrender.com';
  },
  
  getURL: (path) => {
    const baseURL = API_CONFIG.getBaseURL();
    if (!baseURL) return path;
    
    // Ensure path starts with /
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
        // Remove credentials for cross-origin health checks
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

// Enhanced FileCard with better error handling and deployment fixes
export const FileCard = ({ file, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced URL generation with better fallbacks
  const getFileURL = (type = 'view') => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    
    // Priority order for different URL types
    if (type === 'view') {
      // For viewing PDFs - prioritize direct API endpoints
      if (file._id) {
        return `${baseUrl}/api/files/${file._id}/view`;
      }
      // Fallback to provided URLs
      if (file.viewUrl && file.viewUrl.startsWith('http')) {
        return file.viewUrl;
      }
      if (file.directUrl && file.directUrl.startsWith('http')) {
        return file.directUrl;
      }
    } else if (type === 'download') {
      // For downloading files
      if (file._id) {
        return `${baseUrl}/api/files/${file._id}/download`;
      }
      if (file.downloadUrl && file.downloadUrl.startsWith('http')) {
        return file.downloadUrl;
      }
    }
    
    return null;
  };

  // Enhanced view handler with better error detection and fallbacks
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const viewUrl = getFileURL('view');
      
      if (!viewUrl) {
        throw new Error('URL de visualisation non disponible');
      }

      console.log('Attempting to view PDF:', viewUrl);

      // Test if the URL is accessible before opening
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const testResponse = await fetch(viewUrl, {
          method: 'HEAD', // Use HEAD to check if resource exists without downloading
          signal: controller.signal,
          mode: 'cors'
        });
        
        clearTimeout(timeoutId);

        if (!testResponse.ok) {
          throw new Error(`Fichier non accessible (HTTP ${testResponse.status})`);
        }

        console.log('PDF accessibility test passed');
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        console.warn('HEAD request failed, trying direct open:', fetchError.message);
        // Continue with direct open - some servers don't support HEAD requests
      }

      setDebugInfo({
        viewUrl,
        method: 'Direct browser open (tested)',
        timestamp: new Date().toISOString(),
        fileId: file._id
      });

      // Try to open in new window/tab
      const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
      
      if (!newWindow) {
        console.log('Popup blocked, using fallback method');
        // Fallback: create a temporary link and click it
        const link = document.createElement('a');
        link.href = viewUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Check if the window opened successfully
        setTimeout(() => {
          try {
            if (newWindow.closed) {
              console.log('Window was closed immediately - might indicate an error');
            }
          } catch (e) {
            // Cross-origin access error is expected and fine
          }
        }, 1000);
      }
      
    } catch (err) {
      console.error('Error viewing file:', err);
      setError(`Erreur lors de la visualisation: ${err.message}`);
      
      // Offer alternative: direct download
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

      // For downloads, we can try a more robust approach
      try {
        // Method 1: Try fetch with blob for better control
        const response = await fetch(downloadUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit' // Don't send credentials for file downloads
        });

        if (!response.ok) {
          throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName || 'document.pdf';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        
        console.log('Download completed successfully');
        
      } catch (fetchError) {
        console.warn('Fetch download failed, trying direct method:', fetchError.message);
        
        // Method 2: Fallback to direct window.open
        const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.download = file.originalName || 'document.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Erreur lors du téléchargement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get theme and icon (keeping your existing logic)
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
      case 'doc':
      case 'docx':
      case 'txt':
        return <FileText {...iconProps} />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
      case 'webp':
        return <Image {...iconProps} />;
      case 'mp3':
      case 'wav':
      case 'flac':
      case 'ogg':
        return <Music {...iconProps} />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
      case 'webm':
        return <Video {...iconProps} />;
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
        return <Archive {...iconProps} />;
      case 'js':
      case 'jsx':
      case 'ts':
      case 'tsx':
      case 'html':
      case 'css':
      case 'py':
      case 'java':
      case 'cpp':
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
  const fileIcon = getFileIcon(file.originalName || 'file.txt');

  // Styles
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

  const sizeStyles = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
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

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        {fileIcon}
      </div>

      <div style={{ flex: 1 }}>
        <h3 style={titleStyles}>
          {file.originalName || 'Document sans nom'}
        </h3>
        
        <div style={sizeStyles}>
          <span>📊</span>
          {formatFileSize(file.fileSize || 0)}
        </div>

        {/* Development debug info */}
        {(process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost') && debugInfo && (
          <div style={debugStyles}>
            <div>URL: {debugInfo.viewUrl}</div>
            <div>Method: {debugInfo.method}</div>
            {debugInfo.error && <div>Error: {debugInfo.error}</div>}
            {debugInfo.suggestion && <div>Tip: {debugInfo.suggestion}</div>}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div style={errorStyles}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Action buttons */}
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
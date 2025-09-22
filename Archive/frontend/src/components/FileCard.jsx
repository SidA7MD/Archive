import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

// Enhanced API Configuration with better production handling
const API_CONFIG = {
  getBaseURL: () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return '';
    
    // For localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production - try environment variables first
    const envApiUrl = process.env.REACT_APP_API_URL || 
                      process.env.VITE_BACKEND_URL || 
                      process.env.NEXT_PUBLIC_API_URL;
    
    if (envApiUrl) {
      return envApiUrl.replace(/\/$/, ''); // Remove trailing slash
    }
    
    // Fallback to your production API URL
    return 'https://archive-mi73.onrender.com';
  },
  
  getURL: (path) => {
    const baseURL = API_CONFIG.getBaseURL();
    if (!baseURL) return path;
    
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${baseURL}${cleanPath}`;
  },

  // Test if the API is accessible
  testConnection: async () => {
    try {
      const baseURL = API_CONFIG.getBaseURL();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(`${baseURL}/api/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  },

  // Test if a specific file URL is accessible
  testFileURL: async (url) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(url, {
        method: 'HEAD',
        credentials: 'include',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return {
        accessible: response.ok,
        status: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      };
    } catch (error) {
      console.error('File URL test failed:', error);
      return {
        accessible: false,
        error: error.message
      };
    }
  }
};

// Color schemes for different file types/states
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
  },
  { 
    gradient: 'linear-gradient(135deg, #5f27cd 0%, #a55eea 40%, #341f97 100%)',
    color: '#5f27cd',
    shadow: 'rgba(95, 39, 205, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #00d8d6 0%, #01a3a4 40%, #0abde3 100%)',
    color: '#00d8d6',
    shadow: 'rgba(0, 216, 214, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 40%, #48dbfb 100%)',
    color: '#feca57',
    shadow: 'rgba(254, 202, 87, 0.4)',
  }
];

// Enhanced responsive breakpoints hook
const useBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 375) setBreakpoint('mobile-small');
      else if (width < 480) setBreakpoint('mobile');
      else if (width < 640) setBreakpoint('mobile-large');
      else if (width < 768) setBreakpoint('tablet');
      else if (width < 1024) setBreakpoint('desktop-small');
      else setBreakpoint('desktop');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return breakpoint;
};

// Get meaningful icon based on file extension
const getFileIcon = (fileName, breakpoint) => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  const iconSizes = {
    'mobile-small': 36,
    'mobile': 40,
    'mobile-large': 44,
    'tablet': 56,
    'desktop-small': 60,
    'desktop': 72
  };
  
  const iconSize = iconSizes[breakpoint] || 48;
  const iconProps = { size: iconSize, strokeWidth: 1.5 };
  
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

// Get theme based on file name hash for consistency
const getFileTheme = (fileName) => {
  let hash = 0;
  for (let i = 0; i < fileName.length; i++) {
    const char = fileName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return fileThemes[Math.abs(hash) % fileThemes.length];
};

// Enhanced FileCard with improved PDF handling
export const FileCard = ({ file, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt', breakpoint);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [urlTest, setUrlTest] = useState(null);
  const [testingUrl, setTestingUrl] = useState(false);
  
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Generate multiple URL options with proper fallback
  const getFileURLs = () => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    const urls = {};

    // Direct static file serving (primary method for your server)
    if (file.fileName) {
      urls.direct = `${baseUrl}/uploads/${file.fileName}`;
    }

    // API endpoints
    if (file._id) {
      urls.apiView = `${baseUrl}/api/files/${file._id}/view`;
      urls.apiDownload = `${baseUrl}/api/files/${file._id}/download`;
    }

    // From file object URLs (if they exist and are absolute)
    if (file.viewUrl && file.viewUrl.startsWith('http')) {
      urls.fileView = file.viewUrl;
    }
    if (file.downloadUrl && file.downloadUrl.startsWith('http')) {
      urls.fileDownload = file.downloadUrl;
    }
    if (file.directUrl && file.directUrl.startsWith('http')) {
      urls.fileDirect = file.directUrl;
    }

    return urls;
  };

  // Test URL accessibility
  const testURL = async (url) => {
    setTestingUrl(true);
    try {
      const result = await API_CONFIG.testFileURL(url);
      setUrlTest({ url, ...result });
      return result.accessible;
    } catch (error) {
      setUrlTest({ url, accessible: false, error: error.message });
      return false;
    } finally {
      setTestingUrl(false);
    }
  };

  // Enhanced view handler with comprehensive fallback
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const urls = getFileURLs();
      console.log('Available URLs for viewing:', urls);

      // Priority order for viewing PDFs
      const urlPriority = [
        urls.direct,        // Direct static file access (should work with your server)
        urls.fileDirect,    // File object direct URL
        urls.fileView,      // File object view URL
        urls.apiView        // API view endpoint
      ].filter(Boolean); // Remove undefined/null URLs

      if (urlPriority.length === 0) {
        throw new Error('Aucune URL disponible pour visualiser ce fichier');
      }

      let successfulUrl = null;
      let lastError = null;

      // Try each URL in priority order
      for (const url of urlPriority) {
        console.log(`Trying to view file at: ${url}`);
        
        try {
          // For the direct static file URL, we'll test it first
          if (url === urls.direct) {
            const testResult = await testURL(url);
            if (!testResult) {
              console.warn(`URL test failed for ${url}, trying next URL`);
              continue;
            }
          }

          // Try to open the URL
          const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
          
          if (newWindow) {
            successfulUrl = url;
            console.log(`Successfully opened PDF at: ${url}`);
            break;
          } else {
            // Popup blocked, try alternative method
            const link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            successfulUrl = url;
            break;
          }
        } catch (err) {
          console.warn(`Failed to open ${url}:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!successfulUrl) {
        throw new Error(`Impossible d'ouvrir le fichier. Dernière erreur: ${lastError?.message || 'URLs non accessibles'}`);
      }
      
    } catch (err) {
      console.error('Error viewing file:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download handler with fallback
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const urls = getFileURLs();
      console.log('Available URLs for download:', urls);

      // Priority order for downloading
      const downloadPriority = [
        urls.apiDownload,   // API download endpoint (sets proper headers)
        urls.fileDownload,  // File object download URL
        urls.direct,        // Direct static file access
        urls.fileDirect     // File object direct URL
      ].filter(Boolean);

      if (downloadPriority.length === 0) {
        throw new Error('Aucune URL disponible pour télécharger ce fichier');
      }

      let success = false;
      let lastError = null;

      for (const url of downloadPriority) {
        try {
          console.log(`Attempting download from: ${url}`);
          
          // Create download link
          const link = document.createElement('a');
          link.href = url;
          link.download = file.originalName || 'document.pdf';
          link.style.display = 'none';
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          success = true;
          console.log(`Download initiated from: ${url}`);
          break;
        } catch (err) {
          console.warn(`Download failed from ${url}:`, err.message);
          lastError = err;
          continue;
        }
      }

      if (!success) {
        throw new Error(`Impossible de télécharger le fichier. Dernière erreur: ${lastError?.message || 'URLs non accessibles'}`);
      }
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Styles
  const containerStyles = {
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: `0 8px 32px ${theme.shadow}`,
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '240px',
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
    fontSize: isMobile ? '0.875rem' : '1rem',
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

  const metaStyles = {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  };

  const buttonsContainerStyles = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
    paddingTop: '1rem',
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

  const testButtonStyles = {
    ...buttonBaseStyles,
    background: 'rgba(59, 130, 246, 0.1)',
    color: '#1d4ed8',
    border: '1px solid rgba(59, 130, 246, 0.2)',
    flex: 'none',
    padding: '0.25rem 0.5rem',
    fontSize: '0.75rem',
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

  const urlTestStyles = {
    background: urlTest?.accessible ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
    color: urlTest?.accessible ? '#059669' : '#dc2626',
    padding: '0.5rem',
    borderRadius: '6px',
    fontSize: '0.625rem',
    marginBottom: '0.5rem',
    fontFamily: 'monospace',
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
        
        <div style={metaStyles}>
          📊 {formatFileSize(file.fileSize || 0)}
        </div>

        {file.semester && (
          <div style={metaStyles}>
            📚 {file.semester.displayName} - {file.type?.displayName} - {file.subject?.name}
          </div>
        )}

        {file.year && (
          <div style={metaStyles}>
            📅 {file.year.year}
          </div>
        )}

        {/* URL Test Results */}
        {urlTest && (
          <div style={urlTestStyles}>
            <div>Test URL: {urlTest.accessible ? '✅ Accessible' : '❌ Non accessible'}</div>
            {urlTest.contentType && <div>Type: {urlTest.contentType}</div>}
            {urlTest.error && <div>Erreur: {urlTest.error}</div>}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div style={errorStyles}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && (
          <div style={debugStyles}>
            <div>Base URL: {API_CONFIG.getBaseURL()}</div>
            <div>File Name: {file.fileName}</div>
            <div>File ID: {file._id}</div>
            <div>Available URLs: {Object.keys(getFileURLs()).length}</div>
          </div>
        )}

        {/* Action buttons */}
        <div>
          {/* Test URL button (development) */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginBottom: '0.5rem' }}>
              <button
                style={testButtonStyles}
                onClick={() => {
                  const urls = getFileURLs();
                  if (urls.direct) {
                    testURL(urls.direct);
                  }
                }}
                disabled={testingUrl}
              >
                {testingUrl ? <RefreshCw size={14} className="animate-spin" /> : <ExternalLink size={14} />}
                {testingUrl ? 'Test...' : 'Tester URL'}
              </button>
            </div>
          )}
          
          <div style={buttonsContainerStyles}>
            <button
              style={viewButtonStyles}
              onClick={handleView}
              disabled={loading}
            >
              <Eye size={isMobile ? 16 : 18} />
              {loading ? 'Ouverture...' : 'Visualiser'}
            </button>
            
            <button
              style={downloadButtonStyles}
              onClick={handleDownload}
              disabled={loading}
            >
              <Download size={isMobile ? 16 : 18} />
              {loading ? 'Téléchargement...' : 'Télécharger'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Files Page Component
export const FilesPage = ({ files = [], loading = false, error = null, onRetry, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  const [apiStatus, setApiStatus] = useState('checking');
  const [connectionDetails, setConnectionDetails] = useState(null);

  useEffect(() => {
    // Test API connection on mount
    const testAPI = async () => {
      try {
        const baseURL = API_CONFIG.getBaseURL();
        const startTime = Date.now();
        
        const isConnected = await API_CONFIG.testConnection();
        const responseTime = Date.now() - startTime;
        
        setApiStatus(isConnected ? 'connected' : 'disconnected');
        setConnectionDetails({
          baseURL,
          responseTime,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('API test failed:', error);
        setApiStatus('error');
        setConnectionDetails({
          baseURL: API_CONFIG.getBaseURL(),
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };

    testAPI();
  }, []);

  const containerStyles = {
    padding: '1rem',
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const gridStyles = {
    display: 'grid',
    gridTemplateColumns: isMobile 
      ? '1fr' 
      : 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.5rem',
    marginTop: '1rem',
  };

  const loadingStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#6b7280',
  };

  const spinnerStyles = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  };

  const errorStateStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    background: 'rgba(239, 68, 68, 0.05)',
    borderRadius: '12px',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  };

  const emptyStateStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
    color: '#6b7280',
    background: 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  };

  const statusBadgeStyles = {
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '500',
    marginBottom: '1rem',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const getStatusBadgeStyles = () => {
    switch (apiStatus) {
      case 'connected':
        return {
          ...statusBadgeStyles,
          background: 'rgba(34, 197, 94, 0.1)',
          color: '#059669',
        };
      case 'disconnected':
      case 'error':
        return {
          ...statusBadgeStyles,
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#dc2626',
        };
      default:
        return {
          ...statusBadgeStyles,
          background: 'rgba(156, 163, 175, 0.1)',
          color: '#6b7280',
        };
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected':
        return `✅ API Connectée (${connectionDetails?.responseTime}ms)`;
      case 'disconnected':
        return '⚠️ API Déconnectée';
      case 'error':
        return '❌ Erreur API';
      default:
        return '🔄 Test API...';
    }
  };

  if (loading) {
    return (
      <div style={containerStyles}>
        <div style={loadingStyles}>
          <div style={spinnerStyles}></div>
          <div>Chargement des fichiers...</div>
          {connectionDetails && (
            <div style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              Connexion à {connectionDetails.baseURL}
            </div>
          )}
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyles}>
        <div style={errorStateStyles}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ marginBottom: '1rem', textAlign: 'center', color: '#dc2626' }}>
            {error}
          </div>
          <div style={getStatusBadgeStyles()}>
            {getStatusText()}
          </div>
          {connectionDetails && (
            <div style={{
              background: 'rgba(0,0,0,0.05)',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              marginBottom: '1rem',
              wordBreak: 'break-all'
            }}>
              <div>URL: {connectionDetails.baseURL}</div>
              {connectionDetails.error && <div>Erreur: {connectionDetails.error}</div>}
            </div>
          )}
          {onRetry && (
            <button 
              onClick={onRetry}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'background 0.2s ease',
              }}
              onMouseOver={(e) => e.target.style.background = '#2563eb'}
              onMouseOut={(e) => e.target.style.background = '#3b82f6'}
            >
              Réessayer
            </button>
          )}
        </div>
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div style={containerStyles}>
        <div style={emptyStateStyles}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <div>Aucun fichier disponible</div>
          <div style={getStatusBadgeStyles()}>
            {getStatusText()}
          </div>
          {connectionDetails && (
            <div style={{
              background: 'rgba(0,0,0,0.05)',
              padding: '0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              marginTop: '1rem',
              wordBreak: 'break-all'
            }}>
              API: {connectionDetails.baseURL}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyles}>
      {/* API Status indicator */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
        <div style={getStatusBadgeStyles()}>
          {getStatusText()}
        </div>
      </div>

      {/* Connection details in development */}
      {process.env.NODE_ENV === 'development' && connectionDetails && (
        <div style={{
          background: 'rgba(0,0,0,0.05)',
          padding: '1rem',
          borderRadius: '8px',
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          marginBottom: '1rem',
          wordBreak: 'break-all'
        }}>
          <div><strong>Debug Info:</strong></div>
          <div>Base URL: {connectionDetails.baseURL}</div>
          <div>Response Time: {connectionDetails.responseTime}ms</div>
          <div>Timestamp: {connectionDetails.timestamp}</div>
          {connectionDetails.error && <div>Error: {connectionDetails.error}</div>}
        </div>
      )}

      <div style={gridStyles}>
        {files.map(file => (
          <FileCard key={file._id} file={file} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Demo component with production-ready configuration and real API testing
const ProductionPDFDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiBaseUrl, setApiBaseUrl] = useState('');

  // Initialize API base URL
  useEffect(() => {
    const baseUrl = API_CONFIG.getBaseURL();
    setApiBaseUrl(baseUrl);
    console.log('Initialized with API base URL:', baseUrl);
  }, []);

  // Fetch files from actual API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const baseUrl = API_CONFIG.getBaseURL();
      console.log('Fetching files from:', `${baseUrl}/api/files`);
      
      // Test API connection first
      const isConnected = await API_CONFIG.testConnection();
      if (!isConnected) {
        throw new Error('Le serveur API n\'est pas accessible. Vérifiez que le serveur est en ligne.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(`${baseUrl}/api/files?limit=20`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur serveur (${response.status}): ${errorText || response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.files && Array.isArray(data.files)) {
        setCurrentFiles(data.files);
        console.log(`Loaded ${data.files.length} files from API`);
      } else {
        console.warn('Unexpected API response format:', data);
        setCurrentFiles([]);
      }
      
    } catch (err) {
      console.error('Error fetching files:', err);
      let errorMessage = 'Erreur lors du chargement des fichiers';
      
      if (err.name === 'AbortError') {
        errorMessage = 'Délai d\'attente dépassé. Le serveur met trop de temps à répondre.';
      } else if (err.message.includes('fetch')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      // Fallback to sample data for demo purposes
      setCurrentFiles(getSampleFiles());
    } finally {
      setLoading(false);
    }
  };

  // Sample files that match your actual API structure
  const getSampleFiles = () => [
    {
      _id: "675b4903c49b87ce3ab38db3",
      originalName: "Cours_Algebre_Lineaire.pdf",
      fileName: "1755007235029-cours-algebre.pdf",
      filePath: "/uploads/1755007235029-cours-algebre.pdf",
      fileSize: 2847592,
      mimeType: "application/pdf",
      storageProvider: "local",
      uploadedAt: "2024-12-12T14:00:35.779Z",
      viewUrl: `${API_CONFIG.getBaseURL()}/uploads/1755007235029-cours-algebre.pdf`,
      downloadUrl: `${API_CONFIG.getBaseURL()}/api/files/675b4903c49b87ce3ab38db3/download`,
      directUrl: `${API_CONFIG.getBaseURL()}/uploads/1755007235029-cours-algebre.pdf`,
      fileType: "pdf",
      semester: {
        _id: "6898bf64e823136d8dc4c573",
        name: "S1",
        displayName: "Semestre 1"
      },
      type: {
        _id: "689a5bb76f501aa7a841f638",
        name: "cours",
        displayName: "Cours"
      },
      subject: {
        _id: "689a5bb76f501aa7a841f63b",
        name: "Algebre Lineaire"
      },
      year: {
        _id: "689a5bb86f501aa7a841f63e",
        year: 2024
      }
    },
    {
      _id: "675b4903c49b87ce3ab38db4",
      originalName: "TD_Analyse_Mathematique.pdf",
      fileName: "1755007235030-td-analyse.pdf",
      filePath: "/uploads/1755007235030-td-analyse.pdf",
      fileSize: 1256789,
      mimeType: "application/pdf",
      storageProvider: "local",
      uploadedAt: "2024-12-12T15:30:20.123Z",
      viewUrl: `${API_CONFIG.getBaseURL()}/uploads/1755007235030-td-analyse.pdf`,
      downloadUrl: `${API_CONFIG.getBaseURL()}/api/files/675b4903c49b87ce3ab38db4/download`,
      directUrl: `${API_CONFIG.getBaseURL()}/uploads/1755007235030-td-analyse.pdf`,
      fileType: "pdf",
      semester: {
        _id: "6898bf64e823136d8dc4c574",
        name: "S2",
        displayName: "Semestre 2"
      },
      type: {
        _id: "689a5bb76f501aa7a841f639",
        name: "td",
        displayName: "Travaux Dirigés"
      },
      subject: {
        _id: "689a5bb76f501aa7a841f63c",
        name: "Analyse Mathematique"
      },
      year: {
        _id: "689a5bb86f501aa7a841f63f",
        year: 2024
      }
    },
    {
      _id: "675b4903c49b87ce3ab38db5",
      originalName: "Examen_Physique_2023.pdf",
      fileName: "1755007235031-examen-physique.pdf",
      filePath: "/uploads/1755007235031-examen-physique.pdf",
      fileSize: 892456,
      mimeType: "application/pdf",
      storageProvider: "local",
      uploadedAt: "2024-12-11T09:15:45.567Z",
      viewUrl: `${API_CONFIG.getBaseURL()}/uploads/1755007235031-examen-physique.pdf`,
      downloadUrl: `${API_CONFIG.getBaseURL()}/api/files/675b4903c49b87ce3ab38db5/download`,
      directUrl: `${API_CONFIG.getBaseURL()}/uploads/1755007235031-examen-physique.pdf`,
      fileType: "pdf",
      semester: {
        _id: "6898bf64e823136d8dc4c575",
        name: "S3",
        displayName: "Semestre 3"
      },
      type: {
        _id: "689a5bb76f501aa7a841f640",
        name: "compositions",
        displayName: "Compositions"
      },
      subject: {
        _id: "689a5bb76f501aa7a841f63d",
        name: "Physique"
      },
      year: {
        _id: "689a5bb86f501aa7a841f640",
        year: 2023
      }
    }
  ];

  // Fetch files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const handleRetry = () => {
    fetchFiles();
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          padding: '2rem',
          color: 'white',
          textAlign: 'center'
        }}>
          <h1 style={{ margin: 0, fontSize: '2rem', marginBottom: '0.5rem' }}>
            Archive Universitaire
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
            Système de gestion de fichiers avec stockage local - Version Production
          </p>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            marginTop: '1rem',
            display: 'inline-block',
            fontSize: '0.875rem',
            wordBreak: 'break-all'
          }}>
            API: {apiBaseUrl}
          </div>
        </div>
        
        <FilesPage 
          files={currentFiles} 
          loading={loading} 
          error={error}
          onRetry={handleRetry}
          apiBaseUrl={apiBaseUrl}
        />
      </div>
    </div>
  );
};

export default ProductionPDFDemo;
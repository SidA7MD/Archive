import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, AlertCircle } from 'lucide-react';

// Enhanced API Configuration for production
const API_CONFIG = {
  getBaseURL: () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return '';
    
    // For localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production - try environment variable first, then use your production API URL
    const envApiUrl = import.meta.env?.VITE_BACKEND_URL;
    
    if (envApiUrl) {
      return envApiUrl;
    }
    
    // Fallback to your known production API URL
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
      const response = await fetch(`${baseURL}/api/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
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
  const [debugInfo, setDebugInfo] = useState(null);
  
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced URL generation with fallbacks
  const getFileURL = (type = 'view') => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    
    // Priority order for different URL types:
    if (type === 'view') {
      // For viewing PDFs in browser
      if (file.viewUrl && file.viewUrl.startsWith('http')) {
        return file.viewUrl;
      }
      if (file.directUrl && file.directUrl.startsWith('http')) {
        return file.directUrl;
      }
      if (file.fileName) {
        return `${baseUrl}/uploads/${file.fileName}`;
      }
      if (file._id) {
        return `${baseUrl}/api/files/${file._id}/view`;
      }
      if (file.filePath) {
        const prefixed = file.filePath.startsWith('/') ? file.filePath : `/${file.filePath}`;
        return prefixed.startsWith('http') ? prefixed : `${baseUrl}${prefixed}`;
      }
    } else if (type === 'download') {
      // For downloading files
      if (file.downloadUrl && file.downloadUrl.startsWith('http')) {
        return file.downloadUrl;
      }
      if (file._id) {
        return `${baseUrl}/api/files/${file._id}/download`;
      }
      if (file.fileName) {
        return `${baseUrl}/uploads/${file.fileName}`;
      }
    }
    
    return null;
  };

  // Simplified view handler: open directly to avoid CORS preflight issues
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const viewUrl = getFileURL('view');
      
      if (!viewUrl) {
        throw new Error('Aucune URL de visualisation disponible');
      }

      setDebugInfo({
        viewUrl,
        method: 'Direct browser open',
        timestamp: new Date().toISOString()
      });

      const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        const link = document.createElement('a');
        link.href = viewUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (err) {
      console.error('❌ Error viewing file:', err);
      setError(`Erreur lors de la visualisation: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Simplified download handler: open download URL directly
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const downloadUrl = getFileURL('download');
      
      if (!downloadUrl) {
        throw new Error('Aucune URL de téléchargement disponible');
      }

      const newWindow = window.open(downloadUrl, '_blank', 'noopener,noreferrer');
      if (!newWindow) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (err) {
      console.error('❌ Error downloading file:', err);
      setError(`Erreur lors du téléchargement: ${err.message}`);
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
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div style={debugStyles}>
            <div>URL: {debugInfo.viewUrl}</div>
            <div>Method: {debugInfo.method}</div>
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
  );
};

// Enhanced Files Page Component
export const FilesPage = ({ files = [], loading = false, error = null, onRetry, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    // Test API connection on mount
    const testAPI = async () => {
      try {
        const isConnected = await API_CONFIG.testConnection();
        setApiStatus(isConnected ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('API test failed:', error);
        setApiStatus('error');
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
      : 'repeat(auto-fill, minmax(300px, 1fr))',
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
        return '✅ API Connectée';
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

// Demo component with production-ready PDF files
const ProductionPDFDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Updated sample files based on your actual API response
  const sampleProductionFiles = [
    {
      _id: "689b4903c49b87ce3ab38db3",
      originalName: "TP1-.pdf",
      fileName: "1755007235029-854920657.pdf",
      filePath: "uploads/1755007235029-854920657.pdf",
      fileSize: 93110,
      mimeType: "application/pdf",
      storageProvider: "local",
      uploadedAt: "2025-08-12T14:00:35.779Z",
      viewUrl: "https://archive-mi73.onrender.com/uploads/1755007235029-854920657.pdf",
      downloadUrl: "https://archive-mi73.onrender.com/api/files/689b4903c49b87ce3ab38db3/download",
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
        name: "Algebre"
      },
      year: {
        _id: "689a5bb86f501aa7a841f63e",
        year: "2021"
      }
    },
    {
      _id: "689b4903c49b87ce3ab38db4",
      originalName: "Arithmetique dans Z.pdf",
      fileName: "1755007235030-854920658.pdf",
      filePath: "uploads/1755007235030-854920658.pdf",
      fileSize: 104920,
      mimeType: "application/pdf",
      storageProvider: "local",
      uploadedAt: "2025-08-12T15:30:20.123Z",
      viewUrl: "https://archive-mi73.onrender.com/uploads/1755007235030-854920658.pdf",
      downloadUrl: "https://archive-mi73.onrender.com/api/files/689b4903c49b87ce3ab38db4/download",
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
        name: "Mathematiques"
      },
      year: {
        _id: "689a5bb86f501aa7a841f63e",
        year: "2021"
      }
    }
  ];

  // Simulate API loading
  useEffect(() => {
    const timer = setTimeout(() => {
      // Simulate occasional API errors for testing
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        setCurrentFiles(sampleProductionFiles);
        setError(null);
      } else {
        setError('Impossible de se connecter au serveur. Vérifiez que https://archive-mi73.onrender.com est accessible.');
      }
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    setCurrentFiles([]);
    
    // Test actual API connection
    try {
      const isConnected = await API_CONFIG.testConnection();
      
      setTimeout(() => {
        if (isConnected) {
          setCurrentFiles(sampleProductionFiles);
        } else {
          setError('Le serveur API ne répond pas. Vérifiez votre connexion internet et que le serveur https://archive-mi73.onrender.com est en ligne.');
        }
        setLoading(false);
      }, 1000);
    } catch (err) {
      setTimeout(() => {
        setError(`Erreur de connexion: ${err.message}`);
        setLoading(false);
      }, 1000);
    }
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
            📚 Archive Universitaire
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
            fontSize: '0.875rem'
          }}>
            API: {API_CONFIG.getBaseURL()}
          </div>
        </div>
        
        <FilesPage 
          files={currentFiles} 
          loading={loading} 
          error={error}
          onRetry={handleRetry}
          apiBaseUrl={API_CONFIG.getBaseURL()}
        />
      </div>
    </div>
  );
};

export default ProductionPDFDemo;
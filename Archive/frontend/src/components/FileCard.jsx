import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet } from 'lucide-react';

// Color schemes for different file types/states
const fileThemes = [
  { 
    gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b7a 40%, #ff3838 100%)',
    color: '#ff4757',
    accentGradient: 'linear-gradient(45deg, #ff4757, #ff6b7a, #ff3838)',
    shadow: 'rgba(255, 71, 87, 0.4)',
    name: 'red'
  },
  { 
    gradient: 'linear-gradient(135deg, #5352ed 0%, #706fd3 40%, #40407a 100%)',
    color: '#5352ed',
    accentGradient: 'linear-gradient(45deg, #5352ed, #706fd3, #40407a)',
    shadow: 'rgba(83, 82, 237, 0.4)',
    name: 'purple'
  },
  { 
    gradient: 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 40%, #2f3542 100%)',
    color: '#00d2d3',
    accentGradient: 'linear-gradient(45deg, #00d2d3, #54a0ff, #2f3542)',
    shadow: 'rgba(0, 210, 211, 0.4)',
    name: 'cyan'
  },
  { 
    gradient: 'linear-gradient(135deg, #5f27cd 0%, #a55eea 40%, #341f97 100%)',
    color: '#5f27cd',
    accentGradient: 'linear-gradient(45deg, #5f27cd, #a55eea, #341f97)',
    shadow: 'rgba(95, 39, 205, 0.4)',
    name: 'violet'
  },
  { 
    gradient: 'linear-gradient(135deg, #00d8d6 0%, #01a3a4 40%, #0abde3 100%)',
    color: '#00d8d6',
    accentGradient: 'linear-gradient(45deg, #00d8d6, #01a3a4, #0abde3)',
    shadow: 'rgba(0, 216, 214, 0.4)',
    name: 'teal'
  },
  { 
    gradient: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 40%, #48dbfb 100%)',
    color: '#feca57',
    accentGradient: 'linear-gradient(45deg, #feca57, #ff9ff3, #48dbfb)',
    shadow: 'rgba(254, 202, 87, 0.4)',
    name: 'rainbow'
  }
];

// Enhanced API Configuration - Fixed for production deployment
const API_CONFIG = {
  getBaseURL: () => {
    // For production deployment
    if (window.location.hostname.includes('render.com') || 
        window.location.hostname.includes('vercel.app') ||
        window.location.hostname.includes('netlify.app') ||
        window.location.hostname === 'larchive.tech' ||
        window.location.hostname === 'www.larchive.tech') {
      return 'https://archive-mi73.onrender.com';
    }
    
    // For local development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // Fallback to environment variable or current origin
    return process.env.REACT_APP_API_URL || 'https://archive-mi73.onrender.com';
  },
  
  getURL: (path) => {
    const baseURL = API_CONFIG.getBaseURL();
    return `${baseURL}${path.startsWith('/') ? path : '/' + path}`;
  }
};

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

// Enhanced FileCard with fixed production API integration
export const FileCard = ({ file, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt', breakpoint);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  const isTablet = breakpoint === 'tablet';
  const isDesktop = ['desktop-small', 'desktop'].includes(breakpoint);

  // Get the API base URL with proper fallback
  const getApiUrl = (endpoint) => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    return `${baseUrl}${endpoint}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced view handler with direct Cloudinary URLs and fallbacks
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to view file:', file);
      
      // Priority 1: Direct Cloudinary URL
      if (file.cloudinaryUrl) {
        const httpsUrl = file.cloudinaryUrl.replace('http://', 'https://');
        console.log('Opening Cloudinary URL:', httpsUrl);
        window.open(httpsUrl, '_blank');
        return;
      }
      
      // Priority 2: File path (likely Cloudinary)
      if (file.filePath) {
        const httpsUrl = file.filePath.replace('http://', 'https://');
        console.log('Opening file path:', httpsUrl);
        window.open(httpsUrl, '_blank');
        return;
      }
      
      // Priority 3: Constructed view URL if we have an ID
      if (file._id) {
        const viewUrl = getApiUrl(`/api/files/${file._id}/view`);
        console.log('Attempting API view:', viewUrl);
        
        // Try to check if the API endpoint is accessible
        try {
          const response = await fetch(viewUrl, { 
            method: 'HEAD',
            mode: 'cors',
            credentials: 'omit'
          });
          
          if (response.ok || response.status === 302) {
            window.open(viewUrl, '_blank');
            return;
          }
        } catch (fetchError) {
          console.warn('API check failed, will try direct open:', fetchError);
          // Still try to open it - might work
          window.open(viewUrl, '_blank');
          return;
        }
      }
      
      throw new Error('No valid URL found for viewing this file');
      
    } catch (err) {
      console.error('Error viewing file:', err);
      setError(`Unable to view file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download handler with direct Cloudinary URLs and fallbacks
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Attempting to download file:', file);
      
      // Priority 1: Cloudinary URL with attachment flag
      if (file.cloudinaryUrl) {
        let downloadUrl = file.cloudinaryUrl.replace('http://', 'https://');
        
        // Add attachment flag for Cloudinary URLs to force download
        if (downloadUrl.includes('cloudinary.com')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        console.log('Downloading from Cloudinary:', downloadUrl);
        
        // Create a temporary link to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Priority 2: File path with attachment flag
      if (file.filePath) {
        let downloadUrl = file.filePath.replace('http://', 'https://');
        
        if (downloadUrl.includes('cloudinary.com')) {
          downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
        }
        
        console.log('Downloading from file path:', downloadUrl);
        
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Priority 3: API download endpoint
      if (file._id) {
        const downloadUrl = getApiUrl(`/api/files/${file._id}/download`);
        console.log('Attempting API download:', downloadUrl);
        
        // For download, we can directly navigate to the URL
        window.location.href = downloadUrl;
        return;
      }
      
      throw new Error('No valid URL found for downloading this file');
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Unable to download file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Create CSS styles for the card
  const cardStyle = {
    '--theme-gradient': theme.gradient,
    '--theme-color': theme.color,
    '--theme-shadow': theme.shadow,
    background: 'white',
    borderRadius: '16px',
    boxShadow: `0 8px 32px ${theme.shadow}`,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative',
    cursor: 'pointer',
    maxWidth: '350px',
    minHeight: isMobile ? '200px' : '280px'
  };

  const headerStyle = {
    background: theme.gradient,
    height: isMobile ? '80px' : '120px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  };

  const iconStyle = {
    color: 'white',
    zIndex: 2,
    position: 'relative',
    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
  };

  const contentStyle = {
    padding: isMobile ? '16px' : '20px'
  };

  const titleStyle = {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: '8px',
    lineHeight: '1.4',
    wordBreak: 'break-word',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  const sizeStyle = {
    fontSize: isMobile ? '12px' : '14px',
    color: '#666',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  };

  const actionsStyle = {
    display: 'flex',
    gap: '8px',
    flexDirection: isMobile ? 'column' : 'row'
  };

  const buttonBaseStyle = {
    padding: isMobile ? '10px 16px' : '12px 20px',
    borderRadius: '8px',
    border: 'none',
    fontSize: isMobile ? '13px' : '14px',
    fontWeight: '500',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    opacity: loading ? 0.7 : 1,
    flex: isMobile ? '1' : '0 1 auto'
  };

  const viewButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: theme.color,
    color: 'white'
  };

  const downloadButtonStyle = {
    ...buttonBaseStyle,
    backgroundColor: 'transparent',
    color: theme.color,
    border: `2px solid ${theme.color}`
  };

  const errorStyle = {
    color: '#e74c3c',
    fontSize: '12px',
    marginBottom: '12px',
    padding: '8px',
    backgroundColor: '#fef2f2',
    borderRadius: '4px',
    border: '1px solid #fecaca'
  };

  return (
    <div style={cardStyle}>
      {/* Decorative elements */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        width: '20px',
        height: '20px',
        background: 'rgba(255,255,255,0.2)',
        borderRadius: '50%',
        zIndex: 1
      }} />
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '40px',
        width: '12px',
        height: '12px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        zIndex: 1
      }} />

      <div style={headerStyle}>
        <div style={iconStyle}>
          {fileIcon}
        </div>
      </div>

      <div style={contentStyle}>
        <h3 style={titleStyle}>
          {file.originalName || 'Document sans nom'}
        </h3>
        
        <div style={sizeStyle}>
          <span>📊</span>
          {formatFileSize(file.fileSize || 0)}
        </div>

        {error && (
          <div style={errorStyle}>
            {error}
          </div>
        )}

        <div style={actionsStyle}>
          <button
            style={viewButtonStyle}
            onClick={handleView}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-1px)';
                e.target.style.boxShadow = `0 4px 12px ${theme.shadow}`;
              }
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <Eye size={isMobile ? 16 : 20} />
            {loading ? 'Chargement...' : 'Visualiser'}
          </button>
          
          <button
            style={downloadButtonStyle}
            onClick={handleDownload}
            disabled={loading}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = theme.color;
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(-1px)';
              }
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = theme.color;
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <Download size={isMobile ? 16 : 20} />
            {loading ? 'Chargement...' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Files Page Component with API integration
export const FilesPage = ({ files = [], loading = false, error = null, onRetry, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  
  const containerStyle = {
    padding: isMobile ? '16px' : '24px',
    minHeight: '100vh',
    backgroundColor: '#f8fafc'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: isMobile 
      ? '1fr' 
      : 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: isMobile ? '16px' : '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const loadingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '200px',
    color: '#666'
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle} />
          Chargement des fichiers...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={{
          ...loadingStyle,
          color: '#e74c3c'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <div style={{ marginBottom: '16px' }}>{error}</div>
          {onRetry && (
            <button 
              onClick={onRetry}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
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
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
          <div>Aucun fichier disponible</div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        {files.map(file => (
          <FileCard key={file._id} file={file} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>
    </div>
  );
};

// Enhanced demo component with production-ready file loading
const ProductionFileDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Production API base URL
  const apiBaseUrl = 'https://archive-mi73.onrender.com';

  // Load files from production API
  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading files from:', `${apiBaseUrl}/api/files`);
      
      const response = await fetch(`${apiBaseUrl}/api/files?limit=20`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Loaded files:', data);
      
      // Handle both paginated and direct array responses
      const files = data.files || data;
      
      if (Array.isArray(files)) {
        setCurrentFiles(files);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error('Error loading files:', err);
      setError(`Erreur de chargement: ${err.message}`);
      
      // Fallback to sample files for demo
      const sampleFiles = [
        {
          _id: '674a1b2c3d4e5f6789012345',
          originalName: 'Cours_Algorithmes_2024.pdf',
          cloudinaryUrl: 'https://res.cloudinary.com/demo/raw/upload/v1234567890/sample.pdf',
          fileSize: 2048576,
          mimeType: 'application/pdf'
        },
        {
          _id: '674a1b2c3d4e5f6789012346',
          originalName: 'TP_Base_de_Donnees.pdf',
          cloudinaryUrl: 'https://res.cloudinary.com/demo/raw/upload/v1234567891/sample2.pdf',
          fileSize: 1572864,
          mimeType: 'application/pdf'
        }
      ];
      
      setCurrentFiles(sampleFiles);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleRetry = () => {
    loadFiles();
  };

  return (
    <div>
      <FilesPage 
        files={currentFiles} 
        loading={loading} 
        error={error}
        onRetry={handleRetry}
        apiBaseUrl={apiBaseUrl}
      />
    </div>
  );
};

export default ProductionFileDemo;
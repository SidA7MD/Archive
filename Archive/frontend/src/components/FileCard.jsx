import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet } from 'lucide-react';
import styles from './FileCard.module.css';

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

// API Configuration - Updated for local storage
const API_CONFIG = {
  getBaseURL: () => {
    // For development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production - use environment variable or current origin
    return process.env.REACT_APP_API_URL || window.location.origin;
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

// Enhanced FileCard with local storage support
export const FileCard = ({ file, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt', breakpoint);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  const isTablet = breakpoint === 'tablet';
  const isDesktop = ['desktop-small', 'desktop'].includes(breakpoint);

  // Get the API base URL - use prop, then fallback to auto-detection
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

  // Updated view handler for local storage
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Priority order for viewing files:
      // 1. Use direct file path if it's a full URL (for backward compatibility)
      // 2. Use API view endpoint for local files
      // 3. Fallback to viewUrl if provided
      
      let viewUrl;
      
      if (file.viewUrl && (file.viewUrl.startsWith('http') || file.viewUrl.startsWith('/uploads'))) {
        // Direct URL to file (local storage)
        viewUrl = file.viewUrl.startsWith('http') ? file.viewUrl : getApiUrl(file.viewUrl);
      } else if (file.filePath && file.filePath.startsWith('/uploads')) {
        // Relative path to uploaded file
        viewUrl = getApiUrl(file.filePath);
      } else if (file._id) {
        // Use API view endpoint
        viewUrl = getApiUrl(`/api/files/${file._id}/view`);
      } else {
        throw new Error('No valid file path found');
      }

      console.log('Opening file at:', viewUrl);
      
      // For PDFs, open in new tab to use browser's PDF viewer
      window.open(viewUrl, '_blank');
      
    } catch (err) {
      console.error('Error viewing file:', err);
      setError('Impossible de visualiser le fichier');
    } finally {
      setLoading(false);
    }
  };

  // Updated download handler for local storage
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Priority order for downloading files:
      // 1. Use API download endpoint (handles proper headers)
      // 2. Use direct downloadUrl if provided
      // 3. Fallback to direct file path
      
      let downloadUrl;
      
      if (file._id) {
        // Use API download endpoint (recommended - handles proper headers)
        downloadUrl = getApiUrl(`/api/files/${file._id}/download`);
      } else if (file.downloadUrl && file.downloadUrl.startsWith('http')) {
        // Direct download URL
        downloadUrl = file.downloadUrl;
      } else if (file.filePath) {
        // Direct file path
        downloadUrl = file.filePath.startsWith('http') ? file.filePath : getApiUrl(file.filePath);
      } else {
        throw new Error('No valid download path found');
      }

      console.log('Downloading file from:', downloadUrl);
      
      // Create a temporary link for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Impossible de télécharger le fichier');
    } finally {
      setLoading(false);
    }
  };

  // Create CSS custom properties for the theme
  const themeStyles = {
    '--theme-gradient': theme.gradient,
    '--theme-color': theme.color,
    '--theme-shadow': theme.shadow,
  };

  const containerClasses = [
    styles.container,
    styles[`container-${breakpoint}`],
    isMobile ? styles.mobile : '',
    isTablet ? styles.tablet : '',
    isDesktop ? styles.desktop : '',
  ].filter(Boolean).join(' ');

  const headerClasses = [
    styles.header,
    styles[`header-${breakpoint}`],
    isMobile ? styles.headerMobile : '',
  ].filter(Boolean).join(' ');

  const fileIconClasses = [
    styles.fileIcon,
    isMobile ? styles.fileIconMobile : '',
  ].filter(Boolean).join(' ');

  const contentClasses = [
    styles.content,
    styles[`content-${breakpoint}`],
    isMobile ? styles.contentMobile : '',
  ].filter(Boolean).join(' ');

  const titleClasses = [
    styles.title,
    styles[`title-${breakpoint}`],
    isMobile ? styles.titleMobile : '',
  ].filter(Boolean).join(' ');

  const sizeClasses = [
    styles.size,
    styles[`size-${breakpoint}`],
    isMobile ? styles.sizeMobile : '',
  ].filter(Boolean).join(' ');

  const actionsClasses = [
    styles.actions,
    isMobile ? styles.actionsMobile : '',
  ].filter(Boolean).join(' ');

  const viewButtonClasses = [
    styles.baseButton,
    styles.viewButton,
    styles[`button-${breakpoint}`],
    isMobile ? styles.buttonMobile : '',
    loading ? styles.loading : '',
  ].filter(Boolean).join(' ');

  const downloadButtonClasses = [
    styles.baseButton,
    styles.downloadButton,
    styles[`button-${breakpoint}`],
    isMobile ? styles.buttonMobile : '',
    loading ? styles.loading : '',
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      style={themeStyles}
    >
      <div className={headerClasses}>
        <div className={styles.decorativeElement1}></div>
        <div className={styles.decorativeElement2}></div>
        <div className={styles.decorativeElement3}></div>
        <div className={styles.decorativeElement4}></div>
        {isMobile && <div className={styles.decorativeElement5}></div>}
        
        <div className={fileIconClasses}>
          {fileIcon}
        </div>
      </div>

      <div className={contentClasses}>
        <h3 className={titleClasses}>
          {file.originalName || 'Document sans nom'}
        </h3>
        
        <div className={sizeClasses}>
          <span className={styles.sizeEmoji}>📊</span>
          {formatFileSize(file.fileSize || 0)}
        </div>

        {/* Add file info for debugging in development */}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.debugInfo}>
            <small>
              Storage: {file.storageProvider || 'local'} | 
              Path: {file.filePath || 'N/A'}
            </small>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        <div className={actionsClasses}>
          <button
            className={viewButtonClasses}
            onClick={handleView}
            disabled={loading}
          >
            <Eye size={isMobile ? 16 : 20} />
            {loading ? 'Chargement...' : 'Visualiser'}
          </button>
          
          <button
            className={downloadButtonClasses}
            onClick={handleDownload}
            disabled={loading}
          >
            <Download size={isMobile ? 16 : 20} />
            {loading ? 'Chargement...' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Enhanced Files Page Component with local storage support
export const FilesPage = ({ files = [], loading = false, error = null, onRetry, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  
  const containerClasses = [
    styles.filesContainer,
    styles[`filesContainer-${breakpoint}`],
    isMobile ? styles.filesContainerMobile : '',
  ].filter(Boolean).join(' ');

  const gridClasses = [
    styles.grid,
    styles[`grid-${breakpoint}`],
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div className={containerClasses}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          Chargement des fichiers...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClasses}>
        <div className={styles.errorState}>
          <div className={styles.errorIcon}>⚠️</div>
          <div>{error}</div>
          {onRetry && (
            <button 
              className={`${styles.retryButton} ${isMobile ? styles.retryButtonMobile : ''}`}
              onClick={onRetry}
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
      <div className={containerClasses}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📄</div>
          <div>Aucun fichier disponible</div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className={containerClasses}>
        {files.map(file => (
          <FileCard key={file._id} file={file} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>
    );
  }

  return (
    <div className={`${containerClasses} ${styles.filesContainerStretch}`}>
      <div className={gridClasses}>
        {files.map(file => (
          <FileCard key={file._id} file={file} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>
    </div>
  );
};

// Updated demo component with local storage files
const LocalStorageFileDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local storage sample files (as they would come from your API)
  const sampleLocalFiles = [
    {
      _id: '674a1b2c3d4e5f6789012345',
      originalName: 'Cours_Algorithmes_2024.pdf',
      fileName: '1734567890123-Cours_Algorithmes_2024.pdf',
      filePath: '/uploads/1734567890123-Cours_Algorithmes_2024.pdf',
      fileSize: 2048576,
      mimeType: 'application/pdf',
      storageProvider: 'local',
      uploadedAt: '2024-01-15T10:30:00.000Z',
      viewUrl: '/uploads/1734567890123-Cours_Algorithmes_2024.pdf',
      downloadUrl: '/api/files/674a1b2c3d4e5f6789012345/download'
    },
    {
      _id: '674a1b2c3d4e5f6789012346',
      originalName: 'TP_Base_de_Donnees.pdf',
      fileName: '1734567891234-TP_Base_de_Donnees.pdf',
      filePath: '/uploads/1734567891234-TP_Base_de_Donnees.pdf',
      fileSize: 1572864,
      mimeType: 'application/pdf',
      storageProvider: 'local',
      uploadedAt: '2024-01-16T14:20:00.000Z',
      viewUrl: '/uploads/1734567891234-TP_Base_de_Donnees.pdf',
      downloadUrl: '/api/files/674a1b2c3d4e5f6789012346/download'
    },
    {
      _id: '674a1b2c3d4e5f6789012347',
      originalName: 'Examen_Final_Mathematiques.pdf',
      fileName: '1734567892345-Examen_Final_Mathematiques.pdf',
      filePath: '/uploads/1734567892345-Examen_Final_Mathematiques.pdf',
      fileSize: 3145728,
      mimeType: 'application/pdf',
      storageProvider: 'local',
      uploadedAt: '2024-01-17T09:15:00.000Z',
      viewUrl: '/uploads/1734567892345-Examen_Final_Mathematiques.pdf',
      downloadUrl: '/api/files/674a1b2c3d4e5f6789012347/download'
    },
    {
      _id: '674a1b2c3d4e5f6789012348',
      originalName: 'TD_Analyse_Numerique.pdf',
      fileName: '1734567893456-TD_Analyse_Numerique.pdf',
      filePath: '/uploads/1734567893456-TD_Analyse_Numerique.pdf',
      fileSize: 987654,
      mimeType: 'application/pdf',
      storageProvider: 'local',
      uploadedAt: '2024-01-18T16:45:00.000Z',
      viewUrl: '/uploads/1734567893456-TD_Analyse_Numerique.pdf',
      downloadUrl: '/api/files/674a1b2c3d4e5f6789012348/download'
    },
    {
      _id: '674a1b2c3d4e5f6789012349',
      originalName: 'Projet_Fin_Etude_Guide.pdf',
      fileName: '1734567894567-Projet_Fin_Etude_Guide.pdf',
      filePath: '/uploads/1734567894567-Projet_Fin_Etude_Guide.pdf',
      fileSize: 5242880,
      mimeType: 'application/pdf',
      storageProvider: 'local',
      uploadedAt: '2024-01-19T11:30:00.000Z',
      viewUrl: '/uploads/1734567894567-Projet_Fin_Etude_Guide.pdf',
      downloadUrl: '/api/files/674a1b2c3d4e5f6789012349/download'
    }
  ];

  // Simulate loading from local storage server
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentFiles(sampleLocalFiles);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setCurrentFiles([]);
    
    // Simulate retry
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate
      
      if (success) {
        setCurrentFiles(sampleLocalFiles);
        setLoading(false);
      } else {
        setError('Impossible de se connecter au serveur. Vérifiez votre connexion internet.');
        setLoading(false);
      }
    }, 1500);
  };

  // API Configuration - Set this to your actual server URL
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  return (
    <div className={styles.demoContainer}>
      <div className={styles.demoHeader}>
        <h2>📚 Archive Universitaire - Stockage Local</h2>
        <p>Système de gestion de fichiers avec stockage local sécurisé</p>
      </div>
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

export default LocalStorageFileDemo;
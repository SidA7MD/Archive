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

// API Configuration - supports multiple environments
const API_CONFIG = {
  getBaseURL: () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
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

// Enhanced FileCard with dynamic API integration
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

  // Enhanced view handler with error handling
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (file.cloudinaryUrl) {
        window.open(file.cloudinaryUrl, '_blank');
        return;
      }
      
      const viewUrl = getApiUrl(`/api/files/${file._id}/view`);
      const response = await fetch(viewUrl, { method: 'HEAD' });
      
      if (response.ok) {
        window.open(viewUrl, '_blank');
      } else {
        if (file.filePath && file.filePath.includes('cloudinary.com')) {
          window.open(file.filePath, '_blank');
        } else {
          throw new Error('File not accessible');
        }
      }
    } catch (err) {
      console.error('Error viewing file:', err);
      setError('Unable to view file');
      
      if (file.filePath) {
        window.open(file.filePath, '_blank');
      }
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download handler with error handling
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (file.cloudinaryUrl) {
        const downloadUrl = file.cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
        window.location.href = downloadUrl;
        return;
      }
      
      const downloadUrl = getApiUrl(`/api/files/${file._id}/download`);
      const response = await fetch(downloadUrl, { method: 'HEAD' });
      
      if (response.ok) {
        window.location.href = downloadUrl;
      } else {
        if (file.filePath && file.filePath.includes('cloudinary.com')) {
          const directDownloadUrl = file.filePath.replace('/upload/', '/upload/fl_attachment/');
          window.location.href = directDownloadUrl;
        } else {
          throw new Error('File not accessible');
        }
      }
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Unable to download file');
      
      if (file.filePath) {
        window.location.href = file.filePath;
      }
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

// Enhanced Files Page Component with API integration
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

// Enhanced demo component with cloud server integration
const CloudServerFileDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cloud server sample files with Cloudinary URLs
  const sampleCloudFiles = [
    {
      _id: '674a1b2c3d4e5f6789012345',
      originalName: 'Cours_Algorithmes_2024.pdf',
      fileName: '1734567890123-Cours_Algorithmes_2024',
      filePath: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567890/university-archive/pdfs/1734567890123-Cours_Algorithmes_2024.pdf',
      cloudinaryPublicId: 'university-archive/pdfs/1734567890123-Cours_Algorithmes_2024',
      cloudinaryUrl: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567890/university-archive/pdfs/1734567890123-Cours_Algorithmes_2024.pdf',
      fileSize: 2048576,
      mimeType: 'application/pdf',
      storageProvider: 'cloudinary'
    },
    {
      _id: '674a1b2c3d4e5f6789012346',
      originalName: 'TP_Base_de_Donnees.pdf',
      fileName: '1734567891234-TP_Base_de_Donnees',
      filePath: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567891/university-archive/pdfs/1734567891234-TP_Base_de_Donnees.pdf',
      cloudinaryPublicId: 'university-archive/pdfs/1734567891234-TP_Base_de_Donnees',
      cloudinaryUrl: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567891/university-archive/pdfs/1734567891234-TP_Base_de_Donnees.pdf',
      fileSize: 1572864,
      mimeType: 'application/pdf',
      storageProvider: 'cloudinary'
    },
    {
      _id: '674a1b2c3d4e5f6789012347',
      originalName: 'Examen_Final_Mathematiques.pdf',
      fileName: '1734567892345-Examen_Final_Mathematiques',
      filePath: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567892/university-archive/pdfs/1734567892345-Examen_Final_Mathematiques.pdf',
      cloudinaryPublicId: 'university-archive/pdfs/1734567892345-Examen_Final_Mathematiques',
      cloudinaryUrl: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567892/university-archive/pdfs/1734567892345-Examen_Final_Mathematiques.pdf',
      fileSize: 3145728,
      mimeType: 'application/pdf',
      storageProvider: 'cloudinary'
    },
    {
      _id: '674a1b2c3d4e5f6789012348',
      originalName: 'TD_Analyse_Numerique.pdf',
      fileName: '1734567893456-TD_Analyse_Numerique',
      filePath: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567893/university-archive/pdfs/1734567893456-TD_Analyse_Numerique.pdf',
      cloudinaryPublicId: 'university-archive/pdfs/1734567893456-TD_Analyse_Numerique',
      cloudinaryUrl: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567893/university-archive/pdfs/1734567893456-TD_Analyse_Numerique.pdf',
      fileSize: 987654,
      mimeType: 'application/pdf',
      storageProvider: 'cloudinary'
    },
    {
      _id: '674a1b2c3d4e5f6789012349',
      originalName: 'Projet_Fin_Etude_Guide.pdf',
      fileName: '1734567894567-Projet_Fin_Etude_Guide',
      filePath: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567894/university-archive/pdfs/1734567894567-Projet_Fin_Etude_Guide.pdf',
      cloudinaryPublicId: 'university-archive/pdfs/1734567894567-Projet_Fin_Etude_Guide',
      cloudinaryUrl: 'https://res.cloudinary.com/your-cloud-name/raw/upload/v1734567894/university-archive/pdfs/1734567894567-Projet_Fin_Etude_Guide.pdf',
      fileSize: 5242880,
      mimeType: 'application/pdf',
      storageProvider: 'cloudinary'
    }
  ];

  // Simulate loading from cloud server
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentFiles(sampleCloudFiles);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setCurrentFiles([]);
    
    // Simulate retry with potential error
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate
      
      if (success) {
        setCurrentFiles(sampleCloudFiles);
        setLoading(false);
      } else {
        setError('Impossible de se connecter au serveur cloud. Vérifiez votre connexion internet.');
        setLoading(false);
      }
    }, 1500);
  };

  // API Configuration - You should set this to your actual server URL
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://archive-mi73.onrender.com';

  return (
    <div className={styles.demoContainer}>
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

export default CloudServerFileDemo;
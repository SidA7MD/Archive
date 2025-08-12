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

// Helper function to ensure HTTPS URLs
const ensureHttps = (url) => {
  if (!url) return null;
  return url.replace(/^http:/, 'https:');
};

// Helper function to get Cloudinary download URL
const getCloudinaryDownloadUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) return url;
  return ensureHttps(url.replace('/upload/', '/upload/fl_attachment/'));
};

// Helper function to detect if we're in production
const isProduction = () => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1' &&
         !window.location.hostname.includes('localhost');
};

// Enhanced FileCard with improved production deployment support
export const FileCard = ({ file, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt', breakpoint);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  const isTablet = breakpoint === 'tablet';
  const isDesktop = ['desktop-small', 'desktop'].includes(breakpoint);

  // Get the best available URL for the file
  const getFileUrl = (forDownload = false) => {
    // Priority: cloudinaryUrl > viewUrl > downloadUrl > filePath
    let url = file.cloudinaryUrl || file.viewUrl || file.downloadUrl || file.filePath;
    
    if (!url) return null;
    
    // Ensure HTTPS
    url = ensureHttps(url);
    
    // Add download flag for Cloudinary URLs if needed
    if (forDownload && url.includes('cloudinary.com')) {
      url = url.replace('/upload/', '/upload/fl_attachment/');
    }
    
    return url;
  };

  // Get API endpoint URL - only used as fallback
  const getApiUrl = (endpoint) => {
    const baseUrl = apiBaseUrl || 
      (isProduction() ? 'https://archive-mi73.onrender.com' : 'http://localhost:5000');
    return `${baseUrl}${endpoint}`;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced view handler with direct URL priority
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First priority: Direct Cloudinary/file URL
      const directUrl = getFileUrl(false);
      if (directUrl) {
        console.log('Opening direct URL:', directUrl);
        window.open(directUrl, '_blank');
        return;
      }
      
      // Fallback: Try API endpoint (for legacy files or special cases)
      if (file._id) {
        const apiUrl = getApiUrl(`/api/files/${file._id}/view`);
        console.log('Trying API URL:', apiUrl);
        
        // Open directly without testing (let the server handle redirects)
        window.open(apiUrl, '_blank');
        return;
      }
      
      throw new Error('No valid file URL found');
      
    } catch (err) {
      console.error('Error viewing file:', err);
      setError('Unable to open file. The file may no longer be available.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download handler with direct URL priority
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First priority: Direct download URL
      const directUrl = getFileUrl(true);
      if (directUrl) {
        console.log('Downloading from direct URL:', directUrl);
        
        // Create a temporary link for download
        const link = document.createElement('a');
        link.href = directUrl;
        link.download = file.originalName || 'download.pdf';
        link.target = '_blank';
        
        // For mobile devices, use window.location instead of click
        if (isMobile) {
          window.location.href = directUrl;
        } else {
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        return;
      }
      
      // Fallback: Try API endpoint
      if (file._id) {
        const apiUrl = getApiUrl(`/api/files/${file._id}/download`);
        console.log('Trying API download URL:', apiUrl);
        
        if (isMobile) {
          window.location.href = apiUrl;
        } else {
          const link = document.createElement('a');
          link.href = apiUrl;
          link.download = file.originalName || 'download.pdf';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
        return;
      }
      
      throw new Error('No valid download URL found');
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError('Unable to download file. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Enhanced responsive dimensions
  const dimensions = {
    'mobile-small': {
      width: 'calc(100vw - 2.5rem)',
      maxWidth: '320px',
      minWidth: '280px',
      minHeight: '360px',
      borderRadius: '20px',
      headerHeight: '150px',
      padding: '1.6rem 1.3rem',
      gap: '1.3rem',
      fontSize: {
        title: '1.25rem',
        size: '1rem',
        button: '0.95rem'
      }
    },
    'mobile': {
      width: 'calc(100vw - 2.5rem)',
      maxWidth: '350px',
      minWidth: '300px',
      minHeight: '380px',
      borderRadius: '22px',
      headerHeight: '160px',
      padding: '1.8rem 1.5rem',
      gap: '1.4rem',
      fontSize: {
        title: '1.3rem',
        size: '1.05rem',
        button: '1rem'
      }
    },
    'mobile-large': {
      width: 'calc(100vw - 3rem)',
      maxWidth: '380px',
      minWidth: '320px',
      minHeight: '400px',
      borderRadius: '24px',
      headerHeight: '170px',
      padding: '2rem 1.7rem',
      gap: '1.5rem',
      fontSize: {
        title: '1.35rem',
        size: '1.1rem',
        button: '1.05rem'
      }
    },
    'tablet': {
      width: 'min(480px, calc(50vw - 2rem))',
      maxWidth: '480px',
      minWidth: '380px',
      minHeight: '460px',
      borderRadius: '30px',
      headerHeight: '200px',
      padding: '2rem 1.8rem',
      gap: '1.8rem',
      fontSize: {
        title: '1.3rem',
        size: '1.1rem',
        button: '1.05rem'
      }
    },
    'desktop-small': {
      width: '450px',
      maxWidth: '450px',
      minHeight: '480px',
      borderRadius: '28px',
      headerHeight: '180px',
      padding: '2rem',
      gap: '1.8rem',
      fontSize: {
        title: '1.35rem',
        size: '1.1rem',
        button: '1.05rem'
      }
    },
    'desktop': {
      width: '520px',
      maxWidth: '520px',
      minHeight: '500px',
      borderRadius: '32px',
      headerHeight: '200px',
      padding: '2.5rem',
      gap: '2rem',
      fontSize: {
        title: '1.5rem',
        size: '1.2rem',
        button: '1.1rem'
      }
    }
  };

  const currentDimensions = dimensions[breakpoint] || dimensions.mobile;

  const containerStyle = {
    width: currentDimensions.width,
    maxWidth: currentDimensions.maxWidth,
    minWidth: currentDimensions.minWidth || 'auto',
    minHeight: currentDimensions.minHeight,
    borderRadius: currentDimensions.borderRadius,
    boxShadow: (() => {
      if (isMobile) {
        return `
          0 12px 40px rgba(0, 0, 0, 0.15),
          0 6px 20px rgba(0, 0, 0, 0.1),
          0 3px 12px rgba(0, 0, 0, 0.08),
          0 1px 4px rgba(0, 0, 0, 0.06)
        `;
      }
      return `0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)`;
    })(),
    backgroundColor: 'white',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: `1px solid ${isMobile ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)'}`,
    position: 'relative',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    margin: '0 auto',
    transform: 'translateZ(0)',
    ...(isMobile && {
      background: 'linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,1) 100%)',
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderImage: `linear-gradient(145deg, ${theme.color}15, rgba(255,255,255,0.8)) 1`,
    }),
  };

  const headerStyle = {
    height: currentDimensions.headerHeight,
    width: '100%',
    background: theme.gradient,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    ...(isMobile && {
      background: `${theme.gradient}, radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
      backgroundBlendMode: 'overlay, normal',
    }),
  };

  const getDecorativeSize = (baseSize) => {
    const multipliers = {
      'mobile-small': 0.7,
      'mobile': 0.8,
      'mobile-large': 0.85,
      'tablet': 0.9,
      'desktop-small': 0.95,
      'desktop': 1
    };
    return baseSize * (multipliers[breakpoint] || 0.8);
  };

  const decorativeElements = (
    <>
      <div style={{
        position: 'absolute',
        top: `-${getDecorativeSize(35)}px`,
        right: `-${getDecorativeSize(35)}px`,
        width: `${getDecorativeSize(140)}px`,
        height: `${getDecorativeSize(140)}px`,
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '50%',
        animation: 'float1 8s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: `-${getDecorativeSize(30)}px`,
        left: `-${getDecorativeSize(30)}px`,
        width: `${getDecorativeSize(100)}px`,
        height: `${getDecorativeSize(100)}px`,
        background: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '50%',
        animation: 'float2 10s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '20%',
        width: `${getDecorativeSize(10)}px`,
        height: `${getDecorativeSize(10)}px`,
        background: 'rgba(255, 255, 255, 0.6)',
        borderRadius: '50%',
        animation: 'twinkle 5s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '35%',
        right: '25%',
        width: `${getDecorativeSize(8)}px`,
        height: `${getDecorativeSize(8)}px`,
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '50%',
        animation: 'twinkle 4s ease-in-out infinite 2s',
      }}></div>
      {isMobile && (
        <div style={{
          position: 'absolute',
          top: '60%',
          left: '75%',
          width: `${getDecorativeSize(6)}px`,
          height: `${getDecorativeSize(6)}px`,
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '50%',
          animation: 'twinkle 6s ease-in-out infinite 3s',
        }}></div>
      )}
    </>
  );

  const fileIconStyle = {
    filter: 'drop-shadow(0 6px 16px rgba(0, 0, 0, 0.3))',
    animation: 'iconGlow 3s ease-in-out infinite alternate',
    zIndex: 2,
    marginBottom: isMobile ? '0.5rem' : '0.5rem',
    ...(isMobile && {
      transform: 'scale(1.05)',
      filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25)) drop-shadow(0 0 0 rgba(255,255,255,0.1))',
    }),
  };

  const contentStyle = {
    padding: currentDimensions.padding,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: currentDimensions.gap,
    background: isMobile 
      ? 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,1) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
    justifyContent: 'space-between',
  };

  const titleStyle = {
    fontSize: currentDimensions.fontSize.title,
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: '1.3',
    marginBottom: isMobile ? '0.5rem' : '0.5rem',
    textAlign: 'center',
    letterSpacing: '-0.01em',
    wordBreak: 'break-word',
    hyphens: 'auto',
    WebkitHyphens: 'auto',
    maxHeight: isMobile ? '4rem' : '4rem',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    ...(isMobile && {
      fontWeight: '800',
      textShadow: '0 1px 2px rgba(0,0,0,0.02)',
      color: '#1a202c',
    }),
  };

  const sizeStyle = {
    fontSize: currentDimensions.fontSize.size,
    color: '#718096',
    fontWeight: '600',
    background: `linear-gradient(135deg, ${theme.color}12, ${theme.color}08)`,
    padding: isMobile ? '1rem 1.2rem' : isTablet ? '1rem 1.3rem' : '1.1rem 1.5rem',
    borderRadius: isMobile ? '16px' : isTablet ? '16px' : '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    border: `2px solid ${theme.color}20`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: isMobile ? `0 4px 12px rgba(0,0,0,0.06)` : 'none',
    ...(isMobile && {
      fontWeight: '700',
      background: `linear-gradient(135deg, ${theme.color}18, ${theme.color}12, ${theme.color}06)`,
      borderWidth: '2.5px',
    }),
  };

  const actionsStyle = {
    display: 'flex',
    gap: isMobile ? '0.75rem' : '1rem',
    marginTop: 'auto',
    flexDirection: 'column',
  };

  const baseButtonStyle = {
    padding: (() => {
      if (isMobile) return '1.1rem 1.8rem';
      if (isTablet) return '1.2rem 1.8rem';
      return '1.3rem 2rem';
    })(),
    borderRadius: isMobile ? '18px' : '18px',
    fontSize: currentDimensions.fontSize.button,
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '0.7rem' : '0.75rem',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.02em',
    border: 'none',
    minHeight: isMobile ? '50px' : '52px',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    userSelect: 'none',
    fontFamily: 'inherit',
    disabled: loading,
    opacity: loading ? 0.7 : 1,
    ...(isMobile && {
      boxShadow: `0 3px 10px rgba(0, 0, 0, 0.08)`,
      fontWeight: '700',
      borderRadius: '18px',
    }),
  };

  const viewButtonStyle = {
    ...baseButtonStyle,
    background: isMobile 
      ? `linear-gradient(135deg, ${theme.color}20, ${theme.color}15, ${theme.color}10)`
      : `linear-gradient(135deg, ${theme.color}15, ${theme.color}10, ${theme.color}08)`,
    border: `2.5px solid ${theme.color}${isMobile ? '35' : '25'}`,
    color: theme.color,
  };

  const downloadButtonStyle = {
    ...baseButtonStyle,
    background: theme.gradient,
    color: 'white',
    boxShadow: `0 6px 20px ${theme.shadow}`,
    ...(isMobile && {
      background: `${theme.gradient}, linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)`,
      backgroundBlendMode: 'normal, overlay',
      boxShadow: `0 8px 24px ${theme.shadow}, 0 2px 8px rgba(0,0,0,0.1)`,
    }),
  };

  // Error display
  const errorStyle = {
    fontSize: '0.85rem',
    color: '#e53e3e',
    textAlign: 'center',
    padding: '0.5rem',
    background: 'rgba(254, 178, 178, 0.2)',
    borderRadius: '8px',
    marginBottom: '0.5rem',
  };

  // Debug info for development
  const debugInfo = !isProduction() && (
    <div style={{
      position: 'absolute',
      top: '5px',
      left: '5px',
      fontSize: '8px',
      color: 'rgba(255,255,255,0.7)',
      background: 'rgba(0,0,0,0.3)',
      padding: '2px 4px',
      borderRadius: '3px',
      zIndex: 10
    }}>
      {getFileUrl() ? '✓' : '✗'}
    </div>
  );

  // Enhanced interaction handlers
  const handleContainerHover = (e, isHovering) => {
    if (isDesktop && !('ontouchstart' in window)) {
      if (isHovering) {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 24px 60px rgba(0, 0, 0, 0.15), 0 12px 36px ${theme.shadow}`;
        e.currentTarget.style.borderColor = `${theme.color}30`;
      } else {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
      }
    }
  };

  const handleButtonHover = (e, isHovering, buttonType) => {
    if (!loading && !('ontouchstart' in window)) {
      if (isHovering) {
        if (buttonType === 'view') {
          e.currentTarget.style.background = `linear-gradient(135deg, ${theme.color}30, ${theme.color}25, ${theme.color}20)`;
          e.currentTarget.style.borderColor = `${theme.color}50`;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 24px ${theme.color}35`;
        } else {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 10px 30px ${theme.shadow}`;
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      } else {
        if (buttonType === 'view') {
          e.currentTarget.style.background = isMobile 
            ? `linear-gradient(135deg, ${theme.color}20, ${theme.color}15, ${theme.color}10)`
            : `linear-gradient(135deg, ${theme.color}15, ${theme.color}10, ${theme.color}08)`;
          e.currentTarget.style.borderColor = `${theme.color}${isMobile ? '35' : '25'}`;
          e.currentTarget.style.boxShadow = isMobile ? `0 4px 12px rgba(0, 0, 0, 0.1)` : 'none';
        } else {
          e.currentTarget.style.boxShadow = `0 6px 20px ${theme.shadow}`;
          e.currentTarget.style.filter = 'brightness(1)';
        }
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }
  };

  const handleTouchStart = (e) => {
    if ('ontouchstart' in window && !loading) {
      e.currentTarget.style.transform = 'scale(0.97)';
      e.currentTarget.style.opacity = '0.85';
    }
  };

  const handleTouchEnd = (e) => {
    if ('ontouchstart' in window && !loading) {
      setTimeout(() => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }, 150);
    }
  };

  const animationStyles = `
    @keyframes float1 {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-15px) rotate(6deg); }
    }
    @keyframes float2 {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(-4deg); }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(2); }
    }
    @keyframes iconGlow {
      0% { filter: drop-shadow(0 6px 16px rgba(0, 0, 0, 0.3)); }
      100% { filter: drop-shadow(0 8px 24px rgba(255, 255, 255, 0.4)); }
    }
    
    /* Mobile-optimized animations */
    @media (max-width: 640px) {
      @keyframes float1 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(4deg); }
      }
      @keyframes float2 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(-3deg); }
      }
      @keyframes iconGlow {
        0% { filter: drop-shadow(0 8px 20px rgba(0, 0, 0, 0.25)) drop-shadow(0 0 0 rgba(255,255,255,0.1)); }
        100% { filter: drop-shadow(0 10px 28px rgba(255, 255, 255, 0.3)) drop-shadow(0 0 0 rgba(255,255,255,0.2)); }
      }
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: animationStyles }} />
      
      <div 
        style={containerStyle}
        onMouseEnter={(e) => handleContainerHover(e, true)}
        onMouseLeave={(e) => handleContainerHover(e, false)}
      >
        <div style={headerStyle}>
          {decorativeElements}
          {debugInfo}
          <div style={fileIconStyle}>
            {fileIcon}
          </div>
        </div>

        <div style={contentStyle}>
          <h3 style={titleStyle}>
            {file.originalName || 'Document sans nom'}
          </h3>
          
          <div style={sizeStyle}>
            <span style={{ fontSize: '1.3em', opacity: 0.8 }}>📊</span>
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
              onMouseEnter={(e) => handleButtonHover(e, true, 'view')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'view')}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Eye size={isMobile ? 16 : 20} />
              {loading ? 'Chargement...' : 'Visualiser'}
            </button>
            
            <button
              style={downloadButtonStyle}
              onClick={handleDownload}
              disabled={loading}
              onMouseEnter={(e) => handleButtonHover(e, true, 'download')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'download')}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Download size={isMobile ? 16 : 20} />
              {loading ? 'Chargement...' : 'Télécharger'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Enhanced Files Page Component
export const FilesPage = ({ files = [], loading = false, error = null, onRetry, apiBaseUrl }) => {
  const breakpoint = useBreakpoints();
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  
  const containerStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: (() => {
      if (breakpoint === 'mobile-small') return '1.5rem';
      if (isMobile) return '1.8rem';
      if (breakpoint === 'tablet') return '2rem';
      return '2.5rem';
    })(),
    padding: (() => {
      if (breakpoint === 'mobile-small') return '1.5rem 1rem';
      if (isMobile) return '2rem 1rem';
      if (breakpoint === 'tablet') return '2.5rem 1.5rem';
      return '3rem 2rem';
    })(),
    maxWidth: '100%',
    minHeight: '100vh',
    width: '100%',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: isMobile 
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      : 'transparent',
    ...(isMobile && {
      paddingTop: '2rem',
      paddingBottom: '3rem',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 1rem)',
    }),
  };

  const gridContainerStyle = {
    display: 'grid',
    gridTemplateColumns: (() => {
      switch (breakpoint) {
        case 'tablet':
          return 'repeat(auto-fit, minmax(400px, 1fr))';
        case 'desktop-small':
          return 'repeat(auto-fit, minmax(450px, 1fr))';
        case 'desktop':
          return 'repeat(auto-fit, minmax(520px, 1fr))';
        default:
          return '1fr';
      }
    })(),
    gap: (() => {
      if (breakpoint === 'tablet') return '2rem';
      if (breakpoint === 'desktop-small') return '2.5rem';
      return '3rem';
    })(),
    justifyItems: 'center',
    alignItems: 'start',
    width: '100%',
    maxWidth: '1600px',
    margin: '0 auto',
  };

  const loadingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isMobile ? '60vh' : '50vh',
    fontSize: isMobile ? '1.1rem' : '1.2rem',
    color: isMobile ? 'white' : '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    padding: '2rem',
    ...(isMobile && {
      color: 'rgba(255,255,255,0.95)',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
  };

  const errorStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isMobile ? '60vh' : '50vh',
    fontSize: isMobile ? '1.1rem' : '1.2rem',
    color: isMobile ? 'white' : '#e74c3c',
    fontWeight: '600',
    textAlign: 'center',
    padding: '2rem',
    ...(isMobile && {
      color: 'rgba(255,255,255,0.95)',
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
  };

  const retryButtonStyle = {
    marginTop: '1.5rem',
    padding: isMobile ? '1.2rem 2rem' : '0.75rem 1.5rem',
    backgroundColor: isMobile ? 'rgba(255,255,255,0.95)' : '#667eea',
    color: isMobile ? '#667eea' : 'white',
    border: 'none',
    borderRadius: isMobile ? '20px' : '12px',
    fontSize: isMobile ? '1.1rem' : '1rem',
    cursor: 'pointer',
    fontWeight: '700',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    minHeight: isMobile ? '56px' : '44px',
    touchAction: 'manipulation',
    WebkitTapHighlightColor: 'transparent',
    ...(isMobile && {
      boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      letterSpacing: '0.02em',
    }),
  };

  const spinnerStyle = {
    width: isMobile ? '40px' : '36px',
    height: isMobile ? '40px' : '36px',
    border: `4px solid ${isMobile ? 'rgba(255,255,255,0.3)' : '#f3f4f6'}`,
    borderTop: `4px solid ${isMobile ? 'white' : '#667eea'}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1.5rem'
  };

  const emptyStateStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: isMobile ? '60vh' : '50vh',
    fontSize: isMobile ? '1.1rem' : '1.2rem',
    color: isMobile ? 'rgba(255,255,255,0.9)' : '#667eea',
    fontWeight: '600',
    textAlign: 'center',
    padding: '2rem',
    ...(isMobile && {
      textShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }),
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          Chargement des fichiers...
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1.5rem'}}>⚠️</div>
          <div>{error}</div>
          {onRetry && (
            <button 
              style={retryButtonStyle}
              onClick={onRetry}
              onMouseOver={(e) => {
                if (!isMobile) {
                  e.target.style.backgroundColor = '#5a67d8';
                }
              }}
              onMouseOut={(e) => {
                if (!isMobile) {
                  e.target.style.backgroundColor = '#667eea';
                }
              }}
              onTouchStart={(e) => {
                if (isMobile) {
                  e.target.style.transform = 'scale(0.98)';
                }
              }}
              onTouchEnd={(e) => {
                if (isMobile) {
                  setTimeout(() => {
                    e.target.style.transform = 'scale(1)';
                  }, 150);
                }
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
        <div style={emptyStateStyle}>
          <div style={{fontSize: '3.5rem', marginBottom: '1.5rem'}}>📄</div>
          <div>Aucun fichier disponible</div>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={containerStyle}>
        {files.map(file => (
          <FileCard key={file._id} file={file} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>
    );
  }

  return (
    <div style={{...containerStyle, alignItems: 'stretch'}}>
      <div style={gridContainerStyle}>
        {files.map(file => (
          <FileCard key={file._id} file={file} apiBaseUrl={apiBaseUrl} />
        ))}
      </div>
    </div>
  );
};

// Production-ready demo component with real server integration
const ProductionFileDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Production API base URL
  const apiBaseUrl = 'https://archive-mi73.onrender.com';

  // Fetch files from the real API
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching files from:', `${apiBaseUrl}/api/files`);
      
      const response = await fetch(`${apiBaseUrl}/api/files?limit=20&page=1`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        // Add timeout
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      console.log('API Response:', data);
      
      // Handle different response formats
      const files = data.files || data || [];
      
      if (Array.isArray(files)) {
        setCurrentFiles(files);
        console.log(`Loaded ${files.length} files successfully`);
      } else {
        throw new Error('Invalid response format: expected array of files');
      }
      
    } catch (err) {
      console.error('Error fetching files:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load files';
      
      if (err.name === 'AbortError' || err.name === 'TimeoutError') {
        errorMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (err.message.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      } else if (err.message.includes('404')) {
        errorMessage = 'API endpoint not found. Please contact support.';
      } else {
        errorMessage = `Error: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Load files on component mount
  useEffect(() => {
    fetchFiles();
  }, []);

  const handleRetry = () => {
    fetchFiles();
  };

  // Check if we're in production
  const isProductionEnv = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
    }}>
      {/* Debug info for development */}
      {!isProductionEnv && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '8px',
          fontSize: '12px',
          zIndex: 1000,
          maxWidth: '300px'
        }}>
          <div><strong>Debug Info:</strong></div>
          <div>API: {apiBaseUrl}</div>
          <div>Files: {currentFiles.length}</div>
          <div>Loading: {loading.toString()}</div>
          <div>Error: {error || 'none'}</div>
        </div>
      )}
      
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
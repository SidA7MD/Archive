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

// Responsive breakpoints hook
const useBreakpoints = () => {
  const [breakpoint, setBreakpoint] = useState('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 480) setBreakpoint('mobile');
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
  
  // Responsive icon sizes
  const iconSizes = {
    mobile: 36,
    tablet: 48,
    'desktop-small': 56,
    desktop: 72
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

export const FileCard = ({ file }) => {
  const breakpoint = useBreakpoints();
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt', breakpoint);
  
  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'desktop-small';

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleView = () => {
    window.open(`https://archive-mi73.onrender.com/api/files/${file._id}/view`, '_blank');
  };

  const handleDownload = () => {
    window.location.href = `https://archive-mi73.onrender.com/api/files/${file._id}/download`;
  };

  // Responsive dimensions and spacing
  const dimensions = {
    mobile: {
      maxWidth: '100%',
      minWidth: '280px',
      minHeight: '300px',
      borderRadius: '24px',
      headerHeight: '140px',
      padding: '1.5rem',
      gap: '1.2rem',
      fontSize: {
        title: '1.2rem',
        size: '1rem',
        button: '1rem'
      }
    },
    tablet: {
      maxWidth: '380px',
      minHeight: '400px',
      borderRadius: '20px',
      headerHeight: '140px',
      padding: '1.25rem',
      gap: '1.25rem',
      fontSize: {
        title: '1.1rem',
        size: '0.9rem',
        button: '0.95rem'
      }
    },
    'desktop-small': {
      maxWidth: '420px',
      minHeight: '450px',
      borderRadius: '24px',
      headerHeight: '160px',
      padding: '1.5rem',
      gap: '1.5rem',
      fontSize: {
        title: '1.25rem',
        size: '1rem',
        button: '1rem'
      }
    },
    desktop: {
      maxWidth: '1200px',
      minHeight: '500px',
      borderRadius: '32px',
      headerHeight: '100%',
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
    width: '100%',
    maxWidth: currentDimensions.maxWidth,
    minWidth: currentDimensions.minWidth || 'auto',
    minHeight: currentDimensions.minHeight,
    borderRadius: currentDimensions.borderRadius,
    boxShadow: `0 ${isMobile ? '6px 20px' : '8px 25px'} rgba(0, 0, 0, 0.12), 0 ${isMobile ? '3px 10px' : '3px 12px'} rgba(0, 0, 0, 0.08)`,
    backgroundColor: 'white',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: isDesktop ? 'row' : 'column',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.9)',
    position: 'relative',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    margin: '0 auto',
    // Ensure proper touch interaction on mobile
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    // Better mobile spacing and full width utilization
    marginBottom: isMobile ? '0.5rem' : '0',
  };

  const headerStyle = {
    height: isDesktop ? '100%' : currentDimensions.headerHeight,
    width: isDesktop ? '350px' : '100%',
    flex: isDesktop ? '0 0 350px' : 'none',
    background: theme.gradient,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
    borderTopRightRadius: isDesktop ? '60% 30%' : '0',
    borderBottomRightRadius: isDesktop ? '60% 30%' : '0',
  };

  // Responsive decorative elements
  const getDecorativeSize = (baseSize) => {
    const multipliers = {
      mobile: 0.6,
      tablet: 0.75,
      'desktop-small': 0.9,
      desktop: 1
    };
    return baseSize * (multipliers[breakpoint] || 0.6);
  };

  const decorativeElements = (
    <>
      <div style={{
        position: 'absolute',
        top: `-${getDecorativeSize(30)}px`,
        right: `-${getDecorativeSize(30)}px`,
        width: `${getDecorativeSize(120)}px`,
        height: `${getDecorativeSize(120)}px`,
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '50%',
        animation: 'float1 7s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: `-${getDecorativeSize(25)}px`,
        left: `-${getDecorativeSize(25)}px`,
        width: `${getDecorativeSize(80)}px`,
        height: `${getDecorativeSize(80)}px`,
        background: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '50%',
        animation: 'float2 9s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '20%',
        width: `${getDecorativeSize(8)}px`,
        height: `${getDecorativeSize(8)}px`,
        background: 'rgba(255, 255, 255, 0.6)',
        borderRadius: '50%',
        animation: 'twinkle 5s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '35%',
        right: '25%',
        width: `${getDecorativeSize(6)}px`,
        height: `${getDecorativeSize(6)}px`,
        background: 'rgba(255, 255, 255, 0.8)',
        borderRadius: '50%',
        animation: 'twinkle 4s ease-in-out infinite 2s',
      }}></div>
    </>
  );

  const fileIconStyle = {
    filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
    animation: 'iconGlow 3s ease-in-out infinite alternate',
    zIndex: 2,
    marginBottom: isMobile ? '0.25rem' : '0.5rem',
  };

  const contentStyle = {
    padding: currentDimensions.padding,
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: currentDimensions.gap,
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
  };

  const titleStyle = {
    fontSize: currentDimensions.fontSize.title,
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: '1.3',
    marginBottom: isMobile ? '0.4rem' : '0.5rem',
    textAlign: isDesktop ? 'center' : 'left',
    letterSpacing: '-0.01em',
    wordBreak: 'break-word',
    // Better text handling on small screens
    hyphens: 'auto',
    WebkitHyphens: 'auto',
    maxHeight: isMobile ? '3.2rem' : '3.9rem', // Allow more space on mobile
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: isMobile ? 2 : 3,
    WebkitBoxOrient: 'vertical',
  };

  const sizeStyle = {
    fontSize: currentDimensions.fontSize.size,
    color: '#718096',
    fontWeight: '600',
    background: `linear-gradient(135deg, ${theme.color}10, ${theme.color}05)`,
    padding: isMobile ? '0.6rem 0.8rem' : isTablet ? '0.75rem 1rem' : '1rem 1.5rem',
    borderRadius: isMobile ? '10px' : isTablet ? '12px' : '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    border: `1px solid ${theme.color}15`,
  };

  const actionsStyle = {
    display: 'flex',
    gap: isMobile ? '0.5rem' : isTablet ? '0.75rem' : '1.5rem',
    marginTop: 'auto',
    flexDirection: isMobile || isTablet ? 'column' : isDesktop ? 'row' : 'column',
  };

  const baseButtonStyle = {
    padding: isMobile ? '1.1rem 1.5rem' : isTablet ? '0.9rem 1.2rem' : '1.2rem 1.8rem',
    borderRadius: isMobile ? '16px' : isTablet ? '12px' : '18px',
    fontSize: currentDimensions.fontSize.button,
    fontWeight: isMobile ? '700' : '700',
    cursor: 'pointer',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.6rem',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.01em',
    border: 'none',
    minHeight: isMobile ? '52px' : '48px', // Slightly taller on mobile for better proportion
    flex: isDesktop ? 1 : 'none',
    // Mobile touch improvements
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    userSelect: 'none',
    fontFamily: 'inherit',
  };

  const viewButtonStyle = {
    ...baseButtonStyle,
    background: `linear-gradient(135deg, ${theme.color}15, ${theme.color}10, ${theme.color}08)`,
    border: `2px solid ${theme.color}25`,
    color: theme.color,
  };

  const downloadButtonStyle = {
    ...baseButtonStyle,
    background: theme.gradient,
    color: 'white',
    boxShadow: `0 4px 15px ${theme.shadow}`,
  };

  const handleContainerHover = (e, isHovering) => {
    // Only apply hover effects on desktop
    if (isDesktop && !('ontouchstart' in window)) {
      if (isHovering) {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = `0 20px 60px rgba(0, 0, 0, 0.12), 0 8px 30px ${theme.shadow}`;
        e.currentTarget.style.borderColor = `${theme.color}25`;
      } else {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.1), 0 3px 12px rgba(0, 0, 0, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.9)';
      }
    }
  };

  const handleButtonHover = (e, isHovering, buttonType) => {
    // Only apply hover effects on non-touch devices
    if (!('ontouchstart' in window)) {
      if (isHovering) {
        if (buttonType === 'view') {
          e.currentTarget.style.background = `linear-gradient(135deg, ${theme.color}25, ${theme.color}20, ${theme.color}15)`;
          e.currentTarget.style.borderColor = `${theme.color}40`;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 6px 20px ${theme.color}30`;
        } else {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 25px ${theme.shadow}`;
          e.currentTarget.style.filter = 'brightness(1.1)';
        }
      } else {
        if (buttonType === 'view') {
          e.currentTarget.style.background = `linear-gradient(135deg, ${theme.color}15, ${theme.color}10, ${theme.color}08)`;
          e.currentTarget.style.borderColor = `${theme.color}25`;
          e.currentTarget.style.boxShadow = 'none';
        } else {
          e.currentTarget.style.boxShadow = `0 4px 15px ${theme.shadow}`;
          e.currentTarget.style.filter = 'brightness(1)';
        }
        e.currentTarget.style.transform = 'translateY(0)';
      }
    }
  };

  // Touch feedback for mobile
  const handleTouchStart = (e, buttonType) => {
    if ('ontouchstart' in window) {
      e.currentTarget.style.transform = 'scale(0.98)';
      e.currentTarget.style.opacity = '0.8';
    }
  };

  const handleTouchEnd = (e, buttonType) => {
    if ('ontouchstart' in window) {
      setTimeout(() => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }, 150);
    }
  };

  // Animation styles
  const animationStyles = `
    @keyframes float1 {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-12px) rotate(6deg); }
    }
    @keyframes float2 {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-10px) rotate(-4deg); }
    }
    @keyframes twinkle {
      0%, 100% { opacity: 0.3; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.8); }
    }
    @keyframes iconGlow {
      0% { filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3)); }
      100% { filter: drop-shadow(0 6px 20px rgba(255, 255, 255, 0.4)); }
    }
    
    /* Mobile-specific animations */
    @media (max-width: 480px) {
      @keyframes float1 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-8px) rotate(4deg); }
      }
      @keyframes float2 {
        0%, 100% { transform: translateY(0px) rotate(0deg); }
        50% { transform: translateY(-6px) rotate(-2deg); }
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
          <div style={fileIconStyle}>
            {fileIcon}
          </div>
        </div>

        <div style={contentStyle}>
          <h3 style={titleStyle}>
            {file.originalName || 'Document sans nom'}
          </h3>
          
          <div style={sizeStyle}>
            <span style={{ fontSize: '1.2em', opacity: 0.8 }}>📊</span>
            {formatFileSize(file.fileSize || 0)}
          </div>

          <div style={actionsStyle}>
            <button
              style={viewButtonStyle}
              onClick={handleView}
              onMouseEnter={(e) => handleButtonHover(e, true, 'view')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'view')}
              onTouchStart={(e) => handleTouchStart(e, 'view')}
              onTouchEnd={(e) => handleTouchEnd(e, 'view')}
            >
              <Eye size={isMobile ? 16 : isTablet ? 18 : 20} />
              Visualiser
            </button>
            
            <button
              style={downloadButtonStyle}
              onClick={handleDownload}
              onMouseEnter={(e) => handleButtonHover(e, true, 'download')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'download')}
              onTouchStart={(e) => handleTouchStart(e, 'download')}
              onTouchEnd={(e) => handleTouchEnd(e, 'download')}
            >
              <Download size={isMobile ? 16 : isTablet ? 18 : 20} />
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Files Page Component with responsive grid
export const FilesPage = ({ files = [], loading = false, error = null, onRetry }) => {
  const breakpoint = useBreakpoints();
  
  // Responsive container styles
  const containerStyle = {
    display: 'grid',
    gridTemplateColumns: (() => {
      switch (breakpoint) {
        case 'mobile':
          return '1fr';
        case 'tablet':
          return 'repeat(auto-fit, minmax(320px, 1fr))';
        case 'desktop-small':
          return 'repeat(auto-fit, minmax(380px, 1fr))';
        default:
          return 'repeat(auto-fit, minmax(420px, 1fr))';
      }
    })(),
    gap: breakpoint === 'mobile' ? '1.2rem' : 
         breakpoint === 'tablet' ? '1.5rem' : '2rem',
    justifyItems: 'center',
    alignItems: 'start',
    padding: breakpoint === 'mobile' ? '1.2rem 1rem' : 
             breakpoint === 'tablet' ? '1.5rem' : '2rem',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    minHeight: 'auto',
    width: '100%',
  };

  const loadingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    fontSize: breakpoint === 'mobile' ? '1rem' : '1.2rem',
    color: '#667eea',
    fontWeight: '500',
    gridColumn: '1 / -1',
  };

  const errorStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    fontSize: breakpoint === 'mobile' ? '1rem' : '1.2rem',
    color: '#e74c3c',
    fontWeight: '500',
    textAlign: 'center',
    gridColumn: '1 / -1',
    padding: '1rem',
  };

  const retryButtonStyle = {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    minHeight: '44px',
    touchAction: 'manipulation',
  };

  const spinnerStyle = {
    width: breakpoint === 'mobile' ? '32px' : '40px',
    height: breakpoint === 'mobile' ? '32px' : '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
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
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
          <div>{error}</div>
          {onRetry && (
            <button 
              style={retryButtonStyle}
              onClick={onRetry}
              onMouseOver={(e) => e.target.style.backgroundColor = '#5a67d8'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
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
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📄</div>
          Aucun fichier disponible
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {files.map(file => (
        <FileCard key={file._id} file={file} />
      ))}
    </div>
  );
};

// Demo component showcasing different file types
const ResponsiveFileDemo = () => {
  const sampleFiles = [
    {
      _id: '1',
      originalName: 'Annual_Report_2024.pdf',
      fileSize: 2048576,
    },
    {
      _id: '2',
      originalName: 'presentation_slides.pptx',
      fileSize: 5242880,
    },
    {
      _id: '3',
      originalName: 'vacation_photos.zip',
      fileSize: 15728640,
    },
    {
      _id: '4',
      originalName: 'background_music.mp3',
      fileSize: 4194304,
    },
    {
      _id: '5',
      originalName: 'project_code.js',
      fileSize: 1048576,
    },
    {
      _id: '6',
      originalName: 'spreadsheet_data.xlsx',
      fileSize: 512000,
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      paddingTop: '2rem',
      paddingBottom: '2rem',
    }}>
      <FilesPage files={sampleFiles} />
    </div>
  );
};

export default ResponsiveFileDemo;
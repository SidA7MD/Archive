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
  
  // Responsive icon sizes - larger on mobile for better visibility
  const iconSizes = {
    'mobile-small': 42,
    'mobile': 48,
    'mobile-large': 52,
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

export const FileCard = ({ file }) => {
  const breakpoint = useBreakpoints();
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt', breakpoint);
  
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  const isTablet = breakpoint === 'tablet';
  const isDesktop = ['desktop-small', 'desktop'].includes(breakpoint);

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

  // Enhanced responsive dimensions - optimized for mobile
  const dimensions = {
    'mobile-small': {
      width: 'calc(100vw - 2rem)',
      maxWidth: '340px',
      minWidth: '300px',
      minHeight: '400px',
      borderRadius: '24px',
      headerHeight: '180px',
      padding: '2rem 1.5rem',
      gap: '1.6rem',
      fontSize: {
        title: '1.4rem',
        size: '1.1rem',
        button: '1.05rem'
      }
    },
    'mobile': {
      width: 'calc(100vw - 2rem)',
      maxWidth: '380px',
      minWidth: '320px',
      minHeight: '420px',
      borderRadius: '26px',
      headerHeight: '190px',
      padding: '2.2rem 1.75rem',
      gap: '1.7rem',
      fontSize: {
        title: '1.45rem',
        size: '1.15rem',
        button: '1.1rem'
      }
    },
    'mobile-large': {
      width: 'calc(100vw - 2.5rem)',
      maxWidth: '420px',
      minWidth: '340px',
      minHeight: '440px',
      borderRadius: '28px',
      headerHeight: '200px',
      padding: '2.4rem 2rem',
      gap: '1.8rem',
      fontSize: {
        title: '1.5rem',
        size: '1.2rem',
        button: '1.15rem'
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
    transform: 'translateZ(0)', // Hardware acceleration
    // Enhanced mobile presence
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
    // Enhanced mobile gradient
    ...(isMobile && {
      background: `${theme.gradient}, radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)`,
      backgroundBlendMode: 'overlay, normal',
    }),
  };

  // Enhanced responsive decorative elements
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
      {/* Additional mobile-specific decorative element */}
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
    // Enhanced mobile icon presence
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
    // Enhanced mobile typography
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
    background: `linear-gradient(135deg, ${theme.color}15, ${theme.color}08)`,
    padding: isMobile ? '1.2rem 1.5rem' : isTablet ? '1rem 1.3rem' : '1.1rem 1.5rem',
    borderRadius: isMobile ? '20px' : isTablet ? '16px' : '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    border: `2px solid ${theme.color}20`,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    boxShadow: isMobile ? `0 4px 12px rgba(0,0,0,0.06)` : 'none',
    // Enhanced mobile size indicator
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
      if (isMobile) return '1.4rem 2.2rem';
      if (isTablet) return '1.2rem 1.8rem';
      return '1.3rem 2rem';
    })(),
    borderRadius: isMobile ? '20px' : '18px',
    fontSize: currentDimensions.fontSize.button,
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: isMobile ? '1rem' : '0.75rem',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.02em',
    border: 'none',
    minHeight: isMobile ? '60px' : '52px',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
    userSelect: 'none',
    fontFamily: 'inherit',
    // Enhanced mobile button presence
    ...(isMobile && {
      boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1)`,
      fontWeight: '800',
      borderRadius: '22px',
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
    // Enhanced mobile download button
    ...(isMobile && {
      background: `${theme.gradient}, linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%)`,
      backgroundBlendMode: 'normal, overlay',
      boxShadow: `0 8px 24px ${theme.shadow}, 0 2px 8px rgba(0,0,0,0.1)`,
    }),
  };

  // Enhanced hover and touch interactions
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
    if (!('ontouchstart' in window)) {
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

  // Enhanced mobile touch feedback
  const handleTouchStart = (e) => {
    if ('ontouchstart' in window) {
      e.currentTarget.style.transform = 'scale(0.97)';
      e.currentTarget.style.opacity = '0.85';
    }
  };

  const handleTouchEnd = (e) => {
    if ('ontouchstart' in window) {
      setTimeout(() => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.opacity = '1';
      }, 150);
    }
  };

  // Enhanced animation styles
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

          <div style={actionsStyle}>
            <button
              style={viewButtonStyle}
              onClick={handleView}
              onMouseEnter={(e) => handleButtonHover(e, true, 'view')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'view')}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Eye size={isMobile ? 18 : 20} />
              Visualiser
            </button>
            
            <button
              style={downloadButtonStyle}
              onClick={handleDownload}
              onMouseEnter={(e) => handleButtonHover(e, true, 'download')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'download')}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <Download size={isMobile ? 18 : 20} />
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Enhanced Files Page Component with perfect mobile centering
export const FilesPage = ({ files = [], loading = false, error = null, onRetry }) => {
  const breakpoint = useBreakpoints();
  const isMobile = ['mobile-small', 'mobile', 'mobile-large'].includes(breakpoint);
  
  // Enhanced responsive container styles
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
    // Perfect mobile centering
    ...(isMobile && {
      paddingTop: '2rem',
      paddingBottom: '3rem',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 1rem)',
    }),
  };

  // Enhanced grid layout for larger screens
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
    // Mobile loading enhancement
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
    // Mobile error enhancement
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
    // Enhanced mobile button
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
    // Mobile empty state enhancement
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

  // Mobile layout uses flex column, larger screens use grid
  if (isMobile) {
    return (
      <div style={containerStyle}>
        {files.map(file => (
          <FileCard key={file._id} file={file} />
        ))}
      </div>
    );
  }

  return (
    <div style={{...containerStyle, alignItems: 'stretch'}}>
      <div style={gridContainerStyle}>
        {files.map(file => (
          <FileCard key={file._id} file={file} />
        ))}
      </div>
    </div>
  );
};

// Enhanced demo component with more diverse files
const ResponsiveFileDemo = () => {
  const [currentFiles, setCurrentFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const sampleFiles = [
    {
      _id: '1',
      originalName: 'Annual_Report_2024.pdf',
      fileSize: 2048576,
    },
    {
      _id: '2',
      originalName: 'Marketing_Presentation_Q4.pptx',
      fileSize: 5242880,
    },
    {
      _id: '3',
      originalName: 'Project_Assets_Archive.zip',
      fileSize: 15728640,
    },
    {
      _id: '4',
      originalName: 'Background_Music_Track.mp3',
      fileSize: 4194304,
    },
    {
      _id: '5',
      originalName: 'React_Component_Library.js',
      fileSize: 1048576,
    },
    {
      _id: '6',
      originalName: 'Sales_Data_Analytics.xlsx',
      fileSize: 512000,
    },
    {
      _id: '7',
      originalName: 'Product_Demo_Video.mp4',
      fileSize: 25165824,
    },
    {
      _id: '8',
      originalName: 'Company_Logo_Vector.svg',
      fileSize: 128000,
    },
    {
      _id: '9',
      originalName: 'Database_Backup_March.sql',
      fileSize: 8388608,
    }
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentFiles(sampleFiles);
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    setLoading(true);
    setCurrentFiles([]);
    setTimeout(() => {
      setCurrentFiles(sampleFiles);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      // Enhanced mobile background
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
    }}>
      <FilesPage 
        files={currentFiles} 
        loading={loading} 
        error={null}
        onRetry={handleRetry}
      />
    </div>
  );
};

export default ResponsiveFileDemo;
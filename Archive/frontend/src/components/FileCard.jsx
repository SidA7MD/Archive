import React from 'react';
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

// Get meaningful icon based on file extension
const getFileIcon = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
  
  // Responsive icon size - smaller on mobile
  const isMobile = window.innerWidth < 768;
  const iconSize = isMobile ? 48 : 72;
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
    hash = hash & hash; // Convert to 32bit integer
  }
  return fileThemes[Math.abs(hash) % fileThemes.length];
};

export const FileCard = ({ file }) => {
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt');
  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  // Mobile-first styling with proper responsive design
  const containerStyle = {
    width: '100%',
    maxWidth: isDesktop ? '1200px' : '350px',
    minHeight: isDesktop ? '500px' : '450px',
    borderRadius: isDesktop ? '32px' : '20px',
    boxShadow: `0 8px 25px rgba(0, 0, 0, 0.1), 0 3px 12px rgba(0, 0, 0, 0.05)`,
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
    margin: '0 auto'
  };

  const headerStyle = {
    height: isDesktop ? '100%' : '160px',
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

  // Animated decorative elements - smaller on mobile
  const decorativeElements = (
    <>
      <div style={{
        position: 'absolute',
        top: isDesktop ? '-30px' : '-20px',
        right: isDesktop ? '-30px' : '-20px',
        width: isDesktop ? '120px' : '80px',
        height: isDesktop ? '120px' : '80px',
        background: 'rgba(255, 255, 255, 0.15)',
        borderRadius: '50%',
        animation: 'float1 7s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: isDesktop ? '-25px' : '-15px',
        left: isDesktop ? '-25px' : '-15px',
        width: isDesktop ? '80px' : '60px',
        height: isDesktop ? '80px' : '60px',
        background: 'rgba(255, 255, 255, 0.12)',
        borderRadius: '50%',
        animation: 'float2 9s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '20%',
        width: isDesktop ? '8px' : '6px',
        height: isDesktop ? '8px' : '6px',
        background: 'rgba(255, 255, 255, 0.6)',
        borderRadius: '50%',
        animation: 'twinkle 5s ease-in-out infinite',
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '35%',
        right: '25%',
        width: isDesktop ? '6px' : '4px',
        height: isDesktop ? '6px' : '4px',
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
    marginBottom: '0.5rem',
  };

  const contentStyle = {
    padding: isDesktop ? '2.5rem' : '1.25rem',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: isDesktop ? '2rem' : '1.25rem',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 100%)',
  };

  const titleStyle = {
    fontSize: isDesktop ? '1.5rem' : '1.1rem',
    fontWeight: '700',
    color: '#2d3748',
    lineHeight: '1.3',
    marginBottom: '0.5rem',
    textAlign: isDesktop ? 'center' : 'left',
    letterSpacing: '-0.01em',
    wordBreak: 'break-word',
  };

  const sizeStyle = {
    fontSize: isDesktop ? '1.2rem' : '0.95rem',
    color: '#718096',
    fontWeight: '600',
    background: `linear-gradient(135deg, ${theme.color}10, ${theme.color}05)`,
    padding: isDesktop ? '1rem 1.5rem' : '0.75rem 1rem',
    borderRadius: isDesktop ? '18px' : '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    border: `1px solid ${theme.color}15`,
  };

  const actionsStyle = {
    display: 'flex',
    gap: isDesktop ? '1.5rem' : '0.75rem',
    marginTop: 'auto',
    flexDirection: isDesktop ? 'row' : 'column',
  };

  const baseButtonStyle = {
    padding: isDesktop ? '1.2rem 1.8rem' : '0.9rem 1.2rem',
    borderRadius: isDesktop ? '18px' : '14px',
    fontSize: isDesktop ? '1.1rem' : '0.95rem',
    fontWeight: isDesktop ? '700' : '600',
    cursor: 'pointer',
    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.01em',
    border: 'none',
    minHeight: '48px', // Touch-friendly
    flex: isDesktop ? 1 : 'none',
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
    if (isDesktop) {
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
  };

  // Keyframes in a style tag for animations
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
            >
              <Eye size={isDesktop ? 20 : 18} />
              Visualiser
            </button>
            
            <button
              style={downloadButtonStyle}
              onClick={handleDownload}
              onMouseEnter={(e) => handleButtonHover(e, true, 'download')}
              onMouseLeave={(e) => handleButtonHover(e, false, 'download')}
            >
              <Download size={isDesktop ? 20 : 18} />
              Télécharger
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Example usage component showcasing different file types
const PDFAppDemo = () => {
  const sampleFiles = [
    {
      _id: '1',
      originalName: 'Annual_Report_2024.pdf',
      fileSize: 2048576, // 2 MB
    },
    {
      _id: '2',
      originalName: 'presentation_slides.pptx',
      fileSize: 5242880, // 5 MB
    },
    {
      _id: '3',
      originalName: 'vacation_photos.zip',
      fileSize: 15728640, // 15 MB
    },
    {
      _id: '4',
      originalName: 'background_music.mp3',
      fileSize: 4194304, // 4 MB
    },
  ];

  const [isDesktop, setIsDesktop] = React.useState(window.innerWidth >= 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      padding: isDesktop ? '2rem' : '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: isDesktop ? '2rem' : '1.5rem',
    }}>
      {sampleFiles.map((file) => (
        <FileCard key={file._id} file={file} />
      ))}
    </div>
  );
};

export default PDFAppDemo;
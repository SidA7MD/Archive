import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, ExternalLink, Smartphone } from 'lucide-react';

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

// Device detection utilities
const getDeviceInfo = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const isIOS = /iphone|ipad|ipod/.test(userAgent);
  const isAndroid = /android/.test(userAgent);
  const isMobile = /mobile|android|iphone|ipad|ipod/.test(userAgent) || window.innerWidth < 768;
  const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
  
  return { isIOS, isAndroid, isMobile, isSafari };
};

// Get meaningful icon based on file extension
const getFileIcon = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
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
    hash = hash & hash;
  }
  return fileThemes[Math.abs(hash) % fileThemes.length];
};

// Mobile PDF Viewer Component
const MobilePDFViewer = ({ file, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 10000,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
  };

  const headerStyle = {
    padding: '1rem',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  };

  const contentStyle = {
    flex: 1,
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    textAlign: 'center',
  };

  const buttonStyle = {
    padding: '1rem 2rem',
    margin: '0.5rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#007AFF',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  };

  const handleViewPDF = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // For mobile devices, especially iOS, we need to handle PDFs differently
      const { isIOS, isAndroid, isSafari } = getDeviceInfo();
      const fileUrl = `${window.location.origin.replace(':3000', ':5000')}/api/files/${file._id}/view`;
      
      if (isIOS || isSafari) {
        // iOS Safari: Force download or open in Safari
        const response = await fetch(fileUrl);
        if (!response.ok) throw new Error('Failed to load PDF');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create a temporary link to open the PDF
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
      } else {
        // Android and other browsers
        window.open(fileUrl, '_blank', 'noopener,noreferrer');
      }
      
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const downloadUrl = `${window.location.origin.replace(':3000', ':5000')}/api/files/${file._id}/download`;
    window.location.href = downloadUrl;
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{file.originalName}</h3>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={contentStyle}>
        <div style={{ marginBottom: '2rem' }}>
          <Smartphone size={64} color="white" style={{ marginBottom: '1rem' }} />
          <h4 style={{ marginBottom: '1rem' }}>Choose how to view this PDF</h4>
          <p style={{ opacity: 0.8, marginBottom: '2rem', maxWidth: '300px' }}>
            Mobile browsers handle PDFs differently. Choose the best option for your device.
          </p>
        </div>

        {loading && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ 
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto'
            }}></div>
          </div>
        )}

        {error && (
          <div style={{ 
            color: '#ff4757', 
            marginBottom: '1rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 71, 87, 0.1)',
            borderRadius: '8px'
          }}>
            Error: {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '300px' }}>
          <button 
            style={buttonStyle}
            onClick={handleViewPDF}
            disabled={loading}
          >
            <ExternalLink size={20} />
            Open in Browser
          </button>
          
          <button 
            style={{ ...buttonStyle, backgroundColor: '#34c759' }}
            onClick={handleDownload}
            disabled={loading}
          >
            <Download size={20} />
            Download PDF
          </button>
        </div>
        
        <p style={{ 
          opacity: 0.6, 
          fontSize: '0.9rem', 
          marginTop: '2rem',
          maxWidth: '320px',
          lineHeight: '1.4'
        }}>
          💡 Tip: If the PDF doesn't open properly, try downloading it and opening with your device's PDF reader app.
        </p>
      </div>
    </div>
  );
};

export const FileCard = ({ file, apiBaseUrl = 'http://localhost:5000' }) => {
  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.txt');
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [showMobileViewer, setShowMobileViewer] = useState(false);
  const deviceInfo = getDeviceInfo();

  useEffect(() => {
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

  const isPDF = (fileName) => {
    return fileName.toLowerCase().endsWith('.pdf');
  };

  const handleView = () => {
    if (deviceInfo.isMobile && isPDF(file.originalName)) {
      // On mobile, show our custom viewer for PDFs
      setShowMobileViewer(true);
    } else {
      // Desktop behavior - open in new tab
      const fileUrl = `${apiBaseUrl}/api/files/${file._id}/view`;
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = () => {
    const downloadUrl = `${apiBaseUrl}/api/files/${file._id}/download`;
    
    if (deviceInfo.isMobile) {
      // On mobile, direct navigation works better
      window.location.href = downloadUrl;
    } else {
      // Desktop - create invisible link for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Component styles (keeping your existing styles)
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
    minHeight: '48px',
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

  // Add mobile indicator for PDFs
  const mobileIndicatorStyle = deviceInfo.isMobile && isPDF(file.originalName) ? {
    position: 'absolute',
    top: '10px',
    right: '10px',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '20px',
    padding: '0.25rem 0.5rem',
    fontSize: '0.7rem',
    color: theme.color,
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  } : { display: 'none' };

  // Animation styles
  const animationStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
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
      
      <div style={containerStyle}>
        <div style={headerStyle}>
          <div style={mobileIndicatorStyle}>
            <Smartphone size={12} />
            Mobile
          </div>
          
          <div style={{
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3))',
            animation: 'iconGlow 3s ease-in-out infinite alternate',
            zIndex: 2,
            marginBottom: '0.5rem',
          }}>
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
            >
              <Eye size={isDesktop ? 20 : 18} />
              {deviceInfo.isMobile && isPDF(file.originalName) ? 'Ouvrir' : 'Visualiser'}
            </button>
            
            <button
              style={downloadButtonStyle}
              onClick={handleDownload}
            >
              <Download size={isDesktop ? 20 : 18} />
              Télécharger
            </button>
          </div>
        </div>
      </div>

      <MobilePDFViewer 
        file={file}
        isOpen={showMobileViewer}
        onClose={() => setShowMobileViewer(false)}
      />
    </>
  );
};

// Demo component
const PDFAppDemo = () => {
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
  ];

  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
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
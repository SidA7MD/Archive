import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, ExternalLink, Smartphone, AlertCircle } from 'lucide-react';

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
  const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
  
  return { isIOS, isAndroid, isMobile, isSafari, isChrome };
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
const MobilePDFViewer = ({ file, isOpen, onClose, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTips, setShowTips] = useState(false);
  const deviceInfo = getDeviceInfo();

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
    borderRadius: '12px',
    border: 'none',
    backgroundColor: '#007AFF',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)',
  };

  // Enhanced PDF opening logic
  const handleViewPDF = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = apiBaseUrl || (window.location.origin.includes(':3000') 
        ? window.location.origin.replace(':3000', ':5000') 
        : window.location.origin);
      
      const fileUrl = `${baseUrl}/api/files/${file._id}/view`;
      
      if (deviceInfo.isIOS) {
        // iOS - Multiple approaches for better compatibility
        try {
          // Method 1: Try direct navigation first (works best on iOS)
          window.location.href = fileUrl;
          
          // Fallback after a short delay
          setTimeout(() => {
            if (document.hidden || document.visibilityState === 'hidden') {
              // PDF likely opened successfully
              onClose();
            } else {
              // Try alternative method
              const link = document.createElement('a');
              link.href = fileUrl;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
          }, 1000);
          
        } catch (err) {
          console.warn('Direct navigation failed, trying blob approach');
          
          // Fallback: Blob approach for iOS
          const response = await fetch(fileUrl);
          if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setTimeout(() => {
            URL.revokeObjectURL(url);
          }, 1000);
        }
        
      } else if (deviceInfo.isAndroid) {
        // Android - Try window.open with fallbacks
        const newWindow = window.open(fileUrl, '_blank', 'noopener,noreferrer');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          // Popup blocked or failed, try direct navigation
          window.location.href = fileUrl;
        } else {
          // Successfully opened in new tab
          setTimeout(() => {
            if (newWindow.closed) {
              onClose();
            }
          }, 1000);
        }
        
      } else {
        // Other mobile browsers
        const link = document.createElement('a');
        link.href = fileUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err) {
      console.error('PDF viewing error:', err);
      setError(`Failed to open PDF: ${err.message}. Try downloading instead.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const baseUrl = apiBaseUrl || (window.location.origin.includes(':3000') 
        ? window.location.origin.replace(':3000', ':5000') 
        : window.location.origin);
        
      const downloadUrl = `${baseUrl}/api/files/${file._id}/download`;
      
      if (deviceInfo.isIOS || deviceInfo.isSafari) {
        // iOS Safari - Direct navigation works best
        window.location.href = downloadUrl;
      } else {
        // Android and other browsers - Try to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = file.originalName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      onClose();
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced button with device-specific text
  const getViewButtonText = () => {
    if (deviceInfo.isIOS) return 'Open in Safari';
    if (deviceInfo.isAndroid) return 'Open PDF';
    return 'View PDF';
  };

  const getDeviceSpecificTip = () => {
    if (deviceInfo.isIOS) {
      return "On iOS, PDFs open in Safari or your default PDF app. If nothing happens, try the download option.";
    }
    if (deviceInfo.isAndroid) {
      return "On Android, choose your preferred PDF app when prompted. Download if the PDF doesn't open properly.";
    }
    return "If the PDF doesn't open, try downloading it to view with your device's PDF reader.";
  };

  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={headerStyle}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', flex: 1, textAlign: 'left' }}>
          {file.originalName}
        </h3>
        <button 
          onClick={onClose}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>
      
      <div style={contentStyle}>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, #007AFF, #0056CC)',
            borderRadius: '50%',
            padding: '1rem',
            marginBottom: '1rem',
            display: 'inline-block'
          }}>
            <FileText size={48} color="white" />
          </div>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>PDF Viewer</h4>
          <p style={{ opacity: 0.8, marginBottom: '1rem', maxWidth: '320px', fontSize: '0.9rem' }}>
            {deviceInfo.isIOS ? 'iOS Device Detected' : deviceInfo.isAndroid ? 'Android Device Detected' : 'Mobile Device'}
          </p>
        </div>

        {loading && (
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ 
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid white',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem auto'
            }}></div>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>Opening PDF...</p>
          </div>
        )}

        {error && (
          <div style={{ 
            color: '#ff4757', 
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(255, 71, 87, 0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 71, 87, 0.3)',
            maxWidth: '320px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem'
          }}>
            <AlertCircle size={20} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
            <span style={{ fontSize: '0.9rem' }}>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '300px', gap: '0.75rem' }}>
          <button 
            style={{
              ...buttonStyle,
              backgroundColor: loading ? '#999' : '#007AFF',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            onClick={handleViewPDF}
            disabled={loading}
          >
            <ExternalLink size={20} />
            {getViewButtonText()}
          </button>
          
          <button 
            style={{ 
              ...buttonStyle, 
              backgroundColor: loading ? '#999' : '#34c759',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
            onClick={handleDownload}
            disabled={loading}
          >
            <Download size={20} />
            Download PDF
          </button>
        </div>
        
        <button
          onClick={() => setShowTips(!showTips)}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            marginTop: '1.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          💡 {showTips ? 'Hide' : 'Show'} Tips
        </button>

        {showTips && (
          <div style={{ 
            opacity: 0.8, 
            fontSize: '0.85rem', 
            marginTop: '1rem',
            maxWidth: '320px',
            lineHeight: '1.5',
            padding: '1rem',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600' }}>Device-specific tip:</p>
            <p style={{ margin: 0 }}>{getDeviceSpecificTip()}</p>
          </div>
        )}
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
      // On mobile, show our enhanced viewer for PDFs
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

  // Component styles
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

  // Enhanced mobile indicator for PDFs
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
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  } : { display: 'none' };

  // Animation styles
  const animationStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
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
            {deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Mobile'}
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
        apiBaseUrl={apiBaseUrl}
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
    {
      _id: '3',
      originalName: 'technical_documentation.pdf',
      fileSize: 1024000,
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
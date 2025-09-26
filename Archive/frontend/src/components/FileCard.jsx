import React, { useState } from 'react';
import { Eye, Download, FileText, File, Image, Music, Video, Archive, Code, FileSpreadsheet, AlertCircle } from 'lucide-react';

// API config for backend URLs
export const API_CONFIG = {
  getBaseURL: () => {
    if (typeof window === 'undefined') return '';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    const envApiUrl = import.meta.env?.VITE_BACKEND_URL || import.meta.env?.REACT_APP_BACKEND_URL || import.meta.env?.VITE_API_URL;
    if (envApiUrl) return envApiUrl;
    return 'https://archive-mi73.onrender.com';
  },
  getURL: (path) => {
    const baseURL = API_CONFIG.getBaseURL();
    const cleanPath = path.startsWith('/') ? path : '/' + path;
    return `${baseURL}${cleanPath}`;
  }
};

export const FileCard = ({ file, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Returns backend view/download endpoint
  const getFileURL = (type = 'view') => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    if (file._id) {
      return `${baseUrl}/api/files/${file._id}/${type}`;
    }
    return null;
  };

  // View PDF in a new tab - FIXED to properly open PDFs inline
  const handleView = () => {
    setError(null);
    const url = getFileURL('view');
    if (url) {
      // Open in new tab with proper window features for PDF viewing
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer,width=1200,height=800,scrollbars=yes,resizable=yes');
      
      // Fallback: if popup was blocked, try direct navigation
      if (!newWindow) {
        // Try alternative method
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else {
      setError('URL de visualisation non disponible');
    }
  };

  // Download PDF - FIXED to properly download files
  const handleDownload = async () => {
    setLoading(true); 
    setError(null);
    
    try {
      const url = getFileURL('download');
      if (!url) throw new Error('URL de téléchargement non disponible');
      
      // Create a temporary link element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = file.originalName || 'document.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Append to body temporarily
      document.body.appendChild(link);
      
      // Trigger the download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Optional: Add a small delay to show loading state
      setTimeout(() => setLoading(false), 1000);
      
    } catch (err) {
      console.error('Download error:', err);
      setError(`Téléchargement impossible: ${err.message}`);
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024; 
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // File type color/theme
  const getFileTheme = (fileName) => {
    const fileThemes = [
      { gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b7a 40%, #ff3838 100%)', color: '#ff4757', shadow: 'rgba(255, 71, 87, 0.4)' },
      { gradient: 'linear-gradient(135deg, #5352ed 0%, #706fd3 40%, #40407a 100%)', color: '#5352ed', shadow: 'rgba(83, 82, 237, 0.4)' },
      { gradient: 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 40%, #2f3542 100%)', color: '#00d2d3', shadow: 'rgba(0, 210, 211, 0.4)' }
    ];
    let hash = 0;
    for (let i = 0; i < fileName.length; i++) hash = ((hash << 5) - hash) + fileName.charCodeAt(i);
    return fileThemes[Math.abs(hash) % fileThemes.length];
  };

  // File icon by extension
  const getFileIcon = (fileName) => {
    const extension = fileName.toLowerCase().split('.').pop();
    const iconProps = { size: 48, strokeWidth: 1.5 };
    switch (extension) {
      case 'pdf': return <FileText {...iconProps} />;
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'svg': return <Image {...iconProps} />;
      case 'mp3': case 'wav': case 'flac': return <Music {...iconProps} />;
      case 'mp4': case 'avi': case 'mov': case 'mkv': return <Video {...iconProps} />;
      case 'zip': case 'rar': case '7z': return <Archive {...iconProps} />;
      case 'js': case 'jsx': case 'ts': case 'tsx': case 'html': case 'css': case 'py': return <Code {...iconProps} />;
      case 'xlsx': case 'xls': case 'csv': return <FileSpreadsheet {...iconProps} />;
      default: return <File {...iconProps} />;
    }
  };

  const theme = getFileTheme(file.originalName || 'default');
  const fileIcon = getFileIcon(file.originalName || 'file.pdf');

  const containerStyles = {
    background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: `0 8px 32px ${theme.shadow}`,
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
    minHeight: '200px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
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
    fontSize: '1rem',
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

  const buttonsContainerStyles = {
    display: 'flex',
    gap: '0.5rem',
    marginTop: 'auto',
  };

  const buttonBaseStyles = {
    flex: 1,
    padding: '0.75rem 1rem',
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
    boxShadow: `0 4px 15px ${theme.shadow}`,
  };

  const downloadButtonStyles = {
    ...buttonBaseStyles,
    background: 'rgba(0,0,0,0.05)',
    color: '#374151',
    border: '1px solid rgba(0,0,0,0.1)',
  };

  // Add hover effects
  const [hovered, setHovered] = useState({ view: false, download: false });

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        {fileIcon}
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={titleStyles}>
          {file.originalName || 'Document sans nom'}
        </h3>
        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
          <span>📊</span>
          {formatFileSize(file.fileSize || 0)}
        </div>
        {error && (
          <div style={errorStyles}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        <div style={buttonsContainerStyles}>
          <button
            style={{
              ...viewButtonStyles,
              transform: hovered.view ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hovered.view 
                ? `0 8px 25px ${theme.shadow}` 
                : `0 4px 15px ${theme.shadow}`,
            }}
            onClick={handleView}
            disabled={loading}
            onMouseEnter={() => setHovered({ ...hovered, view: true })}
            onMouseLeave={() => setHovered({ ...hovered, view: false })}
            title={`Ouvrir ${file.originalName} dans un nouvel onglet`}
          >
            <Eye size={18} />
            {loading ? 'Ouverture...' : 'Ouvrir'}
          </button>
          <button
            style={{
              ...downloadButtonStyles,
              transform: hovered.download ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: hovered.download 
                ? '0 8px 25px rgba(0,0,0,0.15)' 
                : '0 2px 10px rgba(0,0,0,0.1)',
            }}
            onClick={handleDownload}
            disabled={loading}
            onMouseEnter={() => setHovered({ ...hovered, download: true })}
            onMouseLeave={() => setHovered({ ...hovered, download: false })}
            title={`Télécharger ${file.originalName}`}
          >
            <Download size={18} />
            {loading ? 'Téléchargement...' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
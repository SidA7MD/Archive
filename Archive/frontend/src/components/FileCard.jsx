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

  // Returns backend view/download endpoint or direct Cloudinary link
  const getFileURL = (type = 'view') => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    if (file._id) {
      return `${baseUrl}/api/files/${file._id}/${type}`;
    }
    if (type === 'view' && file.viewUrl) return file.viewUrl;
    if (type === 'download' && file.downloadUrl) return file.downloadUrl;
    return null;
  };

  // View PDF in new tab
  const handleView = async () => {
    setLoading(true); setError(null);
    try {
      const viewUrl = getFileURL('view');
      if (!viewUrl) throw new Error('URL de visualisation non disponible');
      window.open(viewUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Download PDF
  const handleDownload = async () => {
    setLoading(true); setError(null);
    try {
      const downloadUrl = getFileURL('download');
      if (!downloadUrl) throw new Error('URL de téléchargement non disponible');
      // Try fetch blob for better filename, fallback to direct
      try {
        const response = await fetch(downloadUrl, { method: 'GET', mode: 'cors' });
        if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } catch {
        // Direct fallback
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = file.originalName || 'document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      setError(`Téléchargement impossible: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
    padding: '0.5rem 1rem',
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
  };

  const downloadButtonStyles = {
    ...buttonBaseStyles,
    background: 'rgba(0,0,0,0.05)',
    color: '#374151',
    border: '1px solid rgba(0,0,0,0.1)',
  };

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
            style={viewButtonStyles}
            onClick={handleView}
            disabled={loading}
            title={`Visualiser ${file.originalName} dans un nouvel onglet`}
          >
            <Eye size={18} />
            {loading ? 'Ouverture...' : 'Visualiser'}
          </button>
          <button
            style={downloadButtonStyles}
            onClick={handleDownload}
            disabled={loading}
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
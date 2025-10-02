import React, { useState } from 'react';
import { Download, File, FileText, Image, Music, Video, Archive, Code, FileSpreadsheet, AlertCircle } from 'lucide-react';

// API config
export const API_CONFIG = {
  getBaseURL: () => {
    if (typeof window === 'undefined') return '';
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    const envApiUrl = import.meta.env?.VITE_BACKEND_URL || 
                      import.meta.env?.REACT_APP_BACKEND_URL || 
                      import.meta.env?.VITE_API_URL;
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

  // Validate file and generate download URL
  const getDownloadURL = () => {
    if (!file || !file._id) {
      console.error('Invalid file object:', file);
      return null;
    }
    
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    const url = `${baseUrl}/api/files/${file._id}/download`;
    
    console.log('Download URL generated:', url);
    return url;
  };

  // ENHANCED: Proper download with Content-Disposition header respect
  const handleDownload = async () => {
    setLoading(true);
    setError(null);

    try {
      const url = getDownloadURL();
      if (!url) {
        throw new Error('URL de téléchargement non disponible - Fichier invalide');
      }

      console.log('Starting download from:', url);

      // Use fetch to respect server headers
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf,*/*',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}`);
      }

      // Extract filename from Content-Disposition header (server sets .pdf)
      let filename = file.originalName || 'document.pdf';
      const contentDisposition = response.headers.get('Content-Disposition');
      
      if (contentDisposition) {
        // Try UTF-8 encoding first (filename*=UTF-8''...)
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utf8Match) {
          try {
            filename = decodeURIComponent(utf8Match[1]);
          } catch (e) {
            console.warn('Failed to decode UTF-8 filename');
          }
        } else {
          // Fallback to regular filename="..."
          const asciiMatch = contentDisposition.match(/filename="?([^";\n]+)"?/i);
          if (asciiMatch) {
            filename = asciiMatch[1];
          }
        }
      }

      // FORCE .pdf extension if missing
      if (!filename.toLowerCase().endsWith('.pdf')) {
        filename = filename.replace(/\.[^.]*$/, '') + '.pdf';
      }

      console.log('Final filename:', filename);

      // Convert to blob and trigger download
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      // Create download link
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      link.style.display = 'none';
      
      // Mobile-specific attributes
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      }, 100);

      setLoading(false);

    } catch (err) {
      console.error('Download error:', err);
      setError(err.message || 'Téléchargement échoué');
      setLoading(false);
    }
  };

  // Fallback: Direct link method (for older browsers)
  const handleDirectDownload = () => {
    const url = getDownloadURL();
    if (!url) {
      setError('URL invalide');
      return;
    }
    
    const link = document.createElement('a');
    link.href = url;
    link.download = file.originalName || 'document.pdf';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTheme = (fileName) => {
    const fileThemes = [
      { gradient: 'linear-gradient(135deg, #ff4757 0%, #ff6b7a 40%, #ff3838 100%)', shadow: 'rgba(255, 71, 87, 0.4)' },
      { gradient: 'linear-gradient(135deg, #5352ed 0%, #706fd3 40%, #40407a 100%)', shadow: 'rgba(83, 82, 237, 0.4)' },
      { gradient: 'linear-gradient(135deg, #00d2d3 0%, #54a0ff 40%, #2f3542 100%)', shadow: 'rgba(0, 210, 211, 0.4)' }
    ];
    let hash = 0;
    for (let i = 0; i < fileName.length; i++) {
      hash = ((hash << 5) - hash) + fileName.charCodeAt(i);
    }
    return fileThemes[Math.abs(hash) % fileThemes.length];
  };

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

  const theme = getFileTheme(file?.originalName || 'default');
  const fileIcon = getFileIcon(file?.originalName || 'file.pdf');
  const [hovered, setHovered] = useState(false);
  const isValidFile = file && file._id;

  return (
    <div style={{
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: `0 8px 32px ${theme.shadow}`,
      transition: 'all 0.3s ease',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
      opacity: isValidFile ? 1 : 0.6,
    }}>
      <div style={{
        background: theme.gradient,
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem',
        color: 'white',
        minHeight: '80px',
      }}>
        {fileIcon}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3 style={{
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
        }}>
          {file?.originalName || 'Document sans nom'}
        </h3>

        <div style={{ 
          fontSize: '0.75rem', 
          color: '#6b7280', 
          marginBottom: '0.5rem' 
        }}>
          📊 {formatFileSize(file?.fileSize || 0)}
        </div>

        {!isValidFile && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            padding: '0.5rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            <AlertCircle size={16} />
            Fichier invalide - ID manquant
          </div>
        )}

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            color: '#dc2626',
            padding: '0.5rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '500',
            fontSize: '0.875rem',
            cursor: (loading || !isValidFile) ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            opacity: (loading || !isValidFile) ? 0.6 : 1,
            background: theme.gradient,
            color: 'white',
            boxShadow: `0 4px 15px ${theme.shadow}`,
            marginTop: 'auto',
            transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          }}
          onClick={handleDownload}
          disabled={loading || !isValidFile}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          title={`Télécharger ${file?.originalName || 'le document'}`}
        >
          <Download size={18} />
          {loading ? 'Téléchargement...' : 'Télécharger'}
        </button>
      </div>
    </div>
  );
};

export default FileCard;
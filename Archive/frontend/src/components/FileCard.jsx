import React, { useState } from 'react';
import { Eye, Download, FileText, AlertCircle } from 'lucide-react';

// Enhanced API Configuration with Render support
const API_CONFIG = {
  getBaseURL: () => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return '';
    
    // For localhost development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }
    
    // For production - try environment variable first
    const envApiUrl = import.meta.env?.VITE_BACKEND_URL || 
                      process.env.REACT_APP_API_URL || 
                      process.env.NEXT_PUBLIC_API_URL;
    
    if (envApiUrl) {
      return envApiUrl;
    }
    
    // Fallback to your known production API URL
    return 'https://archive-mi73.onrender.com';
  }
};

// Enhanced FileCard component with robust PDF handling
export const FileCard = ({ file, apiBaseUrl }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // Format file size nicely
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // OPTIMIZED: URL resolution with better direct file access priority
  const getFileURL = (type = 'view') => {
    const baseUrl = apiBaseUrl || API_CONFIG.getBaseURL();
    
    if (type === 'view') {
      // CRITICAL FIX: Direct file access is most reliable on Render
      if (file.fileName) {
        return `${baseUrl}/uploads/${file.fileName}`;
      }
      
      // Fallbacks in order of reliability
      if (file.directUrl) return file.directUrl;
      if (file.viewUrl) return file.viewUrl;
      if (file.filePath && !file.filePath.startsWith('http')) {
        return `${baseUrl}${file.filePath}`;
      }
      if (file._id) return `${baseUrl}/api/files/${file._id}/view`;
    } 
    else if (type === 'download') {
      if (file.downloadUrl) return file.downloadUrl;
      if (file._id) return `${baseUrl}/api/files/${file._id}/download`;
      if (file.fileName) return `${baseUrl}/uploads/${file.fileName}`;
    }
    
    return null;
  };

  // Enhanced view handler with multiple strategies
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const viewUrl = getFileURL('view');
      
      if (!viewUrl) {
        throw new Error('Aucune URL de visualisation disponible');
      }

      console.log('Viewing file:', {
        name: file.originalName,
        url: viewUrl
      });

      setDebugInfo({
        viewUrl,
        timestamp: new Date().toISOString()
      });

      // IMPROVED: Open the PDF in a new tab with fallbacks
      const newWindow = window.open(viewUrl, '_blank', 'noopener,noreferrer');
      
      // If popup blocked, try alternate method
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        const link = document.createElement('a');
        link.href = viewUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
    } catch (err) {
      console.error('Error viewing file:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Enhanced download handler
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const downloadUrl = getFileURL('download');
      
      if (!downloadUrl) {
        throw new Error('Aucune URL de téléchargement disponible');
      }

      // Create a temporary link for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || 'document.pdf';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error downloading file:', err);
      setError(`Erreur: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="file-card">
      <div className="file-card-header">
        <FileText size={48} />
      </div>

      <div className="file-card-content">
        <h3 className="file-card-title">
          {file.originalName || 'Document sans nom'}
        </h3>
        
        <div className="file-card-size">
          <span>📊</span>
          {formatFileSize(file.fileSize || 0)}
        </div>

        {/* Debug info in development */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div className="file-card-debug">
            <div>URL: {debugInfo.viewUrl}</div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="file-card-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="file-card-actions">
          <button
            className="btn-view"
            onClick={handleView}
            disabled={loading}
          >
            <Eye size={18} />
            {loading ? 'Ouverture...' : 'Visualiser'}
          </button>
          
          <button
            className="btn-download"
            onClick={handleDownload}
            disabled={loading}
          >
            <Download size={18} />
            {loading ? 'Téléchargement...' : 'Télécharger'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .file-card {
          background: white;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 16px;
          padding: 1.5rem;
          box-shadow: 0 8px 32px rgba(83, 82, 237, 0.1);
          transition: all 0.3s ease;
          cursor: pointer;
          position: relative;
          overflow: hidden;
          min-height: 200px;
          display: flex;
          flex-direction: column;
        }
        
        .file-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 40px rgba(83, 82, 237, 0.2);
        }
        
        .file-card-header {
          background: linear-gradient(135deg, #5352ed 0%, #706fd3 40%, #40407a 100%);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          color: white;
          min-height: 80px;
        }
        
        .file-card-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 0.5rem;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .file-card-size {
          font-size: 0.75rem;
          color: #6b7280;
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .file-card-debug {
          background: rgba(59, 130, 246, 0.1);
          color: #1d4ed8;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.625rem;
          margin-bottom: 0.5rem;
          font-family: monospace;
          word-break: break-all;
        }
        
        .file-card-error {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .file-card-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: auto;
        }
        
        .btn-view {
          flex: 1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #5352ed 0%, #706fd3 40%, #40407a 100%);
          color: white;
        }
        
        .btn-view:hover {
          opacity: 0.9;
        }
        
        .btn-download {
          flex: 1;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(0,0,0,0.1);
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: rgba(0,0,0,0.05);
          color: #374151;
        }
        
        .btn-download:hover {
          background: rgba(0,0,0,0.1);
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};
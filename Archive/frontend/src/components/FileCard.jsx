import React, { useState, useEffect } from 'react';
import { Eye, Download, FileText, Loader2, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';

// Enhanced API Configuration with fallbacks
const API_CONFIG = {
  getBaseURL: () => {
    if (typeof window === 'undefined') return '';
    
    // For production - use your actual deployed API URL
    if (window.location.hostname.includes('larchive.tech') || 
        window.location.hostname.includes('vercel.app')) {
      return 'https://archive-mi73.onrender.com';
    }
    
    // For local development
    return 'http://localhost:5000';
  },
  
  testConnection: async (baseURL) => {
    try {
      const response = await fetch(`${baseURL}/api/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      return response.ok;
    } catch (error) {
      console.warn('API connection test failed:', error);
      return false;
    }
  }
};

// Enhanced FileCard component
export const FileCard = ({ file, onStatusUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');
  const [debugInfo, setDebugInfo] = useState(null);

  const baseURL = API_CONFIG.getBaseURL();

  // Test API connection on component mount
  useEffect(() => {
    testAPIConnection();
  }, [baseURL]);

  const testAPIConnection = async () => {
    try {
      setApiStatus('checking');
      const isConnected = await API_CONFIG.testConnection(baseURL);
      setApiStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setApiStatus('error');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Enhanced URL generation with multiple fallbacks
  const getFileURL = (type = 'view') => {
    const urls = [];

    // Priority 1: Direct URLs from file object
    if (type === 'view' && file.viewUrl) {
      urls.push(file.viewUrl);
    }
    if (type === 'download' && file.downloadUrl) {
      urls.push(file.downloadUrl);
    }

    // Priority 2: Constructed URLs with baseURL
    if (file._id) {
      urls.push(`${baseURL}/api/files/${file._id}/${type}`);
    }

    // Priority 3: File path URLs
    if (file.filePath) {
      const cleanPath = file.filePath.startsWith('/') ? file.filePath : `/${file.filePath}`;
      urls.push(cleanPath.startsWith('http') ? cleanPath : `${baseURL}${cleanPath}`);
    }

    // Priority 4: File name URLs
    if (file.fileName) {
      urls.push(`${baseURL}/uploads/${file.fileName}`);
    }

    // Return the first valid URL
    const validUrl = urls.find(url => url && url.startsWith('http'));
    return validUrl || null;
  };

  // Enhanced PDF viewing with multiple strategies
  const handleView = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      setDebugInfo(null);

      const viewUrl = getFileURL('view');
      
      if (!viewUrl) {
        throw new Error('No view URL available for this file');
      }

      // Add cache busting parameter
      const timestamp = new Date().getTime();
      const urlWithCacheBust = `${viewUrl}${viewUrl.includes('?') ? '&' : '?'}_=${timestamp}`;

      const debugData = {
        originalUrl: viewUrl,
        finalUrl: urlWithCacheBust,
        apiStatus,
        timestamp: new Date().toISOString(),
        strategies: []
      };

      // Strategy 1: Direct window open (primary)
      try {
        debugData.strategies.push('Strategy 1: Direct window open');
        const newWindow = window.open('', '_blank', 'noopener,noreferrer,width=1200,height=800');
        
        if (newWindow) {
          // Show loading message
          newWindow.document.write(`
            <html>
              <head><title>Loading PDF...</title></head>
              <body style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
                <div style="text-align: center;">
                  <h2>Loading PDF Document...</h2>
                  <p>If the PDF doesn't load automatically, <a href="${urlWithCacheBust}" target="_blank">click here</a></p>
                  <div style="margin-top: 20px;">
                    <button onclick="window.location.href='${urlWithCacheBust}'" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
                      Open PDF Directly
                    </button>
                  </div>
                </div>
              </body>
            </html>
          `);

          // Try to load the PDF after a short delay
          setTimeout(() => {
            newWindow.location.href = urlWithCacheBust;
          }, 100);

          setSuccess(true);
          debugData.strategies.push('✓ Strategy 1 successful');
          setDebugInfo(debugData);
          return;
        }
      } catch (strategy1Error) {
        debugData.strategies.push(`✗ Strategy 1 failed: ${strategy1Error.message}`);
      }

      // Strategy 2: Iframe fallback
      try {
        debugData.strategies.push('Strategy 2: Iframe fallback');
        const iframe = document.createElement('iframe');
        iframe.src = urlWithCacheBust;
        iframe.style.width = '100%';
        iframe.style.height = '600px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '10px';
        iframe.title = `PDF Viewer: ${file.originalName}`;

        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.background = 'rgba(0,0,0,0.8)';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.padding = '20px';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '20px';
        header.style.color = 'white';

        const title = document.createElement('h3');
        title.textContent = file.originalName;
        title.style.margin = '0';
        title.style.color = 'white';

        const closeButton = document.createElement('button');
        closeButton.textContent = 'Close';
        closeButton.style.padding = '10px 20px';
        closeButton.style.background = '#dc3545';
        closeButton.style.color = 'white';
        closeButton.style.border = 'none';
        closeButton.style.borderRadius = '5px';
        closeButton.style.cursor = 'pointer';
        closeButton.onclick = () => document.body.removeChild(container);

        header.appendChild(title);
        header.appendChild(closeButton);
        container.appendChild(header);
        container.appendChild(iframe);
        document.body.appendChild(container);

        setSuccess(true);
        debugData.strategies.push('✓ Strategy 2 successful');
        setDebugInfo(debugData);
        return;
      } catch (strategy2Error) {
        debugData.strategies.push(`✗ Strategy 2 failed: ${strategy2Error.message}`);
      }

      // Strategy 3: Direct link fallback
      try {
        debugData.strategies.push('Strategy 3: Direct link');
        const link = document.createElement('a');
        link.href = urlWithCacheBust;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setSuccess(true);
        debugData.strategies.push('✓ Strategy 3 successful');
        setDebugInfo(debugData);
        return;
      } catch (strategy3Error) {
        debugData.strategies.push(`✗ Strategy 3 failed: ${strategy3Error.message}`);
      }

      // All strategies failed
      throw new Error('All viewing strategies failed. The PDF may be unavailable.');

    } catch (err) {
      console.error('❌ Error viewing file:', err);
      setError(`Failed to open PDF: ${err.message}`);
      setDebugInfo(prev => prev ? { ...prev, finalError: err.message } : null);
    } finally {
      setLoading(false);
      if (onStatusUpdate) {
        onStatusUpdate({ success: !error, error, fileId: file._id });
      }
    }
  };

  // Enhanced download handler
  const handleDownload = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const downloadUrl = getFileURL('download');
      
      if (!downloadUrl) {
        throw new Error('No download URL available for this file');
      }

      // Test if the file is accessible
      const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        throw new Error(`File not accessible (HTTP ${testResponse.status})`);
      }

      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.originalName || 'document.pdf';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

    } catch (err) {
      console.error('❌ Error downloading file:', err);
      setError(`Download failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get file icon based on type
  const getFileIcon = () => {
    const extension = (file.originalName || '').toLowerCase().split('.').pop();
    const iconProps = { size: 48, strokeWidth: 1.5 };
    
    if (extension === 'pdf') return <FileText {...iconProps} />;
    return <FileText {...iconProps} />;
  };

  // Get theme based on file name
  const getFileTheme = () => {
    const themes = [
      { gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#667eea' },
      { gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#f093fb' },
      { gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#4facfe' },
      { gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: '#43e97b' },
      { gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: '#fa709a' },
    ];
    
    let hash = 0;
    for (let i = 0; i < (file.originalName || '').length; i++) {
      hash = ((hash << 5) - hash) + file.originalName.charCodeAt(i);
      hash = hash & hash;
    }
    return themes[Math.abs(hash) % themes.length];
  };

  const theme = getFileTheme();

  // Styles
  const styles = {
    container: {
      background: 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      border: '1px solid rgba(0,0,0,0.1)',
      borderRadius: '16px',
      padding: '1.5rem',
      boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      transition: 'all 0.3s ease',
      position: 'relative',
      overflow: 'hidden',
      minHeight: '200px',
      display: 'flex',
      flexDirection: 'column',
    },
    header: {
      background: theme.gradient,
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '1rem',
      color: 'white',
      minHeight: '80px',
    },
    title: {
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
    },
    meta: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    status: {
      padding: '0.25rem 0.5rem',
      borderRadius: '12px',
      fontSize: '0.75rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.25rem',
      marginBottom: '0.5rem',
    },
    buttons: {
      display: 'flex',
      gap: '0.75rem',
      marginTop: 'auto',
    },
    button: {
      flex: 1,
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: 'none',
      fontWeight: '500',
      fontSize: '0.875rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      position: 'relative',
      overflow: 'hidden',
    },
    viewButton: {
      background: theme.gradient,
      color: 'white',
    },
    downloadButton: {
      background: 'rgba(0,0,0,0.05)',
      color: '#374151',
      border: '1px solid rgba(0,0,0,0.1)',
    },
    error: {
      background: 'rgba(239, 68, 68, 0.1)',
      color: '#dc2626',
      padding: '0.5rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    success: {
      background: 'rgba(34, 197, 94, 0.1)',
      color: '#059669',
      padding: '0.5rem',
      borderRadius: '6px',
      fontSize: '0.75rem',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    },
    debug: {
      background: 'rgba(59, 130, 246, 0.1)',
      color: '#1d4ed8',
      padding: '0.5rem',
      borderRadius: '6px',
      fontSize: '0.625rem',
      marginBottom: '0.5rem',
      fontFamily: 'monospace',
    },
  };

  const getStatusStyle = () => {
    switch (apiStatus) {
      case 'connected': return { ...styles.status, background: 'rgba(34, 197, 94, 0.1)', color: '#059669' };
      case 'disconnected': return { ...styles.status, background: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
      case 'error': return { ...styles.status, background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' };
      default: return { ...styles.status, background: 'rgba(156, 163, 175, 0.1)', color: '#6b7280' };
    }
  };

  const getStatusText = () => {
    switch (apiStatus) {
      case 'connected': return '✅ API Connected';
      case 'disconnected': return '⚠️ API Disconnected';
      case 'error': return '❌ API Error';
      default: return '🔄 Checking API...';
    }
  };

  return (
    <div style={styles.container}>
      {/* File Header */}
      <div style={styles.header}>
        {getFileIcon()}
      </div>

      {/* File Content */}
      <div style={{ flex: 1 }}>
        {/* API Status */}
        <div style={getStatusStyle()}>
          {getStatusText()}
        </div>

        {/* File Title */}
        <h3 style={styles.title}>
          {file.originalName || 'Untitled Document'}
        </h3>

        {/* File Metadata */}
        <div style={styles.meta}>
          <span>📊</span>
          {formatFileSize(file.fileSize)}
          {file.fileType && <span>• {file.fileType.toUpperCase()}</span>}
        </div>

        {/* Success Message */}
        {success && (
          <div style={styles.success}>
            <CheckCircle size={14} />
            PDF opened successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Debug Info (Development only) */}
        {process.env.NODE_ENV === 'development' && debugInfo && (
          <div style={styles.debug}>
            <div><strong>URL:</strong> {debugInfo.finalUrl}</div>
            <div><strong>Strategies:</strong> {debugInfo.strategies.join(' → ')}</div>
            {debugInfo.finalError && <div><strong>Error:</strong> {debugInfo.finalError}</div>}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={styles.buttons}>
        <button
          style={{ ...styles.button, ...styles.viewButton }}
          onClick={handleView}
          disabled={loading || apiStatus !== 'connected'}
          title={apiStatus !== 'connected' ? 'API not connected' : 'View PDF'}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Eye size={18} />
          )}
          {loading ? 'Opening...' : 'View'}
        </button>

        <button
          style={{ ...styles.button, ...styles.downloadButton }}
          onClick={handleDownload}
          disabled={loading || apiStatus !== 'connected'}
          title={apiStatus !== 'connected' ? 'API not connected' : 'Download PDF'}
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Download size={18} />
          )}
          {loading ? 'Downloading...' : 'Download'}
        </button>
      </div>

      {/* CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

// Enhanced Files Container Component
export const FilesContainer = ({ files = [], loading = false, error = null, onRetry }) => {
  const [fileStatus, setFileStatus] = useState({});

  const handleFileStatusUpdate = ({ success, error, fileId }) => {
    setFileStatus(prev => ({
      ...prev,
      [fileId]: { success, error, timestamp: Date.now() }
    }));
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#3b82f6' }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '3rem',
        background: 'rgba(239, 68, 68, 0.05)',
        borderRadius: '12px',
        margin: '1rem'
      }}>
        <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '1rem' }} />
        <h3 style={{ color: '#dc2626', marginBottom: '1rem' }}>Error Loading Files</h3>
        <p style={{ color: '#6b7280', marginBottom: '2rem' }}>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '1.5rem',
      padding: '1rem',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {files.map(file => (
        <FileCard 
          key={file._id} 
          file={file} 
          onStatusUpdate={handleFileStatusUpdate}
        />
      ))}
    </div>
  );
};

export default FileCard;
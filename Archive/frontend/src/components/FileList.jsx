import React, { useEffect, useState } from 'react';
import { apiService, createFileHandlers, debugBackendConnection } from './api/apiService';

const FileList = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadFiles();
    // Optional: Run debug check
    runDebugCheck();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await apiService.getFiles({ limit: 20 });
      
      // Validate files have required _id field
      const validFiles = response.files.filter(file => {
        if (!file._id) {
          console.error('File missing _id:', file);
          return false;
        }
        return true;
      });
      
      console.log(`Loaded ${validFiles.length} valid files out of ${response.files.length}`);
      setFiles(validFiles);
      setError(null);
    } catch (err) {
      console.error('Failed to load files:', err);
      setError(err.userMessage || err.message);
    } finally {
      setLoading(false);
    }
  };

  const runDebugCheck = async () => {
    try {
      const debug = await debugBackendConnection();
      setDebugInfo(debug);
    } catch (err) {
      console.error('Debug check failed:', err);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading files...</div>;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <h3 className="font-semibold text-red-800">Error Loading Files</h3>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadFiles}
          className="px-4 py-2 mt-2 text-white bg-red-600 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="mb-4 text-2xl font-bold">Files ({files.length})</h2>
      
      {/* Debug Information */}
      {debugInfo && !debugInfo.tests.health?.connected && (
        <div className="p-3 mb-4 border border-yellow-200 rounded bg-yellow-50">
          <h4 className="font-semibold text-yellow-800">Backend Connection Issue</h4>
          <p className="text-sm text-yellow-700">
            Backend URL: {debugInfo.apiBaseUrl}
          </p>
          <p className="text-sm text-yellow-700">
            Status: {debugInfo.tests.health?.error || 'Not connected'}
          </p>
        </div>
      )}
      
      {files.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          No files available
        </div>
      ) : (
        <div className="grid gap-4">
          {files.map(file => (
            <FileCard key={file._id} file={file} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileCard = ({ file }) => {
  // Validate file object before creating handlers
  if (!file || !file._id) {
    return (
      <div className="p-4 border border-red-200 rounded bg-red-50">
        <p className="text-red-600">Invalid file object (missing ID)</p>
        <pre className="mt-2 text-xs text-red-500">
          {JSON.stringify(file, null, 2)}
        </pre>
      </div>
    );
  }

  const { handleView, handleDownload } = createFileHandlers(file);
  
  return (
    <div className="p-4 bg-white border border-gray-200 rounded shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            {file.originalName || 'Unnamed file'}
          </h3>
          <p className="text-sm text-gray-500">
            ID: {file._id}
          </p>
          <p className="text-sm text-gray-500">
            Size: {file.fileSize ? Math.round(file.fileSize / 1024) + ' KB' : 'Unknown'}
          </p>
          {file.uploadedAt && (
            <p className="text-sm text-gray-500">
              Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 ml-4">
          <button
            onClick={handleView}
            className="px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            View
          </button>
          <button
            onClick={handleDownload}
            className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-700"
          >
            Download
          </button>
        </div>
      </div>
      
      {/* Debug info for development */}
      {import.meta.env.DEV && (
        <details className="mt-2">
          <summary className="text-xs text-gray-400 cursor-pointer">
            Debug Info
          </summary>
          <pre className="p-2 mt-1 overflow-auto text-xs text-gray-500 rounded bg-gray-50">
            {JSON.stringify({
              _id: file._id,
              originalName: file.originalName,
              downloadUrl: apiService.getFileDownloadUrl(file),
              viewUrl: apiService.getFileViewUrl(file)
            }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};

export default FileList;
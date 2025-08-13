import React, { useState, useEffect } from 'react';

const ProductionDebug = () => {
  const [envInfo, setEnvInfo] = useState({});
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    // Get environment info
    const info = {
      isDev: import.meta.env.DEV,
      isProd: import.meta.env.PROD,
      mode: import.meta.env.MODE,
      backendUrl: import.meta.env.VITE_BACKEND_URL,
      currentOrigin: window.location.origin,
      hostname: window.location.hostname
    };
    setEnvInfo(info);

    // Determine API URL (same logic as your main code)
    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 
      (import.meta.env.DEV ? 'http://localhost:5000' : 'https://archive-mi73.onrender.com');
    
    console.log('🔧 Production Debug - API URL:', API_BASE_URL);
    
    // Test backend connectivity
    testBackend(API_BASE_URL);
  }, []);

  const testBackend = async (apiUrl) => {
    const results = {};
    
    try {
      console.log('🧪 Testing health endpoint...');
      const healthResponse = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      results.health = {
        success: healthResponse.ok,
        status: healthResponse.status,
        statusText: healthResponse.statusText
      };
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results.health.data = healthData;
      }
    } catch (error) {
      results.health = {
        success: false,
        error: error.message
      };
    }

    try {
      console.log('🧪 Testing files endpoint...');
      const filesResponse = await fetch(`${apiUrl}/api/files?limit=1`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      results.files = {
        success: filesResponse.ok,
        status: filesResponse.status,
        statusText: filesResponse.statusText
      };
      
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        results.files.data = filesData;
        
        // Test a sample file URL if files exist
        if (filesData.files && filesData.files.length > 0) {
          const sampleFile = filesData.files[0];
          const fileViewUrl = `${apiUrl}/api/files/${sampleFile._id}/view`;
          
          try {
            console.log('🧪 Testing file view URL:', fileViewUrl);
            const fileResponse = await fetch(fileViewUrl, {
              method: 'HEAD',
              credentials: 'include'
            });
            
            results.fileAccess = {
              success: fileResponse.ok,
              status: fileResponse.status,
              url: fileViewUrl,
              headers: Object.fromEntries(fileResponse.headers.entries())
            };
          } catch (error) {
            results.fileAccess = {
              success: false,
              error: error.message,
              url: fileViewUrl
            };
          }
        }
      }
    } catch (error) {
      results.files = {
        success: false,
        error: error.message
      };
    }

    setTestResults(results);
  };

  return (
    <div style={{ 
      position: 'fixed',
      top: '10px',
      right: '10px',
      width: '400px',
      maxHeight: '80vh',
      overflow: 'auto',
      backgroundColor: '#f8f9fa',
      border: '2px solid #007bff',
      borderRadius: '8px',
      padding: '15px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#007bff' }}>
        🔧 Production Debug Panel
      </h3>
      
      <div style={{ marginBottom: '15px' }}>
        <h4>🌍 Environment:</h4>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '11px'
        }}>
          {JSON.stringify(envInfo, null, 2)}
        </pre>
      </div>

      <div>
        <h4>🧪 Test Results:</h4>
        <pre style={{ 
          backgroundColor: '#fff', 
          padding: '8px', 
          borderRadius: '4px',
          fontSize: '11px',
          maxHeight: '300px',
          overflow: 'auto'
        }}>
          {JSON.stringify(testResults, null, 2)}
        </pre>
      </div>

      {testResults.fileAccess && !testResults.fileAccess.success && (
        <div style={{ 
          marginTop: '10px', 
          padding: '8px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '4px'
        }}>
          ❌ File access failed! This is likely your main issue.
        </div>
      )}

      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          width: '100%'
        }}
      >
        🔄 Refresh Tests
      </button>
    </div>
  );
};

export default ProductionDebug;
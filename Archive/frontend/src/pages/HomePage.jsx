import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { SemesterCard } from '../components/SemesterCard';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Configure axios with timeout and retry interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.error || error.message
    });
    return Promise.reject(error);
  }
);

export const HomePage = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  // Memoized fetch function to prevent infinite loops
  const fetchSemesters = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);
      setIsRetrying(attempt > 1);
      
      console.log(`Attempt ${attempt}: Fetching from:`, `${API_BASE_URL}/api/semesters`);
      
      const response = await apiClient.get('/api/semesters');
      
      if (response.data && Array.isArray(response.data)) {
        setSemesters(response.data);
        setRetryCount(0); // Reset retry count on success
        console.log('✅ Semesters loaded successfully:', response.data.length, 'items');
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (err) {
      console.error(`❌ Attempt ${attempt} failed:`, err);
      
      let errorMessage = 'Erreur lors du chargement des semestres';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = 'Délai de connexion expiré. Vérifiez votre connexion réseau.';
      } else if (err.response?.status === 503) {
        errorMessage = 'Base de données non disponible. Veuillez réessayer dans quelques instants.';
      } else if (err.response?.status >= 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (!err.response) {
        errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
      
      setError(errorMessage);
      setRetryCount(attempt);
      
      // Auto-retry for certain types of errors (max 3 attempts)
      if (attempt < 3 && (
        err.code === 'ECONNABORTED' || 
        err.response?.status === 503 ||
        !err.response
      )) {
        console.log(`🔄 Auto-retrying in ${attempt * 2} seconds...`);
        setTimeout(() => {
          fetchSemesters(attempt + 1);
        }, attempt * 2000); // Exponential backoff
        return;
      }
      
    } finally {
      setLoading(false);
      setIsRetrying(false);
    }
  }, []);

  // Effect with dependency array to prevent infinite loops
  useEffect(() => {
    fetchSemesters(1);
  }, []); // Empty dependency array - only run once on mount

  // Manual retry function
  const handleRetry = useCallback(() => {
    setRetryCount(0);
    fetchSemesters(1);
  }, [fetchSemesters]);

  // Enhanced container style with subtle background
  const containerStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 'clamp(1.5rem, 4vw, 2.2rem)',
    justifyContent: 'center',
    alignItems: 'center',
    top: '100px',
    minHeight: 'auto',
    padding: 'clamp(1.5rem, 5vw, 2.5rem)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  };

  const loadingStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    fontSize: '1.2rem',
    color: '#667eea',
    fontWeight: '500',
  };

  const errorStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '50vh',
    fontSize: '1.2rem',
    color: '#e74c3c',
    fontWeight: '500',
    textAlign: 'center',
    maxWidth: '600px',
    margin: '0 auto',
  };

  const retryButtonStyle = {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: isRetrying ? '#95a5a6' : '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: isRetrying ? 'not-allowed' : 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    minWidth: '120px',
  };

  const spinnerStyle = {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  };

  const retryInfoStyle = {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '0.5rem',
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          {isRetrying ? (
            <>
              Nouvelle tentative de connexion...
              <div style={retryInfoStyle}>Tentative {retryCount} sur 3</div>
            </>
          ) : (
            'Chargement des semestres...'
          )}
          <style dangerouslySetInnerHTML={{
            __html: `
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `
          }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
          <div style={{marginBottom: '0.5rem'}}>{error}</div>
          {retryCount > 0 && (
            <div style={retryInfoStyle}>
              Tentative {retryCount} échouée
            </div>
          )}
          <button 
            style={retryButtonStyle}
            onClick={handleRetry}
            disabled={isRetrying}
            onMouseOver={(e) => {
              if (!isRetrying) {
                e.target.style.backgroundColor = '#5a67d8';
              }
            }}
            onMouseOut={(e) => {
              if (!isRetrying) {
                e.target.style.backgroundColor = '#667eea';
              }
            }}
          >
            {isRetrying ? 'Connexion...' : 'Réessayer'}
          </button>
        </div>
      </div>
    );
  }

  if (semesters.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📚</div>
          Aucun semestre disponible
          <button 
            style={{...retryButtonStyle, marginTop: '1rem'}}
            onClick={handleRetry}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a67d8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            Actualiser
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {semesters.map((semester) => (
        <SemesterCard key={semester._id} semester={semester} />
      ))}
    </div>
  );
};
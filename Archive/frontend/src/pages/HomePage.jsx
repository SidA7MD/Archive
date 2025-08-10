import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { SemesterCard } from '../components/SemesterCard';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const HomePage = () => {
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSemesters();
  }, []);

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching from:', `${API_BASE_URL}/api/semesters`);
      
      // Use the API_BASE_URL constant
      const response = await axios.get(`${API_BASE_URL}/api/semesters`);
      setSemesters(response.data);
      
      console.log('Semesters loaded:', response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Erreur lors du chargement des semestres';
      setError(errorMessage);
      console.error('Error fetching semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retry function for failed requests
  const handleRetry = () => {
    fetchSemesters();
  };

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
  };

  const retryButtonStyle = {
    marginTop: '1rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'background-color 0.2s',
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

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={spinnerStyle}></div>
          Chargement des semestres...
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
          <div>{error}</div>
          <button 
            style={retryButtonStyle}
            onClick={handleRetry}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5a67d8'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#667eea'}
          >
            Réessayer
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
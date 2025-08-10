import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { TypeCard } from '../components/TypeCard';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const TypesPage = () => {
  const { semesterId } = useParams();
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTypes();
  }, [semesterId]);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching types from:', `${API_BASE_URL}/api/semesters/${semesterId}/types`);
      
      // Use the API_BASE_URL constant instead of hardcoded URL
      const response = await axios.get(`${API_BASE_URL}/api/semesters/${semesterId}/types`);
      setTypes(response.data);
      
      console.log('Types loaded:', response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Erreur lors du chargement des types';
      setError(errorMessage);
      console.error('Error fetching types:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retry function for failed requests
  const handleRetry = () => {
    fetchTypes();
  };

  // Enhanced container style matching HomePage
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
          Chargement des types...
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

  if (types.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📂</div>
          Aucun type disponible pour ce semestre
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {types.map(type => (
        <TypeCard key={type._id} type={type} semesterId={semesterId} />
      ))}
    </div>
  );
};
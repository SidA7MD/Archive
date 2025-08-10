import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { YearCard } from '../components/YearCard';

// Define API base URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const YearsPage = () => {
  const { semesterId, typeId, subjectId } = useParams();
  const [years, setYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [breadcrumbData, setBreadcrumbData] = useState({});

  useEffect(() => {
    fetchYears();
  }, [semesterId, typeId, subjectId]);

  const fetchYears = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = `${API_BASE_URL}/api/semesters/${semesterId}/types/${typeId}/subjects/${subjectId}/years`;
      console.log('Fetching years from:', apiUrl);
      
      // Use the API_BASE_URL constant instead of hardcoded URL
      const response = await axios.get(apiUrl);
      setYears(response.data);
      
      if (response.data.length > 0) {
        setBreadcrumbData({
          semester: response.data[0].semester.displayName,
          type: response.data[0].type.displayName,
          subject: response.data[0].subject.name
        });
      }
      
      console.log('Years loaded:', response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.message || 
                          'Erreur lors du chargement des années';
      setError(errorMessage);
      console.error('Error fetching years:', err);
    } finally {
      setLoading(false);
    }
  };

  // Retry function for failed requests
  const handleRetry = () => {
    fetchYears();
  };

  // Enhanced container style matching TypesPage
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
          Chargement des années...
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

  if (years.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={loadingStyle}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>📅</div>
          Aucune année disponible pour cette matière
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {years.map((year, index) => (
        <YearCard key={year._id} year={year} index={index} />
      ))}
    </div>
  );
};
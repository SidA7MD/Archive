import React from 'react';
import { Link } from 'react-router-dom';

// Enhanced sections with more sophisticated color schemes
const sections = [
  { 
    id: 'S1', 
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 40%, #ff006e 100%)',
    color: '#ff6a00',
    accentGradient: 'linear-gradient(45deg, #ff6a00, #ee0979, #ff006e)',
    shadow: 'rgba(255, 106, 0, 0.4)'
  },
  { 
    id: 'S2', 
    gradient: 'linear-gradient(135deg, #a100ff 0%, #c900ff 40%, #7209b7 100%)',
    color: '#a100ff',
    accentGradient: 'linear-gradient(45deg, #a100ff, #c900ff, #7209b7)',
    shadow: 'rgba(161, 0, 255, 0.4)'
  },
  { 
    id: 'S3', 
    gradient: 'linear-gradient(135deg, #3c41c5 0%, #8c52ff 40%, #5b21b6 100%)',
    color: '#3c41c5',
    accentGradient: 'linear-gradient(45deg, #3c41c5, #8c52ff, #5b21b6)',
    shadow: 'rgba(60, 65, 197, 0.4)'
  },
  { 
    id: 'S4', 
    gradient: 'linear-gradient(135deg, #00c896 0%, #00e0d6 40%, #0891b2 100%)',
    color: '#00c896',
    accentGradient: 'linear-gradient(45deg, #00c896, #00e0d6, #0891b2)',
    shadow: 'rgba(0, 200, 150, 0.4)'
  },
  { 
    id: 'S5', 
    gradient: 'linear-gradient(135deg, #facc15 0%, #fb923c 40%, #ea580c 100%)',
    color: '#facc15',
    accentGradient: 'linear-gradient(45deg, #facc15, #fb923c, #ea580c)',
    shadow: 'rgba(250, 204, 21, 0.4)'
  },
  { 
    id: 'S6', 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 40%, #4f46e5 100%)',
    color: '#667eea',
    accentGradient: 'linear-gradient(45deg, #667eea, #764ba2, #4f46e5)',
    shadow: 'rgba(102, 126, 234, 0.4)'
  }
];

const getSemesterStyle = (displayName) => {
  const match = displayName.match(/S(\d+)/i) || displayName.match(/(\d+)/);
  const semesterNum = match ? parseInt(match[1]) : 1;
  const index = Math.min(semesterNum - 1, sections.length - 1);
  return sections[Math.max(0, index)];
};

const extractSemesterLabel = (displayName) => {
  const match = displayName.match(/S(\d+)/i) || displayName.match(/(\d+)/);
  if (match) {
    return `S${match[1]}`;
  }
  // Fallback for other formats
  if (displayName.toLowerCase().includes('premier')) return 'S1';
  if (displayName.toLowerCase().includes('deuxième')) return 'S2';
  if (displayName.toLowerCase().includes('troisième')) return 'S3';
  if (displayName.toLowerCase().includes('quatrième')) return 'S4';
  if (displayName.toLowerCase().includes('cinquième')) return 'S5';
  if (displayName.toLowerCase().includes('sixième')) return 'S6';
  return displayName; // Fallback to original if no pattern matches
};

export const SemesterCard = ({ semester }) => {
  const sectionStyle = getSemesterStyle(semester.displayName);
  const semesterLabel = extractSemesterLabel(semester.displayName);

  const cardStyle = {
    width: 'clamp(320px, 90vw, 420px)',
    height: 'clamp(420px, 55vw, 520px)',
    borderRadius: '32px',
    boxShadow: `0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 12px rgba(0, 0, 0, 0.03)`,
    backgroundColor: 'white',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    position: 'relative',
    textDecoration: 'none',
    color: 'inherit',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  };

  const curveTopStyle = {
    height: 'clamp(260px, 40vw, 320px)',
    background: sectionStyle.gradient,
    borderBottomLeftRadius: '85% 45%',
    borderBottomRightRadius: '85% 45%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    position: 'relative',
    overflow: 'hidden',
  };

  // Enhanced decorative elements with better mobile scaling
  const decorativeElementStyle1 = {
    position: 'absolute',
    top: '-60px',
    right: '-60px',
    width: 'clamp(100px, 20vw, 150px)',
    height: 'clamp(100px, 20vw, 150px)',
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '50%',
    animation: 'float1 6s ease-in-out infinite',
  };

  const decorativeElementStyle2 = {
    position: 'absolute',
    bottom: '-30px',
    left: '-30px',
    width: 'clamp(70px, 16vw, 100px)',
    height: 'clamp(70px, 16vw, 100px)',
    background: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '50%',
    animation: 'float2 8s ease-in-out infinite',
  };

  // Additional decorative elements with mobile scaling
  const decorativeElementStyle3 = {
    position: 'absolute',
    top: '20%',
    left: '15%',
    width: 'clamp(4px, 1vw, 6px)',
    height: 'clamp(4px, 1vw, 6px)',
    background: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '50%',
    animation: 'twinkle 4s ease-in-out infinite',
  };

  const decorativeElementStyle4 = {
    position: 'absolute',
    bottom: '30%',
    right: '20%',
    width: 'clamp(3px, 0.8vw, 4px)',
    height: 'clamp(3px, 0.8vw, 4px)',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '50%',
    animation: 'twinkle 3s ease-in-out infinite 1s',
  };

  const labelStyle = {
    fontSize: 'clamp(2.0rem, 6vw, 2.8rem)',
    fontWeight: '800',
    textShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
    zIndex: 3,
    marginBottom: '12px',
    letterSpacing: '-0.02em',
  };

  const descriptionStyle = {
    fontSize: 'clamp(0.9rem, 3vw, 1.2rem)',
    opacity: 0.95,
    fontWeight: '500',
    zIndex: 3,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
    letterSpacing: '0.01em',
  };

  const contentStyle = {
    padding: 'clamp(1.5rem, 4vw, 2rem)',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
  };

  const buttonStyle = {
    background: `linear-gradient(135deg, ${sectionStyle.color}12, ${sectionStyle.color}08, transparent)`,
    border: `2px solid ${sectionStyle.color}20`,
    color: sectionStyle.color,
    borderRadius: '24px',
    padding: 'clamp(0.8rem, 3vw, 1.1rem) clamp(1.4rem, 5vw, 1.9rem)',
    fontSize: 'clamp(0.85rem, 3vw, 1.1rem)',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    outline: 'none',
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
    minHeight: '48px', // Ensures touch target on mobile
  };

  const arrowStyle = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: 'clamp(0.95rem, 3vw, 1.2rem)',
    fontWeight: 'bold',
  };

  // Refined hover handlers with subtle effects
  const handleCardHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
      e.currentTarget.style.boxShadow = `0 16px 50px rgba(0, 0, 0, 0.08), 0 6px 24px ${sectionStyle.shadow}`;
      e.currentTarget.style.borderColor = `${sectionStyle.color}20`;
    } else {
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 12px rgba(0, 0, 0, 0.03)';
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
    }
  };

  const handleButtonHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.background = `linear-gradient(135deg, ${sectionStyle.color}16, ${sectionStyle.color}10, ${sectionStyle.color}06)`;
      e.currentTarget.style.transform = 'translateY(-2px) scale(1.01)';
      e.currentTarget.style.boxShadow = `0 8px 20px ${sectionStyle.color}25`;
      e.currentTarget.style.borderColor = `${sectionStyle.color}30`;
      const arrow = e.currentTarget.querySelector('.arrow');
      if (arrow) arrow.style.transform = 'translateX(4px)';
    } else {
      e.currentTarget.style.background = `linear-gradient(135deg, ${sectionStyle.color}12, ${sectionStyle.color}08, transparent)`;
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.borderColor = `${sectionStyle.color}20`;
      const arrow = e.currentTarget.querySelector('.arrow');
      if (arrow) arrow.style.transform = 'translateX(0)';
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes float1 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(5deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-8px) rotate(-3deg); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.5); }
          }
          @keyframes iconGlow {
            0% { filter: drop-shadow(0 0 5px rgba(255,255,255,0.3)); }
            100% { filter: drop-shadow(0 0 15px rgba(255,255,255,0.6)); }
          }
          
          /* Mobile-specific optimizations */
          @media (max-width: 768px) {
            /* Ensure touch targets are large enough */
            button {
              min-height: 44px !important;
            }
          }
        `
      }} />
      <Link 
        to={`/semester/${semester._id}/types`}
        style={cardStyle}
        onMouseEnter={(e) => handleCardHover(e, true)}
        onMouseLeave={(e) => handleCardHover(e, false)}
      >
        <div style={curveTopStyle}>
          {/* Enhanced decorative elements */}
          <div style={decorativeElementStyle1}></div>
          <div style={decorativeElementStyle2}></div>
          <div style={decorativeElementStyle3}></div>
          <div style={decorativeElementStyle4}></div>
          
          <span style={labelStyle}>{semesterLabel}</span>
          <span style={descriptionStyle}>Explorez les ressources</span>
        </div>
        
        <div style={contentStyle}>
          <button
            style={buttonStyle}
            onMouseEnter={(e) => handleButtonHover(e, true)}
            onMouseLeave={(e) => handleButtonHover(e, false)}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Ouvrir 
            <span className="arrow" style={arrowStyle}>→</span>
          </button>
        </div>
      </Link>
    </>
  );
};
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

  // Refined hover handlers with subtle effects
  const handleCardHover = (e, isHovering) => {
    // Only apply hover effects on non-touch devices
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      if (isHovering) {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.01)';
        e.currentTarget.style.boxShadow = `0 16px 50px rgba(0, 0, 0, 0.08), 0 6px 24px ${sectionStyle.shadow}`;
        e.currentTarget.style.borderColor = `${sectionStyle.color}20`;
      } else {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 12px rgba(0, 0, 0, 0.03)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      }
    }
  };

  const handleButtonHover = (e, isHovering) => {
    // Only apply hover effects on non-touch devices
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
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
    }
  };

  // Touch handlers for mobile feedback
  const handleTouchStart = (e) => {
    e.currentTarget.style.transform = 'scale(0.98)';
    e.currentTarget.style.transition = 'transform 0.1s ease-out';
  };

  const handleTouchEnd = (e) => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
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
          
          .semester-card {
            width: 100%;
            border-radius: 18px;
            box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06), 0 2px 10px rgba(0, 0, 0, 0.03);
            background-color: white;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.8);
            position: relative;
            text-decoration: none;
            color: inherit;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            margin: 8px;
            min-height: 350px;
            max-width: none;
          }
          
          .semester-card-top {
            height: 220px;
            border-bottom-left-radius: 85% 45%;
            border-bottom-right-radius: 85% 45%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            position: relative;
            overflow: hidden;
          }
          
          .semester-card-content {
            padding: 1.2rem;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%);
            flex: 1;
          }
          
          .semester-label {
            font-size: 1.8rem;
            font-weight: 800;
            text-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
            z-index: 3;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
          }
          
          .semester-description {
            font-size: 0.85rem;
            opacity: 0.95;
            font-weight: 500;
            z-index: 3;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            letter-spacing: 0.01em;
          }
          
          .semester-button {
            border-radius: 16px;
            padding: 0.75rem 1.2rem;
            font-size: 0.8rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            display: flex;
            align-items: center;
            gap: 10px;
            outline: none;
            width: 100%;
            justify-content: center;
            position: relative;
            overflow: hidden;
            letter-spacing: 0.02em;
            text-transform: uppercase;
            min-height: 44px;
          }
          
          .arrow {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 0.9rem;
            font-weight: bold;
          }
          
          .decorative-1 {
            position: absolute;
            top: -45px;
            right: -45px;
            width: 80px;
            height: 80px;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            animation: float1 6s ease-in-out infinite;
          }
          
          .decorative-2 {
            position: absolute;
            bottom: -25px;
            left: -25px;
            width: 60px;
            height: 60px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 50%;
            animation: float2 8s ease-in-out infinite;
          }
          
          .decorative-3 {
            position: absolute;
            top: 20%;
            left: 15%;
            width: 3px;
            height: 3px;
            background: rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            animation: twinkle 4s ease-in-out infinite;
          }
          
          .decorative-4 {
            position: absolute;
            bottom: 30%;
            right: 20%;
            width: 2px;
            height: 2px;
            background: rgba(255, 255, 255, 0.6);
            border-radius: 50%;
            animation: twinkle 3s ease-in-out infinite 1s;
          }
          
          /* Extra Small Phones (320px - 374px) */
          @media (max-width: 374px) {
            .semester-card {
              margin: 6px;
              border-radius: 16px;
              min-height: 320px;
            }
            .semester-card-top {
              height: 180px;
            }
            .semester-card-content {
              padding: 1rem;
            }
            .semester-label {
              font-size: 1.5rem;
              margin-bottom: 6px;
            }
            .semester-description {
              font-size: 0.75rem;
            }
            .semester-button {
              padding: 0.65rem 1rem;
              font-size: 0.75rem;
              border-radius: 14px;
              min-height: 40px;
              gap: 8px;
            }
            .arrow {
              font-size: 0.85rem;
            }
            .decorative-1 {
              width: 60px;
              height: 60px;
              top: -35px;
              right: -35px;
            }
            .decorative-2 {
              width: 45px;
              height: 45px;
              bottom: -20px;
              left: -20px;
            }
          }
          
          /* Small Phones (375px - 413px) */
          @media (min-width: 375px) and (max-width: 413px) {
            .semester-card {
              margin: 7px;
              border-radius: 17px;
              min-height: 340px;
            }
            .semester-card-top {
              height: 200px;
            }
            .semester-card-content {
              padding: 1.1rem;
            }
            .semester-label {
              font-size: 1.6rem;
              margin-bottom: 7px;
            }
            .semester-description {
              font-size: 0.8rem;
            }
            .semester-button {
              padding: 0.7rem 1.1rem;
              font-size: 0.77rem;
              border-radius: 15px;
              min-height: 42px;
              gap: 9px;
            }
            .arrow {
              font-size: 0.87rem;
            }
          }
          
          /* Medium Phones (414px - 479px) */
          @media (min-width: 414px) and (max-width: 479px) {
            .semester-card {
              margin: 8px;
              border-radius: 18px;
              min-height: 360px;
            }
            .semester-card-top {
              height: 220px;
            }
            .semester-card-content {
              padding: 1.2rem;
            }
            .semester-label {
              font-size: 1.7rem;
              margin-bottom: 8px;
            }
            .semester-description {
              font-size: 0.82rem;
            }
            .semester-button {
              padding: 0.72rem 1.15rem;
              font-size: 0.78rem;
              border-radius: 15px;
              min-height: 43px;
              gap: 9px;
            }
            .arrow {
              font-size: 0.88rem;
            }
          }
          
          /* Large Phones (480px - 767px) */
          @media (min-width: 480px) and (max-width: 767px) {
            .semester-card {
              margin: 10px;
              border-radius: 20px;
              min-height: 380px;
            }
            .semester-card-top {
              height: 240px;
            }
            .semester-card-content {
              padding: 1.3rem;
            }
            .semester-label {
              font-size: 1.9rem;
              margin-bottom: 9px;
            }
            .semester-description {
              font-size: 0.9rem;
            }
            .semester-button {
              padding: 0.8rem 1.25rem;
              font-size: 0.82rem;
              border-radius: 16px;
              min-height: 46px;
              gap: 10px;
            }
            .arrow {
              font-size: 0.92rem;
            }
            .decorative-1 {
              width: 90px;
              height: 90px;
              top: -50px;
              right: -50px;
            }
            .decorative-2 {
              width: 70px;
              height: 70px;
              bottom: -30px;
              left: -30px;
            }
          }
          
          /* Tablets (768px - 1023px) */
          @media (min-width: 768px) and (max-width: 1023px) {
            .semester-card {
              border-radius: 24px;
              margin: 12px;
              min-height: 420px;
              width: 380px;
              max-width: 380px;
            }
            .semester-card-top {
              height: 260px;
            }
            .semester-card-content {
              padding: 1.5rem;
            }
            .semester-label {
              font-size: 2.2rem;
              margin-bottom: 10px;
            }
            .semester-description {
              font-size: 1rem;
            }
            .semester-button {
              padding: 0.9rem 1.4rem;
              font-size: 0.9rem;
              border-radius: 18px;
              min-height: 50px;
              gap: 11px;
            }
            .arrow {
              font-size: 1rem;
            }
            .decorative-1 {
              width: 100px;
              height: 100px;
              top: -55px;
              right: -55px;
            }
            .decorative-2 {
              width: 80px;
              height: 80px;
              bottom: -35px;
              left: -35px;
            }
            .decorative-3 {
              width: 4px;
              height: 4px;
            }
            .decorative-4 {
              width: 3px;
              height: 3px;
            }
          }
          
          /* Desktop (1024px - 1439px) */
          @media (min-width: 1024px) and (max-width: 1439px) {
            .semester-card {
              border-radius: 28px;
              margin: 14px;
              min-height: 440px;
              width: 400px;
              max-width: 400px;
            }
            .semester-card-top {
              height: 280px;
            }
            .semester-card-content {
              padding: 1.6rem;
            }
            .semester-label {
              font-size: 2.4rem;
              margin-bottom: 11px;
            }
            .semester-description {
              font-size: 1.1rem;
            }
            .semester-button {
              padding: 1rem 1.5rem;
              font-size: 0.95rem;
              border-radius: 20px;
              min-height: 52px;
              gap: 12px;
            }
            .arrow {
              font-size: 1.1rem;
            }
            .decorative-1 {
              width: 110px;
              height: 110px;
              top: -60px;
              right: -60px;
            }
            .decorative-2 {
              width: 85px;
              height: 85px;
              bottom: -40px;
              left: -40px;
            }
            .decorative-3 {
              width: 5px;
              height: 5px;
            }
            .decorative-4 {
              width: 4px;
              height: 4px;
            }
          }
          
          /* Large Desktop (1440px and up) */
          @media (min-width: 1440px) {
            .semester-card {
              border-radius: 30px;
              margin: 16px;
              min-height: 460px;
              width: 420px;
              max-width: 420px;
            }
            .semester-card-top {
              height: 300px;
            }
            .semester-card-content {
              padding: 1.8rem;
            }
            .semester-label {
              font-size: 2.6rem;
              margin-bottom: 12px;
            }
            .semester-description {
              font-size: 1.15rem;
            }
            .semester-button {
              padding: 1.1rem 1.6rem;
              font-size: 1rem;
              border-radius: 22px;
              min-height: 54px;
              gap: 13px;
            }
            .arrow {
              font-size: 1.15rem;
            }
            .decorative-1 {
              width: 120px;
              height: 120px;
              top: -65px;
              right: -65px;
            }
            .decorative-2 {
              width: 90px;
              height: 90px;
              bottom: -45px;
              left: -45px;
            }
            .decorative-3 {
              width: 6px;
              height: 6px;
            }
            .decorative-4 {
              width: 4px;
              height: 4px;
            }
          }
          
          /* Landscape orientation optimizations for phones */
          @media (max-height: 500px) and (orientation: landscape) {
            .semester-card {
              min-height: 280px;
            }
            .semester-card-top {
              height: 160px;
            }
            .semester-card-content {
              padding: 0.8rem;
            }
            .semester-label {
              font-size: 1.4rem;
              margin-bottom: 6px;
            }
            .semester-description {
              font-size: 0.7rem;
            }
            .semester-button {
              padding: 0.6rem 1rem;
              font-size: 0.7rem;
              min-height: 36px;
            }
          }
          
          /* Very large screens - limit max size */
          @media (min-width: 1920px) {
            .semester-card {
              width: 450px;
              max-width: 450px;
              min-height: 480px;
            }
            .semester-card-top {
              height: 320px;
            }
            .semester-label {
              font-size: 2.8rem;
            }
            .semester-description {
              font-size: 1.2rem;
            }
          }
        `
      }} />
      <Link 
        to={`/semester/${semester._id}/types`}
        className="semester-card"
        onMouseEnter={(e) => handleCardHover(e, true)}
        onMouseLeave={(e) => handleCardHover(e, false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="semester-card-top"
          style={{ background: sectionStyle.gradient }}
        >
          {/* Enhanced decorative elements */}
          <div className="decorative-1"></div>
          <div className="decorative-2"></div>
          <div className="decorative-3"></div>
          <div className="decorative-4"></div>
          
          <span className="semester-label">{semesterLabel}</span>
          <span className="semester-description">Explorez les ressources</span>
        </div>
        
        <div className="semester-card-content">
          <button
            className="semester-button"
            style={{
              background: `linear-gradient(135deg, ${sectionStyle.color}12, ${sectionStyle.color}08, transparent)`,
              border: `2px solid ${sectionStyle.color}20`,
              color: sectionStyle.color
            }}
            onMouseEnter={(e) => handleButtonHover(e, true)}
            onMouseLeave={(e) => handleButtonHover(e, false)}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Ouvrir 
            <span className="arrow">→</span>
          </button>
        </div>
      </Link>
    </>
  );
};
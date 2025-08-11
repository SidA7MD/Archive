import React from 'react';
import { Link } from 'react-router-dom';

const typeStyles = {
  'cours': {
    gradient: 'linear-gradient(135deg, #ffb37e 0%, #f28ba0 50%, #ff7fa3 100%)',
    color: '#e65f2b',
    icon: '📚',
    image: 'https://i.pinimg.com/736x/ea/c1/94/eac194c170210319a1c0906a4169ad79.jpg',
    description: 'Accédez à tous les documents et ressources du cours',
    shadow: 'rgba(230, 95, 43, 0.3)'
  },
  'tp': {
    gradient: 'linear-gradient(135deg, #fde68a 0%,rgb(197, 123, 123) 50%, #f59e67 100%)',
    color: '#d4af14',
    icon: '🔬',
    image: 'https://media.gettyimages.com/id/519765301/vector/overhead-view-of-people-discussing-at-round-table.jpg?s=612x612&w=gi&k=20&c=-6vYwNdEFXbTh5e4vfHDXa5vLzD2cskB2ReOwAzth2g=',
    description: 'Travaux pratiques et laboratoires',
    shadow: 'rgba(212, 175, 20, 0.3)'
  },
  'td': {
    gradient: 'linear-gradient(135deg, #8ce3cf 0%,rgb(87, 124, 124) 50%, #5cbfd2 100%)',
    color: '#00a67d',
    icon: '✏️',
    image: 'https://png.pngtree.com/png-vector/20230729/ourlarge/pngtree-meeting-clipart-group-of-people-sitting-around-the-table-cartoon-vector-png-image_6811881.png',
    description: 'Travaux dirigés et exercices pratiques',
    shadow: 'rgba(0, 166, 125, 0.3)'
  },
  'devoirs': {
    gradient: 'linear-gradient(135deg, #d5b4ff 0%,rgb(133, 51, 180) 50%, #c77dff 100%)',
    color: '#8b00d9',
    icon: '📝',
    image: 'https://i.pinimg.com/736x/53/ad/2b/53ad2bc43869800df382394fa29419d6.jpg',
    description: 'Consultez et soumettez vos devoirs',
    shadow: 'rgba(139, 0, 217, 0.3)'
  },
  'compositions': {
    gradient: 'linear-gradient(135deg, #a8b6ff 0%,rgb(69, 34, 156) 50%, #9d85ff 100%)',
    color: '#3538a8',
    icon: '📋',
    image: 'https://i.pinimg.com/736x/65/f7/4a/65f74ad156b5b5fcd256695209b114e7.jpg',
    description: 'Préparez vos examens avec les annales',
    shadow: 'rgba(53, 56, 168, 0.3)'
  },
  'ratrapages': {
    gradient: 'linear-gradient(135deg, #a5b4fc 0%,rgb(93, 67, 170) 50%, #8f85ff 100%)',
    color: '#5a6bc4',
    icon: '🔄',
    image: 'https://i.pinimg.com/736x/fd/6f/58/fd6f58b85308c304c7dd406453ff42f8.jpg',
    description: 'Documents pour les sessions de rattrapage',
    shadow: 'rgba(90, 107, 196, 0.3)'
  }
};

// Default style for unknown types
const getTypeStyle = (typeName) => {
  const normalizedName = typeName.toLowerCase();
  return typeStyles[normalizedName] || {
    gradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    color: '#64748b',
    icon: '📄',
    image: 'https://i.pinimg.com/736x/ea/c1/94/eac194c170210319a1c0906a4169ad79.jpg',
    description: 'Documents et ressources académiques',
    shadow: 'rgba(100, 116, 139, 0.4)'
  };
};

export const TypeCard = ({ type, semesterId }) => {
  const style = getTypeStyle(type.name);

  // Enhanced hover handlers with better mobile support
  const handleCardHover = (e, isHovering) => {
    // Only apply hover effects on non-touch devices
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      if (isHovering) {
        e.currentTarget.style.transform = 'translateY(-6px) scale(1.008)';
        e.currentTarget.style.boxShadow = `0 12px 40px rgba(0, 0, 0, 0.1), 0 4px 16px ${style.shadow}`;
        e.currentTarget.style.borderColor = `${style.color}20`;
      } else {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 8px rgba(0, 0, 0, 0.04)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.8)';
      }
    }
  };

  const handleButtonHover = (e, isHovering) => {
    // Only apply hover effects on non-touch devices
    if (window.matchMedia && window.matchMedia('(hover: hover)').matches) {
      if (isHovering) {
        e.currentTarget.style.background = `linear-gradient(135deg, ${style.color}16, ${style.color}10, ${style.color}06)`;
        e.currentTarget.style.transform = 'translateY(-1px) scale(1.005)';
        e.currentTarget.style.boxShadow = `0 6px 16px ${style.color}25`;
        e.currentTarget.style.borderColor = `${style.color}30`;
        const arrow = e.currentTarget.querySelector('.arrow');
        if (arrow) arrow.style.transform = 'translateX(3px)';
      } else {
        e.currentTarget.style.background = `linear-gradient(135deg, ${style.color}12, ${style.color}08, transparent)`;
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = `${style.color}20`;
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
            50% { transform: translateY(-8px) rotate(3deg); }
          }
          @keyframes float2 {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-6px) rotate(-2deg); }
          }
          @keyframes twinkle {
            0%, 100% { opacity: 0.4; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.3); }
          }
          
          .type-card {
            width: 100%;
            border-radius: 16px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 8px rgba(0, 0, 0, 0.04);
            background-color: white;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            border: 1px solid rgba(255, 255, 255, 0.8);
            position: relative;
            text-decoration: none;
            color: inherit;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            margin: 8px;
            min-height: 340px;
            max-width: none;
          }
          
          .type-card-header {
            height: 180px;
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            padding: 1.2rem;
          }
          
          .type-card-content {
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
            flex: 1;
            justify-content: space-between;
            background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%);
            min-height: 140px;
          }
          
          .type-card-icon {
            width: 44px;
            height: 44px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            z-index: 2;
          }
          
          .type-card-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: white;
            margin: 0;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            line-height: 1.2;
            text-transform: capitalize;
            z-index: 2;
            letter-spacing: -0.01em;
          }
          
          .type-card-description {
            font-size: 0.9rem;
            color: #64748b;
            margin: 0;
            line-height: 1.4;
            font-weight: 400;
            flex: 1;
            letter-spacing: 0.01em;
          }
          
          .type-card-button {
            border: 2px solid transparent;
            border-radius: 14px;
            padding: 0.8rem 1.2rem;
            font-size: 0.85rem;
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
            min-height: 46px;
          }
          
          .arrow {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 1rem;
            font-weight: bold;
          }
          
          .background-image {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-size: cover;
            background-position: center;
            opacity: 0.3;
            mix-blend-mode: overlay;
          }
          
          .overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.1);
          }
          
          .decorative-1 {
            position: absolute;
            top: -25px;
            right: -25px;
            width: 55px;
            height: 55px;
            background: rgba(255, 255, 255, 0.12);
            border-radius: 50%;
            animation: float1 6s ease-in-out infinite;
          }
          
          .decorative-2 {
            position: absolute;
            bottom: -12px;
            left: -12px;
            width: 40px;
            height: 40px;
            background: rgba(255, 255, 255, 0.1);
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
            .type-card {
              margin: 6px;
              border-radius: 14px;
              min-height: 320px;
            }
            .type-card-header {
              height: 160px;
              padding: 1rem;
            }
            .type-card-content {
              padding: 0.9rem;
              gap: 0.9rem;
              min-height: 130px;
            }
            .type-card-title {
              font-size: 1.25rem;
            }
            .type-card-description {
              font-size: 0.85rem;
              line-height: 1.35;
            }
            .type-card-button {
              padding: 0.7rem 1rem;
              font-size: 0.8rem;
              border-radius: 12px;
              min-height: 42px;
              gap: 8px;
            }
            .type-card-icon {
              width: 40px;
              height: 40px;
              font-size: 1rem;
              border-radius: 10px;
            }
            .arrow {
              font-size: 0.9rem;
            }
          }
          
          /* Small Phones (375px - 413px) */
          @media (min-width: 375px) and (max-width: 413px) {
            .type-card {
              margin: 7px;
              border-radius: 15px;
              min-height: 350px;
            }
            .type-card-header {
              height: 170px;
              padding: 1.1rem;
            }
            .type-card-content {
              padding: 0.95rem;
              gap: 0.95rem;
              min-height: 135px;
            }
            .type-card-title {
              font-size: 1.3rem;
            }
            .type-card-description {
              font-size: 0.87rem;
              line-height: 1.37;
            }
            .type-card-button {
              padding: 0.75rem 1.1rem;
              font-size: 0.82rem;
              border-radius: 13px;
              min-height: 44px;
              gap: 9px;
            }
            .type-card-icon {
              width: 42px;
              height: 42px;
              font-size: 1.05rem;
              border-radius: 11px;
            }
            .arrow {
              font-size: 0.95rem;
            }
          }
          
          /* Medium Phones (414px - 479px) */
          @media (min-width: 414px) and (max-width: 479px) {
            .type-card {
              margin: 8px;
              border-radius: 16px;
              min-height: 360px;
            }
            .type-card-header {
              height: 180px;
              padding: 1.2rem;
            }
            .type-card-content {
              padding: 1rem;
              gap: 1rem;
              min-height: 140px;
            }
            .type-card-title {
              font-size: 1.35rem;
            }
            .type-card-description {
              font-size: 0.88rem;
              line-height: 1.38;
            }
            .type-card-button {
              padding: 0.8rem 1.15rem;
              font-size: 0.84rem;
              border-radius: 14px;
              min-height: 46px;
              gap: 9px;
            }
            .type-card-icon {
              width: 43px;
              height: 43px;
              font-size: 1.08rem;
              border-radius: 11px;
            }
          }
          
          /* Large Phones (480px - 767px) */
          @media (min-width: 480px) and (max-width: 767px) {
            .type-card {
              margin: 10px;
              border-radius: 18px;
              min-height: 380px;
            }
            .type-card-header {
              height: 200px;
              padding: 1.3rem;
            }
            .type-card-content {
              padding: 1.1rem;
              gap: 1.1rem;
              min-height: 150px;
            }
            .type-card-title {
              font-size: 1.45rem;
            }
            .type-card-description {
              font-size: 0.92rem;
              line-height: 1.42;
            }
            .type-card-button {
              padding: 0.85rem 1.25rem;
              font-size: 0.87rem;
              border-radius: 15px;
              min-height: 48px;
              gap: 10px;
            }
            .type-card-icon {
              width: 46px;
              height: 46px;
              font-size: 1.15rem;
              border-radius: 12px;
            }
            .decorative-1 {
              width: 60px;
              height: 60px;
              top: -30px;
              right: -30px;
            }
            .decorative-2 {
              width: 45px;
              height: 45px;
              bottom: -15px;
              left: -15px;
            }
          }
          
          /* Tablets (768px and up) */
          @media (min-width: 768px) {
            .type-card {
              border-radius: 24px;
              margin: 15px;
              min-height: 480px;
              max-width: 500px;
            }
            .type-card-header {
              height: 280px;
              padding: 2rem;
            }
            .type-card-content {
              padding: 1.5rem;
              gap: 1.3rem;
              min-height: 180px;
            }
            .type-card-title {
              font-size: 2rem;
            }
            .type-card-description {
              font-size: 1.1rem;
              line-height: 1.5;
            }
            .type-card-button {
              padding: 1.1rem 1.6rem;
              font-size: 1rem;
              border-radius: 20px;
              min-height: 56px;
              gap: 12px;
            }
            .type-card-icon {
              width: 60px;
              height: 60px;
              font-size: 1.5rem;
              border-radius: 16px;
            }
            .arrow {
              font-size: 1.2rem;
            }
            .decorative-1 {
              width: 80px;
              height: 80px;
              top: -35px;
              right: -35px;
            }
            .decorative-2 {
              width: 60px;
              height: 60px;
              bottom: -18px;
              left: -18px;
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
          
          /* Desktop */
          @media (min-width: 1024px) {
            .type-card {
              border-radius: 28px;
              margin: 16px;
              min-height: 460px;
              max-width: 480px;
            }
            .type-card-header {
              height: 260px;
              padding: 2rem;
            }
            .type-card-content {
              padding: 1.6rem;
              gap: 1.2rem;
              min-height: 170px;
            }
            .type-card-title {
              font-size: 2rem;
              letter-spacing: -0.02em;
            }
            .type-card-description {
              font-size: 1.1rem;
              line-height: 1.5;
            }
            .type-card-button {
              padding: 1.1rem 1.6rem;
              font-size: 1rem;
              border-radius: 20px;
              min-height: 54px;
              gap: 12px;
            }
            .type-card-icon {
              width: 60px;
              height: 60px;
              font-size: 1.5rem;
              border-radius: 16px;
            }
            .arrow {
              font-size: 1.15rem;
            }
          }
          
          /* Large Desktop */
          @media (min-width: 1440px) {
            .type-card {
              border-radius: 32px;
              margin: 18px;
              min-height: 500px;
              max-width: 520px;
            }
            .type-card-header {
              height: 280px;
              padding: 2.2rem;
            }
            .type-card-content {
              padding: 1.8rem;
              gap: 1.4rem;
              min-height: 180px;
            }
            .type-card-title {
              font-size: 2.2rem;
              letter-spacing: -0.02em;
            }
            .type-card-description {
              font-size: 1.15rem;
              line-height: 1.55;
            }
            .type-card-button {
              padding: 1.2rem 1.8rem;
              font-size: 1.05rem;
              border-radius: 22px;
              min-height: 56px;
              gap: 13px;
            }
            .type-card-icon {
              width: 64px;
              height: 64px;
              font-size: 1.6rem;
              border-radius: 18px;
            }
            .arrow {
              font-size: 1.2rem;
            }
            .decorative-1 {
              width: 80px;
              height: 80px;
              top: -35px;
              right: -35px;
            }
            .decorative-2 {
              width: 60px;
              height: 60px;
              bottom: -18px;
              left: -18px;
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
          
          /* Landscape orientation optimizations for phones */
          @media (max-height: 500px) and (orientation: landscape) {
            .type-card {
              min-height: 280px;
            }
            .type-card-header {
              height: 140px;
              padding: 1rem;
            }
            .type-card-content {
              padding: 0.8rem;
              gap: 0.8rem;
              min-height: 120px;
            }
            .type-card-title {
              font-size: 1.2rem;
            }
            .type-card-description {
              font-size: 0.8rem;
              line-height: 1.3;
            }
            .type-card-button {
              padding: 0.6rem 1rem;
              font-size: 0.75rem;
              min-height: 38px;
            }
            .type-card-icon {
              width: 36px;
              height: 36px;
              font-size: 0.9rem;
            }
          }
        `
      }} />
      
      <Link 
        to={`/semester/${semesterId}/type/${type._id}/subjects`}
        className="type-card"
        onMouseEnter={(e) => handleCardHover(e, true)}
        onMouseLeave={(e) => handleCardHover(e, false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header with gradient and background image */}
        <div 
          className="type-card-header"
          style={{ background: style.gradient }}
        >
          {/* Background Image */}
          <div 
            className="background-image" 
            style={{ backgroundImage: `url(${style.image})` }}
          />

          {/* Subtle dark overlay for better readability */}
          <div className="overlay" />

          {/* Enhanced decorative elements */}
          <div className="decorative-1"></div>
          <div className="decorative-2"></div>
          <div className="decorative-3"></div>
          <div className="decorative-4"></div>

          {/* Icon */}
          <div className="type-card-icon">
            {style.icon}
          </div>

          {/* Title */}
          <div>
            <h3 className="type-card-title">
              {type.displayName}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div className="type-card-content">
          {/* Description */}
          <p className="type-card-description">
            {style.description}
          </p>

          {/* Button */}
          <button
            className="type-card-button"
            style={{
              background: `linear-gradient(135deg, ${style.color}12, ${style.color}08, transparent)`,
              borderColor: `${style.color}20`,
              color: style.color
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
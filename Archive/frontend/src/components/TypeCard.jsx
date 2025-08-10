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

  const cardStyle = {
    width: '100%',
    minWidth: '400px',
    maxWidth: '500px',
    height: '480px',
    minHeight: '480px',
    borderRadius: '24px',
    boxShadow: `0 6px 25px rgba(0, 0, 0, 0.1), 0 2px 12px rgba(0, 0, 0, 0.05)`,
    backgroundColor: 'white',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    position: 'relative',
    textDecoration: 'none',
    color: 'inherit',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    margin: '12px',
    '@media (min-width: 768px)': {
      borderRadius: '32px',
      margin: '20px',
      minHeight: '540px',
      maxWidth: '600px',
    },
    '@media (min-width: 1024px)': {
      borderRadius: '40px',
      // margin: '28px',
      minHeight: '560px',
      maxWidth: '720px',
    },
    '@media (min-width: 1440px)': {
      borderRadius: '48px',
      margin: '32px',
      minHeight: '760px',
      maxWidth: '820px',
    }
  };

  const headerStyle = {
    height: '340px',
    background: style.gradient,
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '1.5rem',
    '@media (min-width: 768px)': {
      height: '420px',
      padding: '2.2rem',
    },
    '@media (min-width: 1024px)': {
      height: '400px',
      padding: '3rem',
    },
    '@media (min-width: 1440px)': {
      height: '460px',
      padding: '3.5rem',
    }
  };

  // Background Image
  const backgroundImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `url(${style.image})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: 0.3,
    mixBlendMode: 'overlay',
  };

  // Subtle dark overlay for better readability
  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.1)',
  };

  // Mobile-optimized decorative elements
  const decorativeElementStyle1 = {
    position: 'absolute',
    top: '-30px',
    right: '-30px',
    width: '70px',
    height: '70px',
    background: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '50%',
    animation: 'float1 6s ease-in-out infinite',
    '@media (min-width: 768px)': {
      top: '-35px',
      right: '-35px',
      width: '90px',
      height: '90px',
    },
    '@media (min-width: 1024px)': {
      top: '-40px',
      right: '-40px',
      width: '120px',
      height: '120px',
    }
  };

  const decorativeElementStyle2 = {
    position: 'absolute',
    bottom: '-15px',
    left: '-15px',
    width: '50px',
    height: '50px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '50%',
    animation: 'float2 8s ease-in-out infinite',
    '@media (min-width: 768px)': {
      bottom: '-18px',
      left: '-18px',
      width: '65px',
      height: '65px',
    },
    '@media (min-width: 1024px)': {
      bottom: '-20px',
      left: '-20px',
      width: '80px',
      height: '80px',
    }
  };

  const decorativeElementStyle3 = {
    position: 'absolute',
    top: '20%',
    left: '15%',
    width: '4px',
    height: '4px',
    background: 'rgba(255, 255, 255, 0.4)',
    borderRadius: '50%',
    animation: 'twinkle 4s ease-in-out infinite',
    '@media (min-width: 768px)': {
      width: '5px',
      height: '5px',
    },
    '@media (min-width: 1024px)': {
      width: '6px',
      height: '6px',
    }
  };

  const decorativeElementStyle4 = {
    position: 'absolute',
    bottom: '30%',
    right: '20%',
    width: '3px',
    height: '3px',
    background: 'rgba(255, 255, 255, 0.6)',
    borderRadius: '50%',
    animation: 'twinkle 3s ease-in-out infinite 1s',
    '@media (min-width: 768px)': {
      width: '4px',
      height: '4px',
    },
    '@media (min-width: 1024px)': {
      width: '4px',
      height: '4px',
    }
  };

  // Mobile-first icon style
  const iconStyle = {
    width: '52px',
    height: '52px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    zIndex: 2,
    '@media (min-width: 768px)': {
      width: '68px',
      height: '68px',
      fontSize: '1.7rem',
      borderRadius: '18px',
    },
    '@media (min-width: 1024px)': {
      width: '84px',
      height: '84px',
      fontSize: '2.1rem',
      borderRadius: '24px',
    },
    '@media (min-width: 1440px)': {
      width: '96px',
      height: '96px',
      fontSize: '2.4rem',
      borderRadius: '28px',
    }
  };

  // Mobile-first title style
  const titleStyle = {
    fontSize: '1.6rem',
    fontWeight: '700',
    color: 'white',
    margin: 0,
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
    lineHeight: '1.2',
    textTransform: 'capitalize',
    zIndex: 2,
    letterSpacing: '-0.02em',
    '@media (min-width: 768px)': {
      fontSize: '2.2rem',
    },
    '@media (min-width: 1024px)': {
      fontSize: '2.8rem',
      letterSpacing: '-0.025em',
    },
    '@media (min-width: 1440px)': {
      fontSize: '3.2rem',
      letterSpacing: '-0.03em',
    }
  };

  // Mobile-optimized content area
  const contentStyle = {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    flex: 1,
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%)',
    minHeight: '180px',
    '@media (min-width: 768px)': {
      padding: '1.8rem',
      gap: '1.5rem',
      minHeight: '220px',
    },
    '@media (min-width: 1024px)': {
      padding: '2.4rem',
      gap: '1.8rem',
      minHeight: '260px',
    },
    '@media (min-width: 1440px)': {
      padding: '2.8rem',
      gap: '2rem',
      minHeight: '300px',
    }
  };

  // Mobile-first description
  const descriptionStyle = {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.5',
    fontWeight: '400',
    flex: 1,
    letterSpacing: '0.01em',
    '@media (min-width: 768px)': {
      fontSize: '1.15rem',
      lineHeight: '1.6',
    },
    '@media (min-width: 1024px)': {
      fontSize: '1.3rem',
      lineHeight: '1.6',
    },
    '@media (min-width: 1440px)': {
      fontSize: '1.4rem',
      lineHeight: '1.65',
    }
  };

  // Mobile-optimized button
  const buttonStyle = {
    background: `linear-gradient(135deg, ${style.color}12, ${style.color}08, transparent)`,
    border: `2px solid ${style.color}20`,
    color: style.color,
    borderRadius: '18px',
    padding: '1rem 1.5rem',
    fontSize: '0.95rem',
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
    minHeight: '52px', // Ensures touch-friendly size
    '@media (min-width: 768px)': {
      borderRadius: '24px',
      padding: '1.2rem 1.8rem',
      fontSize: '1.1rem',
      gap: '14px',
      minHeight: '58px',
    },
    '@media (min-width: 1024px)': {
      borderRadius: '28px',
      padding: '1.4rem 2.2rem',
      fontSize: '1.25rem',
      gap: '16px',
      minHeight: '64px',
    },
    '@media (min-width: 1440px)': {
      borderRadius: '32px',
      padding: '1.6rem 2.6rem',
      fontSize: '1.35rem',
      gap: '18px',
      minHeight: '70px',
    }
  };

  const arrowStyle = {
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    '@media (min-width: 768px)': {
      fontSize: '1.25rem',
    },
    '@media (min-width: 1024px)': {
      fontSize: '1.4rem',
    },
    '@media (min-width: 1440px)': {
      fontSize: '1.5rem',
    }
  };

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
          
          /* Mobile-specific optimizations */
          @media (max-width: 767px) {
            .type-card {
              margin: 8px !important;
              border-radius: 20px !important;
              min-height: 380px !important;
            }
            .type-card-header {
              height: 220px !important;
              padding: 1.4rem !important;
            }
            .type-card-content {
              padding: 1.1rem !important;
              gap: 1.1rem !important;
              min-height: 160px !important;
            }
            .type-card-title {
              font-size: 1.5rem !important;
            }
            .type-card-description {
              font-size: 0.95rem !important;
              line-height: 1.45 !important;
            }
            .type-card-button {
              padding: 0.9rem 1.35rem !important;
              font-size: 0.9rem !important;
              border-radius: 16px !important;
              min-height: 50px !important;
            }
            .type-card-icon {
              width: 48px !important;
              height: 48px !important;
              font-size: 1.2rem !important;
              border-radius: 12px !important;
            }
          }
          
          /* Ensure touch targets are large enough */
          @media (max-width: 480px) {
            .type-card-button {
              min-height: 48px !important;
              padding: 0.8rem 1.2rem !important;
            }
          }
        `
      }} />
      <Link 
        to={`/semester/${semesterId}/type/${type._id}/subjects`}
        style={cardStyle}
        className="type-card"
        onMouseEnter={(e) => handleCardHover(e, true)}
        onMouseLeave={(e) => handleCardHover(e, false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header with gradient and background image */}
        <div style={headerStyle} className="type-card-header">
          {/* Background Image */}
          <div style={backgroundImageStyle} />

          {/* Subtle dark overlay for better readability */}
          <div style={overlayStyle} />

          {/* Enhanced decorative elements - smaller on mobile */}
          <div style={decorativeElementStyle1}></div>
          <div style={decorativeElementStyle2}></div>
          <div style={decorativeElementStyle3}></div>
          <div style={decorativeElementStyle4}></div>

          {/* Icon */}
          <div style={iconStyle} className="type-card-icon">
            {style.icon}
          </div>

          {/* Title */}
          <div>
            <h3 style={titleStyle} className="type-card-title">
              {type.displayName}
            </h3>
          </div>
        </div>

        {/* Content */}
        <div style={contentStyle} className="type-card-content">
          {/* Description */}
          <p style={descriptionStyle} className="type-card-description">
            {style.description}
          </p>

          {/* Button */}
          <button
            style={buttonStyle}
            className="type-card-button"
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
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Mail, Github } from 'lucide-react';
import logo from '../images/logo-supnum2.png';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);
  const burgerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        burgerRef.current &&
        !burgerRef.current.contains(e.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [menuOpen]);

  const handleClose = () => {
    setMenuOpen(false);
  };

  // Updated header style with increased height and smooth animations
  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 clamp(24px, 5vw, 48px)', // Increased padding for better proportion
    margin: '0',
    background: 'linear-gradient(135deg, #E6F4EA 0%, #F0F9FF 100%)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    width: '100%',
    boxSizing: 'border-box',
    zIndex: 1000,
    height: 'clamp(90px, 12vw, 120px)', // Increased height significantly
    borderBottom: '1px solid rgba(16, 185, 129, 0.1)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    animation: 'slideDown 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const logoContainerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'clamp(16px, 3vw, 20px)',
    cursor: 'pointer',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    textDecoration: 'none',
    transform: 'translateX(0)',
    filter: 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.1))',
  };

  const logoImgStyle = {
    height: 'clamp(48px, 8vw, 64px)', // Increased logo size significantly
    width: 'auto',
    objectFit: 'contain',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    filter: 'brightness(1.05) contrast(1.1)',
  };
  const logoTextStyle = {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.1,
  };

  const projectNameTopStyle = {
    fontSize: 'clamp(1.5rem, 4vw, 1.8rem)', // Increased font size
    fontWeight: '700',
    color: '#1e293b',
    letterSpacing: '-0.5px',
    background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #059669 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: '0 4px 8px rgba(16, 185, 129, 0.15)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  const helpBtnStyle = {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    cursor: 'pointer',
    width: 'clamp(48px, 10vw, 56px)', // Increased size
    height: 'clamp(48px, 10vw, 56px)', // Increased size
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transform: 'scale(1)',
  };

  const iconStyle = {
    color: '#64748b',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    width: 'clamp(22px, 5vw, 26px)', // Increased icon size
    height: 'clamp(22px, 5vw, 26px)', // Increased icon size
    filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
  };

  const helpPanelStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    height: '100vh',
    width: '100%',
    maxWidth: 'clamp(100%, 90vw, 480px)',
    background: '#E6F4EA',
    zIndex: 1100,
    transform: menuOpen ? 'translateX(0)' : 'translateX(100%)',
    transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };

  const panelContentStyle = {
    flex: 1,
    padding: 'clamp(24px, 6vw, 32px) clamp(20px, 4vw, 24px) 0',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    position: 'relative',
  };

  const panelTitleStyle = {
    fontSize: 'clamp(1.8rem, 6vw, 2.25rem)',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: 'clamp(24px, 6vw, 32px)',
    position: 'relative',
    paddingBottom: '16px',
    letterSpacing: '-0.5px',
    lineHeight: 1.2,
  };

  const panelTextStyle = {
    fontSize: 'clamp(1rem, 2.5vw, 1.15rem)',
    lineHeight: 1.7,
    color: '#374151',
    marginBottom: 'clamp(32px, 8vw, 48px)',
    position: 'relative',
    padding: 'clamp(20px, 4vw, 24px)',
    background: 'rgba(255, 255, 255, 0.8)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    fontWeight: '400',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.3s ease',
  };

  const contactLinksStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 'clamp(16px, 4vw, 20px)',
    marginBottom: 'clamp(24px, 6vw, 32px)',
    flexWrap: 'wrap',
    padding: '0 clamp(16px, 4vw, 24px)',
  };

  const contactLinkStyle = {
    padding: 'clamp(12px, 3vw, 16px)',
    background: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '50%',
    width: 'clamp(48px, 10vw, 60px)',
    height: 'clamp(48px, 10vw, 60px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    color: '#64748b',
  };

  const closeBtnStyle = {
    width: '100%',
    maxWidth: 'clamp(200px, 60vw, 300px)',
    margin: '0 auto clamp(24px, 6vw, 32px)',
    padding: 'clamp(12px, 3vw, 16px)',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#64748b',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
  };

  const backdropStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1050,
    opacity: menuOpen ? 1 : 0,
    visibility: menuOpen ? 'visible' : 'hidden',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
  };

  // Enhanced hover handlers with smoother animations
  const handleLogoHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.transform = 'translateX(-4px) scale(1.02)';
      e.currentTarget.style.filter = 'drop-shadow(0 8px 16px rgba(16, 185, 129, 0.2))';
      const img = e.currentTarget.querySelector('img');
      if (img) img.style.transform = 'rotate(-2deg) scale(1.05)';
    } else {
      e.currentTarget.style.transform = 'translateX(0) scale(1)';
      e.currentTarget.style.filter = 'drop-shadow(0 2px 8px rgba(16, 185, 129, 0.1))';
      const img = e.currentTarget.querySelector('img');
      if (img) img.style.transform = 'rotate(0deg) scale(1)';
    }
  };

  const handleHelpBtnHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(52, 211, 153, 0.1) 100%)';
      e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.2)';
      e.currentTarget.querySelector('.icon').style.color = '#10b981';
      e.currentTarget.querySelector('.icon').style.transform = 'scale(1.1)';
    } else {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.8)';
      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.06)';
      e.currentTarget.querySelector('.icon').style.color = '#64748b';
      e.currentTarget.querySelector('.icon').style.transform = 'scale(1)';
    }
  };

  const handleContactLinkHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
      e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
    } else {
      e.currentTarget.style.color = '#64748b';
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
      e.currentTarget.style.transform = 'translateY(0) scale(1)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
    }
  };

  const handleCloseBtnHover = (e, isHovering) => {
    if (isHovering) {
      e.currentTarget.style.background = 'linear-gradient(135deg, #10b981 0%, #34d399 100%)';
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.3)';
    } else {
      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
      e.currentTarget.style.color = '#64748b';
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.08)';
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes slideDown {
            from {
              transform: translateY(-100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.8;
            }
          }
        `}
      </style>
      <nav style={headerStyle}>
        {/* Logo */}
        <Link
          to="/"
          style={logoContainerStyle}
          onMouseEnter={(e) => handleLogoHover(e, true)}
          onMouseLeave={(e) => handleLogoHover(e, false)}
        >
          <img 
            src={logo} 
            alt="Archiv Logo" 
            style={logoImgStyle}
          />
          <div style={logoTextStyle}>
            <span style={projectNameTopStyle}>Archiv</span>
          </div>
        </Link>

        {/* Menu button */}
        <button
          ref={burgerRef}
          style={helpBtnStyle}
          onClick={() => setMenuOpen(!menuOpen)}
          onMouseEnter={(e) => handleHelpBtnHover(e, true)}
          onMouseLeave={(e) => handleHelpBtnHover(e, false)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X style={iconStyle} className="icon" />
          ) : (
            <Menu style={iconStyle} className="icon" />
          )}
        </button>
      </nav>

      {/* Backdrop */}
      <div style={backdropStyle} onClick={handleClose} />

      {/* Navigation panel */}
      <div ref={menuRef} style={helpPanelStyle}>
        <div style={panelContentStyle}>
          <h3 style={panelTitleStyle}>Navigation</h3>
          <p style={panelTextStyle}>
            Bienvenue dans votre archive universitaire. Cette application vous permet d'accéder facilement à tous vos documents d'étude, cours, devoirs et examens dans un environnement organisé et moderne.
            <br /><br />
            Naviguez simplement vers la page d'accueil pour explorer tous les documents disponibles.
          </p>

          <div style={contactLinksStyle}>
            <Link
              to="/"
              style={contactLinkStyle}
              onClick={handleClose}
              onMouseEnter={(e) => handleContactLinkHover(e, true)}
              onMouseLeave={(e) => handleContactLinkHover(e, false)}
              aria-label="Accueil"
            >
              <Home size={20} />
            </Link>
            <a
              href="mailto:24110@supnum.mr"
              style={contactLinkStyle}
              onMouseEnter={(e) => handleContactLinkHover(e, true)}
              onMouseLeave={(e) => handleContactLinkHover(e, false)}
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
            <a
              href="https://github.com/SidA7MD"
              target="_blank"
              rel="noopener noreferrer"
              style={contactLinkStyle}
              onMouseEnter={(e) => handleContactLinkHover(e, true)}
              onMouseLeave={(e) => handleContactLinkHover(e, false)}
              aria-label="GitHub"
            >
              <Github size={20} />
            </a>
          </div>

          <button
            style={closeBtnStyle}
            onClick={handleClose}
            onMouseEnter={(e) => handleCloseBtnHover(e, true)}
            onMouseLeave={(e) => handleCloseBtnHover(e, false)}
            aria-label="Fermer le panneau de navigation"
          >
            <X size={16} />
            <span>Fermer</span>
          </button>
        </div>
      </div>
    </>
  );
};
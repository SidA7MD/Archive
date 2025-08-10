import React from 'react';
import styled from 'styled-components';

const CardContainer = styled.div`
  width: 100%;
  max-width: clamp(320px, 35vw, 420px);
  padding: 1rem;

  @media (max-width: 768px) {
    max-width: clamp(280px, 85vw, 350px);
    padding: 0.75rem;
  }

  @media (max-width: 480px) {
    max-width: 100%;
    padding: 0.5rem;
  }

  @media (max-width: 360px) {
    padding: 0.25rem;
  }
`;

const CardLink = styled.a`
  width: 100%;
  height: clamp(450px, 60vh, 520px);
  border-radius: 32px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 12px rgba(0, 0, 0, 0.03);
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

  &:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow: 0 16px 50px rgba(0, 0, 0, 0.08), 0 6px 24px ${props => props.shadowColor};
    border-color: ${props => props.borderColor};
  }

  @media (max-width: 768px) {
    height: clamp(400px, 55vh, 460px);
    border-radius: 24px;
    
    &:hover {
      transform: translateY(-4px) scale(1.005);
    }
  }

  @media (max-width: 480px) {
    height: clamp(380px, 60vh, 440px);
    border-radius: 20px;
    
    &:hover {
      transform: translateY(-2px) scale(1.002);
    }
  }
`;

const CurveTop = styled.div`
  height: clamp(240px, 28vh, 300px);
  background: ${props => props.gradient};
  border-bottom-left-radius: 85% 45%;
  border-bottom-right-radius: 85% 45%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -60px;
    right: -60px;
    width: clamp(80px, 15vw, 120px);
    height: clamp(80px, 15vw, 120px);
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    animation: float1 6s ease-in-out infinite;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -30px;
    left: -30px;
    width: clamp(60px, 12vw, 80px);
    height: clamp(60px, 12vw, 80px);
    background: rgba(255, 255, 255, 0.12);
    border-radius: 50%;
    animation: float2 8s ease-in-out infinite;
  }

  @keyframes float1 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-10px) rotate(5deg); }
  }

  @keyframes float2 {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-8px) rotate(-3deg); }
  }

  @media (max-width: 768px) {
    height: clamp(200px, 30vh, 260px);
    
    &::before {
      width: clamp(60px, 12vw, 100px);
      height: clamp(60px, 12vw, 100px);
      top: -40px;
      right: -40px;
    }

    &::after {
      width: clamp(50px, 10vw, 70px);
      height: clamp(50px, 10vw, 70px);
      bottom: -20px;
      left: -20px;
    }
  }

  @media (max-width: 480px) {
    height: clamp(180px, 32vh, 220px);
    
    &::before {
      width: clamp(50px, 10vw, 80px);
      height: clamp(50px, 10vw, 80px);
      top: -30px;
      right: -30px;
    }

    &::after {
      width: clamp(40px, 8vw, 60px);
      height: clamp(40px, 8vw, 60px);
      bottom: -15px;
      left: -15px;
    }
  }
`;

const YearText = styled.span`
  font-size: clamp(1.8rem, 6vw, 2.8rem);
  font-weight: 800;
  text-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 3;
  margin-bottom: clamp(8px, 2vw, 12px);
  letter-spacing: -0.02em;
  font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  @media (max-width: 480px) {
    font-size: clamp(1.6rem, 8vw, 2.2rem);
  }
`;

const Description = styled.span`
  font-size: clamp(0.9rem, 3vw, 1.2rem);
  opacity: 0.95;
  font-weight: 500;
  z-index: 3;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.01em;
  text-align: center;
  max-width: 85%;
  line-height: 1.3;

  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 3.5vw, 1rem);
    max-width: 90%;
  }
`;

const ContentSection = styled.div`
  padding: clamp(1.2rem, 4vw, 2rem);
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,1) 100%);
  flex: 1;

  @media (max-width: 768px) {
    padding: clamp(1rem, 3vw, 1.5rem);
  }

  @media (max-width: 480px) {
    padding: clamp(0.8rem, 2.5vw, 1.2rem);
  }
`;

const YearTitle = styled.h3`
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  font-weight: 700;
  margin-bottom: clamp(0.8rem, 2vw, 1rem);
  color: ${props => props.color};
  letter-spacing: -0.01em;
  line-height: 1.2;

  @media (max-width: 480px) {
    font-size: clamp(1.1rem, 4.5vw, 1.4rem);
    margin-bottom: clamp(0.6rem, 1.5vw, 0.8rem);
  }
`;

const ArchiveInfo = styled.p`
  font-size: clamp(0.85rem, 2.5vw, 1.1rem);
  color: #666;
  line-height: 1.5;
  margin-bottom: clamp(1rem, 3vw, 1.5rem);
  opacity: 0.8;
  max-width: 100%;

  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 3vw, 0.95rem);
    line-height: 1.4;
    margin-bottom: clamp(0.8rem, 2vw, 1.2rem);
  }
`;

const AccessButton = styled.div`
  background: linear-gradient(135deg, ${props => props.color}12, ${props => props.color}08, transparent);
  border: 2px solid ${props => props.color}20;
  color: ${props => props.color};
  border-radius: 24px;
  padding: clamp(0.8rem, 3vw, 1.1rem) clamp(1.2rem, 4vw, 1.9rem);
  font-size: clamp(0.85rem, 2.8vw, 1.1rem);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 12px);
  outline: none;
  width: 100%;
  justify-content: center;
  position: relative;
  overflow: hidden;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  min-height: 44px;

  &:hover {
    background: linear-gradient(135deg, ${props => props.color}16, ${props => props.color}10, ${props => props.color}06);
    transform: translateY(-2px) scale(1.01);
    box-shadow: 0 8px 20px ${props => props.color}25;
    border-color: ${props => props.color}30;
    
    .arrow {
      transform: translateX(4px);
    }
  }

  @media (max-width: 768px) {
    border-radius: 20px;
    
    &:hover {
      transform: translateY(-1px) scale(1.005);
    }
  }

  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 3.2vw, 0.95rem);
    padding: clamp(0.7rem, 2.5vw, 1rem) clamp(1rem, 3vw, 1.5rem);
    border-radius: 18px;
    
    &:hover {
      transform: translateY(-1px) scale(1.002);
    }
  }
`;

const Arrow = styled.span`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: clamp(0.9rem, 2.5vw, 1.2rem);
  font-weight: bold;

  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 3vw, 1rem);
  }
`;

const themes = [
  { 
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 40%, #ff006e 100%)',
    color: '#ff6a00',
    shadow: 'rgba(255, 106, 0, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #a100ff 0%, #c900ff 40%, #7209b7 100%)',
    color: '#a100ff',
    shadow: 'rgba(161, 0, 255, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #3c41c5 0%, #8c52ff 40%, #5b21b6 100%)',
    color: '#3c41c5',
    shadow: 'rgba(60, 65, 197, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #00c896 0%, #00e0d6 40%, #0891b2 100%)',
    color: '#00c896',
    shadow: 'rgba(0, 200, 150, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #facc15 0%, #fb923c 40%, #ea580c 100%)',
    color: '#facc15',
    shadow: 'rgba(250, 204, 21, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 40%, #4f46e5 100%)',
    color: '#667eea',
    shadow: 'rgba(102, 126, 234, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    shadow: 'rgba(240, 147, 251, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    shadow: 'rgba(79, 172, 254, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b',
    shadow: 'rgba(67, 233, 123, 0.4)'
  },
  { 
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    shadow: 'rgba(250, 112, 154, 0.4)'
  }
];

export const YearCard = ({ year, index = 0 }) => {
  const safeYear = year && typeof year === 'object' && !Array.isArray(year)
    ? year
    : { _id: 'default', year: '2024' };

  const theme = themes[index % themes.length];

  return (
    <CardContainer>
      <CardLink 
        href={`/year/${safeYear._id}/files`}
        shadowColor={theme.shadow}
        borderColor={`${theme.color}20`}
      >
        <CurveTop gradient={theme.gradient}>
          <YearText>{safeYear.year}</YearText>
          <Description>Archives Académiques</Description>
        </CurveTop>
        
        <ContentSection>
          <YearTitle color={theme.color}>
            Collection {safeYear.year}
          </YearTitle>
          <ArchiveInfo>
            Accédez aux documents, devoirs et ressources de l'année académique {safeYear.year}. 
            Parcourez les fichiers et matériels organisés.
          </ArchiveInfo>
          <AccessButton color={theme.color}>
            Parcourir les Fichiers
            <Arrow className="arrow">→</Arrow>
          </AccessButton>
        </ContentSection>
      </CardLink>
    </CardContainer>
  );
};

export default YearCard;
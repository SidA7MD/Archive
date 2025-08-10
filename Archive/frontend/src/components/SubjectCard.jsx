import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';

// Animations
const liquidGradient = keyframes`
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-15px) rotate(5deg); }
`;

const floatReverse = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-12px) rotate(-3deg); }
`;

const twinkle = keyframes`
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.5); }
`;

const shimmer = keyframes`
  0% { left: -100%; }
  100% { left: 100%; }
`;

// Styled Components
const CardContainer = styled.div`
  width: 100%;
  max-width: clamp(320px, 90vw, 420px);
  margin: 0 auto;

  @media (max-width: 768px) {
    max-width: clamp(280px, 95vw, 380px);
  }

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const SubjectCardLink = styled(Link)`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: clamp(480px, 55vh, 520px);
  border-radius: 32px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06), 0 2px 12px rgba(0, 0, 0, 0.03);
  background: white;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
  border: 1px solid rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  &:hover {
    transform: translateY(-8px) scale(1.01);
    box-shadow: 0 16px 50px rgba(0, 0, 0, 0.08), 0 6px 24px ${props => props.shadowColor};
    border-color: ${props => props.borderColor};
  }

  @media (max-width: 768px) {
    height: clamp(420px, 50vh, 480px);
    border-radius: 24px;
    
    &:hover {
      transform: translateY(-4px) scale(1.005);
    }
  }

  @media (max-width: 480px) {
    height: auto;
    min-height: 400px;
    border-radius: 20px;
    
    &:hover {
      transform: translateY(-2px) scale(1.002);
    }
  }
`;

const CardHeader = styled.div`
  height: clamp(240px, 28vh, 300px);
  background: ${props => props.gradient};
  background-size: 300% 300%;
  animation: ${liquidGradient} 15s ease infinite;
  border-top-left-radius: 32px;
  border-top-right-radius: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  clip-path: polygon(
    0% 0%, 
    100% 0%, 
    100% 92%, 
    95% 95%, 
    90% 92%, 
    85% 95%, 
    80% 92%, 
    75% 95%, 
    70% 92%, 
    65% 95%, 
    60% 92%, 
    55% 95%, 
    50% 92%, 
    45% 95%, 
    40% 92%, 
    35% 95%, 
    30% 92%, 
    25% 95%, 
    20% 92%, 
    15% 95%, 
    10% 92%, 
    5% 95%, 
    0% 92%
  );

  @media (max-width: 768px) {
    height: clamp(200px, 30vh, 260px);
    border-top-left-radius: 24px;
    border-top-right-radius: 24px;
    clip-path: polygon(
      0% 0%, 
      100% 0%, 
      100% 92%, 
      95% 95%, 
      90% 92%, 
      85% 95%, 
      80% 92%, 
      75% 95%, 
      70% 92%, 
      65% 95%, 
      60% 92%, 
      55% 95%, 
      50% 92%, 
      45% 95%, 
      40% 92%, 
      35% 95%, 
      30% 92%, 
      25% 95%, 
      20% 92%, 
      15% 95%, 
      10% 92%, 
      5% 95%, 
      0% 92%
    );
  }

  @media (max-width: 480px) {
    height: clamp(180px, 32vh, 220px);
    border-top-left-radius: 20px;
    border-top-right-radius: 20px;
    clip-path: polygon(
      0% 0%, 
      100% 0%, 
      100% 92%, 
      95% 95%, 
      90% 92%, 
      85% 95%, 
      80% 92%, 
      75% 95%, 
      70% 92%, 
      65% 95%, 
      60% 92%, 
      55% 95%, 
      50% 92%, 
      45% 95%, 
      40% 92%, 
      35% 95%, 
      30% 92%, 
      25% 95%, 
      20% 92%, 
      15% 95%, 
      10% 92%, 
      5% 95%, 
      0% 92%
    );
  }
`;

const DecorativeCircle1 = styled.div`
  position: absolute;
  bottom: -60px;
  right: -60px;
  width: clamp(100px, 16vw, 140px);
  height: clamp(100px, 16vw, 140px);
  background: rgba(255, 255, 255, 0.12);
  border-radius: 50%;
  animation: ${float} 10s ease-in-out infinite;

  @media (max-width: 768px) {
    width: clamp(80px, 12vw, 120px);
    height: clamp(80px, 12vw, 120px);
    bottom: -40px;
    right: -40px;
  }

  @media (max-width: 480px) {
    width: clamp(60px, 10vw, 100px);
    height: clamp(60px, 10vw, 100px);
    bottom: -30px;
    right: -30px;
  }
`;

const DecorativeCircle2 = styled.div`
  position: absolute;
  top: -30px;
  left: -30px;
  width: clamp(70px, 12vw, 100px);
  height: clamp(70px, 12vw, 100px);
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  animation: ${floatReverse} 12s ease-in-out infinite;

  @media (max-width: 768px) {
    width: clamp(60px, 10vw, 80px);
    height: clamp(60px, 10vw, 80px);
    top: -20px;
    left: -20px;
  }

  @media (max-width: 480px) {
    width: clamp(50px, 8vw, 70px);
    height: clamp(50px, 8vw, 70px);
    top: -15px;
    left: -15px;
  }
`;

const Twinkle = styled.div`
  position: absolute;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: ${twinkle} 4s ease-in-out infinite;
  
  &.twinkle-1 {
    bottom: 20%;
    left: 15%;
    width: 6px;
    height: 6px;
  }
  
  &.twinkle-2 {
    top: 30%;
    right: 20%;
    width: 8px;
    height: 8px;
    animation-delay: 2s;
  }
  
  &.twinkle-3 {
    bottom: 65%;
    left: 85%;
    width: 4px;
    height: 4px;
    animation-delay: 1s;
  }

  @media (max-width: 480px) {
    &.twinkle-1, &.twinkle-2 {
      width: 4px;
      height: 4px;
    }
    
    &.twinkle-3 {
      width: 3px;
      height: 3px;
    }
  }
`;

const InitialsContainer = styled.div`
  width: clamp(80px, 12vw, 110px);
  height: clamp(80px, 12vw, 110px);
  border-radius: 50%;
  background: 
    linear-gradient(145deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.15) 100%),
    linear-gradient(45deg, rgba(255, 255, 255, 0.2), transparent);
  border: 2px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.15),
    inset 0 2px 0 rgba(255, 255, 255, 0.5),
    inset 0 -1px 0 rgba(255, 255, 255, 0.3);
  z-index: 10;
  position: relative;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    width: clamp(70px, 10vw, 90px);
    height: clamp(70px, 10vw, 90px);
  }

  @media (max-width: 480px) {
    width: clamp(60px, 12vw, 80px);
    height: clamp(60px, 12vw, 80px);
  }
`;

const Initials = styled.span`
  font-size: clamp(1.8rem, 4vw, 2.8rem);
  font-weight: 900;
  color: white;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
  letter-spacing: -0.02em;
  position: relative;
  z-index: 2;

  @media (max-width: 768px) {
    font-size: clamp(1.6rem, 3.5vw, 2.2rem);
  }

  @media (max-width: 480px) {
    font-size: clamp(1.4rem, 4vw, 1.8rem);
  }
`;

const CardTitle = styled.h3`
  margin-top: clamp(12px, 2vw, 22px);
  font-size: clamp(1.2rem, 3.5vw, 1.9rem);
  font-weight: 700;
  color: white;
  text-align: center;
  max-width: clamp(140px, 80%, 200px);
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  text-transform: capitalize;
  filter: drop-shadow(0 3px 8px rgba(0, 0, 0, 0.4));
  transition: all 0.4s ease;
  line-height: 1.2;
  margin-bottom: 0;

  ${SubjectCardLink}:hover & {
    transform: scale(1.06) translateY(-4px);
  }

  @media (max-width: 768px) {
    font-size: clamp(1.1rem, 3vw, 1.5rem);
    max-width: 90%;
    
    ${SubjectCardLink}:hover & {
      transform: scale(1.02) translateY(-2px);
    }
  }

  @media (max-width: 480px) {
    font-size: clamp(1rem, 3.5vw, 1.3rem);
    margin-top: clamp(8px, 1.5vw, 16px);
    
    ${SubjectCardLink}:hover & {
      transform: scale(1.01) translateY(-1px);
    }
  }
`;

const CardContent = styled.div`
  flex: 1;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(1rem, 3vw, 1.6rem);
  background: 
    radial-gradient(circle at top left, rgba(255,255,255,0.95) 0%, rgba(255,255,255,1) 50%),
    linear-gradient(135deg, rgba(248,250,252,1) 0%, rgba(255,255,255,1) 100%);
  position: relative;
  border-bottom-left-radius: 32px;
  border-bottom-right-radius: 32px;

  @media (max-width: 768px) {
    padding: clamp(1.2rem, 3vw, 2rem);
    gap: clamp(0.8rem, 2vw, 1.2rem);
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
  }

  @media (max-width: 480px) {
    padding: clamp(1rem, 2.5vw, 1.5rem);
    gap: clamp(0.8rem, 2vw, 1rem);
    border-bottom-left-radius: 20px;
    border-bottom-right-radius: 20px;
  }
`;

const CardDescription = styled.p`
  text-align: center;
  color: #64748b;
  font-size: clamp(0.85rem, 2.5vw, 1.05rem);
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: 0.01em;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  margin: 0;
  max-width: clamp(240px, 90%, 280px);
  background: linear-gradient(135deg, #64748b, #475569);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${props => props.accentColor}40, transparent);
    border-radius: 1px;
  }

  @media (max-width: 768px) {
    font-size: clamp(0.8rem, 2.2vw, 0.95rem);
    max-width: 95%;
  }

  @media (max-width: 480px) {
    font-size: clamp(0.75rem, 2.5vw, 0.9rem);
    line-height: 1.3;
    
    &::after {
      width: 30px;
      height: 1.5px;
      bottom: -6px;
    }
  }
`;

const CardButton = styled.button`
  background: 
    linear-gradient(145deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%),
    linear-gradient(135deg, ${props => props.color}08, ${props => props.color}04);
  border: 2px solid rgba(255,255,255,0.8);
  color: ${props => props.color};
  border-radius: 20px;
  padding: clamp(0.8rem, 3vw, 1.2rem) clamp(1.2rem, 4vw, 2.1rem);
  font-size: clamp(0.8rem, 2.5vw, 1.05rem);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  gap: clamp(8px, 2vw, 12px);
  width: 100%;
  max-width: clamp(200px, 80%, 240px);
  justify-content: center;
  text-transform: uppercase;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  letter-spacing: 0.025em;
  box-shadow: 
    0 8px 25px rgba(0,0,0,0.06),
    0 4px 12px ${props => props.color}10,
    inset 0 1px 0 rgba(255,255,255,0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  min-height: 44px;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }

  &:hover {
    background: 
      linear-gradient(145deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 100%),
      linear-gradient(135deg, ${props => props.color}12, ${props => props.color}06);
    transform: translateY(-3px) scale(1.02);
    box-shadow: 
      0 12px 35px rgba(0,0,0,0.08),
      0 6px 20px ${props => props.color}20,
      inset 0 1px 0 rgba(255,255,255,1);
    border-color: rgba(255,255,255,1);
  }

  @media (max-width: 768px) {
    border-radius: 18px;
    max-width: 90%;
    
    &:hover {
      transform: translateY(-2px) scale(1.01);
    }
  }

  @media (max-width: 480px) {
    font-size: clamp(0.75rem, 2.8vw, 0.9rem);
    padding: clamp(0.7rem, 2vw, 1rem) clamp(1rem, 3vw, 1.5rem);
    border-radius: 16px;
    max-width: 95%;
    
    &:hover {
      transform: translateY(-1px) scale(1.005);
    }
  }
`;

const Arrow = styled.span`
  transition: all 0.4s ease;
  font-weight: bold;
  font-size: clamp(0.9rem, 2vw, 1.1rem);

  ${CardButton}:hover & {
    transform: translateX(4px) scale(1.1);
  }

  @media (max-width: 768px) {
    ${CardButton}:hover & {
      transform: translateX(2px) scale(1.05);
    }
  }

  @media (max-width: 480px) {
    font-size: clamp(0.8rem, 2.2vw, 1rem);
    
    ${CardButton}:hover & {
      transform: translateX(1px) scale(1.02);
    }
  }
`;

const cardThemes = [
  { 
    gradient: 'linear-gradient(135deg, #ff6a00 0%, #ee0979 40%, #ff006e 100%)',
    color: '#ff6a00',
    shadow: 'rgba(255, 106, 0, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #a100ff 0%, #c900ff 40%, #7209b7 100%)',
    color: '#a100ff',
    shadow: 'rgba(161, 0, 255, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #3c41c5 0%, #8c52ff 40%, #5b21b6 100%)',
    color: '#3c41c5',
    shadow: 'rgba(60, 65, 197, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #00c896 0%, #00e0d6 40%, #0891b2 100%)',
    color: '#00c896',
    shadow: 'rgba(0, 200, 150, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #facc15 0%, #fb923c 40%, #ea580c 100%)',
    color: '#facc15',
    shadow: 'rgba(250, 204, 21, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 40%, #4f46e5 100%)',
    color: '#667eea',
    shadow: 'rgba(102, 126, 234, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    color: '#f093fb',
    shadow: 'rgba(240, 147, 251, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    color: '#4facfe',
    shadow: 'rgba(79, 172, 254, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    color: '#43e97b',
    shadow: 'rgba(67, 233, 123, 0.4)',
  },
  { 
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    color: '#fa709a',
    shadow: 'rgba(250, 112, 154, 0.4)',
  }
];

export const SubjectCard = ({ subject, semesterId, typeId, index = 0 }) => {
  const theme = cardThemes[index % cardThemes.length];
  const { gradient, color, shadow } = theme;

  const initials = useMemo(() =>
    subject.name.split(' ').map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('')
  , [subject.name]);

  return (
    <CardContainer>
      <SubjectCardLink
        to={`/semester/${semesterId}/type/${typeId}/subject/${subject._id}/years`}
        shadowColor={shadow}
        borderColor={`${color}20`}
      >
        <CardHeader gradient={gradient}>
          <DecorativeCircle1 />
          <DecorativeCircle2 />
          <Twinkle className="twinkle-1" />
          <Twinkle className="twinkle-2" />
          <Twinkle className="twinkle-3" />
          
          <InitialsContainer>
            <Initials>{initials}</Initials>
          </InitialsContainer>
          
          <CardTitle>{subject.name}</CardTitle>
        </CardHeader>
        
        <CardContent>
          <CardDescription accentColor={color}>
            Découvrez tous les contenus disponibles pour {subject.name}
          </CardDescription>
          <CardButton color={color}>
            Explorer le contenu
            <Arrow>→</Arrow>
          </CardButton>
        </CardContent>
      </SubjectCardLink>
    </CardContainer>
  );
};
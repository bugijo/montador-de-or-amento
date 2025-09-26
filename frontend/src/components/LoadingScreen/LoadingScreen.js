import React from 'react';
import { motion } from 'framer-motion';
import { FiPackage } from 'react-icons/fi';
import styled from 'styled-components';
import { theme } from '../../styles/GlobalStyles';

const LoadingContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: ${theme.colors.background};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9999;
`;

const LogoContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${theme.spacing.lg};
`;

const Logo = styled(motion.div)`
  width: 80px;
  height: 80px;
  background: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.xl};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: ${theme.colors.shadows.lg};
`;

const LoadingText = styled(motion.div)`
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSize.lg};
  font-weight: ${theme.fontWeight.medium};
`;

const LoadingDots = styled(motion.div)`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const Dot = styled(motion.div)`
  width: 8px;
  height: 8px;
  background: ${theme.colors.primary};
  border-radius: 50%;
`;

const LoadingScreen = () => {
  return (
    <LoadingContainer>
      <LogoContainer
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <Logo
          animate={{ 
            rotate: [0, 360],
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 2, repeat: Infinity, ease: "linear" },
            scale: { duration: 1, repeat: Infinity, ease: "easeInOut" }
          }}
        >
          <FiPackage size={36} />
        </Logo>
        
        <LoadingText
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Sistema de Orçamentos
        </LoadingText>
        
        <LoadingDots>
          {[0, 1, 2].map((index) => (
            <Dot
              key={index}
              animate={{
                y: [0, -10, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
                ease: "easeInOut"
              }}
            />
          ))}
        </LoadingDots>
      </LogoContainer>
    </LoadingContainer>
  );
};

export default LoadingScreen;

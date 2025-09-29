import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiShield } from 'react-icons/fi';
import styled from 'styled-components';

import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, ErrorMessage, LoadingSpinner } from '../../styles/GlobalStyles';
import { theme } from '../../styles/GlobalStyles';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.md};
  background: ${theme.colors.background};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    50% { transform: translateY(-20px) rotate(1deg); }
  }
`;

const LoginCard = styled(motion.div)`
  width: 100%;
  max-width: 420px;
  position: relative;
  z-index: 1;
  backdrop-filter: blur(20px);
  background: ${theme.colors.gradients.glass};
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.colors.shadows.glass};
  padding: ${theme.spacing['3xl']};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: ${theme.borderRadius['2xl']};
    pointer-events: none;
  }
`;

const LogoContainer = styled(motion.div)`
  text-align: center;
  margin-bottom: ${theme.spacing['2xl']};
`;

const Logo = styled(motion.div)`
  width: 100px;
  height: 100px;
  background: ${theme.colors.gradients.primary};
  border-radius: ${theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${theme.spacing.lg};
  box-shadow: ${theme.colors.shadows.xl};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transform: rotate(45deg);
    animation: shine 3s infinite;
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
    50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
    100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
  }
`;

const CompanyName = styled(motion.h1)`
  font-size: 2rem;
  font-weight: 800;
  background: ${theme.colors.gradients.primary};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: ${theme.spacing.sm};
  text-align: center;
`;

const Subtitle = styled(motion.p)`
  color: ${theme.colors.textMuted};
  text-align: center;
  font-size: 0.95rem;
  margin-bottom: ${theme.spacing['2xl']};
`;

const InputGroup = styled(motion.div)`
  position: relative;
  margin-bottom: ${theme.spacing.lg};
`;

const InputIcon = styled.div`
  position: absolute;
  left: ${theme.spacing.lg};
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textMuted};
  z-index: 2;
  transition: all ${theme.transitions.normal};
`;

const StyledInput = styled(Input).withConfig({
  shouldForwardProp: (prop) => !['hasRightIcon', 'hasError'].includes(prop),
})`
  padding-left: 3rem;
  padding-right: ${props => props.hasRightIcon ? '3rem' : theme.spacing.lg};
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid ${props => props.hasError ? theme.colors.danger : 'rgba(255, 255, 255, 0.3)'};
  border-radius: ${theme.borderRadius.lg};
  font-size: 1rem;
  height: 3.5rem;
  transition: all ${theme.transitions.normal};
  backdrop-filter: blur(10px);
  
  &:focus {
    background: rgba(255, 255, 255, 0.95);
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    transform: translateY(-1px);
  }
  
  &:focus + ${InputIcon} {
    color: ${theme.colors.primary};
    transform: translateY(-50%) scale(1.1);
  }
  
  &::placeholder {
    color: ${theme.colors.textMuted};
    font-weight: 400;
  }
`;

const PasswordToggle = styled(motion.button)`
  position: absolute;
  right: ${theme.spacing.lg};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  transition: all ${theme.transitions.normal};
  z-index: 2;
  
  &:hover {
    color: ${theme.colors.primary};
    background: rgba(102, 126, 234, 0.1);
    transform: translateY(-50%) scale(1.1);
  }
`;

const StyledButton = styled(Button)`
  width: 100%;
  height: 3.5rem;
  background: ${theme.colors.gradients.primary};
  border: none;
  border-radius: ${theme.borderRadius.lg};
  font-size: 1.1rem;
  font-weight: 600;
  color: white;
  position: relative;
  overflow: hidden;
  transition: all ${theme.transitions.normal};
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.xl};
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.5s;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const ForgotPassword = styled(motion.a)`
  display: block;
  text-align: center;
  color: ${theme.colors.textMuted};
  text-decoration: none;
  font-size: 0.9rem;
  margin-top: ${theme.spacing.lg};
  transition: all ${theme.transitions.normal};
  
  &:hover {
    color: ${theme.colors.primary};
    transform: translateY(-1px);
  }
`;

const ErrorContainer = styled(motion.div)`
  background: ${theme.colors.gradients.danger};
  color: white;
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.lg};
  margin-bottom: ${theme.spacing.lg};
  text-align: center;
  font-weight: 500;
  backdrop-filter: blur(10px);
`;

const LoadingContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.md};
`;

// Animações
const containerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.6,
      ease: "easeOut",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors
  } = useForm();

  const from = location.state?.from?.pathname || '/dashboard';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      clearErrors();
      
      const result = await login(data.email, data.password);
      
      if (result.success) {
        navigate(from, { replace: true });
      } else {
        setError('root', {
          type: 'manual',
          message: result.message || 'Erro ao fazer login'
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('root', {
        type: 'manual',
        message: 'Erro interno do servidor'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <LoginCard
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <LogoContainer variants={itemVariants}>
          <Logo
            whileHover={{ scale: 1.05, rotate: 5 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiShield size={40} color="white" />
          </Logo>
          <CompanyName variants={itemVariants}>
            FINITI
          </CompanyName>
          <Subtitle variants={itemVariants}>
            Sistema de Orçamentos
          </Subtitle>
        </LogoContainer>

        <motion.form onSubmit={handleSubmit(onSubmit)} variants={itemVariants}>
          <AnimatePresence>
            {errors.root && (
              <ErrorContainer
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {errors.root.message}
              </ErrorContainer>
            )}
          </AnimatePresence>

          <InputGroup variants={itemVariants}>
            <InputIcon>
              <FiMail size={20} />
            </InputIcon>
            <StyledInput
              type="email"
              placeholder="Digite seu e-mail"
              hasError={!!errors.email}
              {...register('email', {
                required: 'E-mail é obrigatório',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'E-mail inválido'
                }
              })}
            />
            <AnimatePresence>
              {errors.email && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.email.message}
                </ErrorMessage>
              )}
            </AnimatePresence>
          </InputGroup>

          <InputGroup variants={itemVariants}>
            <InputIcon>
              <FiLock size={20} />
            </InputIcon>
            <StyledInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite sua senha"
              hasRightIcon
              hasError={!!errors.password}
              {...register('password', {
                required: 'Senha é obrigatória',
                minLength: {
                  value: 6,
                  message: 'Senha deve ter pelo menos 6 caracteres'
                }
              })}
            />
            <PasswordToggle
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </PasswordToggle>
            <AnimatePresence>
              {errors.password && (
                <ErrorMessage
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {errors.password.message}
                </ErrorMessage>
              )}
            </AnimatePresence>
          </InputGroup>

          <motion.div variants={itemVariants}>
            <StyledButton
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <LoadingContainer>
                  <LoadingSpinner size="20px" />
                  <span>Entrando...</span>
                </LoadingContainer>
              ) : (
                'Entrar'
              )}
            </StyledButton>
          </motion.div>

          <ForgotPassword
            href="#"
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
          >
            Esqueceu sua senha?
          </ForgotPassword>
        </motion.form>
      </LoginCard>
    </LoginContainer>
  );
};

export default Login;

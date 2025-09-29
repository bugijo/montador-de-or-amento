import styled, { createGlobalStyle, keyframes } from 'styled-components';

// Animações
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

// Estilos globais
export const GlobalStyles = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    background-attachment: fixed;
    color: #1a202c;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    overflow-x: hidden;
  }

  #root {
    min-height: 100vh;
    position: relative;
  }

  /* Background overlay pattern */
  body::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: -1;
  }

  /* Scrollbar personalizada */
  ::-webkit-scrollbar {
    width: 8px;
  }

  ::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb {
    background: linear-gradient(45deg, #667eea, #764ba2);
    border-radius: 4px;
    transition: all 0.3s ease;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(45deg, #5a67d8, #6b46c1);
    transform: scale(1.1);
  }

  /* Toastify customization */
  .Toastify__toast {
    font-family: 'Inter', sans-serif;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .Toastify__toast--success {
    background: linear-gradient(135deg, #10b981, #059669);
  }

  .Toastify__toast--error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }

  .Toastify__toast--info {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }

  .Toastify__toast--warning {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }

  /* Animações globais */
  .fade-in {
    animation: ${fadeIn} 0.6s ease-out;
  }

  .slide-in {
    animation: ${slideIn} 0.5s ease-out;
  }

  .pulse {
    animation: ${pulse} 2s infinite;
  }

  /* Efeito de loading shimmer */
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: ${shimmer} 1.5s infinite;
  }

  /* Efeitos de hover globais */
  .hover-lift {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .hover-lift:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  /* Glassmorphism effect */
  .glass {
    background: rgba(255, 255, 255, 0.25);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  }

  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Focus styles */
  *:focus {
    outline: none;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
    border-radius: 4px;
  }

  /* Selection styles */
  ::selection {
    background: rgba(102, 126, 234, 0.3);
    color: #1a202c;
  }

  /* Smooth transitions for all interactive elements */
  button, input, select, textarea, a {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

// Tema de cores atualizado
export const theme = {
  colors: {
    primary: '#667eea',
    primaryDark: '#5a67d8',
    primaryLight: '#7c3aed',
    secondary: '#10b981',
    secondaryDark: '#059669',
    danger: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#10b981',
    
    // Gradientes
    gradients: {
      primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      secondary: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      danger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      warning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      info: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      success: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      glass: 'rgba(255, 255, 255, 0.25)',
      darkGlass: 'rgba(0, 0, 0, 0.25)',
    },
    
    // Tons de cinza
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
    
    // Cores de fundo
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    surface: 'rgba(255, 255, 255, 0.95)',
    surfaceHover: 'rgba(255, 255, 255, 0.8)',
    surfaceGlass: 'rgba(255, 255, 255, 0.25)',

    // Cores de texto
    textPrimary: '#1a202c',
    textSecondary: '#4a5568',
    textMuted: '#718096',
    textLight: '#a0aec0',
    textWhite: '#ffffff',
    
    // Sombras
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    },
    
    // Bordas
    borders: {
      light: '1px solid rgba(255, 255, 255, 0.18)',
      medium: '1px solid rgba(255, 255, 255, 0.3)',
      dark: '1px solid rgba(0, 0, 0, 0.1)',
    },
  },
  
  // Breakpoints responsivos
  breakpoints: {
    xs: '320px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  
  // Espaçamentos
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
    '4xl': '5rem',
  },
  
  // Raios de borda
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    full: '9999px',
  },
  
  // Transições
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
  },
  
  // Tamanhos de fonte
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
  
  // Pesos de fonte
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// Componentes base reutilizáveis
export const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 ${theme.spacing.md};
  
  @media (min-width: ${theme.breakpoints.sm}) {
    padding: 0 ${theme.spacing.lg};
  }
`;

export const Card = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  box-shadow: ${theme.colors.shadows.md};
  padding: ${theme.spacing.lg};
  border: 1px solid ${theme.colors.borders.light};
  
  @media (min-width: ${theme.breakpoints.sm}) {
    padding: ${theme.spacing.xl};
  }
`;

export const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => !['fullWidth', 'variant', 'size'].includes(prop),
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.base};
  font-weight: ${theme.fontWeight.medium};
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
  min-height: 44px; /* Mínimo para touch targets */
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  /* Variantes */
  ${props => props.variant === 'primary' && `
    background: ${theme.colors.primary};
    color: white;
    
    &:hover:not(:disabled) {
      background: ${theme.colors.primaryDark};
      transform: translateY(-1px);
      box-shadow: ${theme.colors.shadows.md};
    }
    
    &:active {
      transform: translateY(0);
    }
  `}
  
  ${props => props.variant === 'secondary' && `
    background: ${theme.colors.gray100};
    color: ${theme.colors.textPrimary};
    
    &:hover:not(:disabled) {
      background: ${theme.colors.gray200};
    }
  `}
  
  ${props => props.variant === 'outline' && `
    background: transparent;
    color: ${theme.colors.primary};
    border: 1px solid ${theme.colors.primary};
    
    &:hover:not(:disabled) {
      background: ${theme.colors.primary};
      color: white;
    }
  `}
  
  ${props => props.variant === 'danger' && `
    background: ${theme.colors.danger};
    color: white;
    
    &:hover:not(:disabled) {
      background: #dc2626;
    }
  `}
  
  /* Tamanhos */
  ${props => props.size === 'sm' && `
    padding: ${theme.spacing.xs} ${theme.spacing.md};
    font-size: ${theme.fontSize.sm};
    min-height: 36px;
  `}
  
  ${props => props.size === 'lg' && `
    padding: ${theme.spacing.md} ${theme.spacing.xl};
    font-size: ${theme.fontSize.lg};
    min-height: 52px;
  `}
  
  ${props => props.fullWidth && `
    width: 100%;
  `}
`;

export const Input = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.base};
  background: ${theme.colors.surface};
  color: ${theme.colors.textPrimary};
  transition: all 0.2s ease;
  min-height: 44px;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &:disabled {
    background: ${theme.colors.gray100};
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: ${theme.colors.textMuted};
  }
  
  ${props => props.error && `
    border-color: ${theme.colors.danger};
    
    &:focus {
      border-color: ${theme.colors.danger};
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  `}
`;

export const Label = styled.label`
  display: block;
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

export const ErrorMessage = styled.span`
  display: block;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.danger};
  margin-top: ${theme.spacing.xs};
`;

export const LoadingSpinner = styled.div`
  width: ${props => props.size || '20px'};
  height: ${props => props.size || '20px'};
  border: 2px solid ${props => props.color || theme.colors.gray300};
  border-top: 2px solid ${props => props.accent || theme.colors.primary};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

export const Grid = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$gap', '$cols'].includes(prop),
})`
  display: grid;
  gap: ${props => props.$gap || theme.spacing.md};
  
  ${props => props.$cols && `
    grid-template-columns: repeat(${props.$cols}, 1fr);
  `}
  
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
  }
`;

export const Flex = styled.div.withConfig({
  shouldForwardProp: (prop) => !['$align', '$justify', '$gap', '$direction', '$wrap', '$responsive'].includes(prop),
})`
  display: flex;
  align-items: ${props => props.$align || 'center'};
  justify-content: ${props => props.$justify || 'flex-start'};
  gap: ${props => props.$gap || theme.spacing.md};
  flex-direction: ${props => props.$direction || 'row'};
  flex-wrap: ${props => props.$wrap || 'nowrap'};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    ${props => props.$responsive && `
      flex-direction: column;
      align-items: stretch;
    `}
  }
`;

export const Text = styled.p.withConfig({
  shouldForwardProp: (prop) => !['$size', '$weight', '$color', '$margin', '$align'].includes(prop),
})`
  font-size: ${props => theme.fontSize[props.$size] || theme.fontSize.base};
  font-weight: ${props => theme.fontWeight[props.$weight] || theme.fontWeight.normal};
  color: ${props => {
    if (props.$color === 'muted') return theme.colors.textMuted;
    if (props.$color === 'secondary') return theme.colors.textSecondary;
    if (props.$color === 'primary') return theme.colors.primary;
    if (props.$color === 'danger') return theme.colors.danger;
    if (props.$color === 'success') return theme.colors.success;
    return theme.colors.textPrimary;
  }};
  line-height: 1.6;
  margin: ${props => props.$margin || '0'};
  text-align: ${props => props.$align || 'left'};
`;

export const Heading = styled.h1.withConfig({
  shouldForwardProp: (prop) => !['$level', '$margin', '$align'].includes(prop),
})`
  font-size: ${props => {
    if (props.$level === 1) return theme.fontSize['4xl'];
    if (props.$level === 2) return theme.fontSize['3xl'];
    if (props.$level === 3) return theme.fontSize['2xl'];
    if (props.$level === 4) return theme.fontSize.xl;
    if (props.$level === 5) return theme.fontSize.lg;
    return theme.fontSize.base;
  }};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.textPrimary};
  line-height: 1.2;
  margin: ${props => props.$margin || '0'};
  text-align: ${props => props.$align || 'left'};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    font-size: ${props => {
      if (props.$level === 1) return theme.fontSize['3xl'];
      if (props.$level === 2) return theme.fontSize['2xl'];
      if (props.$level === 3) return theme.fontSize.xl;
      if (props.$level === 4) return theme.fontSize.lg;
      return theme.fontSize.base;
    }};
  }
`;

// Paleta de cores da Finiti - Equipamentos para Construção
// Extraída da logo oficial da empresa

export const FINITI_COLORS = {
  // Cores principais
  primary: {
    blue: '#1e3a8a',        // Azul principal da logo
    darkBlue: '#1e40af',    // Azul mais escuro para hover/active
    lightBlue: '#3b82f6',   // Azul mais claro para backgrounds
  },
  
  // Cores neutras
  neutral: {
    gray: '#6b7280',        // Cinza médio para textos secundários
    lightGray: '#9ca3af',   // Cinza claro para elementos sutis
    darkGray: '#374151',    // Cinza escuro para textos principais
    white: '#ffffff',       // Branco puro
    offWhite: '#f8fafc',    // Branco levemente acinzentado para backgrounds
  },
  
  // Cores de estado
  status: {
    success: '#10b981',     // Verde para sucesso
    warning: '#f59e0b',     // Amarelo para avisos
    error: '#ef4444',       // Vermelho para erros
    info: '#3b82f6',        // Azul para informações
  },
  
  // Gradientes
  gradients: {
    primary: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
    secondary: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)',
    hero: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
  },
  
  // Sombras
  shadows: {
    sm: '0 1px 2px 0 rgba(30, 58, 138, 0.05)',
    md: '0 4px 6px -1px rgba(30, 58, 138, 0.1), 0 2px 4px -1px rgba(30, 58, 138, 0.06)',
    lg: '0 10px 15px -3px rgba(30, 58, 138, 0.1), 0 4px 6px -2px rgba(30, 58, 138, 0.05)',
    xl: '0 20px 25px -5px rgba(30, 58, 138, 0.1), 0 10px 10px -5px rgba(30, 58, 138, 0.04)',
  }
};

// Tema completo para styled-components ou outras bibliotecas de estilo
export const FINITI_THEME = {
  colors: FINITI_COLORS,
  
  // Tipografia
  typography: {
    fontFamily: {
      primary: '"Inter", "Segoe UI", "Roboto", sans-serif',
      secondary: '"Poppins", "Arial", sans-serif',
      mono: '"Fira Code", "Consolas", monospace',
    },
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Espaçamentos
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  // Bordas
  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    full: '9999px',
  },
  
  // Breakpoints para responsividade
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
};

// Utilitários para usar as cores
export const getColor = (path) => {
  const keys = path.split('.');
  let result = FINITI_COLORS;
  
  for (const key of keys) {
    result = result[key];
    if (!result) return null;
  }
  
  return result;
};

// Função para gerar variações de cor (mais clara/escura)
export const lightenColor = (color, amount = 0.1) => {
  // Implementação simplificada - em produção, usar uma biblioteca como polished
  return color;
};

export const darkenColor = (color, amount = 0.1) => {
  // Implementação simplificada - em produção, usar uma biblioteca como polished
  return color;
};

export default FINITI_COLORS;

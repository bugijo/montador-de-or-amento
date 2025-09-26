import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, 
  FiX, 
  FiHome, 
  FiUser, 
  FiLogOut,
  FiTool,
  FiBarChart,
  FiBox,
  FiUsers,
  FiShield,
  FiBell,
  FiSearch
} from 'react-icons/fi';
import styled from 'styled-components';

import { useAuth } from '../../contexts/AuthContext';
import { Button, Flex, Text, Heading } from '../../styles/GlobalStyles';
import { theme } from '../../styles/GlobalStyles';

const LayoutContainer = styled.div`
  min-height: 100vh;
  background: ${theme.colors.background};
  position: relative;
`;

const Header = styled(motion.header)`
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border-bottom: ${theme.colors.borders.light};
  padding: ${theme.spacing.lg} 0;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: ${theme.colors.shadows.glass};
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 ${theme.spacing.xl};
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
`;

const Logo = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  cursor: pointer;
`;

const LogoIcon = styled(motion.div)`
  width: 50px;
  height: 50px;
  background: ${theme.colors.gradients.primary};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${theme.colors.shadows.lg};
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

const LogoText = styled.div`
  display: flex;
  flex-direction: column;
  
  h1 {
    font-size: 1.75rem;
    font-weight: 800;
    background: ${theme.colors.gradients.primary};
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0;
    line-height: 1;
  }
  
  span {
    font-size: 0.85rem;
    color: ${theme.colors.textMuted};
    margin: 0;
    line-height: 1;
    font-weight: 500;
  }
`;

const Navigation = styled.nav`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  
  @media (max-width: ${theme.breakpoints.md}) {
    display: none;
  }
`;

const NavLink = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})`
  background: ${props => props.active ? theme.colors.gradients.primary : 'rgba(255, 255, 255, 0.1)'};
  border: none;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${props => props.active ? 'white' : theme.colors.textPrimary};
  font-weight: 500;
  font-size: 0.95rem;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.active ? 'transparent' : 'rgba(255, 255, 255, 0.2)'};
  
  &:hover {
    background: ${props => props.active ? theme.colors.gradients.primary : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const NotificationButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  cursor: pointer;
  color: ${theme.colors.textPrimary};
  transition: all ${theme.transitions.normal};
  backdrop-filter: blur(10px);
  position: relative;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 8px;
    height: 8px;
    background: ${theme.colors.danger};
    border-radius: 50%;
    border: 2px solid white;
  }
`;

const UserInfo = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${theme.borderRadius.lg};
  backdrop-filter: blur(10px);
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
  }
`;

const Avatar = styled.div`
  width: 40px;
  height: 40px;
  background: ${theme.colors.gradients.secondary};
  border-radius: ${theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.1rem;
  box-shadow: ${theme.colors.shadows.md};
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
  
  @media (max-width: ${theme.breakpoints.sm}) {
    display: none;
  }
`;

const UserName = styled.span`
  font-weight: 600;
  color: ${theme.colors.textPrimary};
  font-size: 0.95rem;
  line-height: 1;
`;

const UserRole = styled.span`
  font-size: 0.8rem;
  color: ${theme.colors.textMuted};
  text-transform: capitalize;
  line-height: 1;
`;

const MobileMenuButton = styled(motion.button)`
  display: none;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.md};
  cursor: pointer;
  color: ${theme.colors.textPrimary};
  backdrop-filter: blur(10px);
  
  @media (max-width: ${theme.breakpoints.md}) {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MobileMenu = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
`;

const MobileMenuContent = styled(motion.div)`
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border-left: ${theme.colors.borders.light};
  width: 300px;
  height: 100%;
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.lg};
`;

const MobileMenuHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: ${theme.spacing.lg};
  border-bottom: ${theme.colors.borders.light};
`;

const MobileNavLink = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})`
  background: ${props => props.active ? theme.colors.gradients.primary : 'transparent'};
  border: none;
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  color: ${props => props.active ? 'white' : theme.colors.textPrimary};
  font-weight: 500;
  font-size: 1rem;
  text-align: left;
  width: 100%;
  
  &:hover {
    background: ${props => props.active ? theme.colors.gradients.primary : 'rgba(255, 255, 255, 0.1)'};
    transform: translateX(4px);
  }
`;

const MainContent = styled(motion.main)`
  max-width: 1400px;
  margin: 0 auto;
  padding: ${theme.spacing.xl};
  min-height: calc(100vh - 100px);
`;

const ContentCard = styled(motion.div)`
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.colors.shadows.glass};
  padding: ${theme.spacing['2xl']};
  min-height: 600px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
`;

const Layout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiHome },
    { path: '/machines', label: 'Máquinas', icon: FiTool },
    { path: '/calculator', label: 'Calculadora', icon: FiBarChart },
    ...(user?.role === 'admin' ? [
      { path: '/admin/products', label: 'Produtos', icon: FiBox },
      { path: '/admin/users', label: 'Usuários', icon: FiUsers }
    ] : [])
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavigation = (path) => {
    navigate(path);
    setIsMobileMenuOpen(false);
  };

  const getUserInitials = (name) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U';
  };

  return (
    <LayoutContainer>
      <Header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <HeaderContent>
          <Logo
            onClick={() => navigate('/dashboard')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogoIcon
              whileHover={{ rotate: 5 }}
            >
              <FiShield size={24} color="white" />
            </LogoIcon>
            <LogoText>
              <h1>FINITI</h1>
              <span>Sistema de Orçamentos</span>
            </LogoText>
          </Logo>

          <Navigation>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <NavLink
                  key={item.path}
                  active={isActive}
                  onClick={() => handleNavigation(item.path)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon size={18} />
                  {item.label}
                </NavLink>
              );
            })}
          </Navigation>

          <UserSection>
            <NotificationButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiBell size={18} />
            </NotificationButton>

            <UserInfo
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Avatar>
                {getUserInitials(user?.nome)}
              </Avatar>
              <UserDetails>
                <UserName>{user?.nome}</UserName>
                <UserRole>{user?.role}</UserRole>
              </UserDetails>
            </UserInfo>

            <NavLink
              onClick={handleLogout}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiLogOut size={18} />
              Sair
            </NavLink>

            <MobileMenuButton
              onClick={() => setIsMobileMenuOpen(true)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiMenu size={20} />
            </MobileMenuButton>
          </UserSection>
        </HeaderContent>
      </Header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <MobileMenuContent
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
            >
              <MobileMenuHeader>
                <LogoText>
                  <h1 style={{ fontSize: '1.5rem' }}>FINITI</h1>
                  <span>Sistema de Orçamentos</span>
                </LogoText>
                <motion.button
                  onClick={() => setIsMobileMenuOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: theme.colors.textPrimary,
                    cursor: 'pointer',
                    padding: theme.spacing.sm
                  }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <FiX size={24} />
                </motion.button>
              </MobileMenuHeader>

              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  
                  return (
                    <MobileNavLink
                      key={item.path}
                      active={isActive}
                      onClick={() => handleNavigation(item.path)}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon size={20} />
                      {item.label}
                    </MobileNavLink>
                  );
                })}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: theme.spacing.xl, borderTop: theme.colors.borders.light }}>
                <UserInfo style={{ marginBottom: theme.spacing.lg, cursor: 'default' }}>
                  <Avatar>
                    {getUserInitials(user?.nome)}
                  </Avatar>
                  <UserDetails style={{ display: 'flex' }}>
                    <UserName>{user?.nome}</UserName>
                    <UserRole>{user?.role}</UserRole>
                  </UserDetails>
                </UserInfo>

                <MobileNavLink
                  onClick={handleLogout}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FiLogOut size={20} />
                  Sair
                </MobileNavLink>
              </div>
            </MobileMenuContent>
          </MobileMenu>
        )}
      </AnimatePresence>

      <MainContent
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <ContentCard
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Outlet />
        </ContentCard>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;

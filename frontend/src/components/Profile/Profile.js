import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { FiUser, FiEdit3, FiSave, FiX, FiCamera, FiLock } from 'react-icons/fi';
import styled from 'styled-components';

import { useAuth } from '../../contexts/AuthContext';
import { 
  Button, 
  Input, 
  Label, 
  ErrorMessage, 
  LoadingSpinner, 
  Card, 
  Flex, 
  Text, 
  Heading,
  Container 
} from '../../styles/GlobalStyles';
import { theme } from '../../styles/GlobalStyles';

const ProfileContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
  max-width: 600px;
`;

const ProfileCard = styled(Card)`
  position: relative;
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
  border-bottom: 1px solid ${theme.colors.border};
`;

const AvatarContainer = styled.div`
  position: relative;
  display: inline-block;
  margin-bottom: ${theme.spacing.lg};
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: ${theme.borderRadius.full};
  background: ${props => props.src ? `url(${props.src})` : theme.colors.gray200};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 4px solid ${theme.colors.surface};
  box-shadow: ${theme.colors.shadows.lg};
  margin: 0 auto;
  
  ${props => !props.src && `
    color: ${theme.colors.textMuted};
  `}
`;

const AvatarUpload = styled.button`
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: ${theme.borderRadius.full};
  background: ${theme.colors.primary};
  color: white;
  border: 2px solid ${theme.colors.surface};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${theme.colors.primaryDark};
    transform: scale(1.1);
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const FormSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const SectionTitle = styled(Heading)`
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.sm};
  border-bottom: 1px solid ${theme.colors.borderLight};
`;

const InputGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const EditToggle = styled.button`
  position: absolute;
  top: ${theme.spacing.lg};
  right: ${theme.spacing.lg};
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.md};
  transition: all 0.2s ease;
  
  &:hover {
    color: ${theme.colors.primary};
    background: ${theme.colors.gray100};
  }
`;

const ActionButtons = styled(Flex)`
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
`;

const PasswordSection = styled.div`
  background: ${theme.colors.gray50};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.xl};
`;

const Profile = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.foto_url || null);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    defaultValues: {
      nome: user?.nome || '',
      email: user?.email || ''
    }
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
    reset: resetPassword,
    watch: watchPassword
  } = useForm();

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancelar edição - resetar valores
      reset({
        nome: user?.nome || '',
        email: user?.email || ''
      });
      setAvatarPreview(user?.foto_url || null);
    }
    setIsEditing(!isEditing);
  };

  const handleAvatarClick = () => {
    if (isEditing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('A imagem deve ter no máximo 5MB.');
        return;
      }

      // Criar preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    try {
      // Simular upload de avatar se houver mudança
      let fotoUrl = user?.foto_url;
      if (avatarPreview && avatarPreview !== user?.foto_url) {
        // Em uma implementação real, aqui faria o upload da imagem
        fotoUrl = avatarPreview;
      }

      const updatedUser = {
        ...user,
        ...data,
        foto_url: fotoUrl
      };

      updateUser(updatedUser);
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  };

  const onPasswordSubmit = async (data) => {
    const result = await changePassword(data.senhaAtual, data.novaSenha);
    
    if (result.success) {
      resetPassword();
      setIsChangingPassword(false);
    }
  };

  const novaSenha = watchPassword('novaSenha');

  return (
    <ProfileContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProfileCard>
          <EditToggle onClick={handleEditToggle}>
            {isEditing ? <FiX size={20} /> : <FiEdit3 size={20} />}
          </EditToggle>

          <ProfileHeader>
            <AvatarContainer>
              <Avatar 
                src={avatarPreview} 
                onClick={handleAvatarClick}
                style={{ cursor: isEditing ? 'pointer' : 'default' }}
              >
                {!avatarPreview && <FiUser size={48} />}
              </Avatar>
              {isEditing && (
                <AvatarUpload onClick={handleAvatarClick}>
                  <FiCamera size={16} />
                </AvatarUpload>
              )}
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />
            </AvatarContainer>
            
            <Heading $$level={2}>{user?.nome}</Heading>
            <Text color="muted">{user?.email}</Text>
            <Text size="sm" color="muted" style={{ textTransform: 'capitalize' }}>
              {user?.role}
            </Text>
          </ProfileHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <FormSection>
              <SectionTitle $level={3}>Informações Pessoais</SectionTitle>
              
              <InputGroup>
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  disabled={!isEditing}
                  error={errors.nome}
                  {...register('nome', {
                    required: 'Nome é obrigatório',
                    minLength: {
                      value: 2,
                      message: 'Nome deve ter pelo menos 2 caracteres'
                    }
                  })}
                />
                {errors.nome && (
                  <ErrorMessage>{errors.nome.message}</ErrorMessage>
                )}
              </InputGroup>

              <InputGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  disabled={!isEditing}
                  error={errors.email}
                  {...register('email', {
                    required: 'Email é obrigatório',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                />
                {errors.email && (
                  <ErrorMessage>{errors.email.message}</ErrorMessage>
                )}
              </InputGroup>
            </FormSection>

            {isEditing && (
              <ActionButtons justify="flex-end" gap="1rem">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleEditToggle}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Flex gap="0.5rem">
                      <LoadingSpinner size="16px" accent="white" />
                      Salvando...
                    </Flex>
                  ) : (
                    <Flex gap="0.5rem">
                      <FiSave size={16} />
                      Salvar
                    </Flex>
                  )}
                </Button>
              </ActionButtons>
            )}
          </form>

          <PasswordSection>
            <Flex justify="space-between" align="center" style={{ marginBottom: theme.spacing.lg }}>
              <Heading $level={4}>Alterar Senha</Heading>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(!isChangingPassword)}
              >
                <FiLock size={14} />
                {isChangingPassword ? 'Cancelar' : 'Alterar'}
              </Button>
            </Flex>

            {isChangingPassword && (
              <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
                <InputGroup>
                  <Label htmlFor="senhaAtual">Senha Atual</Label>
                  <Input
                    id="senhaAtual"
                    type="password"
                    placeholder="Digite sua senha atual"
                    error={passwordErrors.senhaAtual}
                    {...registerPassword('senhaAtual', {
                      required: 'Senha atual é obrigatória'
                    })}
                  />
                  {passwordErrors.senhaAtual && (
                    <ErrorMessage>{passwordErrors.senhaAtual.message}</ErrorMessage>
                  )}
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="novaSenha">Nova Senha</Label>
                  <Input
                    id="novaSenha"
                    type="password"
                    placeholder="Digite a nova senha"
                    error={passwordErrors.novaSenha}
                    {...registerPassword('novaSenha', {
                      required: 'Nova senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Nova senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                  />
                  {passwordErrors.novaSenha && (
                    <ErrorMessage>{passwordErrors.novaSenha.message}</ErrorMessage>
                  )}
                </InputGroup>

                <InputGroup>
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Confirme a nova senha"
                    error={passwordErrors.confirmarSenha}
                    {...registerPassword('confirmarSenha', {
                      required: 'Confirmação de senha é obrigatória',
                      validate: value =>
                        value === novaSenha || 'As senhas não coincidem'
                    })}
                  />
                  {passwordErrors.confirmarSenha && (
                    <ErrorMessage>{passwordErrors.confirmarSenha.message}</ErrorMessage>
                  )}
                </InputGroup>

                <ActionButtons justify="flex-end" gap="1rem">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setIsChangingPassword(false);
                      resetPassword();
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isPasswordSubmitting}
                  >
                    {isPasswordSubmitting ? (
                      <Flex gap="0.5rem">
                        <LoadingSpinner size="16px" accent="white" />
                        Alterando...
                      </Flex>
                    ) : (
                      'Alterar Senha'
                    )}
                  </Button>
                </ActionButtons>
              </form>
            )}
          </PasswordSection>
        </ProfileCard>
      </motion.div>
    </ProfileContainer>
  );
};

export default Profile;

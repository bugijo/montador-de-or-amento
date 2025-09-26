'use strict';

const { User } = require('../models');
const jwtUtils = require('../utils/jwt');

class AuthController {
  /**
   * Login do usuário
   */
  async login(req, res) {
    try {
      const { email, senha } = req.body;

      // Busca o usuário com senha
      const user = await User.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          error: 'INVALID_CREDENTIALS'
        });
      }

      if (!user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Usuário inativo',
          error: 'USER_INACTIVE'
        });
      }

      // Verifica a senha
      const senhaValida = await user.verificarSenha(senha);

      if (!senhaValida) {
        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Atualiza último login
      await user.atualizarUltimoLogin();

      // Gera tokens
      const tokens = jwtUtils.generateTokenPair(user);

      // Remove senha do objeto de resposta
      const userResponse = user.toJSON();
      delete userResponse.senha;

      res.json({
        success: true,
        message: 'Login realizado com sucesso',
        token: tokens.access_token,
        user: userResponse,
        ...tokens
      });

    } catch (error) {
      console.error('Erro no login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Registro de novo usuário (apenas admins podem criar outros usuários)
   */
  async register(req, res) {
    try {
      const { nome, email, senha, role = 'vendedor' } = req.body;

      // Verifica se o email já existe
      const existingUser = await User.findOne({ where: { email } });

      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email já está em uso',
          error: 'EMAIL_ALREADY_EXISTS'
        });
      }

      // Cria o usuário
      const user = await User.create({
        nome,
        email,
        senha,
        role
      });

      // Remove senha do objeto de resposta
      const userResponse = user.toJSON();
      delete userResponse.senha;

      res.status(201).json({
        success: true,
        message: 'Usuário criado com sucesso',
        user: userResponse
      });

    } catch (error) {
      console.error('Erro no registro:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          error: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Refresh token
   */
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token é obrigatório',
          error: 'MISSING_REFRESH_TOKEN'
        });
      }

      // Verifica o refresh token
      const decoded = jwtUtils.verifyRefreshToken(refresh_token);

      // Busca o usuário
      const user = await User.findByPk(decoded.id);

      if (!user || !user.ativo) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não encontrado ou inativo',
          error: 'INVALID_USER'
        });
      }

      // Gera novos tokens
      const tokens = jwtUtils.generateTokenPair(user);

      res.json({
        success: true,
        message: 'Tokens renovados com sucesso',
        data: tokens
      });

    } catch (error) {
      console.error('Erro no refresh token:', error);
      res.status(401).json({
        success: false,
        message: 'Refresh token inválido',
        error: 'INVALID_REFRESH_TOKEN'
      });
    }
  }

  /**
   * Logout (invalidação do token seria implementada com blacklist em produção)
   */
  async logout(req, res) {
    try {
      // Em uma implementação completa, adicionaríamos o token a uma blacklist
      // Por enquanto, apenas retornamos sucesso
      
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });

    } catch (error) {
      console.error('Erro no logout:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Informações do usuário atual
   */
  async me(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        user: user.toJSON()
      });

    } catch (error) {
      console.error('Erro ao buscar informações do usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Alteração de senha
   */
  async changePassword(req, res) {
    try {
      const { senha_atual, nova_senha } = req.body;
      const user = req.user;

      // Busca o usuário com senha
      const userWithPassword = await User.scope('withPassword').findByPk(user.id);

      // Verifica a senha atual
      const senhaValida = await userWithPassword.verificarSenha(senha_atual);

      if (!senhaValida) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual incorreta',
          error: 'INVALID_CURRENT_PASSWORD'
        });
      }

      // Atualiza a senha
      await userWithPassword.update({ senha: nova_senha });

      res.json({
        success: true,
        message: 'Senha alterada com sucesso'
      });

    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new AuthController();
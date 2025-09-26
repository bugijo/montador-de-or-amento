'use strict';

const jwt = require('jsonwebtoken');

class JWTUtils {
  constructor() {
    this.secret = process.env.JWT_SECRET || 'fallback_secret_key_change_in_production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  /**
   * Gera um token JWT para o usuário
   * @param {Object} user - Objeto do usuário
   * @returns {string} Token JWT
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
      issuer: 'sistema-orcamentos',
      audience: 'sistema-orcamentos-users'
    });
  }

  /**
   * Gera um refresh token
   * @param {Object} user - Objeto do usuário
   * @returns {string} Refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    };

    return jwt.sign(payload, this.secret, {
      expiresIn: '7d',
      issuer: 'sistema-orcamentos',
      audience: 'sistema-orcamentos-refresh'
    });
  }

  /**
   * Verifica e decodifica um token JWT
   * @param {string} token - Token a ser verificado
   * @returns {Object} Payload decodificado
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.secret, {
        issuer: 'sistema-orcamentos',
        audience: 'sistema-orcamentos-users'
      });
    } catch (error) {
      throw new Error(`Token inválido: ${error.message}`);
    }
  }

  /**
   * Verifica um refresh token
   * @param {string} token - Refresh token a ser verificado
   * @returns {Object} Payload decodificado
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.secret, {
        issuer: 'sistema-orcamentos',
        audience: 'sistema-orcamentos-refresh'
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Token não é um refresh token');
      }

      return decoded;
    } catch (error) {
      throw new Error(`Refresh token inválido: ${error.message}`);
    }
  }

  /**
   * Decodifica um token sem verificar a assinatura (para debug)
   * @param {string} token - Token a ser decodificado
   * @returns {Object} Payload decodificado
   */
  decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Verifica se um token está expirado
   * @param {string} token - Token a ser verificado
   * @returns {boolean} True se expirado
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Extrai o token do header Authorization
   * @param {string} authHeader - Header de autorização
   * @returns {string|null} Token extraído ou null
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Gera tokens de acesso e refresh
   * @param {Object} user - Objeto do usuário
   * @returns {Object} Objeto com access_token e refresh_token
   */
  generateTokenPair(user) {
    return {
      access_token: this.generateToken(user),
      refresh_token: this.generateRefreshToken(user),
      token_type: 'Bearer',
      expires_in: this.expiresIn
    };
  }
}

module.exports = new JWTUtils();
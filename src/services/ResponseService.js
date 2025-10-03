'use strict';

/**
 * Serviço para padronizar respostas da API
 * Elimina duplicação de código nos controllers
 */
class ResponseService {
  /**
   * Resposta de sucesso padrão
   * @param {Object} res - Objeto response do Express
   * @param {any} data - Dados a serem retornados
   * @param {string} message - Mensagem de sucesso
   * @param {number} statusCode - Código de status HTTP
   */
  static success(res, data = null, message = 'Operação realizada com sucesso', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de erro padrão
   * @param {Object} res - Objeto response do Express
   * @param {string} message - Mensagem de erro
   * @param {string} errorCode - Código do erro
   * @param {number} statusCode - Código de status HTTP
   * @param {any} details - Detalhes adicionais do erro
   */
  static error(res, message = 'Erro interno do servidor', errorCode = 'INTERNAL_ERROR', statusCode = 500, details = null) {
    const response = {
      success: false,
      message,
      error: errorCode,
      timestamp: new Date().toISOString()
    };

    // Adiciona detalhes apenas em ambiente de desenvolvimento
    if (process.env.NODE_ENV === 'development' && details) {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Resposta de validação com erros
   * @param {Object} res - Objeto response do Express
   * @param {Array} errors - Array de erros de validação
   * @param {string} message - Mensagem principal
   */
  static validationError(res, errors, message = 'Dados inválidos') {
    return res.status(400).json({
      success: false,
      message,
      error: 'VALIDATION_ERROR',
      errors,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Resposta de não encontrado
   * @param {Object} res - Objeto response do Express
   * @param {string} resource - Nome do recurso não encontrado
   */
  static notFound(res, resource = 'Recurso') {
    return this.error(res, `${resource} não encontrado`, 'NOT_FOUND', 404);
  }

  /**
   * Resposta de não autorizado
   * @param {Object} res - Objeto response do Express
   * @param {string} message - Mensagem de erro
   */
  static unauthorized(res, message = 'Não autorizado') {
    return this.error(res, message, 'UNAUTHORIZED', 401);
  }

  /**
   * Resposta de acesso negado
   * @param {Object} res - Objeto response do Express
   * @param {string} message - Mensagem de erro
   */
  static forbidden(res, message = 'Acesso negado') {
    return this.error(res, message, 'FORBIDDEN', 403);
  }

  /**
   * Resposta de conflito
   * @param {Object} res - Objeto response do Express
   * @param {string} message - Mensagem de erro
   */
  static conflict(res, message = 'Conflito de dados') {
    return this.error(res, message, 'CONFLICT', 409);
  }

  /**
   * Resposta de dados criados
   * @param {Object} res - Objeto response do Express
   * @param {any} data - Dados criados
   * @param {string} message - Mensagem de sucesso
   */
  static created(res, data, message = 'Recurso criado com sucesso') {
    return this.success(res, data, message, 201);
  }

  /**
   * Resposta de dados atualizados
   * @param {Object} res - Objeto response do Express
   * @param {any} data - Dados atualizados
   * @param {string} message - Mensagem de sucesso
   */
  static updated(res, data, message = 'Recurso atualizado com sucesso') {
    return this.success(res, data, message, 200);
  }

  /**
   * Resposta de dados removidos
   * @param {Object} res - Objeto response do Express
   * @param {string} message - Mensagem de sucesso
   */
  static deleted(res, message = 'Recurso removido com sucesso') {
    return this.success(res, null, message, 200);
  }

  /**
   * Resposta paginada
   * @param {Object} res - Objeto response do Express
   * @param {Array} items - Itens da página atual
   * @param {Object} pagination - Informações de paginação
   * @param {string} message - Mensagem de sucesso
   */
  static paginated(res, items, pagination, message = 'Dados recuperados com sucesso') {
    const data = {
      items,
      pagination: {
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || items.length,
        itemsPerPage: pagination.itemsPerPage || items.length,
        hasNextPage: pagination.hasNextPage || false,
        hasPreviousPage: pagination.hasPreviousPage || false
      }
    };

    return this.success(res, data, message, 200);
  }

  /**
   * Resposta de lista simples
   * @param {Object} res - Objeto response do Express
   * @param {Array} items - Lista de itens
   * @param {string} message - Mensagem de sucesso
   */
  static list(res, items, message = 'Lista recuperada com sucesso') {
    const data = {
      items,
      total: items.length
    };

    return this.success(res, data, message, 200);
  }

  /**
   * Resposta de item único
   * @param {Object} res - Objeto response do Express
   * @param {any} item - Item encontrado
   * @param {string} message - Mensagem de sucesso
   */
  static item(res, item, message = 'Item recuperado com sucesso') {
    return this.success(res, item, message, 200);
  }

  /**
   * Resposta de operação sem conteúdo
   * @param {Object} res - Objeto response do Express
   */
  static noContent(res) {
    return res.status(204).send();
  }

  /**
   * Trata erros de forma padronizada
   * @param {Object} res - Objeto response do Express
   * @param {Error} error - Erro capturado
   * @param {string} context - Contexto onde o erro ocorreu
   */
  static handleError(res, error, context = 'Operação') {
    console.error(`Erro em ${context}:`, error);

    // Erros de validação do Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return this.validationError(res, errors, 'Dados inválidos');
    }

    // Erros de constraint do Sequelize
    if (error.name === 'SequelizeUniqueConstraintError') {
      return this.conflict(res, 'Dados já existem no sistema');
    }

    // Erros de foreign key do Sequelize
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return this.error(res, 'Referência inválida', 'INVALID_REFERENCE', 400);
    }

    // Erros de conexão com banco
    if (error.name === 'SequelizeConnectionError') {
      return this.error(res, 'Erro de conexão com o banco de dados', 'DATABASE_CONNECTION_ERROR', 503);
    }

    // Erro genérico
    return this.error(res, error.message || 'Erro interno do servidor', 'INTERNAL_ERROR', 500, error.stack);
  }

  /**
   * Middleware para capturar erros não tratados
   * @param {Error} error - Erro capturado
   * @param {Object} req - Objeto request do Express
   * @param {Object} res - Objeto response do Express
   * @param {Function} next - Próximo middleware
   */
  static errorHandler(error, req, res, next) {
    return ResponseService.handleError(res, error, `${req.method} ${req.path}`);
  }
}

module.exports = ResponseService;
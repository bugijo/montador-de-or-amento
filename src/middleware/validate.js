'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware para processar erros de validação do express-validator
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      errors: errorMessages
    });
  }

  next();
};

module.exports = validate;
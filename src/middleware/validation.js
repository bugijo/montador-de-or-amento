'use strict';

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware para processar resultados de validação
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Dados de entrada inválidos',
      error: 'VALIDATION_ERROR',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Validações para autenticação
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .toLowerCase(),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  handleValidationErrors
];

const validateRegister = [
  body('nome')
    .isLength({ min: 2, max: 100 })
    .withMessage('Nome deve ter entre 2 e 100 caracteres')
    .trim(),
  body('email')
    .isEmail()
    .withMessage('Email deve ter um formato válido')
    .normalizeEmail()
    .toLowerCase(),
  body('senha')
    .isLength({ min: 6 })
    .withMessage('Senha deve ter pelo menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'vendedor'])
    .withMessage('Role deve ser admin ou vendedor'),
  handleValidationErrors
];

/**
 * Validações para produtos
 */
const validateCreateProduto = [
  body('nome')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres')
    .trim(),
  body('descricao')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Descrição deve ter no máximo 5000 caracteres')
    .trim(),
  body('foto_url')
    .optional()
    .isURL()
    .withMessage('URL da foto deve ser válida'),
  body('tipo')
    .isIn(['Máquina', 'Acessório'])
    .withMessage('Tipo deve ser Máquina ou Acessório'),
  body('maquinas_compativeis')
    .optional()
    .isArray()
    .withMessage('Máquinas compatíveis deve ser um array')
    .custom((value, { req }) => {
      if (req.body.tipo === 'Acessório' && (!value || value.length === 0)) {
        throw new Error('Acessórios devem ter pelo menos uma máquina compatível');
      }
      if (req.body.tipo === 'Máquina' && value && value.length > 0) {
        throw new Error('Máquinas não devem ter máquinas compatíveis definidas');
      }
      return true;
    }),
  body('preco_base')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço base deve ser um número maior ou igual a zero'),
  body('unidade_medida')
    .optional()
    .isIn(['unidade', 'm2', 'm', 'kg', 'litro', 'caixa', 'pacote'])
    .withMessage('Unidade de medida inválida'),
  body('codigo_interno')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Código interno deve ter entre 1 e 50 caracteres')
    .trim(),
  body('categoria')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Categoria deve ter no máximo 100 caracteres')
    .trim(),
  body('peso')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Peso deve ser um número maior ou igual a zero'),
  body('dimensoes')
    .optional()
    .custom((value) => {
      if (value) {
        if (typeof value !== 'object') {
          throw new Error('Dimensões devem ser um objeto');
        }
        const required = ['largura', 'altura', 'profundidade'];
        for (const key of required) {
          if (!value[key] || typeof value[key] !== 'number' || value[key] <= 0) {
            throw new Error(`Dimensões devem conter ${key} como número positivo`);
          }
        }
      }
      return true;
    }),
  handleValidationErrors
];

const validateUpdateProduto = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID do produto deve ser um número inteiro positivo'),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres')
    .trim(),
  body('descricao')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Descrição deve ter no máximo 5000 caracteres')
    .trim(),
  body('foto_url')
    .optional()
    .isURL()
    .withMessage('URL da foto deve ser válida'),
  body('tipo')
    .optional()
    .isIn(['Máquina', 'Acessório'])
    .withMessage('Tipo deve ser Máquina ou Acessório'),
  body('maquinas_compativeis')
    .optional()
    .isArray()
    .withMessage('Máquinas compatíveis deve ser um array'),
  body('preco_base')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Preço base deve ser um número maior ou igual a zero'),
  body('unidade_medida')
    .optional()
    .isIn(['unidade', 'm2', 'm', 'kg', 'litro', 'caixa', 'pacote'])
    .withMessage('Unidade de medida inválida'),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano'),
  handleValidationErrors
];

/**
 * Validações para fórmulas
 */
const validateCreateFormula = [
  body('produto_id')
    .isInt({ min: 1 })
    .withMessage('ID do produto deve ser um número inteiro positivo'),
  body('maquina_id')
    .isInt({ min: 1 })
    .withMessage('ID da máquina deve ser um número inteiro positivo'),
  body('formula')
    .isLength({ min: 1 })
    .withMessage('Fórmula é obrigatória')
    .trim()
    .custom((value) => {
      // Validação básica da fórmula
      const allowedChars = /^[0-9+\-*/().\s\w]+$/;
      if (!allowedChars.test(value)) {
        throw new Error('Fórmula contém caracteres inválidos');
      }
      return true;
    }),
  body('nome')
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres')
    .trim(),
  body('descricao')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Descrição deve ter no máximo 5000 caracteres')
    .trim(),
  body('variaveis_entrada')
    .optional()
    .isArray()
    .withMessage('Variáveis de entrada deve ser um array'),
  body('unidade_resultado')
    .optional()
    .isIn(['unidade', 'm2', 'm', 'kg', 'litro', 'caixa', 'pacote', 'peça'])
    .withMessage('Unidade de resultado inválida'),
  body('prioridade')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Prioridade deve ser um número entre 1 e 100'),
  body('validacao_minima')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Validação mínima deve ser um número maior ou igual a zero'),
  body('validacao_maxima')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Validação máxima deve ser um número maior ou igual a zero'),
  handleValidationErrors
];

const validateUpdateFormula = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID da fórmula deve ser um número inteiro positivo'),
  body('produto_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID do produto deve ser um número inteiro positivo'),
  body('maquina_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID da máquina deve ser um número inteiro positivo'),
  body('formula')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Fórmula não pode estar vazia')
    .trim(),
  body('nome')
    .optional()
    .isLength({ min: 2, max: 200 })
    .withMessage('Nome deve ter entre 2 e 200 caracteres')
    .trim(),
  body('ativo')
    .optional()
    .isBoolean()
    .withMessage('Ativo deve ser um valor booleano'),
  handleValidationErrors
];

/**
 * Validações para parâmetros de rota
 */
const validateIdParam = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID deve ser um número inteiro positivo'),
  handleValidationErrors
];

/**
 * Validações para query parameters
 */
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),
  query('sort')
    .optional()
    .isIn(['id', 'nome', 'created_at', 'updated_at'])
    .withMessage('Campo de ordenação inválido'),
  query('order')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('Ordem deve ser ASC ou DESC'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateCreateProduto,
  validateUpdateProduto,
  validateCreateFormula,
  validateUpdateFormula,
  validateIdParam,
  validatePaginationQuery
};
'use strict';

/**
 * Utilitários para validações comuns
 * Centraliza lógicas de validação para evitar duplicação
 */

/**
 * Valida se um email tem formato válido
 * @param {string} email - Email a ser validado
 * @returns {boolean} True se válido
 */
const isValidEmail = (email) => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida se um CPF é válido
 * @param {string} cpf - CPF a ser validado
 * @returns {boolean} True se válido
 */
const isValidCPF = (cpf) => {
  if (!cpf) return false;
  
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleaned.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
};

/**
 * Valida se um CNPJ é válido
 * @param {string} cnpj - CNPJ a ser validado
 * @returns {boolean} True se válido
 */
const isValidCNPJ = (cnpj) => {
  if (!cnpj) return false;
  
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Verifica se tem 14 dígitos
  if (cleaned.length !== 14) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleaned)) return false;
  
  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 2;
  for (let i = 11; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(cleaned.charAt(12))) return false;
  
  // Validação do segundo dígito verificador
  sum = 0;
  weight = 2;
  for (let i = 12; i >= 0; i--) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 9 ? 2 : weight + 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(cleaned.charAt(13))) return false;
  
  return true;
};

/**
 * Valida se um telefone brasileiro é válido
 * @param {string} phone - Telefone a ser validado
 * @returns {boolean} True se válido
 */
const isValidPhone = (phone) => {
  if (!phone) return false;
  
  const cleaned = phone.replace(/\D/g, '');
  
  // Aceita telefones com 10 ou 11 dígitos (com ou sem 9 no celular)
  return cleaned.length === 10 || cleaned.length === 11;
};

/**
 * Valida se uma senha atende aos critérios mínimos
 * @param {string} password - Senha a ser validada
 * @param {Object} options - Opções de validação
 * @returns {Object} Resultado da validação com detalhes
 */
const validatePassword = (password, options = {}) => {
  const {
    minLength = 6,
    requireUppercase = false,
    requireLowercase = false,
    requireNumbers = false,
    requireSpecialChars = false
  } = options;
  
  const result = {
    isValid: true,
    errors: []
  };
  
  if (!password) {
    result.isValid = false;
    result.errors.push('Senha é obrigatória');
    return result;
  }
  
  if (password.length < minLength) {
    result.isValid = false;
    result.errors.push(`Senha deve ter pelo menos ${minLength} caracteres`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Senha deve conter pelo menos uma letra maiúscula');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    result.isValid = false;
    result.errors.push('Senha deve conter pelo menos uma letra minúscula');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    result.isValid = false;
    result.errors.push('Senha deve conter pelo menos um número');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.isValid = false;
    result.errors.push('Senha deve conter pelo menos um caractere especial');
  }
  
  return result;
};

/**
 * Valida se uma URL é válida
 * @param {string} url - URL a ser validada
 * @returns {boolean} True se válida
 */
const isValidURL = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Valida se um valor está dentro de um intervalo numérico
 * @param {number} value - Valor a ser validado
 * @param {number} min - Valor mínimo
 * @param {number} max - Valor máximo
 * @returns {boolean} True se válido
 */
const isInRange = (value, min, max) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

/**
 * Valida se uma string contém apenas caracteres permitidos
 * @param {string} text - Texto a ser validado
 * @param {RegExp} pattern - Padrão regex permitido
 * @returns {boolean} True se válido
 */
const matchesPattern = (text, pattern) => {
  if (!text) return false;
  return pattern.test(text);
};

/**
 * Valida se uma data é válida e está no futuro
 * @param {string|Date} date - Data a ser validada
 * @returns {boolean} True se válida e futura
 */
const isFutureDate = (date) => {
  const inputDate = new Date(date);
  const now = new Date();
  
  return !isNaN(inputDate.getTime()) && inputDate > now;
};

/**
 * Valida se uma data é válida e está no passado
 * @param {string|Date} date - Data a ser validada
 * @returns {boolean} True se válida e passada
 */
const isPastDate = (date) => {
  const inputDate = new Date(date);
  const now = new Date();
  
  return !isNaN(inputDate.getTime()) && inputDate < now;
};

/**
 * Valida se um arquivo tem extensão permitida
 * @param {string} filename - Nome do arquivo
 * @param {Array} allowedExtensions - Extensões permitidas
 * @returns {boolean} True se válido
 */
const hasValidExtension = (filename, allowedExtensions) => {
  if (!filename || !allowedExtensions) return false;
  
  const extension = filename.toLowerCase().split('.').pop();
  return allowedExtensions.map(ext => ext.toLowerCase()).includes(extension);
};

/**
 * Valida se um valor é um número positivo
 * @param {any} value - Valor a ser validado
 * @returns {boolean} True se for número positivo
 */
const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Valida se um valor é um inteiro positivo
 * @param {any} value - Valor a ser validado
 * @returns {boolean} True se for inteiro positivo
 */
const isPositiveInteger = (value) => {
  const num = parseInt(value);
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * Remove caracteres especiais de uma string, mantendo apenas letras, números e espaços
 * @param {string} text - Texto a ser sanitizado
 * @returns {string} Texto sanitizado
 */
const sanitizeText = (text) => {
  if (!text) return '';
  return text.replace(/[^a-zA-Z0-9\sÀ-ÿ]/g, '').trim();
};

module.exports = {
  isValidEmail,
  isValidCPF,
  isValidCNPJ,
  isValidPhone,
  validatePassword,
  isValidURL,
  isInRange,
  matchesPattern,
  isFutureDate,
  isPastDate,
  hasValidExtension,
  isPositiveNumber,
  isPositiveInteger,
  sanitizeText
};
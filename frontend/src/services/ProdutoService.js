import api from './api';

const getAll = (filters = {}) => {
  const params = new URLSearchParams(filters);
  return api.get(`/produtos?${params.toString()}`);
};

const getById = (id) => {
  return api.get(`/produtos/${id}`);
};

// Adicione outras funções conforme necessário, como:
// const create = (data) => api.post('/produtos', data);
// const update = (id, data) => api.put(`/produtos/${id}`, data);
// const remove = (id) => api.delete(`/produtos/${id}`);

export const produtoService = {
  getAll,
  getById,
  // create,
  // update,
  // remove,
};

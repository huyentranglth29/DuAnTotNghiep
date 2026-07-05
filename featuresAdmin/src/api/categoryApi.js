import axiosClient from './axiosClient';

const categoryApi = {
  getAll: params => axiosClient.get('/categories', {params}),
  create: data => axiosClient.post('/categories', data),
  update: (id, data) => axiosClient.put(`/categories/${id}`, data),
  remove: id => axiosClient.delete(`/categories/${id}`),
};

export default categoryApi;

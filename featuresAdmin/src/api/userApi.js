import axiosClient from './axiosClient';

const userApi = {
  getAll: params => axiosClient.get('/users', {params}),
  getById: id => axiosClient.get(`/users/${id}`),
  update: (id, data) => axiosClient.put(`/users/${id}`, data),
  remove: id => axiosClient.delete(`/users/${id}`),
};

export default userApi;

import axiosClient from './axiosClient';

const showtimeApi = {
  getAll: params => axiosClient.get('/showtimes', {params}),
  getById: id => axiosClient.get(`/showtimes/${id}`),
  create: data => axiosClient.post('/showtimes', data),
  update: (id, data) => axiosClient.put(`/showtimes/${id}`, data),
  remove: id => axiosClient.delete(`/showtimes/${id}`),
};

export default showtimeApi;

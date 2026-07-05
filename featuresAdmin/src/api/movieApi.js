import axiosClient from './axiosClient';

const movieApi = {
  getAll: params => axiosClient.get('/movies', {params}),
  getById: id => axiosClient.get(`/movies/${id}`),
  create: data => axiosClient.post('/movies', data),
  update: (id, data) => axiosClient.put(`/movies/${id}`, data),
  remove: id => axiosClient.delete(`/movies/${id}`),
};

export default movieApi;

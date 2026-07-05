import axiosClient from './axiosClient';

const cinemaApi = {
  getAll: params => axiosClient.get('/cinemas', {params}),
  create: data => axiosClient.post('/cinemas', data),
  update: (id, data) => axiosClient.put(`/cinemas/${id}`, data),
  remove: id => axiosClient.delete(`/cinemas/${id}`),
};

export default cinemaApi;

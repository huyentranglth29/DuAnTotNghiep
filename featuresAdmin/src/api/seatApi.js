import axiosClient from './axiosClient';

const seatApi = {
  getAll: params => axiosClient.get('/seats', {params}),
  create: data => axiosClient.post('/seats', data),
  update: (id, data) => axiosClient.put(`/seats/${id}`, data),
  remove: id => axiosClient.delete(`/seats/${id}`),
};

export default seatApi;

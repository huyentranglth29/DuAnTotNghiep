import axiosClient from './axiosClient';

const roomApi = {
  getAll: params => axiosClient.get('/rooms', {params}),
  create: data => axiosClient.post('/rooms', data),
  update: (id, data) => axiosClient.put(`/rooms/${id}`, data),
  remove: id => axiosClient.delete(`/rooms/${id}`),
};

export default roomApi;

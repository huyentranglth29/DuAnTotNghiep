import axiosClient from './axiosClient';

const bookingApi = {
  getAll: params => axiosClient.get('/bookings', {params}),
  getById: id => axiosClient.get(`/bookings/${id}`),
  update: (id, data) => axiosClient.put(`/bookings/${id}`, data),
  remove: id => axiosClient.delete(`/bookings/${id}`),
};

export default bookingApi;

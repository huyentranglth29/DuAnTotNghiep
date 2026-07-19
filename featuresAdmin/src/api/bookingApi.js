import axiosClient from './axiosClient';

const bookingApi = {
  getAll: params => axiosClient.get('/admin/bookings', {params}),
  getMovies: () => axiosClient.get('/admin/bookings/movies'),
  getById: id => axiosClient.get(`/admin/bookings/${id}`),
  update: (id, data) => axiosClient.put(`/admin/bookings/${id}`, data),
  remove: id => axiosClient.delete(`/admin/bookings/${id}`),
};

export default bookingApi;

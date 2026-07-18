import createAdminResourceApi from './adminResourceApi';
import axiosClient from './axiosClient';

const base = createAdminResourceApi('showtimes');

const showtimeApi = {
  ...base,
  getSuggestion: params =>
    axiosClient.get('/admin/showtimes/suggest', {params}),
  getOccupancy: () => axiosClient.get('/admin/showtimes/occupancy'),
  checkConflict: data =>
    axiosClient.post('/admin/showtimes/check-conflict', data),
};

export default showtimeApi;

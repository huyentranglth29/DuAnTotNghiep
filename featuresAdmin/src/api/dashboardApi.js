import axiosClient from './axiosClient';

const dashboardApi = {
  getStats: () => axiosClient.get('/admin/dashboard'),
  getOverview: params => axiosClient.get('/admin/dashboard/overview', {params}),
  getRevenueByDay: params => axiosClient.get('/admin/reports/revenue-by-day', {params}),
  getRevenueByMovie: params => axiosClient.get('/admin/reports/revenue-by-movie', {params}),
  getRevenueByRoom: params => axiosClient.get('/admin/reports/revenue-by-room', {params}),
  getTicketsByDay: params => axiosClient.get('/admin/reports/tickets-by-day', {params}),
  getSeatOccupancy: params => axiosClient.get('/admin/reports/seat-occupancy', {params}),
  getTopMovies: params => axiosClient.get('/admin/reports/top-movies', {params}),
};

export default dashboardApi;

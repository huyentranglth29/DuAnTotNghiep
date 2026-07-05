import axiosClient from './axiosClient';

const dashboardApi = {
  getStats: () => axiosClient.get('/dashboard'),
  getRevenue: params => axiosClient.get('/reports/revenue', {params}),
};

export default dashboardApi;

import axiosClient from './axiosClient';

const paymentApi = {
  getAll: params => axiosClient.get('/admin/payments', {params}),
};

export default paymentApi;

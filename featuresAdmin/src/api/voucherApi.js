import axiosClient from './axiosClient';
import createAdminResourceApi from './adminResourceApi';

const voucherApi = {
  ...createAdminResourceApi('vouchers'),
  getStats: (params) => axiosClient.get('/admin/reports/voucher-stats', {params}),
};

export default voucherApi;

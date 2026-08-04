import createAdminResourceApi from './adminResourceApi';
import axiosClient from './axiosClient';

const notificationApi = {
  ...createAdminResourceApi('notifications'),
  getRecipients: id => axiosClient.get(`/admin/notifications/${id}/recipients`),
};

export default notificationApi;

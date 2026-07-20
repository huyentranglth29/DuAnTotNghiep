import axiosClient from './axiosClient';

const basePath = '/admin/users';

const userApi = {
  getStats: () => axiosClient.get(`${basePath}/stats`),
  getAll: params => axiosClient.get(basePath, {params}),
  getById: id => axiosClient.get(`${basePath}/${id}`),
  update: (id, data) => axiosClient.put(`${basePath}/${id}`, data),
  lock: (id, data) => axiosClient.post(`${basePath}/${id}/lock`, data),
  unlock: id => axiosClient.post(`${basePath}/${id}/unlock`),
  exportRows: params => axiosClient.get(`${basePath}/export`, {params}),
};

export default userApi;

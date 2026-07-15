import axiosClient from './axiosClient';

function createAdminResourceApi(resource) {
  const basePath = `/admin/${resource}`;

  return {
    getAll: params => axiosClient.get(basePath, {params}),
    getById: id => axiosClient.get(`${basePath}/${id}`),
    create: data => axiosClient.post(basePath, data),
    update: (id, data) => axiosClient.put(`${basePath}/${id}`, data),
    remove: id => axiosClient.delete(`${basePath}/${id}`),
  };
}

export default createAdminResourceApi;

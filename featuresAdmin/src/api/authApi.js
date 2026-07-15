import axiosClient from './axiosClient';

const authApi = {
  login: data => axiosClient.post('/auth/login', data),
  me: () => axiosClient.get('/auth/profile'),
};

export default authApi;

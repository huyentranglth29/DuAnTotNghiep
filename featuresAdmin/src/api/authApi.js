import axiosClient from './axiosClient';

const authApi = {
  login: data => axiosClient.post('/login', data),
  me: () => axiosClient.get('/me'),
};

export default authApi;

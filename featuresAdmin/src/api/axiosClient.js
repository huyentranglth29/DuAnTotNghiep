import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.response.use(
  response => {
    const payload = response.data;
    if (
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      'data' in payload
    ) {
      return payload.data;
    }
    return payload;
  },
  error => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể kết nối tới server';
    return Promise.reject(new Error(message));
  },
);

export default axiosClient;

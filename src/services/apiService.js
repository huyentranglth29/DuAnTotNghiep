import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

/**
 * Axios instance dùng chung cho toàn app.
 * baseURL lấy từ .env (react-native-config) hoặc src/config/api.config.js
 */
const apiClient = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Gắn token sau khi đăng nhập (tuỳ chọn).
 * Ví dụ: setAuthToken('eyJhbG...') sau login thành công.
 */
export const setAuthToken = token => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete apiClient.defaults.headers.common.Authorization;
};

apiClient.interceptors.response.use(
  response => response.data,
  error => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      'Không thể kết nối tới server';

    const apiError = new Error(message);
    apiError.status = error.response?.status;
    apiError.data = error.response?.data;

    return Promise.reject(apiError);
  },
);

/**
 * Lấy danh sách phim từ JSON Server.
 * GET /movies
 *
 * @param {object} [params] - Query params, vd: { status: 'now-showing', _limit: 10 }
 * @returns {Promise<Array>}
 *
 * db.json mẫu:
 * { "movies": [{ "id": 1, "title": "...", "status": "now-showing", ... }] }
 */
export const getMovies = async (params = {}) => {
  return apiClient.get('/movies', { params });
};

/**
 * Lấy chi tiết một phim theo id.
 * GET /movies/:id
 *
 * @param {string|number} id
 * @returns {Promise<object>}
 */
export const getMovieById = async id => {
  if (id === undefined || id === null || id === '') {
    throw new Error('id phim là bắt buộc');
  }

  return apiClient.get(`/movies/${id}`);
};

/**
 * Đăng nhập qua JSON Server (json-server-auth hoặc custom route).
 * POST /login
 *
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ accessToken?: string, user?: object, ... }>}
 *
 * Body gửi lên: { "email": "...", "password": "..." }
 * Response mẫu (json-server-auth): { "accessToken": "...", "user": { ... } }
 */
export const login = async ({ email, password }) => {
  if (!email?.trim() || !password) {
    throw new Error('Vui lòng nhập email và mật khẩu');
  }

  return apiClient.post('/login', {
    email: email.trim(),
    password,
  });
};

/**
 * Lấy danh sách đánh giá cho một phim
 * GET /reviews?movieId=123
 */
export const getReviews = async (movieId) => {
  return apiClient.get('/reviews', { params: { movieId } });
};

/**
 * Gửi 1 đánh giá mới
 * POST /reviews
 * body: { movieId, rating, text, tags }
 */
export const postReview = async (payload) => {
  return apiClient.post('/reviews', payload);
};

export default apiClient;

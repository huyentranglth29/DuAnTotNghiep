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

  return apiClient.post('/api/auth/login', {
    email: email.trim(),
    password,
  });
};

/**
 * Đăng ký tài khoản qua backend.
 * POST /api/auth/register
 *
 * @param {{ fullName: string, email: string, password: string, phone?: string }} payload
 * @returns {Promise<{ success: boolean, message: string, user: object }>}
 */
export const register = async ({ fullName, email, password, phone }) => {
  if (!fullName?.trim() || !email?.trim() || !password) {
    throw new Error('Vui lòng nhập đầy đủ thông tin bắt buộc');
  }

  return apiClient.post('/api/auth/register', {
    fullName: fullName.trim(),
    email: email.trim(),
    password,
    phone: phone?.trim(),
  });
};

/**
 * Lấy danh sách đánh giá cho một phim
 * GET /reviews?movieId=123
 */
export const getReviews = async (movieId) => {
  return apiClient.get('/api/reviews', {
    params: { movie: movieId, status: 'approved' },
  });
};

/**
 * Gửi 1 đánh giá mới
 * POST /reviews
 * body: { movieId, rating, text, tags }
 */
export const postReview = async (payload) => {
  return apiClient.post('/api/reviews', {
    ...payload,
    movie: payload.movie || payload.movieId,
    comment: payload.comment || payload.text,
  });
};

/**
 * Lấy danh sách Voucher từ backend.
 * GET /api/vouchers
 */
export const getVouchers = async () => {
  return apiClient.get('/api/vouchers');
};

/**
 * Lấy danh sách Combo bắp nước từ backend.
 * GET /api/products
 */
export const getProducts = async () => {
  return apiClient.get('/api/products');
};

/**
 * Lấy danh sách Tin tức / Sự kiện từ backend.
 * GET /api/notifications
 */
export const getNotifications = async () => {
  const response = await apiClient.get('/api/notifications');
  return response?.data ?? response ?? [];
};

export const markNotificationRead = async id => {
  const response = await apiClient.post(`/api/notifications/${id}/read`);
  return response?.data ?? response;
};

export const markAllNotificationsRead = async () => {
  return apiClient.post('/api/notifications/read-all');
};

export const getNewsEvents = async () => {
  const response = await apiClient.get('/api/news-events');
  return response?.data ?? response ?? [];
};

/**
 * Lưu đặt vé nhanh lên MongoDB Atlas
 * POST /api/quick-bookings
 * body: { showtimeId, movieTitle, movieDuration, movieGenre, seats, totalPrice, cinema, bookingDate, bookingTime }
 */
export const createQuickBooking = async (payload) => {
  return apiClient.post('/api/quick-bookings', payload);
};

/** Lấy nhãn ghế đã thanh toán của một suất chiếu. */
export const getSoldSeats = async (showtimeId) => {
  const response = await apiClient.get('/api/quick-bookings/sold-seats', {
    params: {showtimeId},
  });
  const data = response?.data ?? response ?? [];
  return Array.isArray(data) ? data : [];
};

/** Tạo giao dịch VNPAY Sandbox và giữ ghế tạm thời. */
export const createVnpayPayment = async (payload) => {
  return apiClient.post('/api/payments/vnpay/create', payload);
};

/** Tạo giao dịch mô phỏng nội bộ, không cần tài khoản cổng thanh toán. */
export const createMockPayment = async (payload) => {
  return apiClient.post('/api/payments/mock/create', payload);
};

/** Mô phỏng kết quả thành công và phát hành vé thật trong MongoDB. */
export const completeMockPayment = async (paymentId, bankCode) => {
  return apiClient.post(`/api/payments/mock/${paymentId}/complete`, {bankCode});
};

/** Mô phỏng kết quả thất bại và giải phóng ghế. */
export const failMockPayment = async (paymentId) => {
  return apiClient.post(`/api/payments/mock/${paymentId}/fail`);
};

/** Kiểm tra trạng thái giao dịch sau khi quay lại từ VNPAY. */
export const getPaymentStatus = async (paymentId) => {
  return apiClient.get(`/api/payments/${paymentId}/status`);
};

/** Hủy giao dịch đang chờ và giải phóng ghế. */
export const cancelPayment = async (paymentId) => {
  return apiClient.post(`/api/payments/${paymentId}/cancel`);
};

export const holdSeats = async (payload) => {
  return apiClient.post('/api/seat-holds', payload);
};

export const releaseSeats = async ({holdToken, showtimeId}) => {
  return apiClient.delete(`/api/seat-holds/${encodeURIComponent(holdToken)}`, {
    params: showtimeId ? {showtimeId} : undefined,
  });
};

/**
 * Lấy danh sách vé đã đặt từ MongoDB Atlas
 * GET /api/quick-bookings/mine
 */
export const getQuickBookings = async () => {
  return apiClient.get('/api/quick-bookings/mine');
};

export default apiClient;

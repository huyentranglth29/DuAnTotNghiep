import apiClient, {setAuthToken} from './apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = '@filmgo_auth_token';
export const AUTH_USER_KEY = '@filmgo_auth_user';

const unwrap = payload => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data;
  }
  return payload;
};

export async function restoreAuthSession() {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  if (!token) {
    return null;
  }

  setAuthToken(token);

  try {
    // Token cũ / user đã bị seed lại → xóa session để tránh "Người dùng không tồn tại"
    await apiClient.get('/api/auth/profile');
    return token;
  } catch {
    await clearAuthSession();
    return null;
  }
}

export async function saveAuthSession({token, user}) {
  if (token) {
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    setAuthToken(token);
  }
  if (user) {
    await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  }
}

export async function clearAuthSession() {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  setAuthToken(null);
}

export async function loginWithApi({email, password}) {
  const response = await apiClient.post('/api/auth/login', {
    email: email.trim().toLowerCase(),
    password,
  });

  if (!response?.token) {
    throw new Error(response?.message || 'Đăng nhập thất bại');
  }

  await saveAuthSession({token: response.token, user: response.user});
  return response;
}

export async function registerWithApi({fullName, email, password, phone}) {
  return apiClient.post('/api/auth/register', {
    fullName,
    email: email.trim().toLowerCase(),
    password,
    phone,
  });
}

/** Danh sách voucher đang mở */
export async function getActiveVouchers() {
  return unwrap(await apiClient.get('/api/vouchers/active'));
}

/** Kiểm tra + tính giảm giá */
export async function validateVoucher({code, orderValue}) {
  return unwrap(
    await apiClient.post('/api/vouchers/validate', {
      code: String(code || '').trim().toUpperCase(),
      orderValue: Number(orderValue) || 0,
    }),
  );
}

/** Thêm vào kho của user */
export async function claimVoucher(code) {
  return unwrap(
    await apiClient.post('/api/vouchers/claim', {
      code: String(code || '').trim().toUpperCase(),
    }),
  );
}

export async function getMyVouchers() {
  return unwrap(await apiClient.get('/api/vouchers/mine'));
}

export async function getVoucherHistory(status = 'all') {
  return unwrap(
    await apiClient.get('/api/vouchers/history', {params: {status}}),
  );
}

/** Tạo booking + gắn voucher → đẩy lên biểu đồ admin */
export async function checkoutBooking(payload) {
  return unwrap(await apiClient.post('/api/bookings/checkout', payload));
}

/** Vé / booking của user đang đăng nhập */
export async function getMyBookings() {
  return unwrap(await apiClient.get('/api/bookings/mine'));
}

export default {
  getActiveVouchers,
  validateVoucher,
  claimVoucher,
  getMyVouchers,
  getVoucherHistory,
  checkoutBooking,
  getMyBookings,
  loginWithApi,
  registerWithApi,
};

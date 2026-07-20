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
  try {
    const {GoogleSignin} = require('@react-native-google-signin/google-signin');
    await GoogleSignin.signOut();
  } catch {
    // Không đăng nhập Google / native chưa sẵn sàng — bỏ qua
  }

  // AsyncStorage v3: multiRemove → removeMany
  if (typeof AsyncStorage.removeMany === 'function') {
    await AsyncStorage.removeMany([AUTH_TOKEN_KEY, AUTH_USER_KEY]);
  } else {
    await Promise.all([
      AsyncStorage.removeItem(AUTH_TOKEN_KEY),
      AsyncStorage.removeItem(AUTH_USER_KEY),
    ]);
  }
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

/** Đăng nhập bằng tài khoản Google thật — chỉ gửi idToken, lưu JWT (không lưu idToken) */
export async function loginWithGoogleApi(idToken) {
  const response = await apiClient.post('/api/auth/google-login', {idToken});

  if (!response?.token) {
    throw new Error(response?.message || 'Đăng nhập Google thất bại');
  }

  await saveAuthSession({token: response.token, user: response.user});
  return response;
}

export async function setFilmGoPassword(password, confirmPassword) {
  return apiClient.post('/api/auth/set-password', {password, confirmPassword});
}

export async function getAuthProfile() {
  const response = await apiClient.get('/api/auth/profile');
  const user = response?.user || response;
  if (user) {
    await saveAuthSession({user});
  }
  return user;
}

export async function updateAuthProfile(payload) {
  const response = await apiClient.put('/api/auth/profile', payload);
  const user = response?.user;
  if (user) {
    await saveAuthSession({user});
  }
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
  loginWithGoogleApi,
  registerWithApi,
};

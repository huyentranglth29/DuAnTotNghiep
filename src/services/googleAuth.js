import {Platform} from 'react-native';
import GOOGLE_CONFIG from '../config/google.config';

let Config = {};

try {
  Config = require('react-native-config').default ?? {};
} catch {
  // react-native-config chưa link
}

/**
 * Ưu tiên: google.config.js → .env (react-native-config)
 * Phải trùng backend GOOGLE_CLIENT_ID (Web Client ID).
 */
export const GOOGLE_WEB_CLIENT_ID = String(
  GOOGLE_CONFIG.WEB_CLIENT_ID ||
    Config.GOOGLE_WEB_CLIENT_ID ||
    Config.GOOGLE_CLIENT_ID ||
    '',
).trim();

let configured = false;
let GoogleSigninModule = null;

function loadGoogleSignIn() {
  if (GoogleSigninModule) {
    return GoogleSigninModule;
  }

  try {
    GoogleSigninModule = require('@react-native-google-signin/google-signin');
  } catch {
    throw new Error(
      'Chưa cài/link được Google Sign-In. Chạy lại: npx react-native run-android',
    );
  }

  if (!GoogleSigninModule?.GoogleSignin) {
    throw new Error(
      'Google Sign-In native module chưa sẵn sàng. Hãy dừng app và chạy lại: npx react-native run-android',
    );
  }

  return GoogleSigninModule;
}

export function configureGoogleSignIn() {
  if (configured) {
    return;
  }

  if (!GOOGLE_WEB_CLIENT_ID) {
    return;
  }

  try {
    const {GoogleSignin} = loadGoogleSignIn();
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
      forceCodeForRefreshToken: false,
    });
    configured = true;
  } catch (error) {
    console.warn('Google Sign-In configure:', error?.message || error);
  }
}

export async function getGoogleIdToken() {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Chưa cấu hình Web Client ID.\nMở src/config/google.config.js → dán WEB_CLIENT_ID từ Google Cloud (Web application).\nĐồng thời set GOOGLE_CLIENT_ID trong backend/.env (cùng giá trị).',
    );
  }

  const {GoogleSignin} = loadGoogleSignIn();
  configureGoogleSignIn();

  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});

  if (Platform.OS === 'android') {
    try {
      await GoogleSignin.signOut();
    } catch {
      // ignore
    }
  }

  const response = await GoogleSignin.signIn();

  if (response?.type === 'cancelled') {
    const cancelError = new Error('Bạn đã hủy đăng nhập Google.');
    cancelError.code = 'SIGN_IN_CANCELLED';
    throw cancelError;
  }

  let idToken = response?.data?.idToken || response?.idToken || null;

  if (!idToken) {
    try {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens?.idToken || null;
    } catch {
      // fall through
    }
  }

  if (!idToken) {
    throw new Error(
      'Không lấy được idToken từ Google. Kiểm tra Web Client ID và SHA-1 Android (package com.duantotnghiep).',
    );
  }

  return idToken;
}

export function mapGoogleSignInError(error) {
  const code = String(error?.code || '');
  const message = error instanceof Error ? error.message : String(error || '');

  if (
    code === 'SIGN_IN_CANCELLED' ||
    message.includes('hủy đăng nhập') ||
    message.includes('cancelled')
  ) {
    return 'Bạn đã hủy đăng nhập Google.';
  }

  if (code === 'IN_PROGRESS' || message.includes('IN_PROGRESS')) {
    return 'Đang xử lý đăng nhập Google, vui lòng đợi.';
  }

  if (
    code === 'PLAY_SERVICES_NOT_AVAILABLE' ||
    message.includes('PLAY_SERVICES')
  ) {
    return 'Thiết bị thiếu Google Play Services.';
  }

  if (
    message.includes('statusCodes') ||
    message.includes('RNGoogleSignin') ||
    message.includes('TurboModuleRegistry') ||
    message.includes('native module')
  ) {
    return 'Google Sign-In chưa được cài vào bản build. Hãy dừng app và chạy: npx react-native run-android';
  }

  if (message.includes('DEVELOPER_ERROR') || code === '10' || code === 'DEVELOPER_ERROR') {
    return (
      'Cấu hình Google chưa khớp.\n' +
      '1) Client Android SHA-1 phải là: FD:29:31:34:11:60:DC:15:56:4E:30:A6:12:85:18:B0:55:EC:DD:02\n' +
      '2) Code dùng Web Client ID (không dùng Android ID)\n' +
      '3) Phải rebuild app sau khi đổi keystore\n' +
      '4) Thêm Gmail vào Khán giả → Người dùng thử nghiệm'
    );
  }

  return message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
}

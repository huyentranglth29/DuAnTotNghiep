import {Platform} from 'react-native';

let Config = {};

try {
  Config = require('react-native-config').default ?? {};
} catch {
  // react-native-config chưa link — dùng fallback bên dưới
}

/**
 * JSON Server chạy trên máy host:
 * - Android Emulator: 10.0.2.2 trỏ về localhost của máy tính
 * - iOS Simulator / thiết bị thật: dùng IP LAN máy tính (vd: 192.168.1.10:3000)
 *
 * Ghi đè bằng file .env: API_BASE_URL=http://...
 */
const DEV_FALLBACK_BASE_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:3000'
    : 'http://localhost:3000';

export const API_CONFIG = {
  baseURL: Config.API_BASE_URL || DEV_FALLBACK_BASE_URL,
  timeout: Number(Config.API_TIMEOUT) || 15000,
};

/** Ghép URL ảnh avatar (relative `/uploads/...` hoặc URL đầy đủ). */
export function resolveMediaUrl(pathOrUrl) {
  if (!pathOrUrl) {
    return '';
  }
  const value = String(pathOrUrl).trim();
  if (!value) {
    return '';
  }
  if (/^(https?:\/\/|data:|file:)/i.test(value)) {
    return value;
  }
  const base = String(API_CONFIG.baseURL || '').replace(/\/$/, '');
  return `${base}${value.startsWith('/') ? '' : '/'}${value}`;
}

export default API_CONFIG;

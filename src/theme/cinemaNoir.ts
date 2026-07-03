/**
 * Bảng màu Cinema Noir — nền đen, accent vàng đồng và đỏ.
 */
export const MAU_CHU_DE = {
  /** Nền chính */
  nenChinh: '#000000',
  /** Nền thẻ / vùng nổi */
  nenThe: '#121212',
  /** Nền nút phụ */
  nenNutPhu: '#1A1A1A',

  /** Chữ chính */
  chuChinh: '#FFFFFF',
  /** Chữ phụ / meta */
  chuPhu: '#9CA3AF',
  /** Vàng đồng — icon, rating, link */
  vangDong: '#D4AF37',
  /** Vàng nhạt hơn cho subtitle */
  vangNhat: '#C9A227',
  /** Đỏ — nút chính, tab active */
  doAccent: '#E50914',
  /** Viền nút phụ */
  vienNhe: '#3A3A3A',
  /** Viền vàng khi card được chọn */
  vienVang: '#D4AF37',
  /** Badge rating nền mờ */
  nenBadge: 'rgba(0, 0, 0, 0.65)',
} as const;

export const KHOANG_CACH = {
  nho: 8,
  vua: 12,
  lon: 16,
  ratLon: 24,
} as const;

export const BO_TRON = {
  the: 12,
  nut: 24,
  tab: 20,
  badge: 8,
} as const;

export type MauChuDe = typeof MAU_CHU_DE;

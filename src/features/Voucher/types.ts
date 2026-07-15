export type VoucherHistoryFilter = 'all' | 'used' | 'expired';

export type FilmGoVoucher = {
  _id: string;
  walletId?: string;
  code: string;
  description?: string;
  discountType: 'percent' | 'amount';
  discountValue: number;
  minOrderValue?: number;
  maxDiscount?: number;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  status?: string;
  walletStatus?: 'available' | 'used' | 'expired';
  usedAt?: string;
  claimedAt?: string;
  usedCount?: number;
  remaining?: number;
};

export function formatVoucherValue(voucher: FilmGoVoucher) {
  if (voucher.discountType === 'percent') {
    return `Giảm ${voucher.discountValue}%`;
  }
  return `Giảm ${Number(voucher.discountValue || 0).toLocaleString('vi-VN')}đ`;
}

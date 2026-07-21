import AsyncStorage from '@react-native-async-storage/async-storage';
import {getQuickBookings} from '../../../../services/apiService';
import {
  AUTH_USER_KEY,
  getAuthProfile,
  getMyBookings,
  restoreAuthSession,
} from '../../../../services/voucherService';

export type CurrentUser = {
  _id?: string;
  id?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  rewardPoints?: number;
};

export type MemberStats = {
  user: CurrentUser;
  memberId: string;
  registeredAt: string;
  totalSpent: number;
  earnedPoints: number;
  usedPoints: number;
  currentPoints: number;
  tierName: string;
  nextTierName: string;
  nextTierSpend: number;
  remainingToNextTier: number;
  progressRatio: number;
};

const VIP_THRESHOLD = 3_000_000;
const POINT_VALUE = 10_000;

const unwrap = <T>(payload: T | {data?: T} | undefined): T | undefined => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return (payload as {data?: T}).data;
  }
  return payload as T | undefined;
};

const asList = (value: unknown): any[] => (Array.isArray(value) ? value : []);

const paidStatuses = new Set(['paid', 'refunded']);

const isPaidOrder = (order: any) => {
  const status = String(order?.status || '').toLowerCase();
  const paymentStatus = String(order?.paymentStatus || '').toLowerCase();
  return paidStatuses.has(status) || paymentStatus === 'paid';
};

const totalOf = (orders: any[]) =>
  orders
    .filter(isPaidOrder)
    .reduce((sum, item) => sum + Number(item.totalPrice || item.total || 0), 0);

export const formatMoney = (value: number) =>
  `${Number(value || 0).toLocaleString('vi-VN')} đ`;

export const formatMemberDate = (value?: string) => {
  if (!value) {
    return 'Đang cập nhật';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN');
};

export const buildMemberId = (user: CurrentUser) => {
  const raw = String(user._id || user.id || '');
  const digits = raw.replace(/\D/g, '');
  if (digits) {
    return digits.slice(-16).padStart(16, '0');
  }
  return raw.slice(-16).toUpperCase().padStart(16, '0');
};

async function readCachedUser(): Promise<CurrentUser> {
  try {
    const value = await AsyncStorage.getItem(AUTH_USER_KEY);
    return value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
}

export async function loadMemberStats(): Promise<MemberStats> {
  const cachedUser = await readCachedUser();
  const token = await restoreAuthSession();

  if (!token) {
    return buildMemberStats(cachedUser, 0);
  }

  const [profileResult, quickResult, bookingResult] = await Promise.allSettled([
    getAuthProfile(),
    getQuickBookings(),
    getMyBookings(),
  ]);

  const profile =
    profileResult.status === 'fulfilled'
      ? ((unwrap(profileResult.value as any) as CurrentUser) || cachedUser)
      : cachedUser;
  const quickBookings =
    quickResult.status === 'fulfilled'
      ? asList(unwrap(quickResult.value as any))
      : [];
  const bookings =
    bookingResult.status === 'fulfilled'
      ? asList(unwrap(bookingResult.value as any))
      : [];

  return buildMemberStats(profile, totalOf([...quickBookings, ...bookings]));
}

function buildMemberStats(user: CurrentUser, totalSpent: number): MemberStats {
  const earnedPoints = Math.floor(totalSpent / POINT_VALUE);
  const usedPoints = 0;
  const profilePoints = Number(user.rewardPoints);
  const currentPoints = Number.isFinite(profilePoints) && profilePoints > 0
    ? profilePoints
    : earnedPoints - usedPoints;
  const isVip = totalSpent >= VIP_THRESHOLD;

  return {
    user,
    memberId: buildMemberId(user),
    registeredAt: formatMemberDate(user.createdAt),
    totalSpent,
    earnedPoints,
    usedPoints,
    currentPoints: Math.max(0, currentPoints),
    tierName: isVip ? 'VIP' : 'STANDARD',
    nextTierName: isVip ? 'VIP' : 'VIP',
    nextTierSpend: VIP_THRESHOLD,
    remainingToNextTier: Math.max(0, VIP_THRESHOLD - totalSpent),
    progressRatio: Math.min(1, totalSpent / VIP_THRESHOLD),
  };
}

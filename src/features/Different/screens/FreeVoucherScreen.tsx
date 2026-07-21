import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {
  claimVoucher,
  getActiveVouchers,
  restoreAuthSession,
} from '../../../services/voucherService';
import {FilmGoVoucher, formatVoucherValue} from '../../Voucher/types';

const BLUE = '#005f98';
const TEXT = '#263847';
const MUTED = '#667085';

type FreeVoucherScreenProps = {
  onBack: () => void;
};

const money = (value?: number) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const formatDate = (value?: string) => {
  if (!value) {
    return 'Không giới hạn';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN');
};

function FreeVoucherScreen({onBack}: FreeVoucherScreenProps) {
  const [items, setItems] = useState<FilmGoVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [claimingCode, setClaimingCode] = useState('');

  const loadVouchers = useCallback(async () => {
    setError('');
    try {
      const data = await getActiveVouchers();
      const active = Array.isArray(data) ? data : [];
      setItems(active.filter(item => Number(item.remaining ?? 1) > 0));
    } catch (err) {
      setError((err as Error)?.message || 'Không tải được voucher miễn phí');
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadVouchers();
  }, [loadVouchers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadVouchers();
  };

  const onClaim = async (code: string) => {
    setClaimingCode(code);
    try {
      const token = await restoreAuthSession();
      if (!token) {
        Alert.alert(
          'Cần đăng nhập',
          'Bạn cần đăng nhập để lưu voucher vào kho.',
        );
        return;
      }

      await claimVoucher(code);
      Alert.alert('Thành công', `${code} đã được thêm vào kho voucher.`);
      await loadVouchers();
    } catch (err) {
      Alert.alert('Không thể nhận voucher', (err as Error)?.message || 'Vui lòng thử lại');
    } finally {
      setClaimingCode('');
    }
  };

  const renderItem = ({item}: {item: FilmGoVoucher}) => {
    const remaining = Number(item.remaining ?? 0);
    const minOrderValue = Number(item.minOrderValue || 0);
    const maxDiscount = Number(item.maxDiscount || 0);
    const claiming = claimingCode === item.code;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.badge}>
            <Text style={styles.badgeValue}>
              {item.discountType === 'percent'
                ? `${item.discountValue}%`
                : `-${Math.round(Number(item.discountValue || 0) / 1000)}K`}
            </Text>
            <Text style={styles.badgeLabel}>OFF</Text>
          </View>
          <View style={styles.cardBody}>
            <Text style={styles.code}>{item.code}</Text>
            <Text style={styles.value}>{formatVoucherValue(item)}</Text>
            <Text style={styles.description} numberOfLines={2}>
              {item.description || 'Ưu đãi dành cho thành viên FilmGo'}
            </Text>
          </View>
        </View>

        <View style={styles.metaBox}>
          <Text style={styles.metaText}>HSD: {formatDate(item.endDate)}</Text>
          <Text style={styles.metaText}>
            Còn {remaining > 0 ? remaining : 0} lượt
          </Text>
          {minOrderValue > 0 ? (
            <Text style={styles.metaText}>Đơn từ {money(minOrderValue)}</Text>
          ) : null}
          {maxDiscount > 0 ? (
            <Text style={styles.metaText}>Tối đa {money(maxDiscount)}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          activeOpacity={0.82}
          disabled={claiming}
          style={[styles.claimButton, claiming && styles.claimButtonDisabled]}
          onPress={() => onClaim(item.code)}>
          <Text style={styles.claimText}>
            {claiming ? 'Đang nhận...' : 'Nhận voucher'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
          <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
            <Path
              d="M17.5 5.5L9 14l8.5 8.5"
              stroke="#ffffff"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VOUCHER MIỄN PHÍ</Text>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.centerText}>Đang tải voucher...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item._id || item.code}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={loadVouchers}>
                  <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Không có voucher miễn phí</Text>
              <Text style={styles.emptyText}>
                Admin chưa mở voucher nào hoặc voucher đã hết lượt.
              </Text>
            </View>
          }
          renderItem={renderItem}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f4f7fb',
  },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: BLUE,
  },
  backButton: {
    width: 58,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  list: {
    padding: 14,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    backgroundColor: '#ffffff',
    marginBottom: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  cardTop: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    width: 78,
    minHeight: 88,
    borderRadius: 10,
    backgroundColor: '#e51978',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeValue: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  badgeLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  cardBody: {
    flex: 1,
  },
  code: {
    color: BLUE,
    fontSize: 19,
    lineHeight: 25,
    fontWeight: '900',
  },
  value: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  description: {
    color: MUTED,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 7,
  },
  metaBox: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e5e7eb',
    gap: 4,
  },
  metaText: {
    color: '#475467',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  claimButton: {
    height: 44,
    borderRadius: 22,
    backgroundColor: BLUE,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 13,
  },
  claimButtonDisabled: {
    opacity: 0.65,
  },
  claimText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centerText: {
    color: MUTED,
    marginTop: 10,
    fontWeight: '600',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 26,
    paddingVertical: 80,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyText: {
    color: MUTED,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  errorBox: {
    borderRadius: 10,
    backgroundColor: '#fff7ed',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fed7aa',
    marginBottom: 12,
    padding: 12,
  },
  errorText: {
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
  },
  retryText: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
  },
});

export default FreeVoucherScreen;

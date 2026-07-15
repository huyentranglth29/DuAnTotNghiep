import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  VOUCHER_BLUE,
  VOUCHER_MUTED,
  VOUCHER_SCREEN_BG,
  VOUCHER_TEXT,
} from '../constants';
import {
  CheckCircleIcon,
  ClockIcon,
  HistoryIcon,
  RefreshIcon,
} from '../components/VoucherActionIcons';
import VoucherHeader from '../components/VoucherHeader';
import VoucherHistoryTabs from '../components/VoucherHistoryTabs';
import {FilmGoVoucher, VoucherHistoryFilter, formatVoucherValue} from '../types';
import {
  getVoucherHistory,
  restoreAuthSession,
} from '../../../services/voucherService';

type VoucherHistoryScreenProps = {
  activeFilter: VoucherHistoryFilter;
  onBack: () => void;
  onChangeFilter: (filter: VoucherHistoryFilter) => void;
};

function VoucherHistoryScreen({
  activeFilter,
  onBack,
  onChangeFilter,
}: VoucherHistoryScreenProps) {
  const [items, setItems] = useState<FilmGoVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await restoreAuthSession();
      if (!token) {
        setItems([]);
        setError('Đăng nhập để xem lịch sử voucher đã dùng.');
        return;
      }
      const data = await getVoucherHistory(activeFilter);
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error)?.message || 'Không tải được lịch sử');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const emptyContent = useMemo(() => {
    if (activeFilter === 'used') {
      return {
        icon: 'check' as const,
        title: 'Chưa có voucher đã sử dụng',
        description: 'Các voucher đã sử dụng sẽ hiển thị ở đây',
      };
    }

    if (activeFilter === 'expired') {
      return {
        icon: 'clock' as const,
        title: 'Chưa có voucher hết hạn',
        description: 'Các voucher hết hạn sẽ hiển thị ở đây',
      };
    }

    return {
      icon: 'history' as const,
      title: 'Không có lịch sử voucher',
      description: error || 'Lịch sử các voucher sẽ hiển thị ở đây',
    };
  }, [activeFilter, error]);

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={VOUCHER_BLUE} />
      <VoucherHeader title="LỊCH SỬ VOUCHER" onBack={onBack} />

      <VoucherHistoryTabs
        activeFilter={activeFilter}
        onChangeFilter={onChangeFilter}
      />

      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator color={VOUCHER_BLUE} />
        ) : items.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={item => item.walletId || item._id}
            contentContainerStyle={{paddingBottom: 24}}
            renderItem={({item}) => (
              <View style={styles.card}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.value}>{formatVoucherValue(item)}</Text>
                <Text style={styles.meta}>
                  {item.walletStatus === 'used'
                    ? `Đã dùng${item.usedAt ? ` · ${new Date(item.usedAt).toLocaleDateString('vi-VN')}` : ''}`
                    : item.walletStatus === 'expired'
                      ? 'Hết hạn'
                      : 'Trong kho'}
                </Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.iconCircle}>
              <EmptyHistoryIcon name={emptyContent.icon} />
            </View>
            <Text style={styles.emptyTitle}>{emptyContent.title}</Text>
            <Text style={styles.emptyDescription}>
              {emptyContent.description}
            </Text>
            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.refreshButton}
              onPress={load}>
              <RefreshIcon color="#ffffff" />
              <Text style={styles.refreshText}>Làm mới</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function EmptyHistoryIcon({
  name,
}: {
  name: 'history' | 'check' | 'clock';
}) {
  if (name === 'check') {
    return <CheckCircleIcon color="#c9c9c9" size={76} strokeWidth={4} />;
  }

  if (name === 'clock') {
    return <ClockIcon color="#c9c9c9" size={76} strokeWidth={4} />;
  }

  return <HistoryIcon color="#c9c9c9" size={78} strokeWidth={4} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VOUCHER_SCREEN_BG,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  card: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  code: {
    color: VOUCHER_BLUE,
    fontWeight: '900',
    fontSize: 16,
  },
  value: {
    marginTop: 4,
    fontWeight: '700',
    color: VOUCHER_TEXT,
  },
  meta: {
    marginTop: 6,
    color: VOUCHER_MUTED,
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: 19,
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingTop: 36,
    paddingBottom: 38,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 5,
  },
  iconCircle: {
    width: 126,
    height: 126,
    borderRadius: 63,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4f4f4',
  },
  emptyTitle: {
    marginTop: 25,
    color: VOUCHER_TEXT,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    color: VOUCHER_MUTED,
    fontSize: 18,
    lineHeight: 25,
    textAlign: 'center',
  },
  refreshButton: {
    alignSelf: 'stretch',
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    borderRadius: 31,
    backgroundColor: VOUCHER_BLUE,
  },
  refreshText: {
    marginLeft: 11,
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
  },
});

export default VoucherHistoryScreen;

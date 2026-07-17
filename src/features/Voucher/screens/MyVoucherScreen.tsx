import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {VOUCHER_BLUE, VOUCHER_TEXT} from '../constants';
import {GiftIcon, HistoryIcon, PlusIcon} from '../components/VoucherActionIcons';
import {FilmGoVoucher, formatVoucherValue} from '../types';
import {
  getActiveVouchers,
  getMyVouchers,
  claimVoucher,
  restoreAuthSession,
} from '../../../services/voucherService';

type MyVoucherScreenProps = {
  onAddVoucher: () => void;
  onOpenHistory: () => void;
};

function MyVoucherScreen({
  onAddVoucher,
  onOpenHistory,
}: MyVoucherScreenProps) {
  const [items, setItems] = useState<FilmGoVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guestMode, setGuestMode] = useState(false);
  const [availableItems, setAvailableItems] = useState<FilmGoVoucher[]>([]);
  const [claimingCode, setClaimingCode] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await restoreAuthSession();
      if (token) {
        setGuestMode(false);
        const mine = await getMyVouchers();
        const mineList = Array.isArray(mine) ? mine : [];
        setItems(mineList);
        const active = await getActiveVouchers();
        const ownedIds = new Set(mineList.map(item => String(item._id)));
        setAvailableItems((Array.isArray(active) ? active : []).filter(item => !ownedIds.has(String(item._id)) && Number(item.remaining ?? 1) > 0));
      } else {
        setGuestMode(true);
        const active = await getActiveVouchers();
        setItems(Array.isArray(active) ? active : []);
        setAvailableItems([]);
      }
    } catch (err) {
      setError((err as Error)?.message || 'Không tải được voucher');
      setItems([]);
      setAvailableItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const receiveNow = async (code: string) => {
    setClaimingCode(code);
    try {
      await claimVoucher(code);
      Alert.alert('Nhận voucher thành công', `${code} đã được thêm vào kho của bạn.`);
      await load();
    } catch (err) {
      Alert.alert('Không thể nhận voucher', (err as Error)?.message || 'Vui lòng thử lại');
    } finally {
      setClaimingCode('');
    }
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={VOUCHER_BLUE} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VOUCHER CỦA TÔI</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerIconButton}
          onPress={onAddVoucher}>
          <PlusIcon color="#ffffff" size={31} strokeWidth={3} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerIconButton}
          onPress={onOpenHistory}>
          <HistoryIcon color="#ffffff" size={34} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      {guestMode && (
        <Text style={styles.banner}>
          Chưa đăng nhập API — đang hiện voucher đang mở. Đăng nhập để lưu vào
          kho.
        </Text>
      )}

      {loading && items.length === 0 && availableItems.length === 0 ? (
        <ActivityIndicator style={{marginTop: 40}} color={VOUCHER_BLUE} />
      ) : items.length === 0 && availableItems.length === 0 ? (
        <View style={styles.empty}>
          <GiftIcon color="#dddddd" size={94} strokeWidth={5} />
          <Text style={styles.emptyTitle}>Kho chưa có voucher nào</Text>
          <Text style={styles.emptyDescription}>
            {error ||
              'Bạn hãy nhận voucher miễn phí hoặc thêm voucher mới nhé'}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item._id || item.code}
          contentContainerStyle={styles.list}
          ListHeaderComponent={availableItems.length ? (
            <View style={styles.newSection}>
              <Text style={styles.sectionTitle}>🎁 VOUCHER MỚI DÀNH CHO BẠN</Text>
              <Text style={styles.sectionSubtitle}>Nhận ngay ưu đãi mới từ FilmGo, không cần nhập mã.</Text>
              {availableItems.map(item => (
                <View key={item._id || item.code} style={styles.newCard}>
                  <View style={{flex: 1}}>
                    <Text style={styles.code}>{item.code}</Text>
                    <Text style={styles.desc} numberOfLines={2}>{item.description || 'Ưu đãi FilmGo'}</Text>
                    <Text style={styles.value}>{formatVoucherValue(item)}</Text>
                  </View>
                  <TouchableOpacity disabled={claimingCode === item.code} style={styles.claimButton} onPress={() => receiveNow(item.code)}>
                    <Text style={styles.claimText}>{claimingCode === item.code ? 'Đang nhận...' : 'Nhận ngay'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <Text style={styles.ownedTitle}>VOUCHER CỦA TÔI ({items.length})</Text>
            </View>
          ) : items.length ? <Text style={styles.ownedTitle}>VOUCHER CỦA TÔI ({items.length})</Text> : null}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          renderItem={({item}) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.value}>{formatVoucherValue(item)}</Text>
              </View>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description || 'Ưu đãi FilmGo'}
              </Text>
              <Text style={styles.meta}>
                {item.walletStatus
                  ? `Trạng thái: ${item.walletStatus}`
                  : `Còn ${item.remaining ?? '—'} lượt`}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  newSection: {marginBottom: 12},
  sectionTitle: {fontSize: 17, fontWeight: '900', color: '#1f2937'},
  sectionSubtitle: {fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 12},
  newCard: {flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginBottom: 10, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa'},
  claimButton: {paddingHorizontal: 13, paddingVertical: 11, borderRadius: 10, backgroundColor: '#e51978'},
  claimText: {fontSize: 12, color: '#fff', fontWeight: '900'},
  ownedTitle: {fontSize: 15, fontWeight: '900', color: VOUCHER_TEXT, marginTop: 12, marginBottom: 10},
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VOUCHER_BLUE,
    paddingLeft: 20,
    paddingRight: 10,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerIconButton: {
    width: 51,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff7ed',
    color: '#9a3412',
    fontSize: 13,
  },
  list: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    marginBottom: 12,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  code: {
    color: VOUCHER_BLUE,
    fontSize: 18,
    fontWeight: '900',
  },
  value: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  desc: {
    marginTop: 8,
    color: VOUCHER_TEXT,
    fontSize: 14,
    lineHeight: 20,
  },
  meta: {
    marginTop: 8,
    color: '#64748b',
    fontSize: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  emptyTitle: {
    marginTop: 16,
    color: VOUCHER_TEXT,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    color: '#b0b0b0',
    fontSize: 18,
    lineHeight: 26,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: VOUCHER_BLUE,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default MyVoucherScreen;

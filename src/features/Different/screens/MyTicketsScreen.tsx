import React, { useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getQuickBookings } from '../../../services/apiService';

type Ticket = {
  _id: string;
  movieTitle: string;
  movieDuration?: string;
  movieGenre?: string;
  seats: string[];
  totalPrice: number;
  bookingDate: string;
  bookingTime: string;
  cinema: string;
  code: string;
  createdAt: string;
  status?: 'pending' | 'paid' | 'cancelled' | 'refunded';
  cancelReason?: string;
  combos?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  ticketTotal?: number;
  comboTotal?: number;
  comboPickupCode?: string;
  comboStatus?: 'khong_co' | 'cho_nhan' | 'da_nhan';
  paymentMethod?: string;
};

type MyTicketsScreenProps = {
  onBack: () => void;
};

function MyTicketsScreen({ onBack }: MyTicketsScreenProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      setError(null);
      const response = await getQuickBookings() as any;
      const data = response?.data ?? response ?? [];
      setTickets(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError('Không thể tải danh sách vé. Vui lòng kiểm tra kết nối mạng.');
      console.log('Error fetching tickets:', e?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  const renderBarcode = () => {
    return (
      <View style={styles.barcodeContainer}>
        <View style={styles.barcodeLines}>
          {[1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2].map((val, idx) => (
            <View
              key={idx}
              style={{
                width: val,
                height: 44,
                backgroundColor: '#111111',
                marginRight: 2,
              }}
            />
          ))}
        </View>
      </View>
    );
  };

  const getStatusMeta = (status?: Ticket['status']) => {
    if (status === 'cancelled') {
      return {label: '✕ ĐÃ HỦY', style: styles.statusBadgeCancelled};
    }
    if (status === 'refunded') {
      return {label: '↩ ĐÃ HOÀN TIỀN', style: styles.statusBadgeRefunded};
    }
    if (status === 'pending') {
      return {label: '… CHỜ THANH TOÁN', style: styles.statusBadgePending};
    }
    return {label: '✓ ĐÃ THANH TOÁN', style: styles.statusBadgePaid};
  };

  const renderTicketItem = ({ item }: { item: Ticket }) => {
    const statusMeta = getStatusMeta(item.status);
    const isInactive = item.status === 'cancelled' || item.status === 'refunded';

    return (
      <View style={[styles.ticketCard, isInactive && styles.ticketCardInactive]}>
        {/* Badge trạng thái */}
        <View style={[styles.statusBadge, statusMeta.style]}>
          <Text style={styles.statusText}>{statusMeta.label}</Text>
        </View>

        {/* Phần trên của vé */}
        <View style={styles.ticketTop}>
          <Text style={styles.ticketCinema}>🎬 {item.cinema}</Text>
          <Text style={styles.ticketTitle} numberOfLines={2}>{item.movieTitle}</Text>
          {item.movieGenre ? (
            <Text style={styles.ticketGenre}>{item.movieGenre}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>NGÀY CHIẾU</Text>
              <Text style={styles.infoVal}>{item.bookingDate || '—'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>GIỜ CHIẾU</Text>
              <Text style={styles.infoVal}>{item.bookingTime || '—'}</Text>
            </View>
          </View>

          <View style={[styles.infoRow, { marginTop: 14 }]}>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>GHẾ</Text>
              <Text style={styles.infoVal}>{item.seats?.join(', ') || '—'}</Text>
            </View>
            <View style={styles.infoCol}>
              <Text style={styles.infoLabel}>TỔNG TIỀN</Text>
              <Text style={[styles.infoVal, { color: '#e51937' }]}>
                {Number(item.totalPrice).toLocaleString('vi-VN')}đ
              </Text>
            </View>
          </View>

          {item.paymentMethod ? (
            <Text style={styles.paymentMethodLine}>
              Thanh toán: {{
                MBBANK_MO_PHONG: 'MB Bank',
                VCB_MO_PHONG: 'Vietcombank',
                NCB_MO_PHONG: 'NCB',
              }[item.paymentMethod] || item.paymentMethod} (mô phỏng)
            </Text>
          ) : null}

          {item.cancelReason ? (
            <View style={styles.cancelReasonBox}>
              <Text style={styles.cancelReasonLabel}>
                {item.status === 'refunded' ? 'LÝ DO HOÀN TIỀN' : 'LÝ DO HỦY'}
              </Text>
              <Text style={styles.cancelReasonText}>{item.cancelReason}</Text>
            </View>
          ) : null}

          {!!item.combos?.length && (
            <View style={styles.comboTicketBox}>
              <View style={styles.comboTicketHeader}>
                <Text style={styles.comboTicketTitle}>🍿 COMBO BẮP NƯỚC</Text>
                <Text style={styles.comboTicketStatus}>
                  {isInactive
                    ? 'ĐÃ HỦY'
                    : item.comboStatus === 'da_nhan'
                      ? 'ĐÃ NHẬN'
                      : 'CHỜ NHẬN'}
                </Text>
              </View>
              {item.combos.map((combo, index) => (
                <View key={`${combo.name}-${index}`} style={styles.comboTicketRow}>
                  <Text style={styles.comboTicketName}>{combo.name} × {combo.quantity}</Text>
                  <Text style={styles.comboTicketPrice}>
                    {Number(combo.totalPrice).toLocaleString('vi-VN')}đ
                  </Text>
                </View>
              ))}
              {!isInactive ? (
                <View style={styles.comboPickupRow}>
                  <Text style={styles.comboPickupLabel}>MÃ NHẬN COMBO</Text>
                  <Text style={styles.comboPickupCode}>{item.comboPickupCode || '—'}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>

        {/* Đường cắt răng cưa giữa vé */}
        <View style={styles.cutLineContainer}>
          <View style={styles.circleCutLeft} />
          <View style={styles.dashedLine} />
          <View style={styles.circleCutRight} />
        </View>

        {/* Phần dưới của vé (cuống vé / mã nhận vé) */}
        <View style={styles.ticketBottom}>
          <Text style={styles.codeLabel}>MÃ NHẬN VÉ</Text>
          <Text style={[styles.codeVal, isInactive && styles.codeValInactive]}>{item.code}</Text>
          {!isInactive ? renderBarcode() : null}
          <Text style={styles.ticketNote}>
            {isInactive
              ? item.status === 'refunded'
                ? 'Vé này đã được hoàn tiền, không còn hiệu lực'
                : 'Vé này đã bị hủy, không còn hiệu lực'
              : 'Xuất trình mã này tại quầy'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5L8 12l7 7"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vé của tôi</Text>
        <TouchableOpacity activeOpacity={0.75} style={styles.refreshBtn} onPress={onRefresh}>
          <Text style={styles.refreshText}>↻ Tải lại</Text>
        </TouchableOpacity>
      </View>

      {/* Nội dung */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#005f98" />
          <Text style={styles.loadingText}>Đang tải vé...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTickets}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={tickets}
          keyExtractor={(item) => item._id || item.code}
          renderItem={renderTicketItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#005f98']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎟️</Text>
              <Text style={styles.emptyText}>Bạn chưa đặt vé nào.</Text>
              <Text style={styles.emptySubText}>
                Sau khi đặt vé thành công từ Trang chủ, vé sẽ tự động hiện tại đây.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  header: {
    height: 70,
    backgroundColor: '#005f98',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  refreshBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  refreshText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 14,
    paddingBottom: 40,
  },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 14,
    overflow: 'hidden',
  },
  ticketCardInactive: {
    opacity: 0.88,
  },
  statusBadge: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  statusBadgePaid: {
    backgroundColor: '#00b96b',
  },
  statusBadgeCancelled: {
    backgroundColor: '#e51937',
  },
  statusBadgeRefunded: {
    backgroundColor: '#ea580c',
  },
  statusBadgePending: {
    backgroundColor: '#ca8a04',
  },
  statusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  cancelReasonBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  cancelReasonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#be123c',
    marginBottom: 4,
  },
  cancelReasonText: {
    fontSize: 13,
    color: '#881337',
    lineHeight: 18,
  },
  codeValInactive: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  ticketTop: {
    padding: 16,
  },
  ticketCinema: {
    fontSize: 13,
    color: '#005f98',
    fontWeight: 'bold',
  },
  ticketTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111111',
    marginTop: 8,
    lineHeight: 25,
  },
  ticketGenre: {
    fontSize: 12,
    color: '#777777',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    width: '48%',
  },
  infoLabel: {
    fontSize: 10,
    color: '#999999',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  infoVal: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222222',
    marginTop: 3,
  },
  paymentMethodLine: {color: '#777777', fontSize: 11, marginTop: 14, fontWeight: '600'},
  comboTicketBox: {
    backgroundColor: '#fff5f7',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
  },
  comboTicketHeader: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8},
  comboTicketTitle: {color: '#5d2530', fontSize: 12, fontWeight: '800'},
  comboTicketStatus: {color: '#e51937', fontSize: 9, fontWeight: '800'},
  comboTicketRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5},
  comboTicketName: {flex: 1, color: '#555555', fontSize: 11, marginRight: 8},
  comboTicketPrice: {color: '#333333', fontSize: 11, fontWeight: '700'},
  comboPickupRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#f0d6dc', paddingTop: 8, marginTop: 5,
  },
  comboPickupLabel: {color: '#8d6b72', fontSize: 9, fontWeight: '700'},
  comboPickupCode: {color: '#e51937', fontSize: 15, fontWeight: '900', letterSpacing: 1},
  cutLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    backgroundColor: '#ffffff',
  },
  circleCutLeft: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f0f4f8',
    marginLeft: -11,
  },
  circleCutRight: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f0f4f8',
    marginRight: -11,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: '#dddddd',
    borderStyle: 'dashed',
  },
  ticketBottom: {
    backgroundColor: '#fafafa',
    padding: 16,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: 11,
    color: '#999999',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  codeVal: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#e51937',
    marginTop: 4,
    letterSpacing: 2,
  },
  barcodeContainer: {
    marginTop: 14,
    alignItems: 'center',
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketNote: {
    fontSize: 11,
    color: '#aaaaaa',
    marginTop: 8,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#777777',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 38,
  },
  errorText: {
    fontSize: 14,
    color: '#555555',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 26,
    backgroundColor: '#005f98',
    borderRadius: 10,
  },
  retryText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 72,
    paddingHorizontal: 28,
  },
  emptyIcon: {
    fontSize: 44,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 12,
  },
  emptySubText: {
    fontSize: 13,
    color: '#888888',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default MyTicketsScreen;

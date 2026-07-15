import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Rect} from 'react-native-svg';
import {
  getMyBookings,
  restoreAuthSession,
} from '../../../services/voucherService';

const HEADER_BLUE = '#005f98';

type MyTicketsScreenProps = {
  onBack: () => void;
};

type SeatDoc = {
  row?: string;
  number?: number;
};

type BookingItem = {
  _id: string;
  totalPrice?: number;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  ticketCode?: string;
  seatLabels?: string[];
  movieTitle?: string;
  cinemaName?: string;
  roomName?: string;
  seats?: SeatDoc[];
  voucher?: {code?: string} | null;
  showtime?: {
    startTime?: string;
    endTime?: string;
    price?: number;
    movie?: {
      title?: string;
      genre?: string | string[];
      duration?: string | number;
    };
    room?: {name?: string; type?: string};
  };
};

function formatMoney(value?: number) {
  return `${Number(value || 0).toLocaleString('vi-VN')}đ`;
}

function formatWhen(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN');
}

function formatTime(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDate(value?: string) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('vi-VN');
}

function getSeatText(item: BookingItem) {
  if (item.seatLabels?.length) {
    return item.seatLabels.join(', ');
  }
  if (item.seats?.length) {
    return item.seats
      .map(s => `${s.row || ''}${s.number ?? ''}`.trim())
      .filter(Boolean)
      .join(', ');
  }
  return '—';
}

function getRoomName(item: BookingItem) {
  return item.roomName || item.showtime?.room?.name || '—';
}

function getMovieTitle(item: BookingItem) {
  const title =
    item.movieTitle ||
    item.showtime?.movie?.title ||
    '';
  return title.trim() || 'Đang cập nhật tên phim';
}

/** Vẽ barcode từ mã vé (Code-128 style đơn giản theo pattern) */
function TicketBarcode({code}: {code: string}) {
  const bars = useMemo(() => {
    const source = code.toUpperCase();
    const items: {x: number; w: number}[] = [];
    let x = 4;
    for (let i = 0; i < source.length; i += 1) {
      const n = source.charCodeAt(i);
      const pattern = [
        (n % 3) + 1,
        (n % 2) + 1,
        ((n >> 2) % 3) + 1,
        1,
        ((n >> 3) % 2) + 1,
      ];
      pattern.forEach((w, idx) => {
        if (idx % 2 === 0) {
          items.push({x, w});
        }
        x += w + 1;
      });
    }
    // quiet zone + stop bars
    items.push({x: x + 2, w: 3});
    items.push({x: x + 7, w: 1});
    items.push({x: x + 10, w: 3});
    return {items, width: x + 18};
  }, [code]);

  return (
    <View style={styles.barcodeBox}>
      <Svg width="100%" height={84} viewBox={`0 0 ${bars.width} 84`}>
        {bars.items.map((bar, index) => (
          <Rect
            key={`${bar.x}-${index}`}
            x={bar.x}
            y={4}
            width={bar.w}
            height={76}
            fill="#0f172a"
          />
        ))}
      </Svg>
      <Text style={styles.barcodeCode}>{code}</Text>
    </View>
  );
}

function DetailRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MyTicketsScreen({onBack}: MyTicketsScreenProps) {
  const [items, setItems] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<BookingItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await restoreAuthSession();
      if (!token) {
        setItems([]);
        setError('Đăng nhập để xem vé đã mua.');
        return;
      }
      const data = await getMyBookings();
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError((err as Error)?.message || 'Không tải được vé');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>VÉ CỦA TÔI</Text>
        <View style={{width: 40}} />
      </View>

      {loading && items.length === 0 ? (
        <ActivityIndicator style={{marginTop: 40}} color={HEADER_BLUE} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có vé nào</Text>
              <Text style={styles.emptyHint}>
                {error ||
                  'Sau khi thanh toán thành công, vé sẽ hiện ở đây.'}
              </Text>
            </View>
          }
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => setSelected(item)}>
              <Text style={styles.movieTitle}>{getMovieTitle(item)}</Text>
              <Text style={styles.meta}>
                {item.cinemaName || 'FilmGo Giải Phóng'} · {getRoomName(item)}
              </Text>
              <Text style={styles.meta}>
                {formatDate(item.showtime?.startTime)} ·{' '}
                {formatTime(item.showtime?.startTime)} · Ghế {getSeatText(item)}
              </Text>
              <View style={styles.row}>
                <Text style={styles.price}>{formatMoney(item.totalPrice)}</Text>
                <Text style={styles.status}>
                  {item.paymentStatus === 'paid' || item.status === 'paid'
                    ? 'Đã thanh toán'
                    : item.status || '—'}
                </Text>
              </View>
              <Text style={styles.tapHint}>Chạm để xem mã vạch / chi tiết</Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={!!selected}
        animationType="slide"
        onRequestClose={() => setSelected(null)}>
        {selected ? (
          <View style={styles.detailScreen}>
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setSelected(null)}>
                <Text style={styles.backText}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.headerTitle}>CHI TIẾT VÉ</Text>
              <View style={{width: 40}} />
            </View>

            <ScrollView contentContainerStyle={styles.detailBody}>
              <Text style={styles.detailMovie}>{getMovieTitle(selected)}</Text>
              <Text style={styles.detailSub}>
                Mã vé: {getTicketCode(selected)}
              </Text>

              <View style={styles.detailCard}>
                <DetailRow
                  label="Rạp chiếu"
                  value={selected.cinemaName || 'FilmGo Giải Phóng'}
                />
                <DetailRow label="Phòng" value={getRoomName(selected)} />
                <DetailRow
                  label="Ngày chiếu"
                  value={formatDate(selected.showtime?.startTime)}
                />
                <DetailRow
                  label="Giờ chiếu"
                  value={formatTime(selected.showtime?.startTime)}
                />
                <DetailRow label="Ghế" value={getSeatText(selected)} />
                <DetailRow
                  label="Giá tiền"
                  value={formatMoney(selected.totalPrice)}
                />
                {selected.voucher?.code ? (
                  <DetailRow
                    label="Voucher"
                    value={selected.voucher.code}
                  />
                ) : null}
                <DetailRow
                  label="Đặt lúc"
                  value={formatWhen(selected.createdAt)}
                />
                <DetailRow
                  label="Trạng thái"
                  value={
                    selected.paymentStatus === 'paid' ||
                    selected.status === 'paid'
                      ? 'Đã thanh toán'
                      : selected.status || '—'
                  }
                />
              </View>

              <Text style={styles.scanTitle}>Mã vạch — nhân viên quét duyệt</Text>
              <TicketBarcode code={getTicketCode(selected)} />
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#f8fafc'},
  header: {
    height: 84,
    backgroundColor: HEADER_BLUE,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {color: '#fff', fontSize: 32, lineHeight: 34, fontWeight: '300'},
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
  },
  list: {padding: 16, paddingBottom: 40},
  empty: {marginTop: 60, alignItems: 'center', paddingHorizontal: 24},
  emptyTitle: {fontSize: 18, fontWeight: '800', color: '#0f172a'},
  emptyHint: {
    marginTop: 8,
    textAlign: 'center',
    color: '#64748b',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  movieTitle: {fontSize: 16, fontWeight: '800', color: '#0f172a'},
  meta: {marginTop: 4, color: '#64748b', fontSize: 13},
  row: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {fontSize: 15, fontWeight: '800', color: '#dc2626'},
  status: {
    color: '#16a34a',
    fontWeight: '700',
    fontSize: 12,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tapHint: {
    marginTop: 8,
    color: HEADER_BLUE,
    fontSize: 12,
    fontWeight: '600',
  },
  detailScreen: {flex: 1, backgroundColor: '#f8fafc'},
  detailBody: {padding: 16, paddingBottom: 40},
  detailMovie: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    textAlign: 'center',
  },
  detailSub: {
    marginTop: 6,
    textAlign: 'center',
    color: '#64748b',
    fontWeight: '600',
  },
  detailCard: {
    marginTop: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eef2f7',
  },
  detailLabel: {color: '#64748b', fontSize: 14, fontWeight: '600'},
  detailValue: {
    flex: 1,
    textAlign: 'right',
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  scanTitle: {
    marginTop: 22,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '800',
    color: '#0f172a',
  },
  barcodeBox: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  barcodeCode: {
    marginTop: 8,
    letterSpacing: 2,
    fontWeight: '800',
    color: '#0f172a',
    fontSize: 15,
  },
});

export default MyTicketsScreen;

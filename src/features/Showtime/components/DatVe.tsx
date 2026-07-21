import React, {useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {SelectedShowtimeInfo} from './ChonGio';
import {
  formatGio,
  formatNgayNgan,
  GheSuatChieu,
  layGheTheoSuatChieu,
} from '../../../services/showtimeService';
import {holdSeats, releaseSeats} from '../../../services/apiService';

const MOMO_PINK = '#d82d8b';
const COLOR_SOLD = '#555566';       // Đã đặt - xám tối
const COLOR_SELECTED = '#d82d8b';   // Ghế bạn chọn - hồng Momo
const COLOR_NORMAL = '#6c5fc7';     // Ghế thường - tím
const COLOR_VIP = '#e51937';        // Ghế VIP - đỏ
const COLOR_HELD = '#a57922';

type DatVeProps = {
  movie: {
    title: string;
    duration?: string;
    poster: ImageSourcePropType;
  };
  showtime: SelectedShowtimeInfo;
  onBack: () => void;
  onContinue: (summary: {seats: string[]; totalPrice: number; holdToken: string}) => void;
};

// Seats in the "center zone" (bordered)
const CENTER_ZONE = new Set([
  'C6','C7','C8','C9','C10','C11',
  'D6','D7','D8','D9','D10','D11',
  'E6','E7','E8','E9','E10','E11',
  'F6','F7','F8','F9','F10','F11',
]);

function DatVe({movie, showtime, onBack, onContinue}: DatVeProps) {
  const [selectedSeats, setSelectedSeats] = useState(new Set<string>());
  const [seatItems, setSeatItems] = useState<GheSuatChieu[]>([]);
  const [soldSeats, setSoldSeats] = useState(new Set<string>());
  const [heldSeats, setHeldSeats] = useState(new Set<string>());
  const [isHoldingSeats, setIsHoldingSeats] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [seatError, setSeatError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const selectedSeatsRef = useRef(new Set<string>());
  const holdTokenRef = useRef(`hold-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const continuingRef = useRef(false);
  const selectedSeatList = Array.from(selectedSeats).sort(sortSeats);
  const unitPrice = showtime.price > 0 ? showtime.price : 55000;
  const totalPrice = selectedSeatList.reduce((total, seat) => {
    const seatType = seatItems.find(item => item.label === seat)?.type;
    const isVip = seatType === 'vip' || seatType === 'couple';
    return total + (isVip ? Math.round(unitPrice * 1.2) : unitPrice);
  }, 0);
  const hasSelectedSeats = selectedSeatList.length > 0;
  const showMeta = `${showtime.roomType} | ${formatNgayNgan(showtime.startTime)} ${formatGio(showtime.startTime)}`;
  const seatRows = Array.from(
    seatItems.reduce((rows, seat) => {
      if (!rows.has(seat.row)) rows.set(seat.row, []);
      rows.get(seat.row)!.push(seat);
      return rows;
    }, new Map<string, GheSuatChieu[]>()),
  ).map(([key, seats]) => ({key, seats}));

  useEffect(() => {
    let cancelled = false;
    let refreshing = false;
    const holdToken = holdTokenRef.current;
    setIsLoadingSeats(true);
    setSeatError('');
    setSelectedSeats(new Set());
    selectedSeatsRef.current = new Set();

    const refreshSeats = async (initial = false) => {
      if (refreshing) return;
      refreshing = true;
      try {
        const seats = await layGheTheoSuatChieu(showtime.id, holdToken);
        if (cancelled) return;
        const nextSold = new Set(seats.filter(seat => seat.isBooked).map(seat => seat.label));
        const nextHeld = new Set(
          seats.filter(seat => seat.isHeld && !seat.heldByMe).map(seat => seat.label),
        );
        const unavailableSelected = Array.from(selectedSeatsRef.current).filter(label => nextSold.has(label));

        setSeatItems(seats);
        setSoldSeats(nextSold);
        setHeldSeats(nextHeld);
        if (unavailableSelected.length) {
          const nextSelected = new Set(selectedSeatsRef.current);
          unavailableSelected.forEach(label => nextSelected.delete(label));
          selectedSeatsRef.current = nextSelected;
          setSelectedSeats(nextSelected);
          setShowConfirm(false);
          Alert.alert(
            'Ghế vừa được người khác chọn',
            `Ghế ${unavailableSelected.join(', ')} không còn trống và đã được bỏ khỏi lựa chọn của bạn.`,
          );
        }
        setSeatError('');
      } catch (error) {
        if (!cancelled && initial) {
          setSoldSeats(new Set());
          setSeatItems([]);
          setSeatError((error as Error)?.message || 'Không tải được trạng thái ghế');
        }
      } finally {
        refreshing = false;
        if (!cancelled && initial) setIsLoadingSeats(false);
      }
    };

    refreshSeats(true);
    const timer = setInterval(() => refreshSeats(false), 4000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (!continuingRef.current) {
        releaseSeats({holdToken, showtimeId: showtime.id}).catch(() => undefined);
      }
    };
  }, [showtime.id]);

  const handleSeatPress = async (seat: string) => {
    if (isLoadingSeats || seatError || soldSeats.has(seat) || heldSeats.has(seat) || isHoldingSeats) return;
    const next = new Set(selectedSeatsRef.current);
    if (next.has(seat)) next.delete(seat);
    else next.add(seat);
    setIsHoldingSeats(true);
    try {
      if (next.size) {
        await holdSeats({
          showtimeId: showtime.id,
          seatLabels: Array.from(next),
          holdToken: holdTokenRef.current,
        });
      } else {
        await releaseSeats({holdToken: holdTokenRef.current, showtimeId: showtime.id});
      }
      selectedSeatsRef.current = next;
      setSelectedSeats(next);
    } catch (error) {
      Alert.alert(
        'Ghế không còn trống',
        (error as Error)?.message || 'Ghế vừa được người khác giữ. Vui lòng chọn ghế khác.',
      );
      const seats = await layGheTheoSuatChieu(showtime.id, holdTokenRef.current).catch(() => []);
      setSeatItems(seats);
      setSoldSeats(new Set(seats.filter(item => item.isBooked).map(item => item.label)));
      setHeldSeats(new Set(seats.filter(item => item.isHeld && !item.heldByMe).map(item => item.label)));
    } finally {
      setIsHoldingSeats(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
          <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5L8 12l7 7"
              stroke="#ffffff"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>{movie.title}</Text>
          <Text style={styles.headerMeta}>{showMeta}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Screen indicator */}
        <View style={styles.screenWrapper}>
          <View style={styles.screenArc} />
          <Text style={styles.screenText}>MÀN HÌNH</Text>
        </View>

        {/* Seat grid */}
        {isLoadingSeats ? (
          <View style={styles.seatStatus}>
            <ActivityIndicator color="#ffffff" />
            <Text style={styles.seatStatusText}>Đang kiểm tra ghế đã đặt...</Text>
          </View>
        ) : seatError ? (
          <Text style={styles.seatError}>{seatError}. Vui lòng quay lại và thử lại.</Text>
        ) : null}
        <View style={styles.seatPanel}>
          {seatRows.map(row => (
            <View key={row.key} style={styles.seatRow}>
              {row.seats.map(seatItem => {
                const seat = seatItem.label;
                const isSold = soldSeats.has(seat);
                const isHeld = heldSeats.has(seat);
                const isSelected = selectedSeats.has(seat);
                const isCenter = CENTER_ZONE.has(seat);
                let bgColor = seatItem.type === 'vip' || seatItem.type === 'couple'
                  ? COLOR_VIP
                  : COLOR_NORMAL;
                if (isSold) bgColor = COLOR_SOLD;
                if (isHeld) bgColor = COLOR_HELD;
                if (isSelected) bgColor = COLOR_SELECTED;

                return (
                  <TouchableOpacity
                    key={seat}
                    activeOpacity={isSold ? 1 : 0.7}
                    disabled={isSold || isHeld || isLoadingSeats || Boolean(seatError) || isHoldingSeats}
                    onPress={() => handleSeatPress(seat)}
                    style={[
                      styles.seat,
                      {backgroundColor: bgColor},
                      isCenter && styles.seatCenterZone,
                      isSelected && styles.seatSelected,
                    ]}>
                    <Text style={styles.seatLabel}>{seat}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendWrapper}>
          <View style={styles.legendRow}>
            <LegendItem color={COLOR_SOLD} label="Đã đặt" />
            <LegendItem color={COLOR_HELD} label="Đang được giữ" />
            <LegendItem color={COLOR_SELECTED} label="Ghế bạn chọn" />
            <LegendItem color={COLOR_NORMAL} label="Ghế thường" />
          </View>
          <View style={styles.legendRow}>
            <LegendItem color={COLOR_VIP} label="Ghế VIP" />
            <LegendItem isBorder label="Vùng trung tâm" />
          </View>
        </View>

        {/* Bottom padding */}
        <View style={styles.scrollFooterSpacer} />
      </ScrollView>

      {/* Checkout bar */}
      <View style={styles.checkoutBar}>
        {hasSelectedSeats ? (
          <>
            <View style={styles.checkoutInfo}>
              <Text style={styles.checkoutLabel}>Ghế: <Text style={styles.checkoutSeats}>{selectedSeatList.join(', ')}</Text></Text>
              <Text style={styles.checkoutTotal}>{formatMoney(totalPrice)}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.continueBtn}
              onPress={() => setShowConfirm(true)}>
              <Text style={styles.continueBtnText}>Tiếp tục</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.checkoutPlaceholder}>
            <Text style={styles.placeholderText}>Chưa chọn ghế nào</Text>
          </View>
        )}
      </View>

      {/* Confirm modal */}
      <Modal
        transparent
        visible={showConfirm}
        animationType="fade"
        onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Xác nhận đặt vé</Text>
            <Text style={styles.confirmSubtitle}>
              Bạn đang đặt vé xem phim <Text style={styles.confirmBold}>{movie.title}</Text>:
            </Text>

            <View style={styles.confirmInfoRow}>
              <Text style={styles.confirmIcon}>🎬</Text>
              <Text style={styles.confirmInfoText} numberOfLines={1}>
                FilmGo Hà Trung (Thanh Hóa)
              </Text>
            </View>
            <View style={styles.confirmInfoRow}>
              <Text style={styles.confirmIcon}>🕐</Text>
              <Text style={[styles.confirmInfoText, styles.confirmOrange]}>
                {formatGio(showtime.startTime)}
              </Text>
            </View>
            <View style={styles.confirmInfoRow}>
              <Text style={styles.confirmIcon}>📅</Text>
              <Text style={[styles.confirmInfoText, styles.confirmOrange]}>
                {formatNgayNgan(showtime.startTime)}
              </Text>
            </View>
            <View style={styles.confirmInfoRow}>
              <Text style={styles.confirmIcon}>💺</Text>
              <Text style={styles.confirmInfoText}>
                Ghế: <Text style={styles.confirmBold}>{selectedSeatList.join(', ')}</Text>
              </Text>
            </View>
            <View style={styles.confirmInfoRow}>
              <Text style={styles.confirmIcon}>💰</Text>
              <Text style={[styles.confirmInfoText, styles.confirmBold]}>
                {formatMoney(totalPrice)}
              </Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.confirmBtn}
              onPress={() => {
                setShowConfirm(false);
                continuingRef.current = true;
                onContinue({seats: selectedSeatList, totalPrice, holdToken: holdTokenRef.current});
              }}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.cancelBtn}
              onPress={() => setShowConfirm(false)}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function LegendItem({color, label, isBorder}: {color?: string; label: string; isBorder?: boolean}) {
  return (
    <View style={styles.legendItem}>
      {isBorder ? (
        <View style={styles.legendBorderBox} />
      ) : (
        <View style={[styles.legendColorBox, {backgroundColor: color}]} />
      )}
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`;
}

function sortSeats(a: string, b: string) {
  const rowCompare = a.charCodeAt(0) - b.charCodeAt(0);
  if (rowCompare !== 0) return rowCompare;
  return getSeatNumber(a) - getSeatNumber(b);
}

function getSeatNumber(seat: string) {
  const match = seat.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111122',
  },
  header: {
    height: 80,
    backgroundColor: '#1a1a2e',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  headerMeta: {
    color: '#aaaacc',
    fontSize: 13,
    marginTop: 2,
  },
  scrollBody: {
    paddingBottom: 12,
  },
  seatStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  seatStatusText: {
    color: '#ffffff',
  },
  seatError: {
    color: '#ffaaaa',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  screenWrapper: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#111122',
  },
  screenArc: {
    width: '75%',
    height: 26,
    borderTopWidth: 3,
    borderTopColor: '#ffffff',
    borderRadius: 160,
    backgroundColor: 'transparent',
  },
  screenText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    marginTop: 6,
  },
  seatPanel: {
    paddingHorizontal: 8,
    paddingVertical: 12,
    backgroundColor: '#111122',
    gap: 5,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  seat: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  seatCenterZone: {
    borderWidth: 1.5,
    borderColor: '#00ccff',
  },
  seatSelected: {
    transform: [{scale: 1.08}],
  },
  seatLabel: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '700',
  },
  legendWrapper: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 10,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColorBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendBorderBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    backgroundColor: '#6c5fc7',
    borderWidth: 2,
    borderColor: '#00ccff',
  },
  legendText: {
    color: '#ccccdd',
    fontSize: 13,
  },
  checkoutBar: {
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  checkoutInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkoutLabel: {
    color: '#aaaacc',
    fontSize: 14,
    flex: 1,
  },
  checkoutSeats: {
    color: '#ffffff',
    fontWeight: '700',
  },
  checkoutTotal: {
    color: MOMO_PINK,
    fontSize: 18,
    fontWeight: '800',
  },
  continueBtn: {
    backgroundColor: MOMO_PINK,
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  checkoutPlaceholder: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#2a2a4e',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#666688',
    fontSize: 15,
  },
  scrollFooterSpacer: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.72)',
    paddingHorizontal: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
  },
  confirmTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  confirmSubtitle: {
    color: '#555555',
    fontSize: 15,
    marginBottom: 16,
  },
  confirmBold: {
    fontWeight: '700',
    color: '#111111',
  },
  confirmInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  confirmIcon: {
    fontSize: 18,
    width: 26,
  },
  confirmInfoText: {
    color: '#222222',
    fontSize: 15,
    flex: 1,
  },
  confirmOrange: {
    color: MOMO_PINK,
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: MOMO_PINK,
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  cancelBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  cancelBtnText: {
    color: '#888888',
    fontSize: 16,
  },
});

export default DatVe;

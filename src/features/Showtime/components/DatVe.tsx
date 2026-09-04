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
  useWindowDimensions,
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
const SEAT_HOLD_MINUTES = 15;

type DatVeProps = {
  movie: {
    title: string;
    duration?: string;
    poster: ImageSourcePropType;
  };
  showtime: SelectedShowtimeInfo;
  initialSeats?: string[];
  initialHoldToken?: string;
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

function DatVe({
  movie,
  showtime,
  initialSeats,
  initialHoldToken,
  onBack,
  onContinue,
}: DatVeProps) {
  const {width: screenWidth} = useWindowDimensions();
  const [selectedSeats, setSelectedSeats] = useState(new Set<string>(initialSeats || []));
  const [seatItems, setSeatItems] = useState<GheSuatChieu[]>([]);
  const [soldSeats, setSoldSeats] = useState(new Set<string>());
  const [heldSeats, setHeldSeats] = useState(new Set<string>());
  const [isLoadingSeats, setIsLoadingSeats] = useState(true);
  const [seatError, setSeatError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSyncingHold, setIsSyncingHold] = useState(false);
  const selectedSeatsRef = useRef(new Set<string>(initialSeats || []));
  const holdTokenRef = useRef(
    initialHoldToken || `hold-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const continuingRef = useRef(false);
  const holdingRef = useRef(false);
  const holdInFlightRef = useRef(false);
  const pendingHoldRef = useRef<Set<string> | null>(null);
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
  const maxSeatsInRow = Math.max(...seatRows.map(row => row.seats.length), 1);
  const seatGap = maxSeatsInRow >= 15 ? 2 : 5;
  const seatPanelPadding = maxSeatsInRow >= 15 ? 6 : 12;
  const availableSeatWidth = Math.max(
    screenWidth - seatPanelPadding * 2 - seatGap * (maxSeatsInRow - 1),
    0,
  );
  const seatSize = Math.max(22, Math.min(28, Math.floor(availableSeatWidth / maxSeatsInRow)));
  const vipPrice = Math.round(unitPrice * 1.2);
  const availableSeats = seatItems.filter(
    seat => !soldSeats.has(seat.label) && !heldSeats.has(seat.label),
  );
  const availableVipCount = availableSeats.filter(
    seat => seat.type === 'vip' || seat.type === 'couple',
  ).length;
  const centerAvailableCount = availableSeats.filter(seat => CENTER_ZONE.has(seat.label)).length;

  useEffect(() => {
    let cancelled = false;
    let refreshing = false;
    const holdToken = holdTokenRef.current;
    setIsLoadingSeats(true);
    setSeatError('');
    const initialSet = new Set(initialSeats || []);
    setSelectedSeats(initialSet);
    selectedSeatsRef.current = initialSet;

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
        const heldByMe = new Set(
          seats.filter(seat => seat.heldByMe).map(seat => seat.label),
        );
        const unavailableSelected = Array.from(selectedSeatsRef.current).filter(label => nextSold.has(label));
        // Ghế mình đã giữ nhưng server không còn ghi nhận (Admin thu hồi / hết hạn giữ)
        const hasSyncedHold = selectedSeatsRef.current.size === 0 || heldByMe.size > 0;
        const lostHold = holdingRef.current || !hasSyncedHold
          ? []
          : Array.from(selectedSeatsRef.current).filter(
              label => !nextSold.has(label) && !heldByMe.has(label),
            );

        setSeatItems(seats);
        setSoldSeats(nextSold);
        setHeldSeats(nextHeld);
        if (unavailableSelected.length || lostHold.length) {
          const nextSelected = new Set(selectedSeatsRef.current);
          unavailableSelected.forEach(label => nextSelected.delete(label));
          lostHold.forEach(label => nextSelected.delete(label));
          selectedSeatsRef.current = nextSelected;
          setSelectedSeats(nextSelected);
          setShowConfirm(false);
          if (unavailableSelected.length) {
            Alert.alert(
              'Ghế vừa được người khác chọn',
              `Ghế ${unavailableSelected.join(', ')} không còn trống và đã được bỏ khỏi lựa chọn của bạn.`,
            );
          } else {
            Alert.alert(
              'Ghế đã bị thu hồi',
              `Ghế ${lostHold.join(', ')} đã bị rạp thu hồi hoặc hết thời gian giữ. Vui lòng chọn lại ghế.`,
            );
          }
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

  const syncSeatHold = async () => {
    if (holdInFlightRef.current) return;
    holdInFlightRef.current = true;
    holdingRef.current = true;
    setIsSyncingHold(true);
    try {
      while (pendingHoldRef.current) {
        const seatsToHold = pendingHoldRef.current;
        pendingHoldRef.current = null;
        try {
          if (seatsToHold.size) {
            await holdSeats({
              showtimeId: showtime.id,
              seatLabels: Array.from(seatsToHold),
              holdToken: holdTokenRef.current,
            });
          } else {
            await releaseSeats({
              holdToken: holdTokenRef.current,
              showtimeId: showtime.id,
            });
          }
        } catch (error) {
          Alert.alert(
            'Ghế không còn trống',
            (error as Error)?.message ||
              'Ghế vừa được người khác giữ. Vui lòng chọn ghế khác.',
          );
          const seats = await layGheTheoSuatChieu(
            showtime.id,
            holdTokenRef.current,
          ).catch(() => [] as GheSuatChieu[]);
          const nextSold = new Set(
            seats.filter(item => item.isBooked).map(item => item.label),
          );
          const nextHeld = new Set(
            seats
              .filter(item => item.isHeld && !item.heldByMe)
              .map(item => item.label),
          );
          const heldByMe = new Set(
            seats.filter(item => item.heldByMe).map(item => item.label),
          );
          setSeatItems(seats);
          setSoldSeats(nextSold);
          setHeldSeats(nextHeld);
          selectedSeatsRef.current = heldByMe;
          setSelectedSeats(heldByMe);
          pendingHoldRef.current = null;
          break;
        }
      }
    } finally {
      holdInFlightRef.current = false;
      holdingRef.current = false;
      if (pendingHoldRef.current) {
        syncSeatHold();
      } else {
        setIsSyncingHold(false);
      }
    }
  };

  const handleSeatPress = (seat: string) => {
    if (isLoadingSeats || seatError || soldSeats.has(seat) || heldSeats.has(seat)) {
      return;
    }
    const next = new Set(selectedSeatsRef.current);
    if (next.has(seat)) next.delete(seat);
    else next.add(seat);

    if (!areSeatsAdjacent(Array.from(next))) {
      Alert.alert(
        'Chọn ghế liền nhau',
        'Vui lòng chọn các ghế cùng một hàng và nằm cạnh nhau, không chọn ghế tách rời.',
      );
      return;
    }

    // Cập nhật UI ngay, gọi API giữ ghế ở nền (tránh chờ ~1–2s mỗi lần bấm)
    selectedSeatsRef.current = next;
    setSelectedSeats(next);
    pendingHoldRef.current = new Set(next);
    syncSeatHold();
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

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}>
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
        <View style={[styles.seatPanel, {paddingHorizontal: seatPanelPadding}]}>
          {seatRows.map(row => (
            <View key={row.key} style={[styles.seatRow, {gap: seatGap}]}>
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
                    disabled={isSold || isHeld || isLoadingSeats || Boolean(seatError)}
                    onPress={() => handleSeatPress(seat)}
                    style={[
                      styles.seat,
                      {
                        backgroundColor: bgColor,
                        width: seatSize,
                        height: seatSize,
                      },
                      isCenter && styles.seatCenterZone,
                      isSelected && styles.seatSelected,
                    ]}>
                    <Text style={[styles.seatLabel, {fontSize: seatSize <= 21 ? 7 : 8}]}>{seat}</Text>
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
          <Text style={styles.seatHoldHint}>
            Giữ ghế: {SEAT_HOLD_MINUTES} phút khi chọn. Thanh toán sẽ có bộ đếm riêng sau khi tạo đơn.
          </Text>
        </View>

        <View style={styles.selectionGuide}>
          <View style={styles.guideHeaderRow}>
            <View style={styles.guideTitleWrap}>
              <Text style={styles.guideEyebrow}>Gợi ý chọn ghế</Text>
              <Text style={styles.guideTitle}>
                {hasSelectedSeats ? 'Kiểm tra lựa chọn của bạn' : 'Chọn ghế đẹp để xem phim thoải mái hơn'}
              </Text>
            </View>
            <View style={styles.guideBadge}>
              <Text style={styles.guideBadgeText}>{availableSeats.length} ghế trống</Text>
            </View>
          </View>

          <View style={styles.guideStatsRow}>
            <View style={styles.guideStat}>
              <Text style={styles.guideStatLabel}>Ghế thường</Text>
              <Text style={styles.guideStatValue}>{formatMoney(unitPrice)}</Text>
            </View>
            <View style={styles.guideStat}>
              <Text style={styles.guideStatLabel}>Ghế VIP</Text>
              <Text style={styles.guideStatValue}>{formatMoney(vipPrice)}</Text>
            </View>
            <View style={styles.guideStat}>
              <Text style={styles.guideStatLabel}>Trung tâm</Text>
              <Text style={styles.guideStatValue}>{centerAvailableCount} ghế</Text>
            </View>
          </View>

          {hasSelectedSeats ? (
            <View style={styles.selectedGuideBox}>
              <Text style={styles.selectedGuideLabel}>Bạn đang chọn</Text>
              <Text style={styles.selectedGuideSeats}>{selectedSeatList.join(', ')}</Text>
              <Text style={styles.selectedGuideHint}>
                Các ghế đã được giữ tạm. Hãy kiểm tra đúng suất chiếu và bấm tiếp tục để thanh toán.
              </Text>
            </View>
          ) : (
            <View style={styles.tipGrid}>
              <GuideTip title="Đi 1 người" text="Ưu tiên C8, D8 hoặc E8 nếu còn trống." />
              <GuideTip title="Đi 2 người" text="Chọn cặp ghế liền nhau ở vùng trung tâm." />
              <GuideTip title="Nhóm bạn" text="Chọn cùng một hàng, tránh để trống ghế lẻ ở giữa." />
              <GuideTip title="Ghế VIP" text={`${availableVipCount} ghế VIP còn khả dụng cho suất này.`} />
            </View>
          )}
        </View>

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
              style={[styles.continueBtn, isSyncingHold && styles.continueBtnDisabled]}
              disabled={isSyncingHold}
              onPress={() => {
                if (!areSeatsAdjacent(selectedSeatList)) {
                  Alert.alert(
                    'Chọn ghế liền nhau',
                    'Vui lòng chọn các ghế cùng một hàng và nằm cạnh nhau trước khi tiếp tục.',
                  );
                  return;
                }
                setShowConfirm(true);
              }}>
              <Text style={styles.continueBtnText}>
                {isSyncingHold ? 'Đang giữ ghế...' : 'Tiếp tục'}
              </Text>
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

function GuideTip({title, text}: {title: string; text: string}) {
  return (
    <View style={styles.tipCard}>
      <Text style={styles.tipTitle}>{title}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`;
}

function sortSeats(a: string, b: string) {
  const rowCompare = getSeatRow(a).localeCompare(getSeatRow(b), 'vi');
  if (rowCompare !== 0) return rowCompare;
  return getSeatNumber(a) - getSeatNumber(b);
}

function getSeatRow(seat: string) {
  const match = seat.match(/^[A-Za-z]+/);
  return (match?.[0] || '').toUpperCase();
}

function getSeatNumber(seat: string) {
  const match = seat.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function areSeatsAdjacent(seats: string[]) {
  if (seats.length <= 1) {
    return true;
  }

  const rows = new Set(seats.map(getSeatRow));
  if (rows.size !== 1) {
    return false;
  }

  const numbers = seats.map(getSeatNumber).sort((a, b) => a - b);
  return numbers.every((number, index) => index === 0 || number === numbers[index - 1] + 1);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111122',
  },
  scrollView: {
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
    backgroundColor: '#111122',
    paddingBottom: 18,
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
    minWidth: '100%',
    paddingVertical: 12,
    backgroundColor: '#111122',
    gap: 6,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  seat: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
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
    fontSize: 8,
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
  seatHoldHint: {
    color: '#9ca3af',
    fontSize: 12,
    lineHeight: 17,
  },
  selectionGuide: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#19192d',
    borderWidth: 1,
    borderColor: '#2d2d4b',
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  guideTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  guideEyebrow: {
    color: '#8f8fb5',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  guideTitle: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
    marginTop: 4,
  },
  guideBadge: {
    minHeight: 30,
    maxWidth: 116,
    borderRadius: 15,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#242446',
    borderWidth: 1,
    borderColor: '#38386a',
  },
  guideBadgeText: {
    color: '#d9d9ff',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  guideStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  guideStat: {
    flex: 1,
    minHeight: 62,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#111122',
    borderWidth: 1,
    borderColor: '#2c2c49',
  },
  guideStatLabel: {
    color: '#9696ba',
    fontSize: 11,
    fontWeight: '700',
  },
  guideStatValue: {
    color: '#ffffff',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '900',
    marginTop: 6,
  },
  tipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tipCard: {
    width: '48.8%',
    minHeight: 78,
    borderRadius: 10,
    padding: 10,
    backgroundColor: '#20203a',
    borderWidth: 1,
    borderColor: '#34345c',
  },
  tipTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  tipText: {
    color: '#b7b7d2',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
  selectedGuideBox: {
    marginTop: 12,
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#231532',
    borderWidth: 1,
    borderColor: '#4b285f',
  },
  selectedGuideLabel: {
    color: '#c7a7d8',
    fontSize: 12,
    fontWeight: '800',
  },
  selectedGuideSeats: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 5,
  },
  selectedGuideHint: {
    color: '#c8bed0',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 7,
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
  continueBtnDisabled: {
    opacity: 0.7,
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

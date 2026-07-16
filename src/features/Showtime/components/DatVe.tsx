import React, {useState} from 'react';
import {
  ImageBackground,
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
import {formatGio, formatNgayNgan} from '../../../services/showtimeService';

const BLUE = '#005f98';
const MOMO_PINK = '#d82d8b';
const COLOR_SOLD = '#555566';       // Đã đặt - xám tối
const COLOR_SELECTED = '#d82d8b';   // Ghế bạn chọn - hồng Momo
const COLOR_NORMAL = '#6c5fc7';     // Ghế thường - tím
const COLOR_VIP = '#e51937';        // Ghế VIP - đỏ
const COLOR_DISABLED = '#888899';

type DatVeProps = {
  movie: {
    title: string;
    duration?: string;
    poster: ImageSourcePropType;
  };
  showtime: SelectedShowtimeInfo;
  onBack: () => void;
  onContinue: (summary: {seats: string[]; totalPrice: number}) => void;
};

const soldSeats = new Set([
  'C6', 'C7', 'C8', 'C9', 'C10', 'C11',
  'D6', 'D7', 'D8', 'D9', 'D10', 'D11',
  'E6', 'E7', 'E8', 'E9', 'E10', 'E11',
  'F6', 'F7', 'F8', 'F9', 'F10', 'F11',
  'H8', 'H9',
]);

// Row definitions: [row key, seat labels, isVip]
type RowDef = {key: string; seats: string[]; isVip: boolean};

const seatRows: RowDef[] = [
  {key: 'A', seats: ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','A11','A12','A13','A14'], isVip: false},
  {key: 'B', seats: ['B1','B2','B3','B4','B5','B6','B7','B8','B9','B10','B11','B12','B13','B14'], isVip: false},
  {key: 'C', seats: ['C1','C2','C3','C4','C5','C6','C7','C8','C9','C10','C11','C12','C13','C14','C15'], isVip: false},
  {key: 'D', seats: ['D1','D2','D3','D4','D5','D6','D7','D8','D9','D10','D11','D12','D13','D14','D15'], isVip: false},
  {key: 'E', seats: ['E1','E2','E3','E4','E5','E6','E7','E8','E9','E10','E11','E12','E13','E14'], isVip: true},
  {key: 'F', seats: ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12','F13','F14','F15'], isVip: true},
  {key: 'G', seats: ['G1','G2','G3','G4','G5','G6','G7','G8','G9','G10','G11','G12','G13'], isVip: true},
  {key: 'H', seats: ['H1','H2','H3','H4','H5','H6','H7','H8','H9','H10','H11','H12','H13'], isVip: true},
];

// Seats in the "center zone" (bordered)
const CENTER_ZONE = new Set([
  'C6','C7','C8','C9','C10','C11',
  'D6','D7','D8','D9','D10','D11',
  'E6','E7','E8','E9','E10','E11',
  'F6','F7','F8','F9','F10','F11',
]);

function DatVe({movie, showtime, onBack, onContinue}: DatVeProps) {
  const [selectedSeats, setSelectedSeats] = useState(new Set<string>());
  const [showConfirm, setShowConfirm] = useState(false);
  const duration = movie.duration ?? '109 phút';
  const selectedSeatList = Array.from(selectedSeats).sort(sortSeats);
  const unitPrice = showtime.price > 0 ? showtime.price : 55000;
  const totalPrice = selectedSeatList.reduce((total, seat) => {
    const isVip = /^[E-H]/.test(seat);
    return total + (isVip ? Math.round(unitPrice * 1.2) : unitPrice);
  }, 0);
  const hasSelectedSeats = selectedSeatList.length > 0;
  const showMeta = `${showtime.roomType} | ${formatNgayNgan(showtime.startTime)} ${formatGio(showtime.startTime)}`;

  const handleSeatPress = (seat: string) => {
    if (soldSeats.has(seat)) return;
    setSelectedSeats(current => {
      const next = new Set(current);
      if (next.has(seat)) {
        next.delete(seat);
      } else {
        next.add(seat);
      }
      return next;
    });
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
        <View style={styles.seatPanel}>
          {seatRows.map(row => (
            <View key={row.key} style={styles.seatRow}>
              {row.seats.map(seat => {
                const isSold = soldSeats.has(seat);
                const isSelected = selectedSeats.has(seat);
                const isCenter = CENTER_ZONE.has(seat);
                let bgColor = row.isVip ? COLOR_VIP : COLOR_NORMAL;
                if (isSold) bgColor = COLOR_SOLD;
                if (isSelected) bgColor = COLOR_SELECTED;

                return (
                  <TouchableOpacity
                    key={seat}
                    activeOpacity={isSold ? 1 : 0.7}
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
            <LegendItem color={COLOR_SELECTED} label="Ghế bạn chọn" />
            <LegendItem color={COLOR_NORMAL} label="Ghế thường" />
          </View>
          <View style={styles.legendRow}>
            <LegendItem color={COLOR_VIP} label="Ghế VIP" />
            <LegendItem isBorder label="Vùng trung tâm" />
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{height: 20}} />
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
                Cine Prestige Hà Trung
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
                onContinue({seats: selectedSeatList, totalPrice});
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

function getSeatPrice(seat: string) {
  if (/^[E-H]/.test(seat)) return 66000;
  return 55000;
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

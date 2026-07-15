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
const SOLD = '#f02b12';
const SELECTED = '#0879b9';
const HELD = '#39b9ec';
const RESERVED = '#ffd018';
const EMPTY = '#c9ccd2';

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
  'E6',
  'E7',
  'E8',
  'E9',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'G6',
  'G7',
  'G8',
  'G9',
  'H6',
  'H7',
  'J5 J6',
]);

const rows = [
  ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10', 'A11'],
  ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11'],
  ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10', 'C11', 'C12'],
  ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12'],
  ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12'],
  ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
  ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12'],
  ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12'],
  ['I1', 'I2', 'I3', 'I4', 'I5', 'I6', 'I7', 'I8', 'I9', 'I10', 'I11', 'I12'],
];

function DatVe({movie, showtime, onBack, onContinue}: DatVeProps) {
  const [selectedSeats, setSelectedSeats] = useState(new Set<string>());
  const [showAgeConfirm, setShowAgeConfirm] = useState(false);
  const duration = movie.duration ?? '109 phút';
  const selectedSeatList = Array.from(selectedSeats).sort(sortSeats);
  const unitPrice = showtime.price > 0 ? showtime.price : 50000;
  const totalPrice = selectedSeatList.reduce((total, seat) => {
    // VIP hàng E–I cộng thêm nếu giá suất cơ bản
    const isVip = /^[E-I]/.test(seat);
    return total + (isVip ? Math.round(unitPrice * 1.1) : unitPrice);
  }, 0);
  const hasSelectedSeats = selectedSeatList.length > 0;
  const showMeta = `${showtime.roomType} | ${formatNgayNgan(showtime.startTime)} ${formatGio(showtime.startTime)} | ${showtime.roomName}`;

  const handleSeatPress = (seat: string) => {
    if (soldSeats.has(seat)) {
      return;
    }

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
        <Text style={styles.headerTitle}>ĐẶT VÉ THEO PHIM</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollBody}>
        <ImageBackground source={movie.poster} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text numberOfLines={1} style={styles.movieTitle}>
              {movie.title}
            </Text>
            <Text style={styles.movieMeta}>{showMeta} | {duration}</Text>
          </View>
        </ImageBackground>

        <View style={styles.legendPanel}>
          <View style={styles.legendColumn}>
            <LegendItem color={EMPTY} label="Ghế trống" />
            <LegendItem color={HELD} label="Ghế đang được giữ" />
            <LegendItem color={SELECTED} label="Ghế đang chọn" />
            <LegendItem color={SOLD} label="Ghế đã bán" />
            <LegendItem color={RESERVED} label="Ghế đã đặt trước" />
          </View>

          <View style={styles.legendColumn}>
            <PriceItem color={EMPTY} title="Ghế thường" price="50.000 đ" />
            <PriceItem color={EMPTY} title="Ghế VIP" price="55.000 đ" />
            <PriceItem color={EMPTY} title="Ghế đôi" price="110.000 đ" wide />
          </View>
        </View>

        <View style={styles.seatPanel}>
          <View style={styles.screenArc} />
          <Text style={styles.screenText}>MÀN HÌNH CHIẾU</Text>

          <View style={styles.seatRows}>
            {rows.map(row => (
              <View key={row[0]} style={styles.seatRow}>
                {row.map(seat => (
                  <Seat
                    key={seat}
                    label={seat}
                    status={
                      soldSeats.has(seat)
                        ? 'sold'
                        : selectedSeats.has(seat)
                        ? 'selected'
                        : 'empty'
                    }
                    onPress={() => handleSeatPress(seat)}
                  />
                ))}
              </View>
            ))}
          </View>

          <View style={styles.coupleRow}>
            <Seat
              label="J3 J4"
              status={selectedSeats.has('J3 J4') ? 'selected' : 'empty'}
              wide
              onPress={() => handleSeatPress('J3 J4')}
            />
            <Seat label="J5 J6" status="sold" wide onPress={() => handleSeatPress('J5 J6')} />
          </View>
        </View>
      </ScrollView>

      <View style={styles.checkoutBar}>
        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>Thời gian còn lại:</Text>
          <Text style={styles.timerValue}>{hasSelectedSeats ? '9:40' : '9:51'}</Text>
        </View>

        {hasSelectedSeats && (
          <View style={styles.checkoutRow}>
            <View style={styles.selectedInfo}>
              <Text style={styles.checkoutLabel}>Ghế đã chọn</Text>
              <Text numberOfLines={1} style={styles.selectedSeats}>
                {selectedSeatList.join(', ')}
              </Text>
            </View>

            <View style={styles.totalInfo}>
              <Text style={styles.checkoutLabel}>Tổng tiền</Text>
              <Text style={styles.totalPrice}>{formatMoney(totalPrice)}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.82}
              style={styles.continueButton}
              onPress={() => setShowAgeConfirm(true)}>
              <Text style={styles.continueText}>Tiếp tục</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        transparent
        visible={showAgeConfirm}
        animationType="fade"
        onRequestClose={() => setShowAgeConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmText}>
              Tôi xác nhận mua vé cho người xem từ{' '}
              <Text style={styles.confirmBold}>18 tuổi trở lên</Text> và hiểu
              rằng FilmGo sẽ không hoàn lại tiền nếu không chứng thực được độ tuổi
              của khán giả. Tham khảo{' '}
              <Text style={styles.confirmLink}>quy định</Text> của Cục Điện Ảnh.
            </Text>

            <View style={styles.confirmDivider} />

            <View style={styles.confirmActions}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.confirmAction}
                onPress={() => setShowAgeConfirm(false)}>
                <Text style={styles.cancelText}>Hủy</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.confirmAction}
                onPress={() => {
                  setShowAgeConfirm(false);
                  onContinue({
                    seats: selectedSeatList,
                    totalPrice,
                  });
                }}>
                <Text style={styles.agreeText}>Đồng ý</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getSeatPrice(seat: string) {
  if (seat.includes(' ')) {
    return 110000;
  }

  const rowName = seat.charAt(0);
  return ['E', 'F', 'G', 'H', 'I'].includes(rowName) ? 55000 : 50000;
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`;
}

function sortSeats(a: string, b: string) {
  const rowCompare = a.charCodeAt(0) - b.charCodeAt(0);
  if (rowCompare !== 0) {
    return rowCompare;
  }

  return getSeatNumber(a) - getSeatNumber(b);
}

function getSeatNumber(seat: string) {
  const match = seat.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function LegendItem({color, label}: {color: string; label: string}) {
  return (
    <View style={styles.legendItem}>
      <SeatIcon color={color} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function PriceItem({
  color,
  title,
  price,
  wide,
}: {
  color: string;
  title: string;
  price: string;
  wide?: boolean;
}) {
  return (
    <View style={styles.priceItem}>
      <SeatIcon color={color} wide={wide} />
      <View>
        <Text style={styles.priceTitle}>{title}</Text>
        <Text style={styles.priceValue}>{price}</Text>
      </View>
    </View>
  );
}

function SeatIcon({color, wide}: {color: string; wide?: boolean}) {
  return (
    <View style={[styles.seatIcon, wide && styles.seatIconWide]}>
      <View style={[styles.seatIconBack, {backgroundColor: color}]} />
      <View style={[styles.seatIconBase, {backgroundColor: color}]} />
    </View>
  );
}

function Seat({
  label,
  status,
  wide,
  onPress,
}: {
  label: string;
  status: 'empty' | 'selected' | 'sold';
  wide?: boolean;
  onPress: () => void;
}) {
  const color = status === 'sold' ? SOLD : status === 'selected' ? SELECTED : EMPTY;
  const textColor = status === 'sold' || status === 'selected' ? '#ffffff' : '#111111';

  return (
    <TouchableOpacity
      activeOpacity={status === 'sold' ? 1 : 0.75}
      style={[styles.seat, wide && styles.seatWide]}
      onPress={onPress}>
      <View style={[styles.seatBack, {backgroundColor: color}, wide && styles.seatBackWide]}>
        <Text style={[styles.seatLabel, {color: textColor}]}>{label}</Text>
      </View>
      <View style={[styles.seatBase, {backgroundColor: color}, wide && styles.seatBaseWide]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollBody: {
    paddingBottom: 8,
  },
  header: {
    height: 86,
    alignItems: 'center',
    backgroundColor: BLUE,
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  hero: {
    height: 132,
    justifyContent: 'center',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  movieTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
  },
  movieMeta: {
    color: '#ffffff',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  legendPanel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
  },
  legendColumn: {
    gap: 9,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  legendText: {
    color: '#707070',
    fontSize: 15,
    marginLeft: 8,
  },
  priceItem: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  priceTitle: {
    color: '#777777',
    fontSize: 15,
  },
  priceValue: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  seatIcon: {
    width: 32,
    height: 24,
    alignItems: 'center',
    marginRight: 9,
  },
  seatIconWide: {
    width: 52,
  },
  seatIconBack: {
    width: 24,
    height: 14,
    borderRadius: 7,
  },
  seatIconBase: {
    width: 30,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  seatPanel: {
    paddingTop: 17,
    paddingBottom: 14,
    backgroundColor: '#f0f1f2',
  },
  screenArc: {
    alignSelf: 'center',
    width: '92%',
    height: 32,
    borderTopWidth: 4,
    borderTopColor: '#6c8297',
    borderRadius: 220,
  },
  screenText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center',
    marginTop: -18,
    marginBottom: 8,
  },
  seatRows: {
    gap: 6,
  },
  seatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  seat: {
    width: 29,
    height: 29,
    alignItems: 'center',
  },
  seatWide: {
    width: 78,
  },
  seatBack: {
    width: 28,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  seatBackWide: {
    width: 74,
  },
  seatBase: {
    width: 27,
    height: 4,
    borderRadius: 3,
    marginTop: 1,
    opacity: 0.9,
  },
  seatBaseWide: {
    width: 72,
  },
  seatLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  coupleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  checkoutBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  timerRow: {
    minHeight: 61,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
  },
  timerLabel: {
    color: '#111111',
    fontSize: 22,
    fontWeight: '900',
  },
  timerValue: {
    color: '#111111',
    fontSize: 26,
    fontWeight: '900',
  },
  checkoutRow: {
    minHeight: 98,
    flexDirection: 'row',
    alignItems: 'stretch',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eeeeee',
    backgroundColor: '#ffffff',
  },
  selectedInfo: {
    flex: 1.05,
    justifyContent: 'center',
    paddingLeft: 18,
    paddingRight: 10,
  },
  totalInfo: {
    flex: 0.95,
    justifyContent: 'center',
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: '#d8d8d8',
    paddingHorizontal: 13,
  },
  checkoutLabel: {
    color: '#202020',
    fontSize: 16,
  },
  selectedSeats: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 13,
  },
  totalPrice: {
    color: '#2577a4',
    fontSize: 17,
    marginTop: 13,
  },
  continueButton: {
    width: 116,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BLUE,
    marginVertical: 11,
    marginRight: 10,
    borderTopLeftRadius: 7,
    borderBottomLeftRadius: 7,
  },
  continueText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.56)',
    paddingHorizontal: 24,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  confirmText: {
    color: '#242424',
    fontSize: 17,
    lineHeight: 24,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
  },
  confirmBold: {
    fontWeight: '900',
  },
  confirmLink: {
    color: '#2489ca',
    textDecorationLine: 'underline',
  },
  confirmDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#dddddd',
    marginHorizontal: 18,
  },
  confirmActions: {
    height: 58,
    flexDirection: 'row',
  },
  confirmAction: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: '#dddddd',
    marginVertical: 8,
  },
  cancelText: {
    color: '#9a9a9a',
    fontSize: 17,
  },
  agreeText: {
    color: '#2f80ed',
    fontSize: 17,
    fontWeight: '900',
  },
});

export default DatVe;

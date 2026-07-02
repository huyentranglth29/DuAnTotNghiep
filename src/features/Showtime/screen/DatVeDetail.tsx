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
import Svg, {Path, Rect} from 'react-native-svg';

const BLUE = '#005f98';
const TEXT = '#3d4054';
const MUTED = '#b8b8b8';
const RED = '#f22a10';

type DatVeDetailProps = {
  movie: {
    title: string;
    duration?: string;
    genre?: string;
    poster: ImageSourcePropType;
  };
  seats: string[];
  totalPrice: number;
  onClose: () => void;
};

const combos = [
  {
    title: 'Family Combo 69oz',
    description:
      'TIẾT KIỆM 95K!!! Gồm: 2 Bắp (69oz) + 4 Nước có gas (22oz) + 2 Snack Oishi (80g)',
    color: '#62c7df',
    badge: 'FAMILY',
  },
  {
    title: 'Combo See Me - Mùi Phở',
    description:
      'SIÊU HOTTT!!! Combo phiên bản giới hạn: 1 Ly "Mùi Phở" hấp dẫn kèm nước có gas + 1 Bắp (69oz)',
    color: '#db4b42',
    badge: 'MÙI PHỞ',
  },
  {
    title: 'FilmGo Combo 69oz',
    description: 'TIẾT KIỆM 28K!!! Gồm: 1 Bắp (69oz) + 1 Nước có gas (22oz)',
    color: '#9bd24f',
    badge: 'FILMGO',
  },
  {
    title: 'Combo Minions',
    description: 'ƯU ĐÃI GIỚI HẠN 01 ly Minions tặng kèm 01 phần nước Pepsi miễn phí.',
    color: '#ffc33d',
    badge: '139k',
  },
  {
    title: 'Sweet Combo 69oz',
    description: 'TIẾT KIỆM 46K!!! Gồm: 1 Bắp (69oz) + 2 Nước có gas (22oz)',
    color: '#f5a6bd',
    badge: 'SWEET',
  },
];

const paymentMethods = [
  {label: 'MÃ QR', icon: 'qr', active: true},
  {label: 'THẺ NỘI ĐỊA', icon: 'card'},
  {label: 'THẺ QUỐC TẾ', icon: 'cards'},
  {label: 'VÍ SHOPEEPAY', icon: 'spay'},
  {label: 'VÍ MOMO', icon: 'momo'},
  {label: 'VÍ ZALOPAY', icon: 'zalo'},
];

function DatVeDetail({movie, seats, totalPrice, onClose}: DatVeDetailProps) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const genre = movie.genre ?? 'Giật gân, Kinh dị';
  const duration = movie.duration ?? '109 phút';
  const discount = 0;
  const payable = totalPrice - discount;

  const updateCombo = (title: string, change: number) => {
    setQuantities(current => ({
      ...current,
      [title]: Math.max(0, (current[title] ?? 0) + change),
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.closeButton} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>THANH TOÁN</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        <View style={styles.ticketCard}>
          <ImageBackground
            source={movie.poster}
            style={styles.ticketHero}
            imageStyle={styles.ticketHeroImage}>
            <View style={styles.ticketHeroOverlay} />
            <Text numberOfLines={1} style={styles.movieTitle}>
              {movie.title}
            </Text>
            <Text style={styles.movieMeta}>2D Phụ đề | {genre} | {duration}</Text>
          </ImageBackground>

          <View style={styles.perforation} />

          <View style={styles.ticketInfo}>
            <InfoRow label="Rạp chiếu" value="FilmGo Giải Phóng" />
            <InfoRow label="Ngày chiếu" value="2026-07-01" />
            <InfoRow label="Giờ chiếu" value="17:45" />
            <InfoRow label="Phòng chiếu" value="P4" />
            <InfoRow label="Loại vé" value="VIP" />
            <InfoRow label="Ghế" value={seats.join(', ') || '--'} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>COMBO ƯU ĐÃI LỚN</Text>
        <View style={styles.comboList}>
          {combos.map(combo => (
            <View key={combo.title} style={styles.comboItem}>
              <ComboThumb color={combo.color} badge={combo.badge} />
              <View style={styles.comboTextBlock}>
                <Text numberOfLines={1} style={styles.comboTitle}>
                  {combo.title}
                </Text>
                <Text numberOfLines={3} style={styles.comboDescription}>
                  {combo.description}
                </Text>
              </View>
              <View style={styles.stepper}>
                <Text style={styles.quantity}>{quantities[combo.title] ?? 0}</Text>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={[styles.stepButton, styles.stepButtonPlus]}
                  onPress={() => updateCombo(combo.title, 1)}>
                  <Text style={styles.stepText}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  activeOpacity={0.75}
                  style={styles.stepButton}
                  onPress={() => updateCombo(combo.title, -1)}>
                  <Text style={styles.stepText}>−</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>PHƯƠNG THỨC GIẢM GIÁ</Text>
        <OptionRow label="FilmGo Voucher" />
        <OptionRow label="Điểm FilmGo" />

        <View style={styles.totalBlock}>
          <MoneyRow label="Tổng tiền" value={formatVnd(totalPrice)} valueStyle={styles.redMoney} />
          <MoneyRow label="Số tiền được giảm" value={formatVnd(discount)} valueStyle={styles.blueMoney} />
          <MoneyRow label="Số tiền cần thanh toán" value={formatVnd(payable)} valueStyle={styles.redMoney} />
        </View>

        <Text style={styles.sectionTitle}>THANH TOÁN</Text>
        <Text style={styles.paymentTitle}>Chọn thẻ thanh toán</Text>
        <View style={styles.paymentList}>
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.label}
              activeOpacity={0.75}
              style={[styles.paymentMethod, method.active && styles.paymentMethodActive]}>
              <PaymentIcon name={method.icon} active={method.active} />
              <Text style={[styles.paymentLabel, method.active && styles.paymentLabelActive]}>
                {method.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.remainingTitle}>THỜI GIAN CÒN LẠI</Text>
        <Text style={styles.remainingTime}>09:28</Text>
        <Text style={styles.termText}>
          Nhấn "THANH TOÁN" đồng nghĩa với việc bạn đồng ý với{' '}
          <Text style={styles.termLink}>Điều khoản sử dụng</Text> và đang mua vé
          cho người có độ tuổi phù hợp.
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.payButton}
          onPress={() => setShowCancelConfirm(true)}>
          <Text style={styles.payButtonText}>THANH TOÁN</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        transparent
        visible={showCancelConfirm}
        animationType="fade"
        onRequestClose={() => setShowCancelConfirm(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmBox}>
            <Text style={styles.confirmTitle}>Xác nhận</Text>
            <Text style={styles.confirmMessage}>
              Bạn có chắc chắn muốn hủy thanh toán?
            </Text>

            <View style={styles.confirmActions}>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.confirmButton}
                onPress={() => setShowCancelConfirm(false)}>
                <Text style={styles.noText}>Không</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.confirmButton}
                onPress={onClose}>
                <Text style={styles.yesText}>Có</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InfoRow({label, value}: {label: string; value: string}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function OptionRow({label}: {label: string}) {
  return (
    <TouchableOpacity activeOpacity={0.75} style={styles.optionRow}>
      <Text style={styles.optionText}>{label}</Text>
      <View style={styles.optionArrow}>
        <Text style={styles.optionArrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function MoneyRow({
  label,
  value,
  valueStyle,
}: {
  label: string;
  value: string;
  valueStyle: object;
}) {
  return (
    <View style={styles.moneyRow}>
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={[styles.moneyValue, valueStyle]}>{value}</Text>
    </View>
  );
}

function ComboThumb({color, badge}: {color: string; badge: string}) {
  return (
    <View style={[styles.comboThumb, {backgroundColor: color}]}>
      <View style={styles.bucket}>
        <Text style={styles.bucketText}>FILMGO</Text>
      </View>
      <View style={styles.cup} />
      <Text style={styles.comboBadge}>{badge}</Text>
    </View>
  );
}

function PaymentIcon({name, active}: {name: string; active?: boolean}) {
  const color = active ? BLUE : MUTED;

  if (name === 'qr') {
    return (
      <Svg width={32} height={32} viewBox="0 0 32 32">
        <Rect x={5} y={5} width={7} height={7} stroke={color} strokeWidth={2} fill="none" />
        <Rect x={20} y={5} width={7} height={7} stroke={color} strokeWidth={2} fill="none" />
        <Rect x={5} y={20} width={7} height={7} stroke={color} strokeWidth={2} fill="none" />
        <Path d="M18 18h4v4h-4zM24 18h3v9h-3M18 24h3v3h-3" stroke={color} strokeWidth={2} />
      </Svg>
    );
  }

  if (name === 'momo') {
    return (
      <View style={styles.walletIcon}>
        <Text style={styles.walletIconText}>mo</Text>
        <Text style={styles.walletIconText}>mo</Text>
      </View>
    );
  }

  if (name === 'spay' || name === 'zalo') {
    return (
      <View style={[styles.squareWallet, {borderColor: color}]}>
        <Text style={[styles.squareWalletText, {color}]}>{name === 'spay' ? 'S Pay' : 'Zalo'}</Text>
      </View>
    );
  }

  return (
    <Svg width={34} height={28} viewBox="0 0 34 28">
      <Rect x={3} y={6} width={28} height={18} rx={2} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M3 12h28M9 19h7" stroke={color} strokeWidth={2} />
      {name === 'cards' && (
        <Rect x={7} y={2} width={24} height={18} rx={2} stroke={color} strokeWidth={2} fill="none" />
      )}
    </Svg>
  );
}

function formatVnd(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
  },
  header: {
    height: 86,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: BLUE,
    paddingHorizontal: 14,
    paddingTop: 4,
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  closeText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  body: {
    padding: 10,
    paddingBottom: 26,
  },
  ticketCard: {
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
  },
  ticketHero: {
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketHeroImage: {
    resizeMode: 'cover',
  },
  ticketHeroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.68)',
  },
  movieTitle: {
    color: '#222433',
    fontSize: 22,
    fontWeight: '900',
  },
  movieMeta: {
    color: '#202231',
    fontSize: 15,
    marginTop: 6,
    textAlign: 'center',
  },
  perforation: {
    height: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#d8d8d8',
    backgroundColor: '#eeeeee',
  },
  ticketInfo: {
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  infoLabel: {
    width: 118,
    color: TEXT,
    fontSize: 18,
  },
  infoValue: {
    flex: 1,
    color: TEXT,
    fontSize: 18,
    fontWeight: '900',
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 18,
    marginBottom: 10,
  },
  comboList: {
    gap: 7,
  },
  comboItem: {
    minHeight: 82,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  comboThumb: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 31,
    marginRight: 9,
  },
  bucket: {
    width: 27,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    backgroundColor: BLUE,
  },
  bucketText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
  },
  cup: {
    position: 'absolute',
    right: 13,
    top: 16,
    width: 15,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  comboBadge: {
    position: 'absolute',
    bottom: 8,
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
  },
  comboTextBlock: {
    flex: 1,
    paddingRight: 8,
  },
  comboTitle: {
    color: TEXT,
    fontSize: 16,
  },
  comboDescription: {
    color: '#303244',
    fontSize: 12,
    lineHeight: 14,
    marginTop: 5,
  },
  stepper: {
    width: 82,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quantity: {
    color: '#050505',
    fontSize: 19,
    fontWeight: '900',
  },
  stepButton: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: '#8f9aa3',
  },
  stepButtonPlus: {
    backgroundColor: '#0079bd',
  },
  stepText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  optionRow: {
    height: 58,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    marginBottom: 7,
  },
  optionText: {
    color: TEXT,
    fontSize: 19,
  },
  optionArrow: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#eeeeee',
  },
  optionArrowText: {
    color: TEXT,
    fontSize: 29,
    lineHeight: 29,
  },
  totalBlock: {
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  moneyRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 9,
  },
  moneyLabel: {
    color: TEXT,
    fontSize: 19,
  },
  moneyValue: {
    fontSize: 21,
    fontWeight: '900',
  },
  redMoney: {
    color: RED,
  },
  blueMoney: {
    color: BLUE,
  },
  paymentTitle: {
    color: TEXT,
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 10,
  },
  paymentList: {
    gap: 7,
  },
  paymentMethod: {
    height: 56,
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 18,
    gap: 26,
  },
  paymentMethodActive: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderColor: BLUE,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  paymentLabel: {
    color: MUTED,
    fontSize: 19,
  },
  paymentLabelActive: {
    color: BLUE,
  },
  walletIcon: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 3,
    backgroundColor: '#2d2d2d',
  },
  walletIconText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    lineHeight: 9,
  },
  squareWallet: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 4,
  },
  squareWalletText: {
    fontSize: 7,
    fontWeight: '900',
    textAlign: 'center',
  },
  remainingTitle: {
    color: TEXT,
    fontSize: 23,
    fontWeight: '900',
    marginTop: 20,
  },
  remainingTime: {
    color: '#171822',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginVertical: 16,
  },
  termText: {
    color: '#1f202b',
    fontSize: 18,
    lineHeight: 28,
  },
  termLink: {
    color: BLUE,
    fontWeight: '900',
  },
  payButton: {
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    backgroundColor: BLUE,
    marginTop: 18,
    marginBottom: 10,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
  },
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.54)',
    paddingHorizontal: 36,
  },
  confirmBox: {
    width: '100%',
    maxWidth: 330,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 18,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  confirmTitle: {
    color: '#252525',
    fontSize: 22,
    textAlign: 'center',
    marginBottom: 28,
  },
  confirmMessage: {
    color: '#333333',
    fontSize: 17,
    lineHeight: 23,
    marginBottom: 58,
  },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  confirmButton: {
    minWidth: 74,
    minHeight: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  noText: {
    color: '#ef5555',
    fontSize: 16,
  },
  yesText: {
    color: BLUE,
    fontSize: 16,
  },
});

export default DatVeDetail;

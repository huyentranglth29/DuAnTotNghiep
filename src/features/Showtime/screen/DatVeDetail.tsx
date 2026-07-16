import React, {useEffect, useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {createQuickBooking} from '../../../services/apiService';

const MOMO_PINK = '#d82d8b';
const MOMO_DARK = '#a61f69';
const TEXT_DARK = '#1a1a1a';
const TEXT_MUTED = '#888888';
const BG_GRAY = '#f4f4f6';

type DatVeDetailProps = {
  movie: {
    title: string;
    duration?: string;
    genre?: string;
    poster: ImageSourcePropType;
  };
  seats: string[];
  totalPrice: number;
  showtime?: {
    id: string;
    startTime: string;
    endTime?: string;
    roomName?: string;
    roomType?: string;
  };
  onClose: () => void;
};

function formatBookingTime(iso?: string) {
  if (!iso) {
    return new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
  }
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
  } catch {
    return iso;
  }
}

function formatBookingDate(iso?: string) {
  if (!iso) {
    const now = new Date();
    const days = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    return `${days[now.getDay()]}, ${now.toLocaleDateString('vi-VN')}`;
  }
  try {
    const d = new Date(iso);
    const days = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7'];
    return `${days[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`;
  } catch {
    return iso;
  }
}

function DatVeDetail({movie, seats, totalPrice, showtime, onClose}: DatVeDetailProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const genre = movie.genre ?? '2D Phụ đề';
  const roomName = showtime?.roomName ?? 'Phòng chiếu 07';
  const startTime = formatBookingTime(showtime?.startTime);
  const bookingDate = formatBookingDate(showtime?.startTime);

  const handleConfirmPayment = async () => {
    if (isProcessing) return;
    setShowConfirm(false);
    setIsProcessing(true);
    try {
      await createQuickBooking({
        showtimeId: showtime?.id,
        movieTitle: movie.title,
        movieDuration: movie.duration,
        movieGenre: movie.genre,
        seats: seats,
        totalPrice: totalPrice,
        cinema: 'FilmGo Hà Trung (Thanh Hóa)',
        bookingDate: new Date().toLocaleDateString('vi-VN'),
        bookingTime: startTime,
      });
      Alert.alert(
        '🎉 Đặt vé thành công!',
        `Vé phim "${movie.title}" đã được đặt thành công!\nBạn có thể kiểm tra vé trong mục "Khác > Vé của tôi".`,
        [{text: 'Xong', onPress: onClose}],
      );
    } catch (e) {
      console.log('❌ Lỗi lưu vé:', e);
      Alert.alert('Không thể đặt ghế', (e as Error)?.message || 'Đặt vé thất bại, vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backBtn} onPress={onClose}>
          <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5L8 12l7 7"
              stroke="#333333"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin thanh toán</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>

        {/* === THÔNG TIN ĐẶT VÉ === */}
        <Text style={styles.sectionLabel}>Thông tin đặt vé</Text>
        <View style={styles.card}>
          {/* Warning banner */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningIcon}>💬</Text>
            <Text style={styles.warningText}>
              Bạn ơi, vé đã mua sẽ{' '}
              <Text style={styles.warningBold}>không thể hoàn, huỷ, đổi vé.</Text>
              {' '}Bạn nhớ kiểm tra kỹ thông tin nha!
            </Text>
          </View>

          {/* Cinema & Movie info */}
          <View style={styles.movieInfoRow}>
            <Image source={movie.poster} style={styles.posterThumb} />
            <View style={styles.movieInfoText}>
              <Text style={styles.cinemaName}>FilmGo Hà Trung (Thanh Hóa)</Text>
              <Text style={styles.movieTitle} numberOfLines={2}>{movie.title}</Text>
              <View style={styles.ageBadge}>
                <Text style={styles.ageText}>16+</Text>
              </View>
              <Text style={styles.movieMeta} numberOfLines={2}>
                Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên
              </Text>
            </View>
          </View>

          {/* Dashed divider */}
          <View style={styles.dashedDivider} />

          {/* Booking details grid */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Thời gian:</Text>
              <Text style={styles.detailValuePink}>{startTime}</Text>
              <Text style={styles.detailValuePink}>{bookingDate}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Định dạng:</Text>
              <Text style={styles.detailValuePink}>{genre}</Text>
            </View>
          </View>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Phòng chiếu:</Text>
              <Text style={styles.detailValueBold}>{roomName}</Text>
            </View>
            <View style={styles.detailCol}>
              <Text style={styles.detailLabel}>Số ghế:</Text>
              <Text style={styles.detailValueBold}>{seats.join(', ') || '--'}</Text>
            </View>
          </View>
        </View>

        {/* === THÔNG TIN NGƯỜI NHẬN === */}
        <Text style={styles.sectionLabel}>Thông tin người nhận</Text>
        <View style={styles.cardRecipient}>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>Người dùng FilmGo</Text>
            <Text style={styles.recipientContact}>0394584627 - demo@filmgo.vn</Text>
          </View>
          <TouchableOpacity style={styles.editBtn}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path
                d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                stroke={MOMO_PINK}
                strokeWidth={2}
                strokeLinecap="round"
              />
              <Path
                d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                stroke={MOMO_PINK}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          Bằng cách bấm Tiếp tục, bạn đồng ý với các{' '}
          <Text style={styles.termsLink}>điều khoản này</Text>
          {' '}của MoMo và chính sách của rạp
        </Text>

        {/* Spacer for footer */}
        <View style={{height: 100}} />
      </ScrollView>

      {/* === STICKY FOOTER === */}
      <View style={styles.footer}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTamTinh}>Tạm tính</Text>
          <Text style={styles.footerAmount}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, isProcessing && styles.footerBtnDisabled]}
          onPress={() => setShowConfirm(true)}
          disabled={isProcessing}>
          <Text style={styles.footerBtnText}>
            {isProcessing ? 'Đang xử lý...' : 'Tiếp tục'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* === MODAL XÁC NHẬN === */}
      <Modal
        transparent
        visible={showConfirm}
        animationType="slide"
        onRequestClose={() => setShowConfirm(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConfirm(false)}>
          <View style={styles.confirmSheet}>
            <TouchableOpacity
              style={styles.closeX}
              onPress={() => setShowConfirm(false)}>
              <Text style={styles.closeXText}>✕</Text>
            </TouchableOpacity>

            <Text style={styles.confirmTitle}>Xác nhận đặt vé</Text>
            <Text style={styles.confirmSubtitle}>
              Bạn đang đặt vé xem phim {movie.title}:
            </Text>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmRowIcon}>🎬</Text>
              <View>
                <Text style={styles.confirmRowTextPink}>FilmGo Hà Trung (Thanh Hóa)</Text>
                <Text style={styles.confirmRowSub}>Thanh Hóa</Text>
              </View>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmRowIcon}>🕐</Text>
              <Text style={styles.confirmRowTextPink}>{startTime}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmRowIcon}>📅</Text>
              <Text style={styles.confirmRowTextPink}>{bookingDate}</Text>
            </View>

            <View style={styles.confirmRow}>
              <Text style={styles.confirmRowIcon}>💺</Text>
              <Text style={styles.confirmRowText}>Ghế: <Text style={styles.confirmBold}>{seats.join(', ')}</Text></Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.confirmBtn}
              onPress={handleConfirmPayment}>
              <Text style={styles.confirmBtnText}>Xác nhận</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_GRAY,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    color: TEXT_DARK,
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  sectionLabel: {
    color: TEXT_DARK,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e7',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ffe9b0',
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    flex: 1,
    color: '#7a5200',
    fontSize: 13,
    lineHeight: 19,
  },
  warningBold: {
    fontWeight: '700',
    color: '#7a5200',
  },
  movieInfoRow: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
    alignItems: 'flex-start',
  },
  posterThumb: {
    width: 80,
    height: 110,
    borderRadius: 8,
    backgroundColor: '#cccccc',
  },
  movieInfoText: {
    flex: 1,
  },
  cinemaName: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginBottom: 4,
  },
  movieTitle: {
    color: TEXT_DARK,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  ageBadge: {
    backgroundColor: '#ff8800',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  ageText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  movieMeta: {
    color: TEXT_MUTED,
    fontSize: 12,
    lineHeight: 17,
  },
  dashedDivider: {
    borderTopWidth: 1.5,
    borderTopColor: '#dddddd',
    borderStyle: 'dashed',
    marginHorizontal: 14,
    marginBottom: 14,
  },
  detailsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    color: TEXT_MUTED,
    fontSize: 13,
    marginBottom: 3,
  },
  detailValuePink: {
    color: MOMO_PINK,
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  detailValueBold: {
    color: TEXT_DARK,
    fontSize: 14,
    fontWeight: '700',
  },
  cardRecipient: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  recipientInfo: {
    flex: 1,
  },
  recipientName: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  recipientContact: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  editBtn: {
    padding: 6,
  },
  terms: {
    color: TEXT_MUTED,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  termsLink: {
    color: MOMO_PINK,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#eeeeee',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: -2},
  },
  footerTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerTamTinh: {
    color: TEXT_MUTED,
    fontSize: 15,
  },
  footerAmount: {
    color: TEXT_DARK,
    fontSize: 18,
    fontWeight: '800',
  },
  footerBtn: {
    backgroundColor: MOMO_PINK,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerBtnDisabled: {
    backgroundColor: '#e8a0c8',
  },
  footerBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  confirmSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    elevation: 20,
  },
  closeX: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 18,
    marginBottom: 8,
  },
  closeXText: {
    color: '#444444',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmTitle: {
    color: TEXT_DARK,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  confirmSubtitle: {
    color: TEXT_MUTED,
    fontSize: 14,
    marginBottom: 20,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  confirmRowIcon: {
    fontSize: 22,
    width: 30,
  },
  confirmRowTextPink: {
    color: MOMO_PINK,
    fontSize: 16,
    fontWeight: '700',
  },
  confirmRowSub: {
    color: TEXT_MUTED,
    fontSize: 13,
  },
  confirmRowText: {
    color: TEXT_DARK,
    fontSize: 15,
  },
  confirmBold: {
    fontWeight: '700',
  },
  confirmBtn: {
    backgroundColor: MOMO_PINK,
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
});

export default DatVeDetail;

import React, {useEffect, useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useQuery} from '@tanstack/react-query';
import MockPaymentScreen from './MockPaymentScreen';
import {
  cancelPayment,
  completeMockPayment,
  createMockPayment,
  failMockPayment,
  getPaymentStatus,
  getProducts,
} from '../../../services/apiService';
import {getMyVouchers, AUTH_USER_KEY} from '../../../services/voucherService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {FilmGoVoucher, formatVoucherValue} from '../../Voucher/types';

const MOMO_PINK = '#d82d8b';
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
  holdToken?: string;
  showtime?: {
    id: string;
    startTime: string;
    endTime?: string;
    roomName?: string;
    roomType?: string;
  };
  onClose: () => void;
};

type ComboProduct = {
  _id: string;
  name: string;
  description?: string;
  image: string;
  price: number;
  stock?: number;
  isActive: boolean;
};

type SelectedCombo = ComboProduct & {
  quantity: number;
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

function DatVeDetail({movie, seats, totalPrice, holdToken, showtime, onClose}: DatVeDetailProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<{amount: number; expiresAt: string} | null>(null);
  const [comboQuantities, setComboQuantities] = useState<Record<string, number>>({});
  const [selectedVoucher, setSelectedVoucher] = useState<FilmGoVoucher | null>(null);
  const [recipient, setRecipient] = useState({
    fullName: '',
    email: '',
    phone: '',
  });
  const [editVisible, setEditVisible] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const productsQuery = useQuery({queryKey: ['payment-products'], queryFn: getProducts});
  const vouchersQuery = useQuery({queryKey: ['payment-my-vouchers'], queryFn: getMyVouchers});

  useEffect(() => {
    AsyncStorage.getItem(AUTH_USER_KEY)
      .then(value => {
        if (!value) {
          return;
        }
        const user = JSON.parse(value);
        setRecipient({
          fullName: String(user.fullName || '').trim(),
          email: String(user.email || '').trim(),
          phone: String(user.phone || '').trim(),
        });
      })
      .catch(() => undefined);
  }, []);

  const recipientName = recipient.fullName || 'Người dùng FilmGo';
  const recipientContact = [
    recipient.phone || 'Chưa có SĐT',
    recipient.email || 'Chưa có email',
  ].join(' - ');

  const openEditRecipient = () => {
    setEditFullName(recipient.fullName);
    setEditPhone(recipient.phone);
    setEditVisible(true);
  };

  const saveRecipient = async () => {
    const fullName = editFullName.trim();
    const phone = editPhone.trim().replace(/\s+/g, '');

    if (!fullName) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập họ tên người nhận.');
      return;
    }

    if (phone && !/^(0|\+84)\d{8,10}$/.test(phone)) {
      Alert.alert('SĐT không hợp lệ', 'Vui lòng nhập số điện thoại Việt Nam hợp lệ.');
      return;
    }

    const next = {...recipient, fullName, phone};
    setRecipient(next);
    setEditVisible(false);

    try {
      const raw = await AsyncStorage.getItem(AUTH_USER_KEY);
      if (!raw) {
        return;
      }
      const user = JSON.parse(raw);
      await AsyncStorage.setItem(
        AUTH_USER_KEY,
        JSON.stringify({...user, fullName, phone}),
      );
    } catch {
      // Chỉ cập nhật UI đặt vé nếu lưu local thất bại
    }
  };

  const productList: ComboProduct[] = Array.isArray(productsQuery.data)
    ? productsQuery.data
    : Array.isArray((productsQuery.data as any)?.data)
      ? (productsQuery.data as any).data
      : [];
  const products = productList.filter(
    item => item?.isActive && !String(item?.image || '').includes('example.com'),
  );
  const selectedCombos: SelectedCombo[] = products
    .map(item => ({...item, quantity: comboQuantities[String(item._id)] || 0}))
    .filter(item => item.quantity > 0);
  const comboTotal = selectedCombos.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );
  const subtotal = totalPrice + comboTotal;
  const voucherDiscount = selectedVoucher
    ? Math.min(
        subtotal,
        selectedVoucher.discountType === 'percent'
          ? Math.min(Math.round(subtotal * selectedVoucher.discountValue / 100), selectedVoucher.maxDiscount ?? Number.MAX_SAFE_INTEGER)
          : selectedVoucher.discountValue,
      )
    : 0;
  const orderTotal = subtotal - voucherDiscount;
  const voucherList = Array.isArray(vouchersQuery.data)
    ? vouchersQuery.data
    : Array.isArray((vouchersQuery.data as any)?.data)
      ? (vouchersQuery.data as any).data
      : [];
  const myVouchers = (voucherList as FilmGoVoucher[]).filter(
    item => item.walletStatus === 'available',
  );
  const genre = movie.genre ?? '2D Phụ đề';
  const roomName = showtime?.roomName ?? 'Phòng chiếu 07';
  const startTime = formatBookingTime(showtime?.startTime);
  const bookingDate = formatBookingDate(showtime?.startTime);

  useEffect(() => {
    if (selectedVoucher && subtotal < Number(selectedVoucher.minOrderValue || 0)) {
      setSelectedVoucher(null);
    }
  }, [selectedVoucher, subtotal]);

  const changeComboQuantity = (product: any, delta: number) => {
    const id = String(product._id);
    setComboQuantities(current => {
      const next = Math.max(0, Math.min(10, Number(product.stock) || 0, (current[id] || 0) + delta));
      return {...current, [id]: next};
    });
  };

  useEffect(() => {
    if (!paymentId) return;
    let stopped = false;
    const check = async () => {
      try {
        const response = await getPaymentStatus(paymentId) as any;
        const payment = response?.data ?? response;
        if (stopped || !payment) return;
        if (payment.status === 'da_thanh_toan') {
          stopped = true;
          setShowPaymentScreen(false);
          setPaymentId(null);
          setShowPaymentScreen(false);
          Alert.alert(
            '🎉 Thanh toán thành công!',
            `Vé phim "${movie.title}" đã được phát hành.`,
            [{text: 'Xong', onPress: onClose}],
          );
        } else if (['that_bai', 'het_han', 'da_huy'].includes(payment.status)) {
          stopped = true;
          setPaymentId(null);
          setIsProcessing(false);
          Alert.alert('Thanh toán chưa thành công', 'Giao dịch đã thất bại, hết hạn hoặc bị hủy. Ghế đã được mở lại.');
        }
      } catch {
        // Giữ polling: mạng có thể tạm ngắt khi người dùng ở trang VNPAY.
      }
    };
    check();
    const timer = setInterval(check, 3000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [movie.title, onClose, paymentId]);

  const runMockResult = async (
    id: string,
    action: 'success' | 'failed' | 'cancelled',
    bankCode?: string,
  ) => {
    setIsProcessing(true);
    try {
      if (action === 'success') await completeMockPayment(id, bankCode);
      if (action === 'failed') await failMockPayment(id);
      if (action === 'cancelled') await cancelPayment(id);
    } catch (error) {
      setPaymentId(null);
      setIsProcessing(false);
      Alert.alert(
        'Không thể cập nhật thanh toán',
        (error as Error)?.message || 'Vui lòng kiểm tra kết nối và thử lại.',
      );
    }
  };

  const handleContinuePayment = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const response = await createMockPayment({
        showtimeId: showtime?.id,
        movieTitle: movie.title,
        movieDuration: movie.duration,
        movieGenre: movie.genre,
        seats: seats,
        holdToken,
        totalPrice: totalPrice,
        combos: selectedCombos.map(item => ({
          productId: item._id,
          quantity: item.quantity,
        })),
        voucherCode: selectedVoucher?.code,
        cinema: 'FilmGo Hà Trung (Thanh Hóa)',
        bookingDate: new Date().toLocaleDateString('vi-VN'),
        bookingTime: startTime,
      }) as any;
      const payment = response?.data ?? response;
      if (!payment?.paymentId) {
        throw new Error('Backend không tạo được giao dịch mô phỏng');
      }
      setPaymentId(payment.paymentId);
      setPaymentInfo({
        amount: Number(payment.amount || orderTotal),
        expiresAt: String(payment.expiresAt),
      });
      setShowPaymentScreen(true);
      setIsProcessing(false);
    } catch (e) {
      console.log('❌ Lỗi lưu vé:', e);
      Alert.alert('Không thể đặt ghế', (e as Error)?.message || 'Đặt vé thất bại, vui lòng thử lại.');
      setIsProcessing(false);
    }
  };

  const handlePaymentBack = async () => {
    const id = paymentId;
    setPaymentId(null);
    setShowPaymentScreen(false);
    setPaymentInfo(null);
    setIsProcessing(false);
    if (id) {
      try {
        await cancelPayment(id);
      } catch (error) {
        Alert.alert('Không thể hủy giao dịch', (error as Error)?.message || 'Vui lòng thử lại.');
      }
    }
  };

  const handleBankConfirm = (bankCode: string) => {
    if (!paymentId) return;
    Alert.alert(
      'Kiểm thử kết quả thanh toán',
      'Chọn kết quả ngân hàng trả về. Khi chọn thành công, vé và ghế sẽ được lưu thật vào MongoDB.',
      [
        {text: 'Thất bại', style: 'destructive', onPress: () => runMockResult(paymentId, 'failed', bankCode)},
        {text: 'Hủy', style: 'cancel', onPress: () => runMockResult(paymentId, 'cancelled', bankCode)},
        {text: 'Thành công', onPress: () => runMockResult(paymentId, 'success', bankCode)},
      ],
      {cancelable: false},
    );
  };

  if (showPaymentScreen && paymentInfo) {
    return (
      <MockPaymentScreen
        movieTitle={movie.title}
        showtime={`${bookingDate} - ${startTime}`}
        cinema="FilmGo Hà Trung (Thanh Hóa)"
        room={roomName}
        seats={seats}
        ticketTotal={totalPrice}
        combos={selectedCombos}
        totalAmount={paymentInfo.amount}
        voucherCode={selectedVoucher?.code}
        voucherDiscount={voucherDiscount}
        expiresAt={paymentInfo.expiresAt}
        isProcessing={isProcessing}
        customerName={recipientName}
        customerPhone={recipient.phone || 'Chưa có SĐT'}
        customerEmail={recipient.email || 'Chưa có email'}
        onBack={handlePaymentBack}
        onConfirm={handleBankConfirm}
      />
    );
  }

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

        <View style={styles.comboHeaderRow}>
          <View>
            <Text style={styles.sectionLabel}>🍿 Chọn combo bắp nước</Text>
            <Text style={styles.comboOptional}>Không bắt buộc · Có thể bỏ qua</Text>
          </View>
          {comboTotal > 0 && (
            <Text style={styles.comboHeaderTotal}>+{comboTotal.toLocaleString('vi-VN')}đ</Text>
          )}
        </View>
        {productsQuery.isLoading ? (
          <Text style={styles.comboLoading}>Đang tải combo...</Text>
        ) : (
          <View style={styles.comboList}>
            {products.map(product => {
              const quantity = comboQuantities[String(product._id)] || 0;
              return (
                <View
                  key={String(product._id)}
                  style={[styles.comboCard, quantity > 0 && styles.comboCardSelected]}>
                  <Image source={{uri: product.image}} style={styles.comboImage} />
                  <View style={styles.comboInfo}>
                    <Text style={styles.comboName} numberOfLines={2}>{product.name}</Text>
                    <Text style={styles.comboDescription} numberOfLines={2}>{product.description}</Text>
                    <View style={styles.comboBottomRow}>
                      <View>
                        <Text style={styles.comboPrice}>{Number(product.price).toLocaleString('vi-VN')}đ</Text>
                        <Text style={styles.comboStock}>Còn {product.stock}</Text>
                      </View>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity
                          style={[styles.quantityButton, quantity === 0 && styles.quantityButtonDisabled]}
                          disabled={quantity === 0 || isProcessing}
                          onPress={() => changeComboQuantity(product, -1)}>
                          <Text style={styles.quantityButtonText}>−</Text>
                        </TouchableOpacity>
                        <Text style={styles.quantityValue}>{quantity}</Text>
                        <TouchableOpacity
                          style={styles.quantityButton}
                          disabled={quantity >= Math.min(10, Number(product.stock) || 0) || isProcessing}
                          onPress={() => changeComboQuantity(product, 1)}>
                          <Text style={styles.quantityButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.voucherHeaderRow}>
          <View><Text style={styles.sectionLabel}>🎟️ Chọn voucher</Text><Text style={styles.comboOptional}>Không bắt buộc · Chỉ áp dụng một voucher</Text></View>
          {selectedVoucher && <TouchableOpacity onPress={() => setSelectedVoucher(null)}><Text style={styles.removeVoucher}>Bỏ chọn</Text></TouchableOpacity>}
        </View>
        {vouchersQuery.isLoading ? <Text style={styles.comboLoading}>Đang tải voucher...</Text> : myVouchers.length === 0 ? (
          <View style={styles.noVoucherCard}><Text style={styles.noVoucherText}>Bạn chưa có voucher khả dụng. Vào tab Voucher để nhận ưu đãi.</Text></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voucherList}>
            {myVouchers.map(voucher => {
              const eligible = subtotal >= Number(voucher.minOrderValue || 0);
              const selected = selectedVoucher?._id === voucher._id;
              return <TouchableOpacity key={voucher.walletId || voucher._id} disabled={!eligible || isProcessing} style={[styles.voucherCard, selected && styles.voucherCardSelected, !eligible && styles.voucherCardDisabled]} onPress={() => setSelectedVoucher(voucher)}>
                <Text style={styles.voucherCode}>{voucher.code}</Text>
                <Text style={styles.voucherValue}>{formatVoucherValue(voucher)}</Text>
                <Text style={styles.voucherCondition}>{eligible ? `Đơn từ ${Number(voucher.minOrderValue || 0).toLocaleString('vi-VN')}đ` : `Chưa đủ đơn ${Number(voucher.minOrderValue || 0).toLocaleString('vi-VN')}đ`}</Text>
                <Text style={[styles.voucherChoose, selected && styles.voucherChooseSelected]}>{selected ? '✓ Đã chọn' : eligible ? 'Áp dụng' : 'Chưa đủ điều kiện'}</Text>
              </TouchableOpacity>;
            })}
          </ScrollView>
        )}

        {/* === THÔNG TIN NGƯỜI NHẬN === */}
        <Text style={styles.sectionLabel}>Thông tin người nhận</Text>
        <View style={styles.cardRecipient}>
          <View style={styles.recipientInfo}>
            <Text style={styles.recipientName}>{recipientName}</Text>
            <Text style={styles.recipientContact}>{recipientContact}</Text>
          </View>
          <TouchableOpacity style={styles.editBtn} onPress={openEditRecipient}>
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

        <Modal
          visible={editVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditVisible(false)}>
          <View style={styles.editModalOverlay}>
            <View style={styles.editModalCard}>
              <Text style={styles.editModalTitle}>Sửa thông tin người nhận</Text>
              <Text style={styles.editModalHint}>
                Chỉ chỉnh họ tên và SĐT để liên hệ / nhận vé. Email gắn với tài khoản nên không đổi tại đây.
              </Text>

              <Text style={styles.editFieldLabel}>Họ và tên</Text>
              <TextInput
                style={styles.editInput}
                value={editFullName}
                onChangeText={setEditFullName}
                placeholder="Nhập họ tên"
                placeholderTextColor="#aaaaaa"
                autoCapitalize="words"
              />

              <Text style={styles.editFieldLabel}>Số điện thoại</Text>
              <TextInput
                style={styles.editInput}
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="Nhập số điện thoại"
                placeholderTextColor="#aaaaaa"
                keyboardType="phone-pad"
                maxLength={12}
              />

              <Text style={styles.editFieldLabel}>Email</Text>
              <View style={styles.editEmailBox}>
                <Text style={styles.editEmailText}>
                  {recipient.email || 'Chưa có email'}
                </Text>
              </View>

              <View style={styles.editActions}>
                <TouchableOpacity
                  style={styles.editCancelBtn}
                  onPress={() => setEditVisible(false)}>
                  <Text style={styles.editCancelText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editSaveBtn}
                  onPress={() => {
                    saveRecipient().catch(() => undefined);
                  }}>
                  <Text style={styles.editSaveText}>Lưu</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Spacer for footer */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* === STICKY FOOTER === */}
      <View style={styles.footer}>
        <View style={styles.invoiceMiniRow}>
          <Text style={styles.invoiceMiniLabel}>Vé xem phim</Text>
          <Text style={styles.invoiceMiniValue}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
        </View>
        {comboTotal > 0 && (
          <View style={styles.invoiceMiniRow}>
            <Text style={styles.invoiceMiniLabel}>Combo bắp nước</Text>
            <Text style={styles.invoiceMiniValue}>{comboTotal.toLocaleString('vi-VN')}đ</Text>
          </View>
        )}
        {voucherDiscount > 0 && (
          <View style={styles.invoiceMiniRow}><Text style={styles.invoiceDiscountLabel}>Voucher {selectedVoucher?.code}</Text><Text style={styles.invoiceDiscountValue}>−{voucherDiscount.toLocaleString('vi-VN')}đ</Text></View>
        )}
        <View style={styles.footerTotal}>
          <Text style={styles.footerTamTinh}>Tổng thanh toán</Text>
          <Text style={styles.footerAmount}>{orderTotal.toLocaleString('vi-VN')}đ</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          style={[styles.footerBtn, isProcessing && styles.footerBtnDisabled]}
          onPress={handleContinuePayment}
          disabled={isProcessing}>
          <Text style={styles.footerBtnText}>
            {isProcessing ? 'Đang giữ ghế và combo...' : 'Tiếp tục thanh toán'}
          </Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  voucherHeaderRow: {marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  removeVoucher: {color: '#e51978', fontSize: 12, fontWeight: '800'},
  voucherList: {marginHorizontal: -2, marginBottom: 18},
  voucherCard: {width: 210, minHeight: 128, marginHorizontal: 2, marginRight: 10, padding: 14, borderRadius: 15, borderWidth: 1.5, borderColor: '#f2b8d7', backgroundColor: '#fff8fc'},
  voucherCardSelected: {borderColor: '#e51978', backgroundColor: '#fff0f8'},
  voucherCardDisabled: {opacity: 0.48, borderColor: '#d1d5db', backgroundColor: '#f3f4f6'},
  voucherCode: {fontSize: 16, color: '#e51978', fontWeight: '900'},
  voucherValue: {fontSize: 14, color: '#1f2937', fontWeight: '800', marginTop: 6},
  voucherCondition: {fontSize: 11, color: '#6b7280', marginTop: 5},
  voucherChoose: {fontSize: 12, color: '#e51978', fontWeight: '800', marginTop: 9},
  voucherChooseSelected: {color: '#0f9d58'},
  noVoucherCard: {padding: 15, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', marginBottom: 18},
  noVoucherText: {fontSize: 12, lineHeight: 18, color: '#7c8592'},
  invoiceDiscountLabel: {fontSize: 12, color: '#0f9d58', fontWeight: '700'},
  invoiceDiscountValue: {fontSize: 13, color: '#0f9d58', fontWeight: '900'},
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
  comboHeaderRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  comboOptional: {color: TEXT_MUTED, fontSize: 12, marginTop: -7},
  comboHeaderTotal: {color: MOMO_PINK, fontSize: 15, fontWeight: '800'},
  comboLoading: {color: TEXT_MUTED, paddingVertical: 20, textAlign: 'center'},
  comboList: {gap: 10, marginBottom: 18},
  comboCard: {
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#e6e6e8',
    borderRadius: 14, padding: 10, flexDirection: 'row',
  },
  comboCardSelected: {borderColor: MOMO_PINK, backgroundColor: '#fff8fc'},
  comboImage: {width: 82, height: 92, borderRadius: 10, backgroundColor: '#eeeeee'},
  comboInfo: {flex: 1, marginLeft: 11},
  comboName: {color: TEXT_DARK, fontSize: 14, lineHeight: 18, fontWeight: '800'},
  comboDescription: {color: TEXT_MUTED, fontSize: 11, lineHeight: 15, marginTop: 3},
  comboBottomRow: {flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 7},
  comboPrice: {color: MOMO_PINK, fontSize: 14, fontWeight: '800'},
  comboStock: {color: '#999999', fontSize: 9, marginTop: 2},
  quantityControl: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1,
    borderColor: '#ead3e0', borderRadius: 9, overflow: 'hidden',
  },
  quantityButton: {width: 32, height: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff0f8'},
  quantityButtonDisabled: {backgroundColor: '#f3f3f3'},
  quantityButtonText: {color: MOMO_PINK, fontSize: 20, lineHeight: 22, fontWeight: '700'},
  quantityValue: {width: 34, textAlign: 'center', color: TEXT_DARK, fontSize: 14, fontWeight: '700'},
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
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  editModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
  },
  editModalTitle: {
    color: TEXT_DARK,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  editModalHint: {
    color: TEXT_MUTED,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },
  editFieldLabel: {
    color: TEXT_DARK,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#e5e5ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: TEXT_DARK,
    marginBottom: 12,
  },
  editEmailBox: {
    borderWidth: 1,
    borderColor: '#ececf0',
    backgroundColor: '#f7f7f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 18,
  },
  editEmailText: {
    color: TEXT_MUTED,
    fontSize: 14,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  editCancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dddddd',
    paddingVertical: 12,
    alignItems: 'center',
  },
  editCancelText: {
    color: TEXT_DARK,
    fontWeight: '600',
  },
  editSaveBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: MOMO_PINK,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editSaveText: {
    color: '#ffffff',
    fontWeight: '700',
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
  paymentMethodCard: {
    minHeight: 76,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: MOMO_PINK,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paymentMethodTitle: {
    color: TEXT_DARK,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentMethodDescription: {
    color: TEXT_MUTED,
    fontSize: 12,
  },
  paymentRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 5,
    borderColor: MOMO_PINK,
    backgroundColor: '#ffffff',
    marginLeft: 10,
  },
  sandboxNote: {
    color: TEXT_MUTED,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
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
  invoiceMiniRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4},
  invoiceMiniLabel: {color: TEXT_MUTED, fontSize: 12},
  invoiceMiniValue: {color: '#555555', fontSize: 12, fontWeight: '600'},
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
    maxHeight: '92%',
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
  confirmComboBox: {backgroundColor: '#fff5fa', borderRadius: 12, padding: 12, marginBottom: 14},
  confirmComboTitle: {color: TEXT_DARK, fontSize: 14, fontWeight: '800', marginBottom: 8},
  confirmComboRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5},
  confirmComboName: {flex: 1, color: '#555555', fontSize: 12, marginRight: 8},
  confirmComboPrice: {color: TEXT_DARK, fontSize: 12, fontWeight: '700'},
  confirmComboTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1,
    borderTopColor: '#efd8e5', paddingTop: 8, marginTop: 4,
  },
  confirmComboTotalLabel: {color: TEXT_DARK, fontSize: 13, fontWeight: '700'},
  confirmComboTotalValue: {color: MOMO_PINK, fontSize: 14, fontWeight: '800'},
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
  footerSpacer: {
    height: 145,
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

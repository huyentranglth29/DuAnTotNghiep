import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type ComboLine = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
};

type Props = {
  movieTitle: string;
  showtime: string;
  cinema: string;
  room: string;
  seats: string[];
  ticketTotal: number;
  combos: ComboLine[];
  totalAmount: number;
  voucherCode?: string;
  voucherDiscount?: number;
  expiresAt: string;
  isProcessing: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onBack: () => void;
  onConfirm: (bankCode: string) => void;
};

const BANKS = [
  {code: 'MBBANK_MO_PHONG', short: 'MB', name: 'MB Bank', color: '#0754a5'},
  {code: 'VCB_MO_PHONG', short: 'VCB', name: 'Vietcombank', color: '#007b5b'},
  {code: 'NCB_MO_PHONG', short: 'NCB', name: 'NCB', color: '#8c1d82'},
];

const money = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function MockPaymentScreen(props: Props) {
  const [selectedBank, setSelectedBank] = useState(BANKS[0].code);
  const [showInvoice, setShowInvoice] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const comboTotal = useMemo(
    () => props.combos.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
    [props.combos],
  );

  useEffect(() => {
    const update = () => {
      const seconds = Math.max(0, Math.ceil((new Date(props.expiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(seconds);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [props.expiresAt]);

  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={props.onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Thanh toán an toàn</Text>
          <Text style={styles.headerSubtitle}>Môi trường kiểm thử FilmGo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>⏳ Ghế và combo được giữ trong</Text>
          <Text style={styles.timerValue}>{countdown}</Text>
        </View>

        <View style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>🎬 Mua vé xem phim</Text>
            <TouchableOpacity style={styles.detailButton} onPress={() => setShowInvoice(true)}>
              <Text style={styles.detailButtonText}>Chi tiết  ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dashedLine} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Phim</Text>
            <Text style={styles.summaryAccent} numberOfLines={1}>{props.movieTitle}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Suất chiếu</Text>
            <Text style={styles.summaryAccent}>{props.showtime}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính</Text>
            <Text style={styles.summaryValue}>{money(props.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.promoCard}>
          <Text style={styles.promoIcon}>🎟️</Text>
          <Text style={styles.promoTitle}>Ưu đãi</Text>
          <Text style={[styles.promoHint, props.voucherCode && styles.promoApplied]}>
            {props.voucherCode ? `${props.voucherCode}  −${money(props.voucherDiscount || 0)}` : 'Chưa áp dụng mã'}
          </Text>
        </View>

        <View style={styles.bankCard}>
          <Text style={styles.bankSectionTitle}>Trả ngay</Text>
          <Text style={styles.bankSectionHint}>Chọn ngân hàng để kiểm thử thanh toán</Text>
          {BANKS.map(bank => {
            const selected = bank.code === selectedBank;
            return (
              <TouchableOpacity
                key={bank.code}
                activeOpacity={0.8}
                style={[styles.bankRow, selected && styles.bankRowSelected]}
                onPress={() => setSelectedBank(bank.code)}>
                <View style={[styles.bankLogo, {backgroundColor: bank.color}]}>
                  <Text style={styles.bankLogoText}>{bank.short}</Text>
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankName}>{bank.name}</Text>
                  <Text style={styles.bankMock}>Thanh toán mô phỏng · Không trừ tiền thật</Text>
                </View>
                <View style={[styles.radio, selected && styles.radioSelected]}>
                  {selected && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            );
          })}

          <View style={styles.futureMethod}>
            <Text style={styles.futureLogo}>VNPAY</Text>
            <View style={styles.bankInfo}>
              <Text style={styles.futureName}>VNPAY Sandbox</Text>
              <Text style={styles.futureHint}>Giữ sẵn khung · Chưa cấu hình tài khoản</Text>
            </View>
            <Text style={styles.comingSoon}>SAU</Text>
          </View>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTotalRow}>
          <Text style={styles.footerLabel}>Tổng tiền</Text>
          <Text style={styles.footerTotal}>{money(props.totalAmount)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.confirmButton, (props.isProcessing || remainingSeconds === 0) && styles.disabledButton]}
          disabled={props.isProcessing || remainingSeconds === 0}
          onPress={() => props.onConfirm(selectedBank)}>
          <Text style={styles.confirmButtonText}>
            {props.isProcessing ? 'Đang xử lý...' : '🔒 Xác nhận thanh toán thử'}
          </Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={showInvoice} animationType="slide" onRequestClose={() => setShowInvoice(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>Chi tiết hóa đơn</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.closeIconButton}
                onPress={() => setShowInvoice(false)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.invoiceBox}>
                <InvoiceRow label="Phim" value={props.movieTitle} accent />
                <InvoiceRow label="Suất chiếu" value={props.showtime} accent />
                <InvoiceRow label="Rạp" value={props.cinema} accent />
                <InvoiceRow label="Phòng chiếu" value={props.room} />
                <InvoiceRow label="Ghế" value={props.seats.join(', ')} />
                <InvoiceRow label="Tiền vé" value={money(props.ticketTotal)} />
                {props.combos.map(item => (
                  <InvoiceRow
                    key={item._id}
                    label={`${item.name} × ${item.quantity}`}
                    value={money(Number(item.price) * item.quantity)}
                  />
                ))}
                {comboTotal > 0 && <InvoiceRow label="Tổng combo" value={money(comboTotal)} />}
                {!!props.voucherDiscount && <InvoiceRow label={`Voucher ${props.voucherCode}`} value={`−${money(props.voucherDiscount)}`} accent />}
                <InvoiceRow label="Người đặt" value={props.customerName || 'Người dùng FilmGo'} />
                <InvoiceRow label="Số điện thoại" value={props.customerPhone || 'Chưa có SĐT'} />
                <InvoiceRow label="Email" value={props.customerEmail || 'Chưa có email'} />
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalLabel}>Tổng thanh toán</Text>
                  <Text style={styles.invoiceTotalValue}>{money(props.totalAmount)}</Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowInvoice(false)}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function InvoiceRow({label, value, accent = false}: {label: string; value: string; accent?: boolean}) {
  return (
    <View style={styles.invoiceRow}>
      <Text style={styles.invoiceLabel}>{label}</Text>
      <Text style={[styles.invoiceValue, accent && styles.invoiceAccent]}>{value}</Text>
    </View>
  );
}

const PINK = '#ec168c';
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f7f5fb'},
  header: {height: 86, paddingTop: 20, paddingHorizontal: 18, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center'},
  backButton: {width: 40, height: 40, borderRadius: 20, backgroundColor: '#f4f4f4', alignItems: 'center', justifyContent: 'center', marginRight: 10},
  backIcon: {fontSize: 35, color: '#333', lineHeight: 37},
  headerTitle: {fontSize: 20, color: '#262626', fontWeight: '800'},
  headerSubtitle: {fontSize: 11, color: '#999', marginTop: 2},
  content: {padding: 16},
  footerSpacer: {height: 135},
  timerBox: {backgroundColor: '#fff4df', borderRadius: 12, padding: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12},
  timerText: {color: '#7d5a12', fontSize: 12},
  timerValue: {color: '#d97706', fontSize: 14, fontWeight: '900', marginLeft: 7},
  orderCard: {backgroundColor: '#fff', borderRadius: 17, padding: 16, marginBottom: 12, elevation: 2},
  cardHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  cardTitle: {fontSize: 17, fontWeight: '800', color: '#333'},
  detailButton: {paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 8},
  detailButtonText: {fontSize: 12, color: '#333', fontWeight: '700'},
  dashedLine: {borderTopWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', marginVertical: 12},
  summaryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  summaryLabel: {fontSize: 13, color: '#888'},
  summaryAccent: {maxWidth: '68%', fontSize: 13, color: '#f05a30', fontWeight: '700', textAlign: 'right'},
  summaryValue: {fontSize: 14, color: '#333', fontWeight: '700'},
  promoCard: {backgroundColor: '#fff', borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  promoIcon: {fontSize: 18, marginRight: 9},
  promoTitle: {fontSize: 15, color: '#444', fontWeight: '700', flex: 1},
  promoHint: {fontSize: 12, color: '#999'},
  promoApplied: {color: '#0f9d58', fontWeight: '800'},
  bankCard: {backgroundColor: '#fff', borderRadius: 17, padding: 14},
  bankSectionTitle: {fontSize: 17, color: '#333', fontWeight: '800'},
  bankSectionHint: {fontSize: 11, color: '#999', marginTop: 3, marginBottom: 12},
  bankRow: {borderWidth: 1, borderColor: '#e2e2e2', borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', marginBottom: 9},
  bankRowSelected: {borderWidth: 2, borderColor: PINK, backgroundColor: '#fffafd'},
  bankLogo: {width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  bankLogoText: {color: '#fff', fontSize: 11, fontWeight: '900'},
  bankInfo: {flex: 1, marginLeft: 10},
  bankName: {fontSize: 14, color: '#333', fontWeight: '700'},
  bankMock: {fontSize: 10, color: '#999', marginTop: 3},
  radio: {width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#aaa', alignItems: 'center', justifyContent: 'center'},
  radioSelected: {borderColor: PINK},
  radioDot: {width: 12, height: 12, borderRadius: 6, backgroundColor: PINK},
  futureMethod: {borderWidth: 1, borderColor: '#eee', borderRadius: 13, padding: 11, flexDirection: 'row', alignItems: 'center', opacity: 0.55},
  futureLogo: {color: '#0754a5', fontSize: 11, fontWeight: '900', width: 50},
  futureName: {color: '#555', fontSize: 13, fontWeight: '700'},
  futureHint: {color: '#999', fontSize: 10, marginTop: 3},
  comingSoon: {color: '#777', fontSize: 9, fontWeight: '800'},
  footer: {position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, elevation: 12},
  footerTotalRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  footerLabel: {fontSize: 14, color: '#666'},
  footerTotal: {fontSize: 25, color: '#222', fontWeight: '900'},
  confirmButton: {height: 54, borderRadius: 12, backgroundColor: PINK, alignItems: 'center', justifyContent: 'center'},
  disabledButton: {backgroundColor: '#e9a6cd'},
  confirmButtonText: {color: '#fff', fontSize: 16, fontWeight: '800'},
  modalOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.52)', justifyContent: 'flex-end'},
  invoiceSheet: {maxHeight: '86%', backgroundColor: '#f8f7fb', borderTopLeftRadius: 23, borderTopRightRadius: 23, paddingTop: 9},
  sheetHandle: {width: 45, height: 5, borderRadius: 3, backgroundColor: '#d4d4d4', alignSelf: 'center'},
  invoiceHeader: {position: 'relative', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 17, paddingHorizontal: 58, borderBottomWidth: 1, borderBottomColor: '#eee'},
  invoiceTitle: {fontSize: 20, color: '#333', fontWeight: '900'},
  closeIconButton: {position: 'absolute', right: 14, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eeeeee'},
  closeText: {color: '#333', fontSize: 18, lineHeight: 22, fontWeight: '800'},
  invoiceBox: {backgroundColor: '#fff', borderRadius: 14, margin: 14, paddingHorizontal: 14},
  invoiceRow: {minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f0f0f0'},
  invoiceLabel: {flex: 1, color: '#888', fontSize: 12, marginRight: 10},
  invoiceValue: {maxWidth: '60%', color: '#333', fontSize: 12, fontWeight: '700', textAlign: 'right'},
  invoiceAccent: {color: '#f05a30'},
  invoiceTotalRow: {minHeight: 55, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  invoiceTotalLabel: {fontSize: 14, color: '#333', fontWeight: '800'},
  invoiceTotalValue: {fontSize: 18, color: PINK, fontWeight: '900'},
  closeButton: {height: 52, marginHorizontal: 14, marginBottom: 20, backgroundColor: PINK, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  closeButtonText: {color: '#fff', fontSize: 16, fontWeight: '800'},
});

export default MockPaymentScreen;

import React, {useEffect, useMemo, useState} from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';

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
  qrCode: string;
  orderCode?: string;
  isProcessing: boolean;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  onBack: () => void;
};

const money = (value: number) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

function PayosPaymentScreen(props: Props) {
  const [showInvoice, setShowInvoice] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const comboTotal = useMemo(
    () =>
      props.combos.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0,
      ),
    [props.combos],
  );

  useEffect(() => {
    const update = () => {
      const seconds = Math.max(
        0,
        Math.ceil((new Date(props.expiresAt).getTime() - Date.now()) / 1000),
      );
      setRemainingSeconds(seconds);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [props.expiresAt]);

  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(
    2,
    '0',
  )}:${String(remainingSeconds % 60).padStart(2, '0')}`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={props.onBack}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <Text style={styles.headerSubtitle}>Quét QR để chuyển khoản</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.timerBox}>
          <Text style={styles.timerText}>Ghế và combo được giữ trong</Text>
          <Text style={styles.timerValue}>{countdown}</Text>
        </View>

        <View style={styles.qrCard}>
          <Text style={styles.qrTitle}>Quét mã bằng app ngân hàng</Text>
          <View style={styles.qrWrap}>
            <QRCode value={props.qrCode} size={228} />
          </View>
          <Text style={styles.amount}>{money(props.totalAmount)}</Text>
          <Text style={styles.orderCode}>
            Mã đơn: {props.orderCode || 'Đang cập nhật'}
          </Text>
          <Text style={styles.qrHint}>
            Sau khi chuyển khoản thành công, FilmGo sẽ tự xác nhận và phát hành
            vé. Bạn không cần bấm thêm gì.
          </Text>
        </View>

        <View style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Mua vé xem phim</Text>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => setShowInvoice(true)}>
              <Text style={styles.detailButtonText}>Chi tiết ›</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dashedLine} />
          <SummaryRow label="Phim" value={props.movieTitle} accent />
          <SummaryRow label="Suất chiếu" value={props.showtime} accent />
          <SummaryRow label="Rạp" value={props.cinema} />
          <SummaryRow label="Ghế" value={props.seats.join(', ')} />
        </View>

        <View style={styles.promoCard}>
          <Text style={styles.promoTitle}>Ưu đãi</Text>
          <Text style={[styles.promoHint, props.voucherCode && styles.promoApplied]}>
            {props.voucherCode
              ? `${props.voucherCode} -${money(props.voucherDiscount || 0)}`
              : 'Chưa áp dụng mã'}
          </Text>
        </View>

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerHint}>
          {props.isProcessing
            ? 'Đang kiểm tra thanh toán...'
            : remainingSeconds === 0
              ? 'Giao dịch đã hết thời gian giữ ghế'
              : 'Đang chờ thanh toán'}
        </Text>
        <Text style={styles.footerTotal}>{money(props.totalAmount)}</Text>
      </View>

      <Modal
        transparent
        visible={showInvoice}
        animationType="slide"
        onRequestClose={() => setShowInvoice(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.invoiceSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.invoiceHeader}>
              <Text style={styles.invoiceTitle}>Chi tiết hóa đơn</Text>
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.closeIconButton}
                onPress={() => setShowInvoice(false)}>
                <Text style={styles.closeText}>x</Text>
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
                    label={`${item.name} x ${item.quantity}`}
                    value={money(Number(item.price) * item.quantity)}
                  />
                ))}
                {comboTotal > 0 && (
                  <InvoiceRow label="Tổng combo" value={money(comboTotal)} />
                )}
                {!!props.voucherDiscount && (
                  <InvoiceRow
                    label={`Voucher ${props.voucherCode}`}
                    value={`-${money(props.voucherDiscount)}`}
                    accent
                  />
                )}
                <InvoiceRow
                  label="Người đặt"
                  value={props.customerName || 'Người dùng FilmGo'}
                />
                <InvoiceRow
                  label="Số điện thoại"
                  value={props.customerPhone || 'Chưa có SĐT'}
                />
                <InvoiceRow
                  label="Email"
                  value={props.customerEmail || 'Chưa có email'}
                />
                <View style={styles.invoiceTotalRow}>
                  <Text style={styles.invoiceTotalLabel}>Tổng thanh toán</Text>
                  <Text style={styles.invoiceTotalValue}>
                    {money(props.totalAmount)}
                  </Text>
                </View>
              </View>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowInvoice(false)}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.summaryAccent]}>
        {value}
      </Text>
    </View>
  );
}

function InvoiceRow({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.invoiceRow}>
      <Text style={styles.invoiceLabel}>{label}</Text>
      <Text style={[styles.invoiceValue, accent && styles.invoiceAccent]}>
        {value}
      </Text>
    </View>
  );
}

const PINK = '#ec168c';

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f7f5fb'},
  header: {
    height: 86,
    paddingTop: 20,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backIcon: {fontSize: 35, color: '#333', lineHeight: 37},
  headerTitle: {fontSize: 20, color: '#262626', fontWeight: '800'},
  headerSubtitle: {fontSize: 11, color: '#999', marginTop: 2},
  content: {padding: 16},
  timerBox: {
    backgroundColor: '#fff4df',
    borderRadius: 12,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timerText: {color: '#7d5a12', fontSize: 12},
  timerValue: {color: '#d97706', fontSize: 14, fontWeight: '900', marginLeft: 7},
  qrCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 12,
    elevation: 2,
  },
  qrTitle: {fontSize: 17, color: '#333', fontWeight: '900'},
  qrWrap: {
    marginTop: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ececec',
  },
  amount: {fontSize: 26, color: PINK, fontWeight: '900', marginTop: 15},
  orderCode: {fontSize: 12, color: '#555', fontWeight: '700', marginTop: 4},
  qrHint: {
    color: '#777',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
  },
  orderCard: {backgroundColor: '#fff', borderRadius: 17, padding: 16, marginBottom: 12},
  cardHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  cardTitle: {fontSize: 17, fontWeight: '800', color: '#333'},
  detailButton: {paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#ddd', borderRadius: 8},
  detailButtonText: {fontSize: 12, color: '#333', fontWeight: '700'},
  dashedLine: {borderTopWidth: 1, borderColor: '#ddd', borderStyle: 'dashed', marginVertical: 12},
  summaryRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10},
  summaryLabel: {fontSize: 13, color: '#888'},
  summaryValue: {maxWidth: '64%', fontSize: 13, color: '#333', fontWeight: '700', textAlign: 'right'},
  summaryAccent: {color: '#f05a30'},
  promoCard: {backgroundColor: '#fff', borderRadius: 14, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  promoTitle: {fontSize: 15, color: '#444', fontWeight: '700', flex: 1},
  promoHint: {fontSize: 12, color: '#999'},
  promoApplied: {color: '#0f9d58', fontWeight: '800'},
  footerSpacer: {height: 90},
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    elevation: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerHint: {color: '#666', fontSize: 13, fontWeight: '700'},
  footerTotal: {fontSize: 22, color: '#222', fontWeight: '900'},
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

export default PayosPaymentScreen;

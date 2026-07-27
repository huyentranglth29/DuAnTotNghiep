import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  VOUCHER_BLUE,
  VOUCHER_SCREEN_BG,
  VOUCHER_TEXT,
} from '../constants';
import VoucherHeader from '../components/VoucherHeader';

type VoucherGuideScreenProps = {
  onBack: () => void;
};

const STEPS = [
  {
    title: '1. Đăng nhập tài khoản',
    body: 'Bạn cần đăng nhập để nhận voucher vào kho và dùng khi thanh toán. Chưa đăng nhập chỉ xem được voucher đang mở.',
  },
  {
    title: '2. Nhận hoặc thêm voucher',
    body: 'Trong “Voucher của tôi”, bấm Nhận ngay với voucher mới, hoặc bấm dấu + để nhập mã voucher (nếu có mã từ FilmGo).',
  },
  {
    title: '3. Áp dụng khi đặt vé',
    body: 'Chọn phim → suất → ghế → vào màn thanh toán. Chọn voucher trong danh sách để trừ tiền đơn hàng.',
  },
  {
    title: '4. Kiểm tra điều kiện',
    body: 'Mỗi voucher có thể yêu cầu đơn tối thiểu, giảm cố định hoặc %, số lượt còn lại và hạn dùng. Không đủ điều kiện sẽ không chọn được.',
  },
  {
    title: '5. Xem lịch sử',
    body: 'Bấm icon lịch sử trên đầu trang để xem voucher còn hiệu lực, đã dùng hoặc hết hạn.',
  },
];

const NOTES = [
  'Mỗi đơn thường chỉ áp dụng 1 voucher.',
  'Voucher đã dùng không dùng lại được (trừ khi hệ thống hoàn đơn/trả lại).',
  'Ưu đãi chỉ áp dụng cho đơn đã thanh toán thành công.',
];

function VoucherGuideScreen({onBack}: VoucherGuideScreenProps) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={VOUCHER_BLUE} />
      <VoucherHeader title="HƯỚNG DẪN VOUCHER" onBack={onBack} />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Cách dùng voucher FilmGo</Text>
          <Text style={styles.heroText}>
            Làm theo các bước dưới đây để nhận ưu đãi và giảm giá khi mua vé.
          </Text>
        </View>

        {STEPS.map(step => (
          <View key={step.title} style={styles.card}>
            <Text style={styles.cardTitle}>{step.title}</Text>
            <Text style={styles.cardBody}>{step.body}</Text>
          </View>
        ))}

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>Lưu ý</Text>
          {NOTES.map(note => (
            <Text key={note} style={styles.noteItem}>
              • {note}
            </Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VOUCHER_SCREEN_BG,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  hero: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#e8f4ff',
  },
  heroTitle: {
    color: VOUCHER_BLUE,
    fontSize: 20,
    fontWeight: '900',
  },
  heroText: {
    marginTop: 8,
    color: VOUCHER_TEXT,
    fontSize: 14,
    lineHeight: 21,
  },
  card: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cardTitle: {
    color: VOUCHER_TEXT,
    fontSize: 16,
    fontWeight: '800',
  },
  cardBody: {
    marginTop: 8,
    color: '#4b5563',
    fontSize: 14,
    lineHeight: 21,
  },
  noteCard: {
    marginTop: 6,
    padding: 15,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  noteTitle: {
    color: '#9a3412',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 8,
  },
  noteItem: {
    color: '#9a3412',
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default VoucherGuideScreen;

import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BLUE = '#005f98';
const TITLE = '#263847';

type RecruitmentScreenProps = {
  onBack: () => void;
};

function RecruitmentScreen({ onBack }: RecruitmentScreenProps) {
  const [isDetail, setIsDetail] = useState(false);

  if (isDetail) {
    return <RecruitmentDetailScreen onBack={() => setIsDetail(false)} />;
  }

  return (
    <View style={styles.screen}>
      <Header title="TUYỂN DỤNG" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.listContent}>
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.recruitmentCard}
          onPress={() => setIsDetail(true)}
        >
          <Text style={styles.cardTitle}>THÔNG TIN TUYỂN DỤNG</Text>
          <Text style={styles.dateText}>Ngày đăng: 05/04/2023</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function RecruitmentDetailScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <Header title="CHI TIẾT TUYỂN DỤNG" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailContent}>
        <Text style={styles.detailTitle}>THÔNG TIN TUYỂN DỤNG</Text>
        <Text style={styles.detailDate}>Ngày đăng: 05/04/2023</Text>

        <View style={styles.article}>
          <Text style={styles.articleHeading}>GIA NHẬP CÙNG GIA ĐÌNH BETA MEDIA</Text>
          <Text style={styles.articleText}>
            Công ty cổ phần Beta Media trực thuộc Beta Group kinh doanh trong nhiều lĩnh
            vực giải trí. FilmGo là một trong top 5 cụm rạp chiếu phim có tốc độ
            tăng trưởng nhanh nhất tại Việt Nam.
          </Text>
          <Text style={styles.articleText}>
            Beta Media luôn mong muốn mang đến nhiều cơ hội việc làm với môi trường làm
            việc năng động, trẻ trung, chuyên nghiệp và yêu thích ngành công nghiệp điện
            ảnh. Beta luôn hướng đến phát triển dịch vụ giải trí hàng đầu Việt Nam.
          </Text>
          <Text style={styles.articleText}>
            Để gia nhập gia đình Beta và cháy trọn tuổi trẻ, bạn có thể tham khảo một số
            cách dưới đây nhé:
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
        <Svg width={28} height={28} viewBox="0 0 28 28" fill="none">
          <Path
            d="M17.5 5.5L9 14l8.5 8.5"
            stroke="#ffffff"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 64,
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: BLUE,
  },
  backButton: {
    width: 58,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '900',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 36,
    paddingBottom: 28,
  },
  recruitmentCard: {
    minHeight: 166,
    borderRadius: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 24,
    paddingTop: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e0e0e0',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardTitle: {
    color: TITLE,
    fontSize: 25,
    lineHeight: 32,
    fontWeight: '900',
  },
  dateText: {
    color: '#929292',
    fontSize: 22,
    lineHeight: 29,
    marginTop: 10,
  },
  detailContent: {
    paddingTop: 14,
    paddingBottom: 36,
  },
  detailTitle: {
    color: TITLE,
    fontSize: 27,
    lineHeight: 35,
    fontWeight: '900',
  },
  detailDate: {
    color: '#929292',
    fontSize: 21,
    lineHeight: 28,
    marginTop: 8,
  },
  article: {
    paddingHorizontal: 16,
    paddingTop: 380,
  },
  articleHeading: {
    color: '#252525',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 28,
  },
  articleText: {
    color: '#555555',
    fontSize: 22,
    lineHeight: 34,
    textAlign: 'center',
    marginBottom: 28,
  },
});

export default RecruitmentScreen;

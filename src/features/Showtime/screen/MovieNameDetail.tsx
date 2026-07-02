import React from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';
import {MovieBookingInfo} from '../components/MovieName';

const BLUE = '#005f98';

type MovieNameDetailProps = {
  movie: MovieBookingInfo;
  onBack: () => void;
};

const promotions = [
  {
    title: 'ĐÓN SIÊU HÈ - SIÊU DEAL SỐC',
    color: '#8ddbf1',
  },
  {
    title: 'QUỶ VÀNG ĐỔ BỘ - GIÁ NHÍ HỜI TO',
    color: '#51311f',
  },
  {
    title: 'BẮT MOOD DELULU - TỚI FILMGO VI VU',
    color: '#bde874',
  },
  {
    title: 'SĨ TỬ BUNG LỤA - LỰA ƯU ĐÃI TO',
    color: '#f8d87a',
  },
];

function MovieNameDetail({movie, onBack}: MovieNameDetailProps) {
  const duration = movie.duration ?? '109 phút';
  const genre = movie.genre ?? 'Giật gân, Kinh dị';

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <ImageBackground source={movie.poster} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.darkOverlay} />
          <View style={styles.topBar}>
            <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
              <Svg width={31} height={31} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M15 5L8 12l7 7"
                  stroke="#ffffff"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.topTitle}>Chi tiết phim</Text>
          </View>

          <View style={styles.playButton}>
            <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
              <Circle cx={32} cy={32} r={30} fill="rgba(255,255,255,0.72)" />
              <Path
                d="M26 20v24l20-12z"
                stroke={BLUE}
                strokeWidth={3}
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </ImageBackground>

        <View style={styles.infoBlock}>
          <Image source={movie.poster} style={styles.poster} />
          <View style={styles.titleBlock}>
            <Text numberOfLines={1} style={styles.movieTitle}>
              {movie.title}
            </Text>
            <View style={styles.agePill}>
              <Text style={styles.agePillText}>Chỉ dành cho người trên 18 tuổi</Text>
            </View>
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <Text style={styles.detailLabel}>ĐẠO DIỄN</Text>
          <Text style={styles.detailValue}>Curry Barker</Text>
          <Text style={styles.detailLabel}>DIỄN VIÊN</Text>
          <Text style={styles.detailValue}>
            Michael Johnston, Inde Navarrette, Cooper Tomlinson, Megan Lawless,
            Andy Richter
          </Text>
          <Text style={styles.detailLabel}>THỂ LOẠI</Text>
          <Text style={styles.detailValue}>{genre}</Text>
          <Text style={styles.detailLabel}>THỜI LƯỢNG</Text>
          <Text style={styles.detailValue}>{duration}</Text>
          <Text style={styles.detailLabel}>NGÔN NGỮ</Text>
          <Text style={styles.detailValue}>Tiếng Anh</Text>
          <Text style={styles.detailLabel}>NGÀY KHỞI CHIẾU</Text>
          <Text style={styles.detailValue}>19/06/2026</Text>
        </View>

        <Text style={styles.description}>
          Bear, một chàng trai si tình, đã bẻ gãy món đồ chơi bí ẩn mang tên
          "Liễu Ước Nguyện" để đổi lấy tình yêu của cô gái mình thầm thương.
          Điều ước nhanh chóng trở thành hiện thực, nhưng hạnh phúc mà anh hằng
          mong đợi lại dần biến thành cơn ác mộng. Bear dần nhận ra một sự thật
          rùng rợn: cái giá phải trả cho món quà kỳ diệu đó kinh hoàng và đen
          tối hơn bất cứ điều gì anh có thể tưởng tượng.
        </Text>

        <View style={styles.promotionHeader}>
          <Text style={styles.sectionTitle}>KHUYẾN MÃI</Text>
          <TouchableOpacity activeOpacity={0.75} style={styles.allButton}>
            <Text style={styles.allButtonText}>Tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promotionList}>
          {promotions.map(promo => (
            <View key={promo.title} style={styles.promotionCard}>
              <View style={[styles.promotionThumb, {backgroundColor: promo.color}]}>
                <Text style={styles.promotionThumbText}>FilmGo</Text>
              </View>
              <Text style={styles.promotionTitle}>{promo.title}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity activeOpacity={0.8} style={styles.shareButton}>
        <Svg width={25} height={25} viewBox="0 0 24 24" fill="none">
          <Circle cx={18} cy={5} r={3} fill="#ffffff" />
          <Circle cx={6} cy={12} r={3} fill="#ffffff" />
          <Circle cx={18} cy={19} r={3} fill="#ffffff" />
          <Path d="M8.8 10.7l6.4-4.4M8.8 13.3l6.4 4.4" stroke="#ffffff" strokeWidth={2.2} />
        </Svg>
        <Text style={styles.shareText}>Chia sẻ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollBody: {
    paddingBottom: 82,
  },
  hero: {
    height: 300,
  },
  heroImage: {
    resizeMode: 'cover',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 42,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  topTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '500',
  },
  playButton: {
    position: 'absolute',
    left: '50%',
    top: 156,
    marginLeft: -32,
  },
  infoBlock: {
    flexDirection: 'row',
    marginTop: -68,
    paddingHorizontal: 18,
  },
  poster: {
    width: 124,
    height: 192,
    borderRadius: 5,
    backgroundColor: '#dfe3e7',
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 8,
    paddingLeft: 16,
  },
  movieTitle: {
    color: '#111111',
    fontSize: 23,
    fontWeight: '900',
  },
  agePill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#c8c8c8',
    borderRadius: 15,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  agePillText: {
    color: '#9a9a9a',
    fontSize: 12,
    fontWeight: '800',
  },
  detailsGrid: {
    columnGap: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 22,
    paddingTop: 52,
    rowGap: 8,
  },
  detailLabel: {
    color: '#111111',
    fontSize: 16,
    fontWeight: '900',
    width: '36%',
  },
  detailValue: {
    color: '#363636',
    fontSize: 16,
    lineHeight: 23,
    width: '56%',
  },
  description: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 22,
    paddingTop: 28,
  },
  promotionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingTop: 32,
  },
  sectionTitle: {
    color: '#111111',
    fontSize: 20,
    fontWeight: '900',
  },
  allButton: {
    borderWidth: 1,
    borderColor: '#e4e4e4',
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 6,
  },
  allButtonText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '600',
  },
  promotionList: {
    paddingHorizontal: 18,
    paddingTop: 16,
    gap: 10,
  },
  promotionCard: {
    minHeight: 92,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    paddingHorizontal: 12,
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  promotionThumb: {
    width: 104,
    height: 64,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  promotionThumbText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
  },
  promotionTitle: {
    color: '#111111',
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  shareButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    height: 52,
    alignItems: 'center',
    backgroundColor: BLUE,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  shareText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
});

export default MovieNameDetail;

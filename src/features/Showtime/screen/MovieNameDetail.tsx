import React, {useState, useEffect, useRef} from 'react';
import {
  Image,
  ImageBackground,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
} from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { MovieBookingInfo } from '../components/MovieName';
import CommentsList from '../components/CommentsList';
import ChonGio, {SelectedShowtimeInfo} from '../components/ChonGio';
const BLUE = '#005f98';

type MovieNameDetailProps = {
  movie: MovieBookingInfo;
  onBack: () => void;
  onWriteReview?: (movie: MovieBookingInfo) => void;
  onShowtimeSelect?: (showtime: SelectedShowtimeInfo) => void;
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

function MovieNameDetail({ movie, onBack, onWriteReview, onShowtimeSelect }: MovieNameDetailProps) {
  const duration = movie.duration ?? '109 phút';
  const genre = movie.genre ?? 'Giật gân, Kinh dị';

  const scrollViewRef = useRef<ScrollView>(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selectedShowtime, setSelectedShowtime] = useState<SelectedShowtimeInfo | null>(null);

  useEffect(() => {
    let timer: any;
    if (showTrailerModal && isPlaying) {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) return 0;
          return prev + 2;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [showTrailerModal, isPlaying]);

  const formatTime = (pct: number) => {
    const totalSec = Math.round((pct / 100) * 150); // 150 giây = 2m30s
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const handleBookTicketPress = () => {
    if (selectedShowtime) {
      if (onShowtimeSelect) {
        onShowtimeSelect(selectedShowtime);
      }
    } else {
      scrollViewRef.current?.scrollTo({
        y: 400,
        animated: true,
      });
      Alert.alert('Thông báo', 'Vui lòng chọn khung giờ chiếu hôm nay ở bên dưới!');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
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

          <TouchableOpacity
            style={styles.playButton}
            activeOpacity={0.8}
            onPress={() => {
              setProgress(0);
              setIsPlaying(true);
              setShowTrailerModal(true);
            }}
          >
            <Svg width={64} height={64} viewBox="0 0 64 64" fill="none">
              <Circle cx={32} cy={32} r={30} fill="rgba(255,255,255,0.72)" />
              <Path
                d="M26 20v24l20-12z"
                stroke={BLUE}
                strokeWidth={3}
                strokeLinejoin="round"
              />
            </Svg>
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.infoBlock}>
          <Image source={movie.poster} style={styles.poster} />
          <View style={styles.titleBlock}>
            <Text numberOfLines={2} style={styles.movieTitle}>
              {movie.title}
            </Text>
            {movie.ageRating ? (
              <View style={styles.agePill}>
                <Text style={styles.agePillText}>{movie.ageRating}</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.detailsGrid}>
          <Text style={styles.detailLabel}>ĐẠO DIỄN</Text>
          <Text style={styles.detailValue}>{movie.director || 'Đang cập nhật'}</Text>
          <Text style={styles.detailLabel}>DIỄN VIÊN</Text>
          <Text style={styles.detailValue}>
            {movie.cast?.join(', ') || 'Đang cập nhật'}
          </Text>
          <Text style={styles.detailLabel}>THỂ LOẠI</Text>
          <Text style={styles.detailValue}>{genre}</Text>
          <Text style={styles.detailLabel}>THỜI LƯỢNG</Text>
          <Text style={styles.detailValue}>{duration}</Text>
          <Text style={styles.detailLabel}>NGÔN NGỮ</Text>
          <Text style={styles.detailValue}>Tiếng Anh</Text>
          <Text style={styles.detailLabel}>NGÀY KHỞI CHIẾU</Text>
          <Text style={styles.detailValue}>
            {movie.releaseDate
              ? new Date(movie.releaseDate).toLocaleDateString('vi-VN')
              : 'Đang cập nhật'}
          </Text>
        </View>

        <Text style={styles.description}>
          {movie.description || movie.tomTat || "Bear, một chàng trai si tình, đã bẻ gãy món đồ chơi bí ẩn mang tên \"Liễu Ước Nguyện\" để đổi lấy tình yêu của cô gái mình thầm thương. Điều ước nhanh chóng trở thành hiện thực, nhưng hạnh phúc mà anh hằng mong đợi lại dần biến thành cơn ác mộng. Bear dần nhận ra một sự thật rùng rợn: cái giá phải trả cho món quà kỳ diệu đó kinh hoàng và đen tối hơn bất cứ điều gì anh có thể tưởng tượng."}
        </Text>

        {/* Lịch chiếu lấy trực tiếp từ MongoDB qua API */}
        <View style={styles.showtimeSection}>
          <Text style={styles.sectionTitle}>📅 LỊCH CHIẾU</Text>
          <Text style={styles.showtimeSubtitle}>FilmGo Hà Trung (Thanh Hóa)</Text>
          <ChonGio
            movieId={movie.id}
            onShowtimePress={setSelectedShowtime}
          />
          {selectedShowtime ? (
            <Text style={styles.showtimeSubtitle}>
              Đã chọn: {new Date(selectedShowtime.startTime).toLocaleString('vi-VN')}
            </Text>
          ) : null}
        </View>

        <View style={styles.promotionHeader}>
          <Text style={styles.sectionTitle}>KHUYẾN MÃI</Text>
          <TouchableOpacity activeOpacity={0.75} style={styles.allButton}>
            <Text style={styles.allButtonText}>Tất cả</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promotionList}>
          {promotions.map(promo => (
            <View key={promo.title} style={styles.promotionCard}>
              <View style={[styles.promotionThumb, { backgroundColor: promo.color }]}>
                <Text style={styles.promotionThumbText}>FilmGo</Text>
              </View>
              <Text style={styles.promotionTitle}>{promo.title}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.writeReviewBtn} activeOpacity={0.85} onPress={() => onWriteReview?.(movie)}>
          <Text style={styles.writeReviewText}>Viết đánh giá</Text>
        </TouchableOpacity>

        <CommentsList />
      </ScrollView>

      {/* Modal Phát Trailer Giả Lập */}
      <Modal
        visible={showTrailerModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowTrailerModal(false)}
      >
        <View style={styles.trailerContainer}>
          <View style={styles.trailerHeader}>
            <TouchableOpacity
              style={styles.closeTrailerBtn}
              onPress={() => setShowTrailerModal(false)}
            >
              <Text style={styles.closeTrailerText}>✕ Đóng</Text>
            </TouchableOpacity>
            <Text style={styles.trailerTitleText} numberOfLines={1}>
              Trailer - {movie.title}
            </Text>
          </View>
          
          <ImageBackground
            source={movie.poster}
            style={styles.trailerVideoArea}
            imageStyle={{opacity: 0.25}}
          >
            <View style={styles.videoPlayerScreen}>
              <Image source={movie.poster} style={styles.trailerPosterSmall} />
              {isPlaying ? (
                <View style={styles.playingStatusBadge}>
                  <Text style={styles.playingStatusText}>🔴 Đang phát Trailer</Text>
                </View>
              ) : (
                <View style={styles.playingStatusBadge}>
                  <Text style={styles.playingStatusText}>⏸ Tạm dừng</Text>
                </View>
              )}
            </View>

            <View style={styles.videoControls}>
              <TouchableOpacity
                style={styles.playPauseBtn}
                onPress={() => setIsPlaying(!isPlaying)}
              >
                <Text style={styles.playPauseIcon}>{isPlaying ? '⏸' : '▶'}</Text>
              </TouchableOpacity>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarActive, {width: `${progress}%`}]} />
                </View>
                <Text style={styles.videoTimeText}>{formatTime(progress)} / 02:30</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </Modal>

      <TouchableOpacity activeOpacity={0.8} style={styles.bookTicketBtn} onPress={handleBookTicketPress}>
        <Text style={styles.bookTicketBtnText}>ĐẶT VÉ NGAY</Text>
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
    shadowOffset: { width: 0, height: 1 },
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
  writeReviewBtn: {
    backgroundColor: '#ff2d7a',
    marginHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  writeReviewText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  bookTicketBtn: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 14,
    height: 52,
    alignItems: 'center',
    backgroundColor: '#e51937',
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 5,
  },
  bookTicketBtnText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
  },
  showtimeSection: {
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  showtimeSubtitle: {
    fontSize: 13,
    color: '#666666',
    marginTop: 4,
    fontWeight: '600',
  },
  timeSlotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  timeSlotBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotBtnSelected: {
    backgroundColor: '#e51937',
    borderColor: '#e51937',
  },
  timeSlotText: {
    fontSize: 15,
    color: '#333333',
    fontWeight: 'bold',
  },
  timeSlotTextSelected: {
    color: '#ffffff',
  },
  trailerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
  },
  trailerHeader: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  closeTrailerBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#333333',
    borderRadius: 6,
    marginRight: 16,
  },
  closeTrailerText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  trailerTitleText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  trailerVideoArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  videoPlayerScreen: {
    width: '80%',
    height: '50%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  trailerPosterSmall: {
    width: '70%',
    height: '80%',
    borderRadius: 8,
    resizeMode: 'contain',
  },
  playingStatusBadge: {
    position: 'absolute',
    top: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  playingStatusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  videoControls: {
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  playPauseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e51937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  playPauseIcon: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    flex: 1,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#333333',
    borderRadius: 3,
    width: '100%',
  },
  progressBarActive: {
    height: 6,
    backgroundColor: '#e51937',
    borderRadius: 3,
  },
  videoTimeText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 6,
    fontWeight: 'bold',
  },
});

export default MovieNameDetail;

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
import {getMyReview, getNewsEvents, getReviewEligibility, getReviews} from '../../../services/apiService';
import {resolveMediaUrl} from '../../../config/api.config';
import {useAuth} from '../../../contexts/AuthContext';
import {useLanguage} from '../../../contexts/LanguageContext';
import {t} from '../../../utils/i18n';
const BLUE = '#005f98';

type MovieNameDetailProps = {
  movie: MovieBookingInfo;
  onBack: () => void;
  onWriteReview?: (movie: MovieBookingInfo) => void;
  onShowtimeSelect?: (showtime: SelectedShowtimeInfo) => void;
};

type NewsEventApi = {
  _id?: string;
  id?: string;
  title?: string;
  summary?: string;
  content?: string;
  category?: string;
  publishDate?: string;
  createdAt?: string;
  image?: string;
};

type MoviePromotion = {
  id: string;
  title: string;
  summary: string;
  content: string;
  publishedAt?: string;
  imageUrl?: string;
  color: string;
};

type MovieReview = {
  id: string;
  author: string;
  date: string;
  rating?: number;
  text: string;
  tags?: string[];
  images?: any[];
  likes?: number;
  replies?: number;
  verifiedViewer?: boolean;
};

type ReviewApi = {
  _id?: string;
  id?: string;
  user?: {
    fullName?: string;
    name?: string;
    email?: string;
  };
  rating?: number;
  comment?: string;
  text?: string;
  createdAt?: string;
  updatedAt?: string;
  status?: 'pending' | 'approved' | 'rejected';
  verifiedViewer?: boolean;
};

type ReviewEligibility = {
  canReview: boolean;
  verifiedViewer: boolean;
};

const fallbackPromotions: MoviePromotion[] = [
  {
    id: 'summer-deal',
    title: 'ĐÓN SIÊU HÈ - SIÊU DEAL SỐC',
    summary: 'Tặng combo bắp nước cho khách hàng xem phim trong dịp hè.',
    content: 'Tặng combo bắp nước cho khách hàng xem phim trong dịp hè.',
    color: '#8ddbf1',
  },
  {
    id: 'golden-army',
    title: 'QUỶ VÀNG ĐỔ BỘ - GIÁ NHÍ HỜI TO',
    summary: 'Combo nước và bắp giá tốt cho các suất chiếu gia đình.',
    content: 'Combo nước và bắp giá tốt cho các suất chiếu gia đình.',
    color: '#51311f',
  },
  {
    id: 'filmgo-vivu',
    title: 'BẮT MOOD DELULU - TỚI FILMGO VI VU',
    summary: 'Vé xem phim và combo đồng giá cho thành viên FilmGo.',
    content: 'Vé xem phim và combo đồng giá cho thành viên FilmGo.',
    color: '#bde874',
  },
  {
    id: 'student-fire',
    title: 'SĨ TỬ BUNG LỤA - LỰA ƯU ĐÃI TO',
    summary: 'Ưu đãi mùa thi dành riêng cho học sinh, sinh viên.',
    content: 'Ưu đãi mùa thi dành riêng cho học sinh, sinh viên.',
    color: '#f8d87a',
  },
];

const promoColors = fallbackPromotions.map(item => item.color);

const formatPromotionDate = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN');
};

const mapNewsEventToPromotion = (
  item: NewsEventApi,
  index: number,
): MoviePromotion => ({
  id: String(item._id || item.id || `promotion-${index}`),
  title: item.title || fallbackPromotions[index % fallbackPromotions.length].title,
  summary: item.summary || item.content || 'Ưu đãi FilmGo',
  content: item.content || item.summary || 'Thông tin khuyến mãi đang được cập nhật.',
  publishedAt: formatPromotionDate(item.publishDate || item.createdAt),
  imageUrl: resolveMediaUrl(item.image),
  color: promoColors[index % promoColors.length],
});

const formatReviewDate = (value?: string) => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN');
};

const mapApiReview = (item: ReviewApi, index: number): MovieReview => ({
  id: String(item._id || item.id || `review-${index}`),
  author: item.user?.fullName || item.user?.name || item.user?.email || 'Khách FilmGo',
  date: formatReviewDate(item.createdAt || item.updatedAt),
  rating: typeof item.rating === 'number' ? item.rating : undefined,
  verifiedViewer: Boolean(item.verifiedViewer),
  text: item.comment || item.text || 'Người dùng chưa để lại nội dung.',
  tags: [],
  images: [],
  likes: 0,
  replies: 0,
});

function MovieNameDetail({ movie, onBack, onWriteReview, onShowtimeSelect }: MovieNameDetailProps) {
  const {isAuthenticated} = useAuth();
  const {language} = useLanguage();
  const isEnglish = language === 'en';
  const ticketSaleOpen =
    !movie.ticketSaleStartAt ||
    new Date(movie.ticketSaleStartAt) <= new Date();
  const bookingLocked = movie.status === 'sap-chieu' && !ticketSaleOpen;
  const duration = movie.duration ?? (isEnglish ? '109 minutes' : '109 phút');
  const genre = movie.genre ?? (isEnglish ? 'Thriller, Horror' : 'Giật gân, Kinh dị');

  const scrollViewRef = useRef<ScrollView>(null);
  const [showTrailerModal, setShowTrailerModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [selectedShowtime, setSelectedShowtime] = useState<SelectedShowtimeInfo | null>(null);
  const [moviePromotions, setMoviePromotions] = useState<MoviePromotion[]>(fallbackPromotions);
  const [movieReviews, setMovieReviews] = useState<MovieReview[]>([]);
  const [myReview, setMyReview] = useState<ReviewApi | null>(null);
  const [reviewEligibility, setReviewEligibility] = useState<ReviewEligibility>({canReview: false, verifiedViewer: false});
  const [selectedPromotion, setSelectedPromotion] = useState<MoviePromotion | null>(null);
  const [showAllPromotions, setShowAllPromotions] = useState(false);

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

  useEffect(() => {
    let cancelled = false;

    getNewsEvents()
      .then(response => {
        if (cancelled) {
          return;
        }
        const list = Array.isArray(response) ? response : [];
        const promos = list
          .filter((item: NewsEventApi) => item.category === 'khuyen_mai')
          .slice(0, 4)
          .map(mapNewsEventToPromotion);
        setMoviePromotions(promos);
      })
      .catch(() => {
        if (!cancelled) {
          setMoviePromotions(fallbackPromotions);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!movie.id) {
      setMovieReviews([]);
      return () => {
        cancelled = true;
      };
    }

    getReviews(movie.id)
      .then(response => {
        if (cancelled) {
          return;
        }
        const list = Array.isArray(response) ? response : [];
        setMovieReviews(list.map(mapApiReview));
      })
      .catch(() => {
        if (!cancelled) {
          setMovieReviews([]);
        }
      });

    getReviewEligibility(movie.id)
      .then(response => {
        if (!cancelled) {
          const data = response?.data || response;
          setReviewEligibility({
            canReview: Boolean(data?.canReview),
            verifiedViewer: Boolean(data?.verifiedViewer),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setReviewEligibility({canReview: false, verifiedViewer: false});
        }
      });

    if (isAuthenticated) {
      getMyReview(movie.id)
        .then(response => {
          if (!cancelled) {
            setMyReview((response?.data || response) ?? null);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setMyReview(null);
          }
        });
    } else {
      setMyReview(null);
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, movie.id]);

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
      Alert.alert(t(language, 'Thông báo', 'Notice'), t(language, 'Vui lòng chọn khung giờ chiếu ở bên dưới!', 'Please select a showtime below!'));
    }
  };

  const averageRating = movieReviews.length
    ? movieReviews.reduce((total, review) => total + Number(review.rating || 0), 0) / movieReviews.length
    : 0;

  const myReviewStatus = myReview?.status === 'approved'
    ? {label: t(language, 'Đánh giá của bạn đã được duyệt', 'Your review has been approved'), tone: styles.reviewStateApproved}
    : myReview?.status === 'rejected'
      ? {label: t(language, 'Đánh giá của bạn đã bị từ chối — bạn có thể chỉnh sửa và gửi lại', 'Your review was rejected — you can edit and resubmit it'), tone: styles.reviewStateRejected}
      : myReview
        ? {label: t(language, 'Đánh giá của bạn đang chờ duyệt', 'Your review is pending approval'), tone: styles.reviewStatePending}
        : null;

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
            <Text style={styles.topTitle}>{t(language, 'Chi tiết phim', 'Movie details')}</Text>
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
          <Text style={styles.detailLabel}>{t(language, 'ĐẠO DIỄN', 'DIRECTOR')}</Text>
          <Text style={styles.detailValue}>{movie.director || (isEnglish ? 'Updating' : 'Đang cập nhật')}</Text>
          <Text style={styles.detailLabel}>{t(language, 'DIỄN VIÊN', 'CAST')}</Text>
          <Text style={styles.detailValue}>
            {movie.cast?.join(', ') || (isEnglish ? 'Updating' : 'Đang cập nhật')}
          </Text>
          <Text style={styles.detailLabel}>{t(language, 'THỂ LOẠI', 'GENRE')}</Text>
          <Text style={styles.detailValue}>{genre}</Text>
          <Text style={styles.detailLabel}>{t(language, 'THỜI LƯỢNG', 'DURATION')}</Text>
          <Text style={styles.detailValue}>{duration}</Text>
          <Text style={styles.detailLabel}>{t(language, 'NGÔN NGỮ', 'LANGUAGE')}</Text>
          <Text style={styles.detailValue}>{isEnglish ? 'English' : 'Tiếng Anh'}</Text>
          <Text style={styles.detailLabel}>
            {movie.status === 'sap-chieu'
              ? (t(language, 'DỰ KIẾN KHỞI CHIẾU', 'EXPECTED RELEASE'))
              : (t(language, 'NGÀY KHỞI CHIẾU', 'RELEASE DATE'))}
          </Text>
          <Text style={styles.detailValue}>
            {movie.releaseDate
              ? new Date(movie.releaseDate).toLocaleDateString('vi-VN')
              : (isEnglish ? 'Updating' : 'Đang cập nhật')}
          </Text>
        </View>

        <Text style={styles.description}>
          {movie.description || movie.tomTat || "Bear, một chàng trai si tình, đã bẻ gãy món đồ chơi bí ẩn mang tên \"Liễu Ước Nguyện\" để đổi lấy tình yêu của cô gái mình thầm thương. Điều ước nhanh chóng trở thành hiện thực, nhưng hạnh phúc mà anh hằng mong đợi lại dần biến thành cơn ác mộng. Bear dần nhận ra một sự thật rùng rợn: cái giá phải trả cho món quà kỳ diệu đó kinh hoàng và đen tối hơn bất cứ điều gì anh có thể tưởng tượng."}
        </Text>

        {/* Phim sắp chiếu chỉ công bố thông tin; chưa mở lịch đặt vé. */}
        {bookingLocked ? (
          <View style={styles.upcomingScheduleNotice}>
            <Text style={styles.upcomingScheduleTitle}>{t(language, 'SẮP CHIẾU TẠI FILMGO', 'COMING SOON TO FILMGO')}</Text>
            <Text style={styles.upcomingScheduleText}>
              {t(language, 'Lịch chiếu và thời gian mở bán vé sẽ được cập nhật sau.', 'Showtimes and ticket sales will be updated later.')}
            </Text>
          </View>
        ) : <View style={styles.showtimeSection}>
          <Text style={styles.sectionTitle}>📅 {t(language, 'LỊCH CHIẾU', 'SHOWTIMES')}</Text>
          <Text style={styles.showtimeSubtitle}>FilmGo Hà Trung (Thanh Hóa)</Text>
          <ChonGio
            movieId={movie.id}
            selectedShowtimeId={selectedShowtime?.id}
            onShowtimePress={showtime =>
              setSelectedShowtime(current =>
                current?.id === showtime.id ? null : showtime,
              )
            }
          />
        </View>}

        <View style={styles.promotionHeader}>
          <Text style={styles.sectionTitle}>{t(language, 'KHUYẾN MÃI', 'PROMOTIONS')}</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.allButton}
            onPress={() => setShowAllPromotions(true)}>
            <Text style={styles.allButtonText}>{t(language, 'Tất cả', 'All')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.promotionList}>
          {moviePromotions.slice(0, 3).map(promo => (
            <TouchableOpacity
              key={promo.id}
              activeOpacity={0.82}
              style={styles.promotionCard}
              onPress={() => setSelectedPromotion(promo)}>
              {promo.imageUrl ? (
                <Image source={{uri: promo.imageUrl}} style={styles.promotionImage} />
              ) : (
                <View style={[styles.promotionThumb, { backgroundColor: promo.color }]}>
                  <Text style={styles.promotionThumbText}>FilmGo</Text>
                </View>
              )}
              <Text style={styles.promotionTitle}>{promo.title}</Text>
            </TouchableOpacity>
          ))}
          {moviePromotions.length === 0 && (
            <Text style={styles.emptyPromotion}>{t(language, 'Hiện chưa có chương trình khuyến mãi đang áp dụng.', 'There are no active promotions.')}</Text>
          )}
        </View>

        <View style={styles.reviewSummary}>
          <View>
            <Text style={styles.reviewSummaryTitle}>{t(language, 'ĐÁNH GIÁ PHIM', 'MOVIE REVIEWS')}</Text>
            <Text style={styles.reviewSummaryMeta}>
              {movieReviews.length
                ? `★ ${averageRating.toFixed(1)}/5 · ${movieReviews.length} ${t(language, 'lượt đánh giá', 'reviews')}`
                : t(language, 'Chưa có đánh giá về phim này', 'No reviews for this movie yet')}
            </Text>
          </View>
        </View>

        {myReviewStatus && (
          <View style={[styles.reviewState, myReviewStatus.tone]}>
            <Text style={styles.reviewStateText}>{myReviewStatus.label}</Text>
          </View>
        )}

        {!reviewEligibility.canReview ? (
          <Text style={styles.reviewAvailabilityText}>
            {t(language, 'Bạn có thể đánh giá sau khi suất chiếu đầu tiên của phim kết thúc.', 'You can review this movie after its first showtime ends.')}
          </Text>
        ) : reviewEligibility.verifiedViewer ? (
          <View style={styles.verifiedViewerNotice}>
            <Text style={styles.verifiedViewerNoticeText}>✓ {t(language, 'Bạn đã xem phim tại FilmGo', 'You watched this movie at FilmGo')}</Text>
          </View>
        ) : (
          <Text style={styles.reviewAvailabilityText}>
            {t(language, 'Khách mua vé tại quầy vẫn có thể chia sẻ cảm nhận sau khi xem phim.', 'Customers who buy tickets at the counter can still share a review after watching.')}
          </Text>
        )}

        <TouchableOpacity
          style={[styles.writeReviewBtn, !reviewEligibility.canReview && styles.writeReviewBtnDisabled]}
          activeOpacity={0.85}
          disabled={!reviewEligibility.canReview}
          onPress={() => onWriteReview?.(movie)}>
          <Text style={styles.writeReviewText}>
            {!reviewEligibility.canReview
              ? t(language, 'Chưa thể đánh giá', 'Review unavailable')
              : myReview
                ? t(language, 'Chỉnh sửa đánh giá', 'Edit review')
                : t(language, 'Viết đánh giá', 'Write a review')}
          </Text>
        </TouchableOpacity>

        <CommentsList comments={movieReviews} />
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
              <Text style={styles.closeTrailerText}>✕ {isEnglish ? 'Close' : 'Đóng'}</Text>
            </TouchableOpacity>
            <Text style={styles.trailerTitleText} numberOfLines={1}>
              Trailer - {movie.title}
            </Text>
          </View>
          
          <ImageBackground
            source={movie.poster}
            style={styles.trailerVideoArea}
            imageStyle={styles.trailerVideoImage}
          >
            <View style={styles.videoPlayerScreen}>
              <Image source={movie.poster} style={styles.trailerPosterSmall} />
              {isPlaying ? (
                <View style={styles.playingStatusBadge}>
                  <Text style={styles.playingStatusText}>🔴 {isEnglish ? 'Playing trailer' : 'Đang phát Trailer'}</Text>
                </View>
              ) : (
                <View style={styles.playingStatusBadge}>
                  <Text style={styles.playingStatusText}>⏸ {isEnglish ? 'Paused' : 'Tạm dừng'}</Text>
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

      <Modal
        visible={Boolean(selectedPromotion)}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedPromotion(null)}>
        <View style={styles.promotionModalBackdrop}>
          <View style={styles.promotionModalCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedPromotion?.imageUrl ? (
                <Image source={{uri: selectedPromotion.imageUrl}} style={styles.promotionModalImage} />
              ) : (
                <View style={[styles.promotionModalPlaceholder, {backgroundColor: selectedPromotion?.color || BLUE}]}>
                  <Text style={styles.promotionModalBrand}>FilmGo</Text>
                </View>
              )}
              <View style={styles.promotionModalBody}>
                <Text style={styles.promotionModalTitle}>{selectedPromotion?.title}</Text>
                {selectedPromotion?.publishedAt ? (
                  <Text style={styles.promotionModalDate}>Công bố ngày {selectedPromotion.publishedAt}</Text>
                ) : null}
                <Text style={styles.promotionModalSummary}>{selectedPromotion?.summary}</Text>
                <Text style={styles.promotionModalContent}>{selectedPromotion?.content}</Text>
              </View>
            </ScrollView>
            <TouchableOpacity style={styles.promotionCloseButton} onPress={() => setSelectedPromotion(null)}>
              <Text style={styles.promotionCloseText}>{isEnglish ? 'Close' : 'Đóng'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAllPromotions}
        animationType="slide"
        onRequestClose={() => setShowAllPromotions(false)}>
        <View style={styles.allPromotionsPage}>
          <View style={styles.allPromotionsHeader}>
            <TouchableOpacity onPress={() => setShowAllPromotions(false)} style={styles.allPromotionsBack}>
              <Text style={styles.allPromotionsBackText}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.allPromotionsTitle}>{isEnglish ? 'All promotions' : 'Tất cả khuyến mãi'}</Text>
            <View style={styles.allPromotionsBack} />
          </View>
          <ScrollView contentContainerStyle={styles.allPromotionsList}>
            {moviePromotions.map(promo => (
              <TouchableOpacity key={promo.id} style={styles.allPromotionCard} onPress={() => {
                setShowAllPromotions(false);
                setTimeout(() => setSelectedPromotion(promo), 220);
              }}>
                {promo.imageUrl ? <Image source={{uri: promo.imageUrl}} style={styles.allPromotionImage} /> : (
                  <View style={[styles.allPromotionImage, styles.allPromotionPlaceholder, {backgroundColor: promo.color}]}>
                    <Text style={styles.promotionThumbText}>FilmGo</Text>
                  </View>
                )}
                <View style={styles.allPromotionText}>
                  <Text style={styles.allPromotionTitle} numberOfLines={2}>{promo.title}</Text>
                  <Text style={styles.allPromotionSummary} numberOfLines={2}>{promo.summary}</Text>
                  <Text style={styles.allPromotionLink}>{isEnglish ? 'View details' : 'Xem chi tiết'} ›</Text>
                </View>
              </TouchableOpacity>
            ))}
            {moviePromotions.length === 0 && <Text style={styles.emptyPromotion}>{isEnglish ? 'No promotions available.' : 'Hiện chưa có khuyến mãi.'}</Text>}
          </ScrollView>
        </View>
      </Modal>

      {!bookingLocked && <TouchableOpacity activeOpacity={0.8} style={styles.bookTicketBtn} onPress={handleBookTicketPress}>
        <Text style={styles.bookTicketBtnText}>{isEnglish ? 'BOOK NOW' : 'ĐẶT VÉ NGAY'}</Text>
      </TouchableOpacity>}
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
    height: 252,
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
    flex: 1,
    fontSize: 20,
    fontWeight: '500',
  },
  playButton: {
    position: 'absolute',
    left: '50%',
    top: 132,
    marginLeft: -30,
  },
  infoBlock: {
    flexDirection: 'row',
    marginTop: -46,
    paddingHorizontal: 16,
  },
  poster: {
    width: 104,
    height: 160,
    borderRadius: 5,
    backgroundColor: '#dfe3e7',
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 6,
    paddingLeft: 14,
  },
  movieTitle: {
    color: '#111111',
    fontSize: 20,
    lineHeight: 26,
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
    columnGap: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 36,
    rowGap: 8,
  },
  detailLabel: {
    color: '#111111',
    fontSize: 14,
    fontWeight: '900',
    width: '34%',
  },
  detailValue: {
    color: '#363636',
    fontSize: 14,
    lineHeight: 21,
    width: '60%',
  },
  description: {
    color: '#333333',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  promotionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 28,
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
  promotionImage: {width: 104, height: 64, borderRadius: 3, marginRight: 16, resizeMode: 'cover'},
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
  emptyPromotion: {color: '#777', fontSize: 14, lineHeight: 20, paddingVertical: 12},
  reviewSummary: {marginHorizontal: 18, marginTop: 26, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  reviewSummaryTitle: {color: '#111', fontSize: 20, fontWeight: '900'},
  reviewSummaryMeta: {color: '#d98b00', fontSize: 14, fontWeight: '800', marginTop: 5},
  reviewState: {marginHorizontal: 18, marginTop: 14, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11},
  reviewStatePending: {backgroundColor: '#fff7d6'},
  reviewStateApproved: {backgroundColor: '#e4f8ea'},
  reviewStateRejected: {backgroundColor: '#ffe8e8'},
  reviewStateText: {color: '#4b5563', fontSize: 13, lineHeight: 18, fontWeight: '700'},
  writeReviewBtn: {
    backgroundColor: '#ff2d7a',
    marginHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16,
  },
  writeReviewBtnDisabled: {backgroundColor: '#aab2bd'},
  reviewAvailabilityText: {marginHorizontal: 18, marginTop: 12, color: '#667085', fontSize: 13, lineHeight: 19},
  verifiedViewerNotice: {marginHorizontal: 18, marginTop: 12, alignSelf: 'flex-start', backgroundColor: '#e5f8eb', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7},
  verifiedViewerNoticeText: {color: '#16803c', fontSize: 13, fontWeight: '800'},
  writeReviewText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 16,
  },
  promotionModalBackdrop: {flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.48)'},
  promotionModalCard: {maxHeight: '88%', backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden'},
  promotionModalImage: {width: '100%', height: 220, resizeMode: 'cover'},
  promotionModalPlaceholder: {height: 180, alignItems: 'center', justifyContent: 'center'},
  promotionModalBrand: {color: '#fff', fontSize: 32, fontWeight: '900'},
  promotionModalBody: {padding: 20},
  promotionModalTitle: {color: '#111', fontSize: 23, lineHeight: 30, fontWeight: '900'},
  promotionModalDate: {color: BLUE, fontSize: 13, fontWeight: '700', marginTop: 8},
  promotionModalSummary: {color: '#344054', fontSize: 16, lineHeight: 23, fontWeight: '700', marginTop: 18},
  promotionModalContent: {color: '#475467', fontSize: 15, lineHeight: 24, marginTop: 14},
  promotionCloseButton: {marginHorizontal: 20, marginBottom: 20, borderRadius: 11, backgroundColor: '#ff2d7a', paddingVertical: 14, alignItems: 'center'},
  promotionCloseText: {color: '#fff', fontSize: 16, fontWeight: '900'},
  allPromotionsPage: {flex: 1, backgroundColor: '#f5f7fa'},
  allPromotionsHeader: {paddingTop: 42, paddingHorizontal: 14, paddingBottom: 14, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#dfe3e8'},
  allPromotionsBack: {width: 42, height: 38, justifyContent: 'center'},
  allPromotionsBackText: {fontSize: 38, lineHeight: 38, color: BLUE},
  allPromotionsTitle: {flex: 1, textAlign: 'center', color: '#111', fontSize: 19, fontWeight: '900'},
  allPromotionsList: {padding: 16, gap: 12, paddingBottom: 32},
  allPromotionCard: {backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 6, shadowOffset: {width: 0, height: 2}},
  allPromotionImage: {width: '100%', height: 150, resizeMode: 'cover'},
  allPromotionPlaceholder: {alignItems: 'center', justifyContent: 'center'},
  allPromotionText: {padding: 14},
  allPromotionTitle: {color: '#101828', fontSize: 17, lineHeight: 23, fontWeight: '900'},
  allPromotionSummary: {color: '#667085', fontSize: 14, lineHeight: 20, marginTop: 6},
  allPromotionLink: {color: '#ff2d7a', fontSize: 13, fontWeight: '800', marginTop: 10},
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
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  upcomingScheduleNotice: {
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#eef8fc',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#9bcfe3',
  },
  upcomingScheduleTitle: {color: BLUE, fontSize: 15, fontWeight: '900'},
  upcomingScheduleText: {color: '#4b6470', fontSize: 13, lineHeight: 19, marginTop: 5},
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
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#1a1a1a',
    position: 'absolute',
    top: 24,
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
    paddingHorizontal: 16,
    paddingTop: 82,
  },
  trailerVideoImage: {
    opacity: 0.25,
  },
  videoPlayerScreen: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 16 / 10,
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
    width: '100%',
    maxWidth: 420,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
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

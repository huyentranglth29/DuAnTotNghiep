import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useMoviesSapChieu} from '../../../hooks/useMovies';
import {layDanhSachSuatChieu} from '../../../services/showtimeService';
import {
  dangKyNhacPhim,
  huyNhacPhim,
  layDanhSachNhacPhim,
} from '../../../services/movieReminderService';
import {MovieBookingInfo} from './MovieName';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';
import {useLanguage} from '../../../contexts/LanguageContext';
import {t} from '../../../utils/i18n';

const BLUE = '#00689d';
const PINK = '#ec197e';

type SapChieuProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function getRelease(value?: string, isEnglish = false) {
  if (!value) return {label: isEnglish ? 'Coming soon' : 'Sắp công bố', month: isEnglish ? 'NEW' : 'MỚI', days: null};
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {label: value, month: isEnglish ? 'NEW' : 'MỚI', days: null};
  }
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return {
    label: date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    month: isEnglish ? `MONTH ${date.getMonth() + 1}` : `THÁNG ${date.getMonth() + 1}`,
    days,
  };
}

function SapChieu({onMoviePress}: SapChieuProps) {
  const {language} = useLanguage();
  const isEnglish = language === 'en';
  const {data, isLoading, isError, refetch, isFetching} = useMoviesSapChieu();
  const movies = useMemo(() => data ?? [], [data]);
  const [remindedMovieIds, setRemindedMovieIds] = useState<Set<string>>(new Set());
  const remindersQuery = useQuery({
    queryKey: ['nhac-phim'],
    queryFn: layDanhSachNhacPhim,
    retry: false,
  });
  useEffect(() => {
    if (remindersQuery.data) setRemindedMovieIds(new Set(remindersQuery.data));
  }, [remindersQuery.data]);
  const bookableQuery = useQuery({
    queryKey: ['lich-chieu', 'sap-chieu-mo-ban'],
    queryFn: () => layDanhSachSuatChieu({bookable: true}),
    staleTime: 15_000,
    refetchInterval: 15_000,
  });
  const bookableMovieIds = useMemo(
    () => new Set((bookableQuery.data ?? []).map(item => String(item.movie?._id || ''))),
    [bookableQuery.data],
  );
  const genres = useMemo(
    () => [
      isEnglish ? 'All' : 'Tất cả',
      ...Array.from(
        new Set(
          movies
            .flatMap(movie => String(movie.theLoai || '').split(','))
            .map(item => item.trim())
            .filter(Boolean),
        ),
      ),
    ],
    [isEnglish, movies],
  );
  const [genre, setGenre] = useState(isEnglish ? 'All' : 'Tất cả');
  const visibleMovies =
    genre === (isEnglish ? 'All' : 'Tất cả')
      ? movies
      : movies.filter(movie =>
          String(movie.theLoai || '')
            .toLowerCase()
            .includes(genre.toLowerCase()),
        );

  return (
    <View style={styles.container}>


      {genres.length > 1 && (
        <ScrollView
          horizontal
          style={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}>
          {genres.map(item => {
            const active = genre === item;
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.78}
                onPress={() => setGenre(item)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text
                  style={[
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}>
                  {item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={BLUE} />
      ) : isError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>{t(language, 'Không tải được phim sắp chiếu', 'Unable to load upcoming movies')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>{t(language, 'Thử lại', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      ) : visibleMovies.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.stateTitle}>{t(language, 'Chưa có phim phù hợp', 'No matching movies yet')}</Text>
          <Text style={styles.stateHint}>
            {t(language, 'Chọn thể loại khác hoặc thêm phim trên Admin.', 'Try another genre or add movies from Admin.')}
          </Text>
        </View>
      ) : (
        <View style={styles.movieList}>
          {visibleMovies.map((phim, index) => {
            const release = getRelease(phim.ngayPhatHanh, isEnglish);
            const saleAt = phim.moBanVeTu ? new Date(phim.moBanVeTu) : null;
            const saleOpened = !saleAt || saleAt <= new Date();
            const hasBookableShowtime = bookableMovieIds.has(String(phim.id));
            const reminded = remindedMovieIds.has(String(phim.id));
            return (
              <TouchableOpacity
                key={String(phim.id)}
                activeOpacity={0.84}
                style={styles.movieCard}
                onPress={() => onMoviePress(phimSangBooking(phim))}>
                <View style={styles.posterWrap}>
                  <Image
                    source={{uri: phim.posterUrl}}
                    style={styles.poster}
                  />
                  <View
                    style={[
                      styles.ageBadge,
                      {backgroundColor: layMauNhanTuoi(phim.nhanTuoi || 'T13')},
                    ]}>
                    <Text style={styles.ageText}>{phim.nhanTuoi || 'T13'}</Text>
                  </View>
                  <View style={styles.orderBadge}>
                    <Text style={styles.orderText}>
                      {String(index + 1).padStart(2, '0')}
                    </Text>
                  </View>
                </View>

                <View style={styles.movieInfo}>
                  <View style={styles.releaseRow}>
                    <View style={styles.monthBadge}>
                      <Text style={styles.monthText}>{release.month}</Text>
                    </View>
                    {release.days !== null && release.days > 0 && (
                      <Text style={styles.countdown}>
                        {t(language, `Còn ${release.days} ngày`, `${release.days} days left`)}
                      </Text>
                    )}
                  </View>
                  <Text numberOfLines={2} style={styles.movieTitle}>
                    {phim.tieuDe}
                  </Text>
                  <Text numberOfLines={2} style={styles.movieMeta}>
                    {phim.theLoai || t(language, 'Đang cập nhật', 'Updating')} ·{' '}
                    {phim.thoiLuong || '—'}
                  </Text>
                  <View style={styles.releaseBox}>
                    <Text style={styles.calendarIcon}>▣</Text>
                    <View>
                      <Text style={styles.releaseLabel}>{t(language, 'Dự kiến khởi chiếu', 'Expected release')}</Text>
                      <Text style={styles.releaseDate}>{release.label}</Text>
                    </View>
                  </View>
                  {saleAt && <Text style={styles.saleDate}>
                    {t(language, `Mở bán vé từ ${saleAt.toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}`, `Tickets on sale from ${saleAt.toLocaleString('en-GB', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}`)}
                  </Text>}
                  <TouchableOpacity
                    style={[styles.upcomingAction, saleOpened && hasBookableShowtime && styles.upcomingActionPrimary]}
                    onPress={async event => {
                      event.stopPropagation?.();
                      if (saleOpened && hasBookableShowtime) {
                        onMoviePress(phimSangBooking(phim));
                        return;
                      }
                      if (saleOpened) {
                        Alert.alert(t(language, 'Đang cập nhật lịch', 'Schedule update'), t(language, 'FilmGo chưa mở suất chiếu để đặt vé cho phim này.', 'FilmGo has not opened showtimes for ticket booking yet.'));
                        return;
                      }
                      const movieId = String(phim.id);
                      try {
                        if (reminded) {
                          await huyNhacPhim(movieId);
                          setRemindedMovieIds(current => {
                            const next = new Set(current);
                            next.delete(movieId);
                            return next;
                          });
                        } else {
                          await dangKyNhacPhim(movieId);
                          setRemindedMovieIds(current => new Set(current).add(movieId));
                          Alert.alert(t(language, 'Đã đăng ký nhắc', 'Reminder registered'), t(language, `FilmGo sẽ nhắc bạn khi ${phim.tieuDe} mở bán vé.`, `FilmGo will remind you when ${phim.tieuDe} goes on sale.`));
                        }
                      } catch (error) {
                        Alert.alert(t(language, 'Cần đăng nhập', 'Login required'), (error as Error).message || t(language, 'Vui lòng đăng nhập để dùng chức năng nhắc tôi.', 'Please log in to use the reminder feature.'));
                      }
                    }}>
                    <Text style={[styles.upcomingActionText, saleOpened && hasBookableShowtime && styles.upcomingActionTextPrimary]}>
                      {saleOpened ? (hasBookableShowtime ? t(language, 'Đặt vé', 'Book now') : t(language, 'Đang cập nhật lịch', 'Schedule update')) : (reminded ? t(language, 'Đã nhắc tôi', 'Reminder set') : t(language, 'Nhắc tôi', 'Remind me'))}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.detailLink}>Xem thông tin phim  ›</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {isFetching && !isLoading && (
        <Text style={styles.refreshHint}>Đang đồng bộ phim mới...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#ffffff', minHeight: 700, paddingBottom: 28},
  filterList: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignItems: 'center',
  },
  filterScroll: {
    height: 56,
    flexGrow: 0,
  },
  filterChip: {
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {backgroundColor: '#e6f0fa'},
  filterText: {color: '#555', fontSize: 13, fontWeight: '600'},
  filterTextActive: {color: BLUE, fontWeight: '800'},
  loader: {marginTop: 45},
  stateBox: {paddingHorizontal: 24, paddingVertical: 55, alignItems: 'center'},
  emptyIcon: {fontSize: 38, marginBottom: 10},
  stateTitle: {fontSize: 17, fontWeight: '900', color: '#172a3f', textAlign: 'center'},
  stateHint: {fontSize: 13, color: '#718096', textAlign: 'center', marginTop: 6},
  retryBtn: {marginTop: 14, backgroundColor: BLUE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10},
  retryText: {color: '#fff', fontWeight: '800'},
  movieList: {paddingHorizontal: 16, paddingTop: 10},
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  posterWrap: {width: 80, height: 116, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0'},
  poster: {width: '100%', height: '100%', resizeMode: 'cover'},
  ageBadge: {position: 'absolute', top: 4, left: 4, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2},
  ageText: {fontSize: 9, color: '#fff', fontWeight: '900', textAlign: 'center'},
  orderBadge: {display: 'none'},
  orderText: {display: 'none'},
  movieInfo: {flex: 1, paddingLeft: 14, paddingTop: 1},
  releaseRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  monthBadge: {backgroundColor: '#f5f5f5', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2},
  monthText: {fontSize: 9, color: '#555', fontWeight: '700'},
  countdown: {fontSize: 11, color: '#e18400', fontWeight: '700'},
  movieTitle: {fontSize: 16, lineHeight: 22, color: '#111', fontWeight: '800', marginTop: 6},
  movieMeta: {fontSize: 13, lineHeight: 18, color: '#555', marginTop: 4},
  releaseBox: {flexDirection: 'row', alignItems: 'center', marginTop: 8},
  calendarIcon: {display: 'none'},
  releaseLabel: {fontSize: 11, color: '#777', fontWeight: '600'},
  releaseDate: {fontSize: 12, color: '#111', fontWeight: '800', marginTop: 1},
  saleDate: {fontSize: 11, color: '#555', fontWeight: '600', marginTop: 6},
  upcomingAction: {marginTop: 12, borderRadius: 6, paddingVertical: 8, alignItems: 'center', backgroundColor: '#f0f4f8', borderWidth: 1, borderColor: '#d9e2ec'},
  upcomingActionPrimary: {backgroundColor: BLUE, borderColor: BLUE},
  upcomingActionText: {fontSize: 13, color: '#334155', fontWeight: '700'},
  upcomingActionTextPrimary: {color: '#fff'},
  detailLink: {display: 'none'},
  refreshHint: {textAlign: 'center', fontSize: 11, color: '#94a3b8'},
});

export default SapChieu;

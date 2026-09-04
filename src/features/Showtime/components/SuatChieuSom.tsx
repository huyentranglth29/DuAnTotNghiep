import React, {useMemo, useState} from 'react';
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
import {useMoviesDangChieu, useMoviesSapChieu} from '../../../hooks/useMovies';
import {
  formatGio,
  formatNgayNgan,
  layDanhSachSuatChieu,
  SuatChieuApi,
  toDateKey,
} from '../../../services/showtimeService';
import {MovieBookingInfo} from './MovieName';
import {SelectedShowtimeInfo} from './ChonGio';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';
import {Phim} from '../../../types/phim';
import {useLanguage} from '../../../contexts/LanguageContext';
import {t} from '../../../utils/i18n';

const BLUE = '#00689d';
const ORANGE = '#ff7817';
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&auto=format&fit=crop&q=80';

type SuatChieuSomProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
  onShowtimePress?: (
    movie: MovieBookingInfo,
    showtime: SelectedShowtimeInfo,
  ) => void;
};

function movieFromShowtime(item?: SuatChieuApi): Phim | null {
  const movie = item?.movie;
  const id = String(movie?._id || '');
  if (!movie || !id) return null;

  const genre = Array.isArray(movie.genre)
    ? movie.genre.map(value => String(value || '').trim()).filter(Boolean).join(', ')
    : String(movie.genre || '').trim();

  return {
    id,
    tieuDe: movie.title || 'Phim chiếu sớm',
    posterUrl: movie.posterUrl || DEFAULT_POSTER,
    diemDanhGia: 0,
    theLoai: genre || 'Đang cập nhật',
    thoiLuong: String(movie.duration || 'Đang cập nhật'),
    trangThai: 'sap-chieu',
    nhanTuoi: movie.ageRating || 'T13',
    laPhimHot: false,
    moBanVeTu: item.ticketSaleStartAt || movie.ticketSaleStartAt,
    ngayPhatHanh: movie.expectedReleaseDate,
  };
}

function asSelected(item: SuatChieuApi): SelectedShowtimeInfo {
  return {
    id: item._id,
    startTime: item.startTime,
    endTime: item.endTime,
    price: Number(item.price) || 0,
    roomName: item.room?.name || 'Phòng chiếu',
    roomType: item.room?.type || '2D',
    cinemaName: 'FilmGo Hà Trung (Thanh Hóa)',
  };
}

function SuatChieuSom({onMoviePress, onShowtimePress}: SuatChieuSomProps) {
  const {language} = useLanguage();
  const isEnglish = language === 'en';
  const showingMoviesQuery = useMoviesDangChieu();
  const upcomingMoviesQuery = useMoviesSapChieu();
  const showtimesQuery = useQuery({
    queryKey: ['lich-chieu', 'suat-chieu-som'],
    queryFn: () =>
      layDanhSachSuatChieu({bookable: true, screeningType: 'early'}),
    staleTime: 15_000,
    refetchOnMount: true,
  });

  const showtimes = useMemo(
    () => showtimesQuery.data ?? [],
    [showtimesQuery.data],
  );

  const dates = useMemo(
    () =>
      Array.from(new Set(showtimes.map(item => toDateKey(item.startTime))))
        .sort(),
    [showtimes],
  );
  const [chosenDate, setChosenDate] = useState('ALL');
  const selectedDate = chosenDate;

  const filteredShowtimes = useMemo(
    () =>
      showtimes.filter(
        item => selectedDate === 'ALL' || toDateKey(item.startTime) === selectedDate,
      ),
    [selectedDate, showtimes],
  );

  const moviesById = useMemo(() => {
    const map = new Map<string, Phim>();
    [...(upcomingMoviesQuery.data ?? []), ...(showingMoviesQuery.data ?? [])]
      .forEach(movie => map.set(String(movie.id), movie));
    return map;
  }, [showingMoviesQuery.data, upcomingMoviesQuery.data]);

  const showtimesByMovie = useMemo(() => {
    const map = new Map<string, SuatChieuApi[]>();
    filteredShowtimes.forEach(item => {
      const id = String(item.movie?._id || '');
      if (!id) return;
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(item);
    });
    return map;
  }, [filteredShowtimes]);

  const grouped = useMemo(() => {
    return Array.from(showtimesByMovie.entries())
      .map(([id, items]) => {
        const movie = moviesById.get(id) ?? movieFromShowtime(items[0]);
        return {
          movie,
          showtimes: items,
        };
      })
      .filter((group): group is {movie: Phim; showtimes: SuatChieuApi[]} => Boolean(group.movie));
  }, [moviesById, showtimesByMovie]);

  const loading =
    showingMoviesQuery.isLoading ||
    upcomingMoviesQuery.isLoading ||
    showtimesQuery.isLoading;
  const error =
    showingMoviesQuery.isError ||
    upcomingMoviesQuery.isError ||
    showtimesQuery.isError;

  return (
    <View style={styles.container}>


      {dates.length > 0 && (
        <ScrollView
          horizontal
          style={styles.dateScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}>
          <TouchableOpacity
            activeOpacity={0.78}
            onPress={() => setChosenDate('ALL')}
            style={[styles.dateCard, selectedDate === 'ALL' && styles.dateCardActive]}>
            <Text style={[styles.weekday, selectedDate === 'ALL' && styles.activeText]}>
              {isEnglish ? 'ALL' : 'TẤT CẢ'}
            </Text>
            <Text style={[styles.dateNumber, selectedDate === 'ALL' && styles.activeText]}>
              {showtimes.length}
            </Text>
            <Text style={[styles.dateMonth, selectedDate === 'ALL' && styles.activeText]}>
              {isEnglish ? 'Shows' : 'Suất'}
            </Text>
            <Text style={[styles.dateCount, selectedDate === 'ALL' && styles.dateCountActive]}>
              {new Set(showtimes.map(s => String(s.movie?._id || '')).filter(Boolean)).size} {isEnglish ? 'movies' : 'phim'}
            </Text>
          </TouchableOpacity>
          {dates.map(key => {
            const date = new Date(`${key}T12:00:00`);
            const active = selectedDate === key;
            const count = showtimes.filter(
              item => toDateKey(item.startTime) === key,
            ).length;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.78}
                onPress={() => setChosenDate(key)}
                style={[styles.dateCard, active && styles.dateCardActive]}>
                <Text style={[styles.weekday, active && styles.activeText]}>
                  {key === toDateKey(new Date())
                    ? (isEnglish ? 'TODAY' : 'HÔM NAY')
                    : WEEKDAY[date.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, active && styles.activeText]}>
                  {String(date.getDate()).padStart(2, '0')}
                </Text>
                <Text style={[styles.dateMonth, active && styles.activeText]}>
                  {isEnglish ? 'Month' : 'Tháng'} {date.getMonth() + 1}
                </Text>
                <Text style={[styles.dateCount, active && styles.dateCountActive]}>
                  {count} {isEnglish ? 'early shows' : 'suất sớm'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {loading ? (
        <ActivityIndicator style={styles.loader} color={BLUE} />
      ) : error ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>{t(language, 'Không tải được suất chiếu sớm', 'Unable to load early screenings')}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              showingMoviesQuery.refetch();
              upcomingMoviesQuery.refetch();
              showtimesQuery.refetch();
            }}>
            <Text style={styles.retryText}>{t(language, 'Thử lại', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      ) : grouped.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>🎟️</Text>
          <Text style={styles.stateTitle}>{t(language, 'Chưa có suất chiếu sớm', 'No early screenings yet')}</Text>
          <Text style={styles.stateHint}>
            {t(language, 'Admin chưa đánh dấu suất nào là “Suất chiếu sớm”.', 'Admin has not marked any showtime as an early screening.')}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {grouped.map(({movie: phim, showtimes: items}) => {
            const movie = phimSangBooking(phim);
            return (
              <View key={String(phim.id)} style={styles.movieCard}>
                <TouchableOpacity
                  activeOpacity={0.84}
                  style={styles.movieHeader}
                  onPress={() => onMoviePress(movie)}>
                  <View style={styles.posterWrap}>
                    <Image source={{uri: phim.posterUrl}} style={styles.poster} />
                    <View style={styles.earlyRibbon}>
                      <Text style={styles.earlyRibbonText}>{t(language, 'CHIẾU SỚM', 'EARLY SHOWING')}</Text>
                    </View>
                    <View
                      style={[
                        styles.ageBadge,
                        {backgroundColor: layMauNhanTuoi(phim.nhanTuoi || 'T13')},
                      ]}>
                      <Text style={styles.ageText}>{phim.nhanTuoi || 'T13'}</Text>
                    </View>
                  </View>
                  <View style={styles.movieInfo}>
                    <Text numberOfLines={2} style={styles.movieTitle}>
                      {phim.tieuDe}
                    </Text>
                    <Text numberOfLines={2} style={styles.movieMeta}>
                      {phim.theLoai || t(language, 'Đang cập nhật', 'Updating')} ·{' '}
                      {phim.thoiLuong || '—'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.rating}>★ {phim.diemDanhGia || 'Mới'}</Text>
                      <Text style={styles.hotText}>HOT</Text>
                    </View>
                    <Text style={styles.detailLink}>{t(language, 'Chi tiết phim  ›', 'Movie details  ›')}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />
                <Text style={styles.chooseLabel}>{t(language, 'CHỌN SUẤT CHIẾU', 'CHOOSE SHOWTIME')}</Text>
                <View style={styles.timeGrid}>
                  {items.map(item => {
                    const saleAt = item.ticketSaleStartAt
                      ? new Date(item.ticketSaleStartAt)
                      : (phim.moBanVeTu ? new Date(phim.moBanVeTu) : null);
                    const saleOpened = !saleAt || saleAt <= new Date();

                    return (
                      <TouchableOpacity
                        key={item._id}
                        activeOpacity={0.78}
                        style={[styles.timeButton, !saleOpened && styles.timeButtonPresale]}
                        onPress={() => {
                          if (!saleOpened) {
                            Alert.alert(
                              t(language, 'Chưa mở bán vé', 'Ticket sale not opened'),
                              t(
                                language,
                                `Vé cho suất chiếu sớm này sẽ mở bán từ ${saleAt!.toLocaleString('vi-VN', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}.`,
                                `Tickets for this early screening will go on sale from ${saleAt!.toLocaleString('en-GB', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}.`,
                              ),
                            );
                            return;
                          }
                          if (onShowtimePress) {
                            onShowtimePress(movie, asSelected(item));
                          } else {
                            onMoviePress(movie);
                          }
                        }}>
                        {selectedDate === 'ALL' && (
                          <Text style={styles.showtimeDateBadge}>
                            {formatNgayNgan(item.startTime)}
                          </Text>
                        )}
                        <View style={styles.timeTop}>
                          <Text style={[styles.timeValue, !saleOpened && styles.timeValuePresale]}>
                            {formatGio(item.startTime)}
                          </Text>
                          <Text style={styles.timeType}>
                            {item.room?.type || '2D'}
                          </Text>
                        </View>
                        {!saleOpened && (
                          <Text style={styles.presaleBadge}>
                            {t(language, 'Sắp mở bán', 'Presale')}
                          </Text>
                        )}
                        <Text style={styles.roomName}>
                          {item.room?.name || 'Phòng chiếu'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#ffffff', minHeight: 700, paddingBottom: 28},
  dateList: {paddingHorizontal: 16, paddingVertical: 12, gap: 12},
  dateScroll: {flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0'},
  dateCard: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateCardActive: {backgroundColor: '#f0f4f8'},
  weekday: {fontSize: 11, color: '#777', fontWeight: '600'},
  dateNumber: {fontSize: 16, color: '#111', fontWeight: '800', marginTop: 2},
  dateMonth: {display: 'none'},
  dateCount: {display: 'none'},
  activeText: {color: BLUE},
  dateCountActive: {},
  loader: {marginTop: 45},
  stateBox: {paddingHorizontal: 24, paddingVertical: 55, alignItems: 'center'},
  emptyIcon: {fontSize: 38, marginBottom: 10},
  stateTitle: {fontSize: 17, fontWeight: '900', color: '#172a3f', textAlign: 'center'},
  stateHint: {fontSize: 13, color: '#718096', textAlign: 'center', marginTop: 6},
  retryBtn: {marginTop: 14, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10},
  retryText: {color: '#fff', fontWeight: '800'},
  list: {paddingHorizontal: 16, paddingTop: 10},
  movieCard: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  movieHeader: {flexDirection: 'row'},
  posterWrap: {width: 80, height: 116, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f0f0f0'},
  poster: {width: '100%', height: '100%', resizeMode: 'cover'},
  earlyRibbon: {display: 'none'},
  earlyRibbonText: {display: 'none'},
  ageBadge: {position: 'absolute', top: 4, left: 4, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2},
  ageText: {fontSize: 9, color: '#fff', fontWeight: '900', textAlign: 'center'},
  movieInfo: {flex: 1, paddingLeft: 14, paddingTop: 1},
  movieTitle: {fontSize: 16, lineHeight: 22, color: '#111', fontWeight: '800'},
  movieMeta: {fontSize: 13, lineHeight: 18, color: '#555', marginTop: 4},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6},
  rating: {fontSize: 12, color: '#e49a00', fontWeight: '800'},
  hotText: {fontSize: 9, color: '#fff', fontWeight: '900', backgroundColor: '#ff5b31', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2},
  detailLink: {display: 'none'},
  divider: {display: 'none'},
  chooseLabel: {display: 'none'},
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12},
  timeButton: {
    minWidth: 72,
    minHeight: 36,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d9e2ec',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeTop: {flexDirection: 'row', justifyContent: 'center', alignItems: 'center'},
  timeValue: {fontSize: 15, color: '#334155', fontWeight: '700'},
  timeType: {display: 'none'},
  roomName: {display: 'none'},
  showtimeDateBadge: {fontSize: 10, color: '#0284c7', fontWeight: '800', marginBottom: 2},
  timeButtonPresale: {borderColor: '#fde68a', backgroundColor: '#fffbeb'},
  timeValuePresale: {color: '#b45309'},
  presaleBadge: {fontSize: 9, color: '#d97706', fontWeight: '800', marginTop: 2},
});

export default SuatChieuSom;

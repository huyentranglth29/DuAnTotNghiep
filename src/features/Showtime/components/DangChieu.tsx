import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useMoviesDangChieu} from '../../../hooks/useMovies';
import {
  formatGio,
  layDanhSachSuatChieu,
  SuatChieuApi,
  toDateKey,
} from '../../../services/showtimeService';
import {MovieBookingInfo} from './MovieName';
import {SelectedShowtimeInfo} from './ChonGio';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';
import {useLanguage} from '../../../contexts/LanguageContext';
import {t} from '../../../utils/i18n';
import {Phim} from '../../../types/phim';

const BLUE = '#00689d';
const PINK = '#ec197e';
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DEFAULT_POSTER =
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500';

type DangChieuProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
  onShowtimePress?: (
    movie: MovieBookingInfo,
    showtime: SelectedShowtimeInfo,
  ) => void;
};

function toSelectedShowtime(item: SuatChieuApi): SelectedShowtimeInfo {
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

function movieIdOf(item: SuatChieuApi) {
  return String(item.movie?._id || '');
}

function movieFromShowtime(item?: SuatChieuApi): Phim | null {
  const movie = item?.movie;
  const id = String(movie?._id || '');
  if (!movie || !id) return null;

  const genre = Array.isArray(movie.genre)
    ? movie.genre.map(value => String(value || '').trim()).filter(Boolean).join(', ')
    : String(movie.genre || '').trim();

  return {
    id,
    tieuDe: movie.title || 'Phim đang chiếu',
    posterUrl: movie.posterUrl || DEFAULT_POSTER,
    diemDanhGia: 0,
    theLoai: genre || 'Đang cập nhật',
    thoiLuong: String(movie.duration || 'Đang cập nhật'),
    trangThai: 'dang-chieu',
    nhanTuoi: movie.ageRating || 'T13',
    laPhimHot: false,
  };
}

function DangChieu({onMoviePress, onShowtimePress}: DangChieuProps) {
  const {language} = useLanguage();
  const isEnglish = language === 'en';
  const {data, isLoading, isError, refetch, isFetching} = useMoviesDangChieu();
  const movies = useMemo(() => data ?? [], [data]);
  const showtimesQuery = useQuery({
    queryKey: ['lich-chieu', 'tat-ca-suat-dat-duoc'],
    queryFn: () =>
      layDanhSachSuatChieu({bookable: true, screeningType: 'regular'}),
    staleTime: 15_000,
    refetchOnMount: true,
  });
  const showtimes = useMemo(
    () => showtimesQuery.data ?? [],
    [showtimesQuery.data],
  );

  const dates = useMemo(() => {
    const keys = Array.from(
      new Set(showtimes.map(item => toDateKey(item.startTime))),
    ).sort();
    return keys.slice(0, 10);
  }, [showtimes]);
  const [chosenDate, setChosenDate] = useState('');
  const [formatFilter, setFormatFilter] = useState(isEnglish ? 'All formats' : 'Tất cả');
  const allFormatsLabel = isEnglish ? 'All formats' : 'Tất cả';
  const selectedDate = chosenDate || dates[0] || '';

  const availableFormats = useMemo(() => {
    const formats = Array.from(
      new Set(
        showtimes
          .filter(
            item =>
              !selectedDate || toDateKey(item.startTime) === selectedDate,
          )
          .map(item => item.room?.type)
          .filter((item): item is string => Boolean(item)),
      ),
    );
    return [allFormatsLabel, ...formats];
  }, [allFormatsLabel, selectedDate, showtimes]);

  useEffect(() => {
    if (!availableFormats.includes(formatFilter)) {
      setFormatFilter(availableFormats[0] || allFormatsLabel);
    }
  }, [allFormatsLabel, availableFormats, formatFilter]);

  const moviesById = useMemo(() => {
    const map = new Map<string, Phim>();
    movies.forEach(movie => map.set(String(movie.id), movie));
    return map;
  }, [movies]);

  const showtimeMatchesFormat = (item: SuatChieuApi) =>
    formatFilter === allFormatsLabel || item.room?.type === formatFilter;

  const countShowtimesByDate = (key: string) =>
    showtimes.filter(
      item => toDateKey(item.startTime) === key && showtimeMatchesFormat(item),
    ).length;

  const showtimesByMovie = useMemo(() => {
    const map = new Map<string, SuatChieuApi[]>();
    showtimes
      .filter(
        item =>
          (!selectedDate || toDateKey(item.startTime) === selectedDate) &&
          showtimeMatchesFormat(item),
      )
      .forEach(item => {
        const id = movieIdOf(item);
        if (!id) return;
        if (!map.has(id)) map.set(id, []);
        map.get(id)!.push(item);
      });
    map.forEach(items =>
      items.sort(
        (left, right) =>
          new Date(left.startTime).getTime() -
          new Date(right.startTime).getTime(),
      ),
    );
    return map;
  }, [formatFilter, selectedDate, showtimes]);

  const visibleMovies = useMemo(() => {
    if (!selectedDate || showtimesQuery.isLoading) return movies;
    return Array.from(showtimesByMovie.entries())
      .map(([id, movieShowtimes]) => moviesById.get(id) ?? movieFromShowtime(movieShowtimes[0]))
      .filter((movie): movie is Phim => Boolean(movie));
  }, [movies, moviesById, selectedDate, showtimesByMovie, showtimesQuery.isLoading]);

  const nearestShowtime = useMemo(() => {
    const items = Array.from(showtimesByMovie.values()).flat();
    return items[0];
  }, [showtimesByMovie]);

  return (
    <View style={styles.container}>
      <View style={styles.cinemaHeader}>
        <Text style={styles.cinemaPin}>📍</Text>
        <Text style={styles.cinemaTitle}>FilmGo Hà Trung (Thanh Hóa) ▾</Text>
      </View>

      {showtimesQuery.isLoading ? (
        <ActivityIndicator style={styles.dateLoader} color={BLUE} />
      ) : dates.length > 0 ? (
        <ScrollView
          horizontal
          style={styles.dateScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}>
          {dates.map(key => {
            const date = new Date(`${key}T12:00:00`);
            const active = selectedDate === key;
            const today = key === toDateKey(new Date());
            const count = countShowtimesByDate(key);
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.78}
                onPress={() => setChosenDate(key)}
                style={[styles.dateCard, active && styles.dateCardActive]}>
                <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                  {today ? (isEnglish ? 'TODAY' : 'HÔM NAY') : WEEKDAY[date.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, active && styles.dateTextActive]}>
                  {String(date.getDate()).padStart(2, '0')}
                </Text>
                <Text style={[styles.dateMonth, active && styles.dateTextActive]}>
                  {isEnglish ? 'Month' : 'Tháng'} {date.getMonth() + 1}
                </Text>
                <Text style={[styles.dateCount, active && styles.dateCountActive]}>
                  {count} {isEnglish ? 'shows' : 'suất'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : null}

      {availableFormats.length > 1 && (
        <ScrollView
          horizontal
          style={styles.filterScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}>
          {availableFormats.map(format => {
            const active = formatFilter === format;
            return (
              <TouchableOpacity
                key={format}
                activeOpacity={0.78}
                onPress={() => setFormatFilter(format)}
                style={[styles.filterChip, active && styles.filterChipActive]}>
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}>
                  {format === allFormatsLabel ? (isEnglish ? 'All formats' : 'Tất cả định dạng') : format}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={BLUE} />
      ) : isError || showtimesQuery.isError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>{t(language, 'Không tải được lịch chiếu', 'Unable to load showtimes')}</Text>
          <Text style={styles.stateHint}>
            {t(language, 'Kiểm tra backend rồi tải lại dữ liệu từ MongoDB.', 'Check the backend and reload data from MongoDB.')}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              refetch();
              showtimesQuery.refetch();
            }}>
            <Text style={styles.retryText}>{t(language, 'Thử lại', 'Try again')}</Text>
          </TouchableOpacity>
        </View>
      ) : visibleMovies.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.stateTitle}>{t(language, 'Ngày này chưa có lịch chiếu', 'No showtimes on this date')}</Text>
          <Text style={styles.stateHint}>
            {t(language, 'Hãy chọn ngày khác hoặc thêm suất chiếu trên Admin.', 'Please choose another date.')}
          </Text>
        </View>
      ) : (
        <View style={styles.scheduleList}>
          {visibleMovies.map(phim => {
            const movie = phimSangBooking(phim);
            const movieShowtimes = showtimesByMovie.get(String(phim.id)) ?? [];
            const rooms = Array.from(
              new Set(
                movieShowtimes.map(
                  item =>
                    `${item.room?.name || 'Phòng chiếu'} · ${
                      item.room?.type || '2D'
                    }`,
                ),
              ),
            );
            return (
              <View key={String(phim.id)} style={styles.movieCard}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.movieTop}
                  onPress={() => onMoviePress(movie)}>
                  <View style={styles.posterWrap}>
                    <Image
                      source={{uri: phim.posterUrl}}
                      style={styles.moviePoster}
                    />
                    <View
                      style={[
                        styles.ageBadge,
                        {backgroundColor: layMauNhanTuoi(phim.nhanTuoi || 'T13')},
                      ]}>
                      <Text style={styles.ageText}>{phim.nhanTuoi || 'T13'}</Text>
                    </View>
                  </View>
                  <View style={styles.movieInfo}>
                    <View style={styles.titleRow}>
                      <Text numberOfLines={2} style={styles.movieTitle}>
                        {phim.tieuDe}
                      </Text>
                      {phim.laPhimHot && (
                        <View style={styles.hotBadge}>
                          <Text style={styles.hotText}>HOT</Text>
                        </View>
                      )}
                    </View>
                    <Text numberOfLines={2} style={styles.movieMeta}>
                      {phim.theLoai || t(language, 'Đang cập nhật', 'Updating')} ·{' '}
                      {phim.thoiLuong || '—'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.rating}>★ {phim.diemDanhGia || t(language, 'Mới', 'New')}</Text>
                      <Text style={styles.subtitleBadge}>{t(language, 'PHỤ ĐỀ', 'SUBTITLED')}</Text>
                    </View>
                    <Text style={styles.detailLink}>{t(language, 'Xem chi tiết phim', 'View movie details')}  ›</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />
                {movieShowtimes.length === 0 ? (
                  <Text style={styles.noShowtime}>
                    {t(language, 'Chưa có suất đặt được trong ngày này', 'No bookable showtimes on this date')}
                  </Text>
                ) : (
                  <>
                    <View style={styles.roomRow}>
                      <Text style={styles.roomText}>
                        {rooms.join('  •  ')}
                      </Text>
                    </View>
                    <View style={styles.timeGrid}>
                      {movieShowtimes.map(item => (
                        <TouchableOpacity
                          key={item._id}
                          activeOpacity={0.78}
                          style={styles.timeButton}
                          onPress={() =>
                            onShowtimePress
                              ? onShowtimePress(movie, toSelectedShowtime(item))
                              : onMoviePress(movie)
                          }>
                          <Text style={styles.timeValue}>
                            {formatGio(item.startTime)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
      {(isFetching || showtimesQuery.isFetching) && !isLoading && (
        <Text style={styles.refreshHint}>{isEnglish ? 'Syncing the latest showtimes...' : 'Đang đồng bộ lịch mới từ Admin...'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#ffffff', paddingBottom: 26},
  cinemaHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cinemaPin: {fontSize: 18, marginRight: 6},
  cinemaTitle: {fontSize: 15, color: '#111', fontWeight: '800'},
  dateLoader: {marginVertical: 22},
  dateScroll: {flexGrow: 0, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0'},
  dateList: {paddingHorizontal: 16, paddingBottom: 12, gap: 12},
  dateCard: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateCardActive: {backgroundColor: '#f0f4f8'},
  dateWeekday: {fontSize: 11, color: '#777', fontWeight: '600'},
  dateNumber: {fontSize: 16, color: '#111', fontWeight: '800', marginTop: 2},
  dateMonth: {display: 'none'},
  dateCount: {display: 'none'},
  dateTextActive: {color: BLUE},
  dateCountActive: {},
  filterList: {paddingHorizontal: 16, paddingVertical: 10, gap: 8},
  filterScroll: {flexGrow: 0},
  filterChip: {
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterChipActive: {backgroundColor: '#e6f0fa'},
  filterChipText: {fontSize: 13, color: '#555', fontWeight: '600'},
  filterChipTextActive: {color: BLUE, fontWeight: '800'},
  loader: {marginTop: 40},
  stateBox: {paddingHorizontal: 24, paddingVertical: 45, alignItems: 'center'},
  emptyIcon: {fontSize: 38, marginBottom: 12},
  stateTitle: {fontSize: 17, fontWeight: '900', color: '#172a3f', textAlign: 'center'},
  stateHint: {marginTop: 6, fontSize: 13, color: '#718096', textAlign: 'center'},
  retryBtn: {
    marginTop: 14,
    backgroundColor: BLUE,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '800'},
  scheduleList: {paddingHorizontal: 16, paddingTop: 8},
  movieCard: {
    backgroundColor: '#fff',
    marginBottom: 20,
  },
  movieTop: {flexDirection: 'row'},
  posterWrap: {
    width: 80,
    height: 116,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  moviePoster: {width: '100%', height: '100%', resizeMode: 'cover'},
  ageBadge: {
    position: 'absolute',
    left: 4,
    top: 4,
    minWidth: 28,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  ageText: {color: '#fff', fontSize: 9, fontWeight: '900', textAlign: 'center'},
  movieInfo: {flex: 1, paddingLeft: 14},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start'},
  movieTitle: {flex: 1, color: '#111', fontSize: 16, lineHeight: 22, fontWeight: '800'},
  hotBadge: {backgroundColor: '#ff5b31', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, marginLeft: 6},
  hotText: {fontSize: 9, color: '#fff', fontWeight: '900'},
  movieMeta: {color: '#555', fontSize: 13, marginTop: 4},
  ratingRow: {flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 6},
  rating: {fontSize: 12, color: '#e49a00', fontWeight: '800'},
  subtitleBadge: {
    color: '#333',
    fontSize: 10,
    fontWeight: '700',
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  detailLink: {color: BLUE, fontSize: 13, fontWeight: '600', marginTop: 10},
  divider: {display: 'none'},
  noShowtime: {fontSize: 13, color: '#999', paddingTop: 12},
  roomRow: {marginTop: 12, marginBottom: 8},
  roomIcon: {display: 'none'},
  roomText: {fontSize: 14, color: '#333', fontWeight: '700'},
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
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
  timeValue: {fontSize: 15, color: '#334155', fontWeight: '700'},
  timeType: {display: 'none'},
  refreshHint: {textAlign: 'center', color: '#999', fontSize: 12, marginTop: 8},
});

export default DangChieu;

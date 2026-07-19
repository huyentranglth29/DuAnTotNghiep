import React, {useMemo, useState} from 'react';
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

const BLUE = '#00689d';
const PINK = '#ec197e';
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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

function DangChieu({onMoviePress, onShowtimePress}: DangChieuProps) {
  const {data, isLoading, isError, refetch, isFetching} = useMoviesDangChieu();
  const movies = data ?? [];
  const showtimesQuery = useQuery({
    queryKey: ['lich-chieu', 'tat-ca-suat-dat-duoc'],
    queryFn: () => layDanhSachSuatChieu({bookable: true}),
    staleTime: 15_000,
    refetchOnMount: true,
  });
  const showtimes = showtimesQuery.data ?? [];

  const dates = useMemo(() => {
    const keys = Array.from(
      new Set(showtimes.map(item => toDateKey(item.startTime))),
    ).sort();
    return keys.slice(0, 10);
  }, [showtimes]);
  const [chosenDate, setChosenDate] = useState('');
  const [formatFilter, setFormatFilter] = useState('Tất cả');
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
    return ['Tất cả', ...formats];
  }, [selectedDate, showtimes]);

  const showtimesByMovie = useMemo(() => {
    const map = new Map<string, SuatChieuApi[]>();
    showtimes
      .filter(
        item =>
          (!selectedDate || toDateKey(item.startTime) === selectedDate) &&
          (formatFilter === 'Tất cả' || item.room?.type === formatFilter),
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
    return movies.filter(movie => showtimesByMovie.has(String(movie.id)));
  }, [movies, selectedDate, showtimesByMovie, showtimesQuery.isLoading]);

  const nearestShowtime = useMemo(() => {
    const items = Array.from(showtimesByMovie.values()).flat();
    return items[0];
  }, [showtimesByMovie]);

  return (
    <View style={styles.container}>
      <View style={styles.intro}>
        <View>
          <Text style={styles.eyebrow}>FILMGO HÀ TRUNG</Text>
          <Text style={styles.heading}>Lịch chiếu phim</Text>
          <Text style={styles.subheading}>
            Chọn ngày và suất chiếu phù hợp với bạn
          </Text>
        </View>
        <View style={styles.movieCount}>
          <Text style={styles.movieCountNumber}>{visibleMovies.length}</Text>
          <Text style={styles.movieCountLabel}>phim</Text>
        </View>
      </View>

      <View style={styles.cinemaCard}>
        <Text style={styles.cinemaPin}>📍</Text>
        <View style={styles.cinemaInfo}>
          <Text style={styles.cinemaTitle}>FilmGo Hà Trung (Thanh Hóa)</Text>
          <Text style={styles.cinemaAddress}>
            Hà Trung, Thanh Hóa · Rạp đang chọn
          </Text>
        </View>
        <View style={styles.activeDot} />
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
            const count = showtimes.filter(
              item => toDateKey(item.startTime) === key,
            ).length;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.78}
                onPress={() => setChosenDate(key)}
                style={[styles.dateCard, active && styles.dateCardActive]}>
                <Text style={[styles.dateWeekday, active && styles.dateTextActive]}>
                  {today ? 'HÔM NAY' : WEEKDAY[date.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, active && styles.dateTextActive]}>
                  {String(date.getDate()).padStart(2, '0')}
                </Text>
                <Text style={[styles.dateMonth, active && styles.dateTextActive]}>
                  Tháng {date.getMonth() + 1}
                </Text>
                <Text style={[styles.dateCount, active && styles.dateCountActive]}>
                  {count} suất
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
                  {format === 'Tất cả' ? 'Tất cả định dạng' : format}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {nearestShowtime && (
        <View style={styles.nearestBanner}>
          <Text style={styles.nearestIcon}>⚡</Text>
          <View style={styles.nearestContent}>
            <Text style={styles.nearestLabel}>SUẤT GẦN NHẤT</Text>
            <Text style={styles.nearestText}>
              {formatGio(nearestShowtime.startTime)} ·{' '}
              {nearestShowtime.movie?.title || 'Phim đang chiếu'}
            </Text>
          </View>
          <Text style={styles.nearestRoom}>
            {nearestShowtime.room?.type || '2D'}
          </Text>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={BLUE} />
      ) : isError || showtimesQuery.isError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Không tải được lịch chiếu</Text>
          <Text style={styles.stateHint}>
            Kiểm tra backend rồi tải lại dữ liệu từ MongoDB.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              refetch();
              showtimesQuery.refetch();
            }}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : visibleMovies.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>🎬</Text>
          <Text style={styles.stateTitle}>Ngày này chưa có lịch chiếu</Text>
          <Text style={styles.stateHint}>
            Hãy chọn ngày khác hoặc thêm suất chiếu trên Admin.
          </Text>
        </View>
      ) : (
        <View style={styles.scheduleList}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Phim & suất chiếu</Text>
            <Text style={styles.liveText}>● Dữ liệu trực tiếp</Text>
          </View>
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
                      {phim.theLoai || 'Đang cập nhật'} ·{' '}
                      {phim.thoiLuong || '—'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.rating}>★ {phim.diemDanhGia || 'Mới'}</Text>
                      <Text style={styles.subtitleBadge}>PHỤ ĐỀ</Text>
                    </View>
                    <Text style={styles.detailLink}>Xem chi tiết phim  ›</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />
                {movieShowtimes.length === 0 ? (
                  <Text style={styles.noShowtime}>
                    Chưa có suất đặt được trong ngày này
                  </Text>
                ) : (
                  <>
                    <View style={styles.roomRow}>
                      <Text style={styles.roomIcon}>▣</Text>
                      <Text numberOfLines={1} style={styles.roomText}>
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
                          <Text style={styles.timeType}>
                            {item.room?.type || '2D'}
                          </Text>
                          <Text style={styles.timePrice}>
                            {Number(item.price).toLocaleString('vi-VN')}đ
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
        <Text style={styles.refreshHint}>Đang đồng bộ lịch mới từ Admin...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#f4f7fa', paddingBottom: 26},
  intro: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyebrow: {fontSize: 11, color: PINK, fontWeight: '900', letterSpacing: 1.2},
  heading: {fontSize: 26, color: '#102235', fontWeight: '900', marginTop: 2},
  subheading: {fontSize: 13, color: '#718096', marginTop: 4},
  movieCount: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#e2f4fc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  movieCountNumber: {fontSize: 19, color: BLUE, fontWeight: '900'},
  movieCountLabel: {fontSize: 10, color: '#617b8d', fontWeight: '700'},
  cinemaCard: {
    marginHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cinemaPin: {fontSize: 22, marginRight: 10},
  cinemaInfo: {flex: 1},
  cinemaTitle: {fontSize: 14, color: '#16283c', fontWeight: '900'},
  cinemaAddress: {fontSize: 11, color: '#8291a3', marginTop: 3},
  activeDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: '#20bf6b'},
  dateLoader: {marginVertical: 22},
  dateScroll: {height: 130, flexGrow: 0},
  dateList: {paddingHorizontal: 16, paddingVertical: 16, gap: 10},
  dateCard: {
    width: 70,
    borderRadius: 17,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce4eb',
  },
  dateCardActive: {backgroundColor: BLUE, borderColor: BLUE},
  dateWeekday: {fontSize: 10, color: '#8492a3', fontWeight: '900'},
  dateNumber: {fontSize: 22, color: '#1e293b', fontWeight: '900', marginTop: 2},
  dateMonth: {fontSize: 10, color: '#8492a3'},
  dateCount: {
    fontSize: 9,
    color: BLUE,
    fontWeight: '800',
    marginTop: 5,
    backgroundColor: '#e8f5fb',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  dateTextActive: {color: '#fff'},
  dateCountActive: {color: '#fff', backgroundColor: 'rgba(255,255,255,0.18)'},
  filterList: {paddingHorizontal: 16, paddingBottom: 14, gap: 8},
  filterScroll: {height: 50, flexGrow: 0},
  filterChip: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#ced9e2',
    backgroundColor: '#fff',
    paddingHorizontal: 13,
    paddingVertical: 7,
  },
  filterChipActive: {borderColor: PINK, backgroundColor: '#fff0f7'},
  filterChipText: {fontSize: 11, color: '#65778a', fontWeight: '800'},
  filterChipTextActive: {color: PINK},
  nearestBanner: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 14,
    backgroundColor: '#fff3df',
    borderWidth: 1,
    borderColor: '#ffdba3',
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearestIcon: {fontSize: 19, marginRight: 9},
  nearestContent: {flex: 1},
  nearestLabel: {fontSize: 9, color: '#d97706', fontWeight: '900'},
  nearestText: {fontSize: 12, color: '#593b18', fontWeight: '800', marginTop: 2},
  nearestRoom: {
    color: '#d97706',
    fontSize: 10,
    fontWeight: '900',
    borderWidth: 1,
    borderColor: '#f1b65e',
    borderRadius: 7,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
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
  scheduleList: {paddingHorizontal: 14},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {fontSize: 18, fontWeight: '900', color: '#172a3f'},
  liveText: {fontSize: 10, color: '#20a464', fontWeight: '800'},
  movieCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  movieTop: {flexDirection: 'row'},
  posterWrap: {
    width: 92,
    height: 132,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#e7edf2',
  },
  moviePoster: {width: '100%', height: '100%', resizeMode: 'cover'},
  ageBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    minWidth: 31,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ageText: {color: '#fff', fontSize: 10, fontWeight: '900', textAlign: 'center'},
  movieInfo: {flex: 1, paddingLeft: 12, paddingTop: 2},
  titleRow: {flexDirection: 'row', alignItems: 'flex-start'},
  movieTitle: {flex: 1, color: '#142437', fontSize: 17, lineHeight: 22, fontWeight: '900'},
  hotBadge: {backgroundColor: '#ff5b31', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3},
  hotText: {fontSize: 8, color: '#fff', fontWeight: '900'},
  movieMeta: {color: '#718096', fontSize: 12, lineHeight: 17, marginTop: 6},
  ratingRow: {flexDirection: 'row', gap: 7, alignItems: 'center', marginTop: 9},
  rating: {fontSize: 11, color: '#e49a00', fontWeight: '900'},
  subtitleBadge: {
    color: BLUE,
    fontSize: 9,
    fontWeight: '900',
    borderRadius: 5,
    backgroundColor: '#e5f5fb',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  detailLink: {color: PINK, fontSize: 11, fontWeight: '900', marginTop: 11},
  divider: {height: 1, backgroundColor: '#edf1f5', marginVertical: 12},
  noShowtime: {fontSize: 12, color: '#94a3b8', paddingVertical: 8, textAlign: 'center'},
  roomRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 9},
  roomIcon: {color: BLUE, fontWeight: '900', marginRight: 7},
  roomText: {flex: 1, fontSize: 11, color: '#58697c', fontWeight: '700'},
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  timeButton: {
    minWidth: 82,
    borderRadius: 11,
    borderWidth: 1.2,
    borderColor: '#bcd9e7',
    backgroundColor: '#f5fbfe',
    paddingHorizontal: 9,
    paddingVertical: 7,
    alignItems: 'center',
  },
  timeValue: {fontSize: 15, color: BLUE, fontWeight: '900'},
  timeType: {fontSize: 8, color: '#7990a0', fontWeight: '800', marginTop: 1},
  timePrice: {fontSize: 9, color: '#526577', marginTop: 3},
  refreshHint: {textAlign: 'center', color: '#94a3b8', fontSize: 11, marginTop: 2},
});

export default DangChieu;

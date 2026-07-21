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
const ORANGE = '#ff7817';
const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

type SuatChieuSomProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
  onShowtimePress?: (
    movie: MovieBookingInfo,
    showtime: SelectedShowtimeInfo,
  ) => void;
};

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
  const moviesQuery = useMoviesDangChieu();
  const showtimesQuery = useQuery({
    queryKey: ['lich-chieu', 'suat-chieu-som'],
    queryFn: () => layDanhSachSuatChieu({bookable: true}),
    staleTime: 15_000,
    refetchOnMount: true,
  });
  const allMovies = useMemo(() => moviesQuery.data ?? [], [moviesQuery.data]);
  const preferredMovies = useMemo(() => {
    const hot = allMovies.filter(movie => movie.laPhimHot);
    return hot.length > 0 ? hot : allMovies;
  }, [allMovies]);
  const movieIds = useMemo(
    () => new Set(preferredMovies.map(movie => String(movie.id))),
    [preferredMovies],
  );
  const showtimes = useMemo(
    () =>
      (showtimesQuery.data ?? []).filter(item =>
        movieIds.has(String(item.movie?._id || '')),
      ),
    [movieIds, showtimesQuery.data],
  );
  const dates = useMemo(
    () =>
      Array.from(new Set(showtimes.map(item => toDateKey(item.startTime))))
        .sort()
        .slice(0, 7),
    [showtimes],
  );
  const [chosenDate, setChosenDate] = useState('');
  const selectedDate = chosenDate || dates[0] || '';

  const filteredShowtimes = useMemo(
    () =>
      showtimes.filter(
        item => !selectedDate || toDateKey(item.startTime) === selectedDate,
      ),
    [selectedDate, showtimes],
  );
  const grouped = useMemo(
    () =>
      preferredMovies
        .map(movie => ({
          movie,
          showtimes: filteredShowtimes.filter(
            item => String(item.movie?._id || '') === String(movie.id),
          ),
        }))
        .filter(group => group.showtimes.length > 0),
    [filteredShowtimes, preferredMovies],
  );

  const loading = moviesQuery.isLoading || showtimesQuery.isLoading;
  const error = moviesQuery.isError || showtimesQuery.isError;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroGlow} />
        <View style={styles.premiereBadge}>
          <Text style={styles.premiereBadgeText}>EARLY ACCESS</Text>
        </View>
        <Text style={styles.heading}>Suất chiếu sớm</Text>
        <Text style={styles.subheading}>
          Xem trước phim nổi bật tại FilmGo Hà Trung
        </Text>
        <View style={styles.heroNote}>
          <Text style={styles.heroNoteIcon}>★</Text>
          <Text style={styles.heroNoteText}>
            Lịch và giá vé được cập nhật trực tiếp từ Admin
          </Text>
        </View>
      </View>

      {dates.length > 0 && (
        <ScrollView
          horizontal
          style={styles.dateScroll}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateList}>
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
                    ? 'HÔM NAY'
                    : WEEKDAY[date.getDay()]}
                </Text>
                <Text style={[styles.dateNumber, active && styles.activeText]}>
                  {String(date.getDate()).padStart(2, '0')}
                </Text>
                <Text style={[styles.dateMonth, active && styles.activeText]}>
                  Tháng {date.getMonth() + 1}
                </Text>
                <Text style={[styles.dateCount, active && styles.dateCountActive]}>
                  {count} suất sớm
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
          <Text style={styles.stateTitle}>Không tải được suất chiếu sớm</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              moviesQuery.refetch();
              showtimesQuery.refetch();
            }}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : grouped.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>🎟️</Text>
          <Text style={styles.stateTitle}>Chưa có suất chiếu sớm</Text>
          <Text style={styles.stateHint}>
            Hãy chọn ngày khác hoặc tạo suất cho phim HOT trên Admin.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Đặc quyền xem trước</Text>
            <Text style={styles.liveLabel}>● Đang mở bán</Text>
          </View>
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
                      <Text style={styles.earlyRibbonText}>CHIẾU SỚM</Text>
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
                      {phim.theLoai || 'Đang cập nhật'} ·{' '}
                      {phim.thoiLuong || '—'}
                    </Text>
                    <View style={styles.ratingRow}>
                      <Text style={styles.rating}>★ {phim.diemDanhGia || 'Mới'}</Text>
                      <Text style={styles.hotText}>HOT</Text>
                    </View>
                    <Text style={styles.detailLink}>Chi tiết phim  ›</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.divider} />
                <Text style={styles.chooseLabel}>CHỌN SUẤT CHIẾU</Text>
                <View style={styles.timeGrid}>
                  {items.map(item => (
                    <TouchableOpacity
                      key={item._id}
                      activeOpacity={0.78}
                      style={styles.timeButton}
                      onPress={() =>
                        onShowtimePress
                          ? onShowtimePress(movie, asSelected(item))
                          : onMoviePress(movie)
                      }>
                      <View style={styles.timeTop}>
                        <Text style={styles.timeValue}>
                          {formatGio(item.startTime)}
                        </Text>
                        <Text style={styles.timeType}>
                          {item.room?.type || '2D'}
                        </Text>
                      </View>
                      <Text style={styles.roomName}>
                        {item.room?.name || 'Phòng chiếu'}
                      </Text>
                      <Text style={styles.price}>
                        {Number(item.price).toLocaleString('vi-VN')}đ
                      </Text>
                    </TouchableOpacity>
                  ))}
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
  container: {backgroundColor: '#f4f7fa', minHeight: 700, paddingBottom: 28},
  hero: {
    backgroundColor: '#151b34',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -45,
    top: -60,
    backgroundColor: 'rgba(255,120,23,0.22)',
  },
  premiereBadge: {alignSelf: 'flex-start', backgroundColor: ORANGE, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4},
  premiereBadgeText: {fontSize: 9, color: '#fff', fontWeight: '900', letterSpacing: 1},
  heading: {fontSize: 27, color: '#fff', fontWeight: '900', marginTop: 8},
  subheading: {fontSize: 13, color: '#bbc4d7', marginTop: 5},
  heroNote: {flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, alignSelf: 'flex-start'},
  heroNoteIcon: {color: '#ffc252', marginRight: 7},
  heroNoteText: {color: '#d3d8e4', fontSize: 10, fontWeight: '700'},
  dateList: {paddingHorizontal: 15, paddingVertical: 16, gap: 10},
  dateScroll: {height: 132, flexGrow: 0},
  dateCard: {width: 78, alignItems: 'center', borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: '#dce4eb', paddingVertical: 9},
  dateCardActive: {backgroundColor: '#17213d', borderColor: ORANGE},
  weekday: {fontSize: 9, color: '#8290a0', fontWeight: '900'},
  dateNumber: {fontSize: 22, color: '#1b2939', fontWeight: '900', marginTop: 2},
  dateMonth: {fontSize: 9, color: '#8290a0'},
  dateCount: {fontSize: 8, color: ORANGE, fontWeight: '900', marginTop: 5, backgroundColor: '#fff2e7', borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2},
  activeText: {color: '#fff'},
  dateCountActive: {backgroundColor: ORANGE, color: '#fff'},
  loader: {marginTop: 45},
  stateBox: {paddingHorizontal: 24, paddingVertical: 55, alignItems: 'center'},
  emptyIcon: {fontSize: 38, marginBottom: 10},
  stateTitle: {fontSize: 17, fontWeight: '900', color: '#172a3f', textAlign: 'center'},
  stateHint: {fontSize: 13, color: '#718096', textAlign: 'center', marginTop: 6},
  retryBtn: {marginTop: 14, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 18, paddingVertical: 10},
  retryText: {color: '#fff', fontWeight: '800'},
  list: {paddingHorizontal: 14},
  sectionRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  sectionTitle: {fontSize: 18, color: '#172a3f', fontWeight: '900'},
  liveLabel: {fontSize: 10, color: '#20a464', fontWeight: '800'},
  movieCard: {backgroundColor: '#fff', borderRadius: 18, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: {width: 0, height: 4}, elevation: 2},
  movieHeader: {flexDirection: 'row'},
  posterWrap: {width: 96, height: 137, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e7edf2'},
  poster: {width: '100%', height: '100%', resizeMode: 'cover'},
  earlyRibbon: {position: 'absolute', right: -25, top: 11, width: 86, height: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: ORANGE, transform: [{rotate: '45deg'}]},
  earlyRibbonText: {fontSize: 7, color: '#fff', fontWeight: '900'},
  ageBadge: {position: 'absolute', top: 6, left: 6, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2},
  ageText: {fontSize: 9, color: '#fff', fontWeight: '900'},
  movieInfo: {flex: 1, paddingLeft: 12, paddingTop: 2},
  movieTitle: {fontSize: 18, lineHeight: 22, color: '#142437', fontWeight: '900'},
  movieMeta: {fontSize: 11, lineHeight: 16, color: '#718096', marginTop: 6},
  ratingRow: {flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9},
  rating: {fontSize: 11, color: '#d99800', fontWeight: '900'},
  hotText: {fontSize: 8, color: '#fff', fontWeight: '900', backgroundColor: ORANGE, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3},
  detailLink: {fontSize: 10, color: BLUE, fontWeight: '900', marginTop: 12},
  divider: {height: 1, backgroundColor: '#edf1f5', marginVertical: 12},
  chooseLabel: {fontSize: 9, color: '#7b899a', fontWeight: '900', marginBottom: 8},
  timeGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  timeButton: {minWidth: 105, backgroundColor: '#fff8f1', borderWidth: 1, borderColor: '#ffd3ad', borderRadius: 11, paddingHorizontal: 9, paddingVertical: 8},
  timeTop: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  timeValue: {fontSize: 15, color: '#ce5600', fontWeight: '900'},
  timeType: {fontSize: 8, color: '#fff', fontWeight: '900', backgroundColor: ORANGE, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2},
  roomName: {fontSize: 8, color: '#8b796d', marginTop: 4},
  price: {fontSize: 9, color: '#5f4b3c', fontWeight: '800', marginTop: 3},
});

export default SuatChieuSom;

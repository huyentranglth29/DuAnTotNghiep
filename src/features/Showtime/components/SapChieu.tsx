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
import {useMoviesSapChieu} from '../../../hooks/useMovies';
import {MovieBookingInfo} from './MovieName';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';

const BLUE = '#00689d';
const PINK = '#ec197e';

type SapChieuProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function getRelease(value?: string) {
  if (!value) return {label: 'Sắp công bố', month: 'MỚI', days: null};
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {label: value, month: 'MỚI', days: null};
  }
  const days = Math.ceil((date.getTime() - Date.now()) / 86_400_000);
  return {
    label: date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }),
    month: `THÁNG ${date.getMonth() + 1}`,
    days,
  };
}

function SapChieu({onMoviePress}: SapChieuProps) {
  const {data, isLoading, isError, refetch, isFetching} = useMoviesSapChieu();
  const movies = data ?? [];
  const genres = useMemo(
    () => [
      'Tất cả',
      ...Array.from(
        new Set(
          movies
            .flatMap(movie => String(movie.theLoai || '').split(','))
            .map(item => item.trim())
            .filter(Boolean),
        ),
      ),
    ],
    [movies],
  );
  const [genre, setGenre] = useState('Tất cả');
  const visibleMovies =
    genre === 'Tất cả'
      ? movies
      : movies.filter(movie =>
          String(movie.theLoai || '')
            .toLowerCase()
            .includes(genre.toLowerCase()),
        );

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroCircle} />
        <Text style={styles.eyebrow}>SẮP RA MẮT TẠI FILMGO</Text>
        <Text style={styles.heading}>Phim sắp chiếu</Text>
        <Text style={styles.subheading}>
          Khám phá trước những bộ phim đáng mong chờ
        </Text>
        <View style={styles.heroStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{movies.length}</Text>
            <Text style={styles.statLabel}>phim mới</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>FilmGo</Text>
            <Text style={styles.statLabel}>Hà Trung</Text>
          </View>
        </View>
      </View>

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
          <Text style={styles.stateTitle}>Không tải được phim sắp chiếu</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : visibleMovies.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.emptyIcon}>⏳</Text>
          <Text style={styles.stateTitle}>Chưa có phim phù hợp</Text>
          <Text style={styles.stateHint}>
            Chọn thể loại khác hoặc thêm phim trên Admin.
          </Text>
        </View>
      ) : (
        <View style={styles.movieList}>
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Danh sách sắp ra mắt</Text>
            <Text style={styles.dataLabel}>● Từ Admin</Text>
          </View>
          {visibleMovies.map((phim, index) => {
            const release = getRelease(phim.ngayPhatHanh);
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
                        Còn {release.days} ngày
                      </Text>
                    )}
                  </View>
                  <Text numberOfLines={2} style={styles.movieTitle}>
                    {phim.tieuDe}
                  </Text>
                  <Text numberOfLines={2} style={styles.movieMeta}>
                    {phim.theLoai || 'Đang cập nhật'} ·{' '}
                    {phim.thoiLuong || '—'}
                  </Text>
                  <View style={styles.releaseBox}>
                    <Text style={styles.calendarIcon}>▣</Text>
                    <View>
                      <Text style={styles.releaseLabel}>Dự kiến khởi chiếu</Text>
                      <Text style={styles.releaseDate}>{release.label}</Text>
                    </View>
                  </View>
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
  container: {backgroundColor: '#f4f7fa', minHeight: 700, paddingBottom: 28},
  hero: {
    backgroundColor: '#073b5b',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  heroCircle: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -45,
    top: -55,
    backgroundColor: 'rgba(25,160,218,0.22)',
  },
  eyebrow: {color: '#63cff5', fontSize: 10, fontWeight: '900', letterSpacing: 1.1},
  heading: {color: '#fff', fontSize: 27, fontWeight: '900', marginTop: 3},
  subheading: {color: '#c2d8e5', fontSize: 13, marginTop: 5},
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 17,
    alignSelf: 'flex-start',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.11)',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statItem: {alignItems: 'center', minWidth: 65},
  statValue: {color: '#fff', fontSize: 14, fontWeight: '900'},
  statLabel: {color: '#a9c7d8', fontSize: 9, marginTop: 2},
  statDivider: {height: 28, width: 1, backgroundColor: '#5f8194', marginHorizontal: 8},
  filterList: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    gap: 8,
    alignItems: 'center',
  },
  filterScroll: {
    height: 68,
    flexGrow: 0,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: '#d4dfe7',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: '#fff',
    height: 38,
    justifyContent: 'center',
  },
  filterChipActive: {backgroundColor: '#e7f5fb', borderColor: BLUE},
  filterText: {color: '#728296', fontSize: 11, fontWeight: '800'},
  filterTextActive: {color: BLUE},
  loader: {marginTop: 45},
  stateBox: {paddingHorizontal: 24, paddingVertical: 55, alignItems: 'center'},
  emptyIcon: {fontSize: 38, marginBottom: 10},
  stateTitle: {fontSize: 17, fontWeight: '900', color: '#172a3f', textAlign: 'center'},
  stateHint: {fontSize: 13, color: '#718096', textAlign: 'center', marginTop: 6},
  retryBtn: {marginTop: 14, backgroundColor: BLUE, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10},
  retryText: {color: '#fff', fontWeight: '800'},
  movieList: {paddingHorizontal: 14},
  sectionRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10},
  sectionTitle: {fontSize: 18, color: '#172a3f', fontWeight: '900'},
  dataLabel: {fontSize: 10, color: '#20a464', fontWeight: '800'},
  movieCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 11,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#e1e9ef',
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 7,
    shadowOffset: {width: 0, height: 3},
    elevation: 2,
  },
  posterWrap: {width: 106, height: 151, borderRadius: 12, overflow: 'hidden', backgroundColor: '#e7edf2'},
  poster: {width: '100%', height: '100%', resizeMode: 'cover'},
  ageBadge: {position: 'absolute', top: 6, left: 6, borderRadius: 5, minWidth: 31, paddingHorizontal: 5, paddingVertical: 2},
  ageText: {fontSize: 10, color: '#fff', fontWeight: '900', textAlign: 'center'},
  orderBadge: {position: 'absolute', right: 6, bottom: 6, width: 29, height: 29, borderRadius: 15, backgroundColor: 'rgba(4,32,49,0.82)', alignItems: 'center', justifyContent: 'center'},
  orderText: {color: '#fff', fontSize: 10, fontWeight: '900'},
  movieInfo: {flex: 1, paddingLeft: 12, paddingTop: 1},
  releaseRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'},
  monthBadge: {backgroundColor: '#fff0f7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3},
  monthText: {fontSize: 9, color: PINK, fontWeight: '900'},
  countdown: {fontSize: 9, color: '#e18400', fontWeight: '800'},
  movieTitle: {fontSize: 17, lineHeight: 21, color: '#142437', fontWeight: '900', marginTop: 8},
  movieMeta: {fontSize: 11, lineHeight: 16, color: '#718096', marginTop: 5},
  releaseBox: {flexDirection: 'row', alignItems: 'center', backgroundColor: '#f4f9fc', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 7, marginTop: 10},
  calendarIcon: {color: BLUE, fontSize: 15, marginRight: 7},
  releaseLabel: {fontSize: 8, color: '#8b9aac', fontWeight: '700'},
  releaseDate: {fontSize: 10, color: BLUE, fontWeight: '900', marginTop: 1},
  detailLink: {fontSize: 10, color: PINK, fontWeight: '900', marginTop: 9},
  refreshHint: {textAlign: 'center', fontSize: 11, color: '#94a3b8'},
});

export default SapChieu;

import React, {useMemo} from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useMoviesDangChieu} from '../../../hooks/useMovies';
import {MovieBookingInfo} from './MovieName';
import PromoCarousel from './PromoCarousel';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';

type SuatChieuSomProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

/** Suất chiếu sớm: ưu tiên phim đang chiếu được gắn HOT từ Admin */
function SuatChieuSom({onMoviePress}: SuatChieuSomProps) {
  const {data, isLoading, isError, refetch} = useMoviesDangChieu();
  const movies = useMemo(() => {
    const list = data ?? [];
    const hot = list.filter(p => p.laPhimHot);
    return hot.length ? hot : list;
  }, [data]);

  return (
    <View style={styles.container}>
      <PromoCarousel />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#005f98" />
      ) : isError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Không tải được phim</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.movieGrid}>
          {movies.map(phim => {
            const movie = phimSangBooking(phim);
            const age = phim.nhanTuoi || 'T13';
            return (
              <TouchableOpacity
                key={String(phim.id)}
                activeOpacity={0.85}
                style={styles.movieCard}
                onPress={() => onMoviePress(movie)}>
                <View style={styles.posterWrap}>
                  <Image
                    source={{uri: phim.posterUrl}}
                    style={styles.moviePoster}
                  />
                  <View
                    style={[
                      styles.ageBadge,
                      {backgroundColor: layMauNhanTuoi(age)},
                    ]}>
                    <Text style={styles.ageText}>{age}</Text>
                  </View>
                </View>
                <Text numberOfLines={1} style={styles.movieTitle}>
                  {phim.tieuDe}
                </Text>
                <Text style={styles.movieDuration}>
                  {phim.thoiLuong || '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    minHeight: 700,
    paddingBottom: 24,
  },
  loader: {marginTop: 40},
  stateBox: {
    marginTop: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#005f98',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {color: '#fff', fontWeight: '700'},
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 10,
    paddingTop: 18,
  },
  movieCard: {
    width: '31.7%',
  },
  posterWrap: {
    aspectRatio: 0.68,
    borderRadius: 5,
    backgroundColor: '#e9eef3',
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ageBadge: {
    position: 'absolute',
    left: 7,
    top: 7,
    minWidth: 37,
    borderRadius: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  ageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  movieTitle: {
    color: '#242424',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  movieDuration: {
    color: '#9b9b9b',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default SuatChieuSom;

import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useMoviesSapChieu} from '../../../hooks/useMovies';
import {MovieBookingInfo} from './MovieName';
import PromoCarousel from './PromoCarousel';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';

type SapChieuProps = {
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function formatDate(value?: string) {
  if (!value) return 'Sắp ra mắt';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('vi-VN');
}

function SapChieu({onMoviePress}: SapChieuProps) {
  const {data, isLoading, isError, refetch} = useMoviesSapChieu();
  const movies = data ?? [];

  return (
    <View style={styles.container}>
      <PromoCarousel />

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color="#005f98" />
      ) : isError ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Không tải được phim từ server</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Chưa có phim sắp chiếu</Text>
          <Text style={styles.stateHint}>
            Thêm phim trạng thái Sắp chiếu trên Admin.
          </Text>
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
                  {phim.laPhimHot && (
                    <View style={styles.hotRibbon}>
                      <Text style={styles.hotText}>HOT</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.movieDate}>
                  {formatDate(phim.ngayPhatHanh)}
                </Text>
                <Text numberOfLines={2} style={styles.movieTitle}>
                  {phim.tieuDe}
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
    paddingBottom: 18,
  },
  loader: {
    marginTop: 40,
  },
  stateBox: {
    marginTop: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  stateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  stateHint: {
    marginTop: 6,
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 14,
    backgroundColor: '#005f98',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '700',
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 18,
  },
  movieCard: {
    width: '31.7%',
    marginBottom: 26,
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
  hotRibbon: {
    position: 'absolute',
    right: -27,
    top: 10,
    width: 86,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff6d16',
    transform: [{rotate: '45deg'}],
  },
  hotText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  movieDate: {
    color: '#22a8e8',
    fontSize: 13,
    fontWeight: '900',
    marginTop: 8,
    textAlign: 'center',
  },
  movieTitle: {
    color: '#242424',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
    marginTop: 5,
    textAlign: 'center',
  },
});

export default SapChieu;

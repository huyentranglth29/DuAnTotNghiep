import React from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useTimKiemPhim} from '../../../hooks/useMovies';
import {Phim} from '../../../types/phim';
import {MovieBookingInfo} from './MovieName';
import {layMauNhanTuoi, phimSangBooking} from './phimUtils';

const BLUE = '#005f98';

type KetQuaTimKiemProps = {
  tuKhoa: string;
  trangThai?: Phim['trangThai'];
  onMoviePress: (movie: MovieBookingInfo) => void;
};

function KetQuaTimKiem({tuKhoa, trangThai, onMoviePress}: KetQuaTimKiemProps) {
  const ketQua = useTimKiemPhim(tuKhoa, trangThai);
  const danhSach = ketQua.data ?? [];

  if (tuKhoa.trim().length < 2) {
    return (
      <View style={styles.hintBox}>
        <Text style={styles.hintText}>Nhập ít nhất 2 ký tự để tìm phim</Text>
      </View>
    );
  }

  if (ketQua.isLoading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color={BLUE} size="large" />
        <Text style={styles.loadingText}>Đang tìm...</Text>
      </View>
    );
  }

  if (ketQua.error) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.errorText}>Không thể tìm phim. Kiểm tra kết nối backend.</Text>
        <TouchableOpacity activeOpacity={0.75} onPress={() => ketQua.refetch()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (danhSach.length === 0) {
    return (
      <View style={styles.centerBox}>
        <Text style={styles.emptyText}>Không tìm thấy phim "{tuKhoa.trim()}"</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.resultTitle}>KẾT QUẢ ({danhSach.length})</Text>
      <View style={styles.movieGrid}>
        {danhSach.map(phim => {
          const age = phim.nhanTuoi ?? 'T13';
          return (
            <TouchableOpacity
              key={String(phim.id)}
              activeOpacity={0.85}
              style={styles.movieCard}
              onPress={() => onMoviePress(phimSangBooking(phim))}>
              <View style={styles.posterWrap}>
                <Image source={{uri: phim.posterUrl}} style={styles.moviePoster} />
                <View
                  style={[
                    styles.ageBadge,
                    {backgroundColor: layMauNhanTuoi(phim.nhanTuoi)},
                  ]}>
                  <Text style={styles.ageText}>{age}</Text>
                </View>
                {phim.laPhimHot && (
                  <View style={styles.hotRibbon}>
                    <Text style={styles.hotText}>HOT</Text>
                  </View>
                )}
              </View>
              <Text numberOfLines={2} style={styles.movieTitle}>
                {phim.tieuDe}
              </Text>
              <Text style={styles.movieDuration}>{phim.thoiLuong}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    paddingBottom: 18,
  },
  resultTitle: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 4,
  },
  hintBox: {
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  hintText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  centerBox: {
    paddingVertical: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#666666',
    fontSize: 14,
    marginTop: 10,
  },
  errorText: {
    color: '#d14343',
    fontSize: 14,
    textAlign: 'center',
  },
  retryText: {
    color: BLUE,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },
  movieGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  movieCard: {
    width: '31.7%',
    marginBottom: 28,
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

export default KetQuaTimKiem;

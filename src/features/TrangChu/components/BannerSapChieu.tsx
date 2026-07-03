import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BO_TRON, KHOANG_CACH, MAU_CHU_DE} from '../../../theme/cinemaNoir';
import {Phim} from '../../../types/phim';

type BannerSapChieuProps = {
  phim: Phim;
  onNhan?: () => void;
};

function BannerSapChieu({phim, onNhan}: BannerSapChieuProps) {
  const anhNen = phim.anhNen ?? phim.posterUrl;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      style={styles.khung}
      onPress={onNhan}
      disabled={!onNhan}>
      <ImageBackground
        source={{uri: anhNen}}
        style={styles.anhNen}
        imageStyle={styles.anhNenStyle}>
        <View style={styles.lopPhu} />
        <View style={styles.noiDung}>
          <Text style={styles.nhan}>SẮP CÔNG CHIẾU</Text>
          <Text numberOfLines={2} style={styles.tieuDe}>
            {phim.tieuDe}
          </Text>
          <Text style={styles.meta}>
            {phim.theLoai} • {phim.ngayPhatHanh ?? 'Sắp ra mắt'}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  khung: {
    marginHorizontal: KHOANG_CACH.lon,
    marginBottom: KHOANG_CACH.lon,
    borderRadius: BO_TRON.the,
    overflow: 'hidden',
  },
  anhNen: {
    height: 160,
    justifyContent: 'flex-end',
  },
  anhNenStyle: {
    resizeMode: 'cover',
  },
  lopPhu: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  noiDung: {
    padding: KHOANG_CACH.lon,
  },
  nhan: {
    color: MAU_CHU_DE.vangDong,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tieuDe: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 22,
    fontWeight: '900',
  },
  meta: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 13,
    marginTop: 4,
  },
});

export default BannerSapChieu;

import React from 'react';
import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NutBam} from '../../../components/shared';
import {BO_TRON, KHOANG_CACH, MAU_CHU_DE} from '../../../theme/cinemaNoir';
import {Phim} from '../../../types/phim';

type HeroPhimProps = {
  phim: Phim;
  onDatVe?: () => void;
};

function HeroPhim({phim, onDatVe}: HeroPhimProps) {
  const anhNen = phim.anhNen ?? phim.posterUrl;

  return (
    <View style={styles.khung}>
      <ImageBackground
        source={{uri: anhNen}}
        style={styles.anhNen}
        imageStyle={styles.anhNenStyle}>
        <View style={styles.lopPhu} />

        <View style={styles.noiDung}>
          <View style={styles.nhanPremiere}>
            <Text style={styles.chuPremiere}>PREMIERE</Text>
          </View>

          <Text numberOfLines={2} style={styles.tieuDe}>
            {phim.tieuDe}
          </Text>

          <Text style={styles.meta}>
            ★ {phim.diemDanhGia.toFixed(1)} • {phim.theLoai} • {phim.thoiLuong}
          </Text>

          <NutBam
            nhan="Đặt vé ngay"
            kieu="chinh"
            onNhan={onDatVe}
            styleTuyChinh={styles.nutDatVe}
          />
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  khung: {
    marginHorizontal: KHOANG_CACH.lon,
    marginBottom: KHOANG_CACH.ratLon,
    borderRadius: BO_TRON.the,
    overflow: 'hidden',
  },
  anhNen: {
    height: 220,
    justifyContent: 'flex-end',
  },
  anhNenStyle: {
    resizeMode: 'cover',
  },
  lopPhu: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  noiDung: {
    padding: KHOANG_CACH.lon,
  },
  nhanPremiere: {
    alignSelf: 'flex-start',
    backgroundColor: MAU_CHU_DE.doAccent,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: KHOANG_CACH.nho,
  },
  chuPremiere: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },
  tieuDe: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  meta: {
    color: MAU_CHU_DE.vangDong,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: KHOANG_CACH.vua,
  },
  nutDatVe: {
    alignSelf: 'flex-start',
    paddingHorizontal: KHOANG_CACH.lon,
    minHeight: 44,
    paddingVertical: 10,
  },
});

export default HeroPhim;

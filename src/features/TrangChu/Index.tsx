import React, {useCallback} from 'react';
import {
  FlatList,
  ListRenderItem,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {ThePhim, TieuDeMuc} from '../../components/shared';
import {
  useMoviesDangChieu,
  useMoviesSapChieu,
  usePhimNoiBat,
} from '../../hooks/useMovies';
import {KHOANG_CACH, MAU_CHU_DE} from '../../theme/cinemaNoir';
import {Phim} from '../../types/phim';
import BannerSapChieu from './components/BannerSapChieu';
import HanhDongNhanh from './components/HanhDongNhanh';
import HeroPhim from './components/HeroPhim';
import TrangThaiTai from './components/TrangThaiTai';

const CHIEU_RONG_THE = 140;

function TrangChu() {
  const phimNoiBat = usePhimNoiBat();
  const phimDangChieu = useMoviesDangChieu();
  const phimSapChieu = useMoviesSapChieu();

  const dangTai =
    phimNoiBat.isLoading ||
    phimDangChieu.isLoading ||
    phimSapChieu.isLoading;

  const loi = phimNoiBat.error ?? phimDangChieu.error ?? phimSapChieu.error;

  const thuLai = useCallback(() => {
    phimNoiBat.refetch();
    phimDangChieu.refetch();
    phimSapChieu.refetch();
  }, [phimNoiBat, phimDangChieu, phimSapChieu]);

  const phimHero = phimNoiBat.data?.[0];
  const danhSachDangChieu = phimDangChieu.data ?? [];
  const danhSachSapChieu = phimSapChieu.data ?? [];
  const phimBannerSapChieu = danhSachSapChieu[0];
  const phimSapChieuConLai = danhSachSapChieu.slice(1);

  const renderTheDangChieu: ListRenderItem<Phim> = useCallback(
    ({item}) => (
      <ThePhim phim={item} chieuRong={CHIEU_RONG_THE} onNhan={() => {}} />
    ),
    [],
  );

  const renderTheSapChieu: ListRenderItem<Phim> = useCallback(
    ({item}) => (
      <ThePhim phim={item} chieuRong={CHIEU_RONG_THE} onNhan={() => {}} />
    ),
    [],
  );

  const khoaPhim = useCallback((item: Phim) => String(item.id), []);

  return (
    <View style={styles.khungChinh}>
      <StatusBar barStyle="light-content" backgroundColor={MAU_CHU_DE.nenChinh} />

      <TrangThaiTai dangTai={dangTai} loi={loi} onThuLai={thuLai}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.noiDungCuon}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.logoVang}>CINE</Text>
              <Text style={styles.logoDo}>PRESTIGE</Text>
            </View>
            <TouchableOpacity activeOpacity={0.75} style={styles.nutTim}>
              <Text style={styles.iconTim}>⌕</Text>
            </TouchableOpacity>
          </View>

          {/* Hero phim nổi bật */}
          {phimHero && <HeroPhim phim={phimHero} />}

          {/* Hành động nhanh */}
          <HanhDongNhanh />

          {/* Now Showing — FlatList ngang */}
          <TieuDeMuc tieuDe="NOW SHOWING" coXemTatCa nhanXemTatCa="SEE ALL" />
          <FlatList
            data={danhSachDangChieu}
            keyExtractor={khoaPhim}
            renderItem={renderTheDangChieu}
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.danhSachNgang}
            ListEmptyComponent={
              !phimDangChieu.isLoading ? (
                <Text style={styles.rong}>Chưa có phim đang chiếu</Text>
              ) : null
            }
          />

          {/* Coming Soon */}
          <TieuDeMuc tieuDe="COMING SOON" coXemTatCa nhanXemTatCa="SEE ALL" />

          {phimBannerSapChieu && (
            <BannerSapChieu phim={phimBannerSapChieu} />
          )}

          {phimSapChieuConLai.length > 0 && (
            <>
              <Text style={styles.phuDeMuc}>Phim sắp ra mắt</Text>
              <FlatList
                data={phimSapChieuConLai}
                keyExtractor={khoaPhim}
                renderItem={renderTheSapChieu}
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.danhSachNgang}
              />
            </>
          )}

          {!phimSapChieu.isLoading && danhSachSapChieu.length === 0 && (
            <Text style={styles.rong}>Chưa có phim sắp chiếu</Text>
          )}
        </ScrollView>
      </TrangThaiTai>
    </View>
  );
}

const styles = StyleSheet.create({
  khungChinh: {
    flex: 1,
    backgroundColor: MAU_CHU_DE.nenChinh,
  },
  noiDungCuon: {
    paddingTop: KHOANG_CACH.nho,
    paddingBottom: KHOANG_CACH.ratLon,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: KHOANG_CACH.lon,
    marginBottom: KHOANG_CACH.lon,
  },
  logoVang: {
    color: MAU_CHU_DE.vangDong,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 24,
  },
  logoDo: {
    color: MAU_CHU_DE.doAccent,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginTop: -2,
  },
  nutTim: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: MAU_CHU_DE.vienNhe,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTim: {
    color: MAU_CHU_DE.vangDong,
    fontSize: 22,
    fontWeight: '700',
  },
  danhSachNgang: {
    paddingHorizontal: KHOANG_CACH.lon,
    paddingBottom: KHOANG_CACH.ratLon,
  },
  phuDeMuc: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: KHOANG_CACH.lon,
    marginBottom: KHOANG_CACH.vua,
  },
  rong: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 14,
    paddingHorizontal: KHOANG_CACH.lon,
    paddingBottom: KHOANG_CACH.lon,
  },
});

export default TrangChu;

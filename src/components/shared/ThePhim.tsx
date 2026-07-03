import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {BO_TRON, KHOANG_CACH, MAU_CHU_DE} from '../../theme/cinemaNoir';
import {Phim} from '../../types/phim';

export type ThePhimProps = {
  /** Dữ liệu phim đầy đủ — ưu tiên nếu truyền */
  phim?: Phim;
  /** Poster: URL string hoặc require() local */
  anhPoster?: string | ImageSourcePropType;
  tieuDe?: string;
  diemDanhGia?: number;
  /** Dòng phụ, vd: "Action • 2h 10m" */
  phuDe?: string;
  /** Hiển thị viền vàng (card đang focus) */
  duocChon?: boolean;
  /** Chiều rộng card — mặc định 140 */
  chieuRong?: number;
  onNhan?: () => void;
};

function layNguonAnh(nguon?: string | ImageSourcePropType) {
  if (!nguon) {
    return undefined;
  }

  if (typeof nguon === 'string') {
    return {uri: nguon};
  }

  return nguon;
}

function taoPhuDeTuPhim(phim: Phim): string {
  return `${phim.theLoai} • ${phim.thoiLuong}`;
}

function ThePhim({
  phim,
  anhPoster,
  tieuDe,
  diemDanhGia,
  phuDe,
  duocChon = false,
  chieuRong = 140,
  onNhan,
}: ThePhimProps) {
  const tenPhim = phim?.tieuDe ?? tieuDe ?? '';
  const diem = phim?.diemDanhGia ?? diemDanhGia;
  const dongPhu = phim ? taoPhuDeTuPhim(phim) : phuDe ?? '';
  const nguonAnh = layNguonAnh(phim?.posterUrl ?? anhPoster);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={[styles.the, {width: chieuRong}, duocChon && styles.theDuocChon]}
      onPress={onNhan}
      disabled={!onNhan}>
      <View style={styles.khungPoster}>
        {nguonAnh ? (
          <Image source={nguonAnh} style={styles.anhPoster} />
        ) : (
          <View style={styles.anhTrong} />
        )}

        {diem !== undefined && (
          <View style={styles.huyHieuDiem}>
            <Text style={styles.iconSao}>★</Text>
            <Text style={styles.textDiem}>{diem.toFixed(1)}</Text>
          </View>
        )}
      </View>

      <Text numberOfLines={2} style={styles.tieuDe}>
        {tenPhim}
      </Text>

      {dongPhu.length > 0 && (
        <Text numberOfLines={1} style={styles.phuDe}>
          {dongPhu}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  the: {
    marginRight: KHOANG_CACH.vua,
  },
  theDuocChon: {
    borderWidth: 1.5,
    borderColor: MAU_CHU_DE.vienVang,
    borderRadius: BO_TRON.the + 2,
    padding: 2,
  },
  khungPoster: {
    aspectRatio: 0.68,
    borderRadius: BO_TRON.the,
    backgroundColor: MAU_CHU_DE.nenThe,
    overflow: 'hidden',
  },
  anhPoster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  anhTrong: {
    flex: 1,
    backgroundColor: MAU_CHU_DE.nenThe,
  },
  huyHieuDiem: {
    position: 'absolute',
    top: KHOANG_CACH.nho,
    right: KHOANG_CACH.nho,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: MAU_CHU_DE.nenBadge,
    borderRadius: BO_TRON.badge,
    paddingHorizontal: 6,
    paddingVertical: 3,
    gap: 3,
  },
  iconSao: {
    color: MAU_CHU_DE.vangDong,
    fontSize: 11,
  },
  textDiem: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 12,
    fontWeight: '700',
  },
  tieuDe: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 14,
    fontWeight: '800',
    marginTop: KHOANG_CACH.nho,
    lineHeight: 18,
  },
  phuDe: {
    color: MAU_CHU_DE.vangNhat,
    fontSize: 12,
    marginTop: 4,
  },
});

export default ThePhim;

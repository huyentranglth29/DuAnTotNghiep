import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import {BO_TRON, KHOANG_CACH, MAU_CHU_DE} from '../../theme/cinemaNoir';

export type KieuNutBam = 'chinh' | 'phu' | 'tab';

export type NutBamProps = {
  /** Nội dung hiển thị trên nút */
  nhan: string;
  /** Kiểu nút: chính (đỏ), phụ (viền), tab (pill) */
  kieu?: KieuNutBam;
  /** Tab đang active — chỉ áp dụng khi kieu = 'tab' */
  dangChon?: boolean;
  /** Icon/text bên trái nhãn */
  bieuTuongTrai?: React.ReactNode;
  onNhan?: () => void;
  voHieu?: boolean;
  styleTuyChinh?: ViewStyle;
};

function NutBam({
  nhan,
  kieu = 'chinh',
  dangChon = false,
  bieuTuongTrai,
  onNhan,
  voHieu = false,
  styleTuyChinh,
}: NutBamProps) {
  const kieuNut =
    kieu === 'tab'
      ? dangChon
        ? styles.tabDangChon
        : styles.tabThuong
      : kieu === 'phu'
        ? styles.phu
        : styles.chinh;

  const kieuChu =
    kieu === 'tab'
      ? dangChon
        ? styles.chuTabDangChon
        : styles.chuTabThuong
      : kieu === 'phu'
        ? styles.chuPhu
        : styles.chuChinh;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.coBan, kieuNut, voHieu && styles.voHieu, styleTuyChinh]}
      onPress={onNhan}
      disabled={voHieu || !onNhan}>
      <View style={styles.noiDung}>
        {bieuTuongTrai}
        <Text style={[styles.nhan, kieuChu]}>{nhan}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  coBan: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  noiDung: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: KHOANG_CACH.nho,
  },
  chinh: {
    backgroundColor: MAU_CHU_DE.doAccent,
    borderRadius: BO_TRON.nut,
    paddingHorizontal: KHOANG_CACH.ratLon,
    paddingVertical: 14,
    minHeight: 52,
  },
  phu: {
    backgroundColor: MAU_CHU_DE.nenNutPhu,
    borderWidth: 1,
    borderColor: MAU_CHU_DE.vienNhe,
    borderRadius: BO_TRON.nut,
    paddingHorizontal: KHOANG_CACH.ratLon,
    paddingVertical: 14,
    minHeight: 52,
  },
  tabThuong: {
    backgroundColor: MAU_CHU_DE.nenThe,
    borderRadius: BO_TRON.tab,
    paddingHorizontal: KHOANG_CACH.lon,
    paddingVertical: KHOANG_CACH.nho,
  },
  tabDangChon: {
    backgroundColor: MAU_CHU_DE.doAccent,
    borderRadius: BO_TRON.tab,
    paddingHorizontal: KHOANG_CACH.lon,
    paddingVertical: KHOANG_CACH.nho,
  },
  chuChinh: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 16,
    fontWeight: '800',
  },
  chuPhu: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 15,
    fontWeight: '700',
  },
  chuTabThuong: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 13,
    fontWeight: '700',
  },
  chuTabDangChon: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 13,
    fontWeight: '800',
  },
  nhan: {
    textAlign: 'center',
  },
  voHieu: {
    opacity: 0.45,
  },
});

export default NutBam;

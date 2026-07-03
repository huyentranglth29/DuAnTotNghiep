import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {NutBam} from '../../../components/shared';
import {KHOANG_CACH, MAU_CHU_DE} from '../../../theme/cinemaNoir';

type TrangThaiTaiProps = {
  /** true = đang tải dữ liệu */
  dangTai?: boolean;
  /** Thông báo lỗi — hiển thị màn hình lỗi nếu có */
  loi?: Error | null;
  onThuLai?: () => void;
  children: React.ReactNode;
};

function TrangThaiTai({
  dangTai = false,
  loi,
  onThuLai,
  children,
}: TrangThaiTaiProps) {
  if (dangTai) {
    return (
      <View style={styles.khung}>
        <ActivityIndicator size="large" color={MAU_CHU_DE.vangDong} />
        <Text style={styles.chuGoiY}>Đang tải phim...</Text>
      </View>
    );
  }

  if (loi) {
    return (
      <View style={styles.khung}>
        <Text style={styles.tieuDeLoi}>Không tải được dữ liệu</Text>
        <Text style={styles.chiTietLoi}>{loi.message}</Text>
        <NutBam
          nhan="Thử lại"
          kieu="phu"
          onNhan={onThuLai}
          styleTuyChinh={styles.nutThuLai}
        />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  khung: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MAU_CHU_DE.nenChinh,
    paddingHorizontal: KHOANG_CACH.ratLon,
  },
  chuGoiY: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 15,
    marginTop: KHOANG_CACH.lon,
  },
  tieuDeLoi: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  chiTietLoi: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 14,
    marginTop: KHOANG_CACH.nho,
    textAlign: 'center',
    lineHeight: 20,
  },
  nutThuLai: {
    marginTop: KHOANG_CACH.ratLon,
    minWidth: 160,
  },
});

export default TrangThaiTai;

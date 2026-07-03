import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {KHOANG_CACH, MAU_CHU_DE} from '../../theme/cinemaNoir';

export type TieuDeMucProps = {
  /** Tiêu đề section, vd: "Now Showing" */
  tieuDe: string;
  /** Có hiển thị nút "SEE ALL" bên phải */
  coXemTatCa?: boolean;
  /** Nhãn nút xem tất cả */
  nhanXemTatCa?: string;
  onXemTatCa?: () => void;
};

function TieuDeMuc({
  tieuDe,
  coXemTatCa = false,
  nhanXemTatCa = 'SEE ALL',
  onXemTatCa,
}: TieuDeMucProps) {
  return (
    <View style={styles.khung}>
      <Text style={styles.tieuDe}>{tieuDe}</Text>

      {coXemTatCa && (
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={onXemTatCa}
          disabled={!onXemTatCa}>
          <Text style={styles.nutXemTatCa}>{nhanXemTatCa}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  khung: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: KHOANG_CACH.lon,
    marginBottom: KHOANG_CACH.vua,
  },
  tieuDe: {
    color: MAU_CHU_DE.chuChinh,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  nutXemTatCa: {
    color: MAU_CHU_DE.vangDong,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default TieuDeMuc;

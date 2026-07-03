import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {KHOANG_CACH, MAU_CHU_DE} from '../../../theme/cinemaNoir';

type MucHanhDong = {
  id: string;
  nhan: string;
  bieuTuong: string;
};

const DANH_SACH_HANH_DONG: MucHanhDong[] = [
  {id: 'suat-chieu', nhan: 'Suất chiếu', bieuTuong: '🎬'},
  {id: 'hoi-vien', nhan: 'Hội viên', bieuTuong: '👑'},
  {id: 'thong-tin', nhan: 'Thông tin', bieuTuong: 'ℹ️'},
  {id: 'ho-tro-ai', nhan: 'Hỗ trợ AI', bieuTuong: '✦'},
];

type HanhDongNhanhProps = {
  onChon?: (id: string) => void;
};

function HanhDongNhanh({onChon}: HanhDongNhanhProps) {
  return (
    <View style={styles.khung}>
      {DANH_SACH_HANH_DONG.map(muc => (
        <TouchableOpacity
          key={muc.id}
          activeOpacity={0.8}
          style={styles.muc}
          onPress={() => onChon?.(muc.id)}>
          <View style={styles.vongTron}>
            <Text style={styles.bieuTuong}>{muc.bieuTuong}</Text>
          </View>
          <Text style={styles.nhan}>{muc.nhan}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  khung: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: KHOANG_CACH.lon,
    marginBottom: KHOANG_CACH.ratLon,
  },
  muc: {
    alignItems: 'center',
    flex: 1,
  },
  vongTron: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: MAU_CHU_DE.vangDong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: MAU_CHU_DE.nenThe,
  },
  bieuTuong: {
    fontSize: 22,
  },
  nhan: {
    color: MAU_CHU_DE.chuPhu,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
});

export default HanhDongNhanh;

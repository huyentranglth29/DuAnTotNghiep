import React from 'react';
import {StatusBar, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {VOUCHER_BLUE, VOUCHER_TEXT} from '../constants';
import {GiftIcon, HistoryIcon, PlusIcon} from '../components/VoucherActionIcons';

type MyVoucherScreenProps = {
  onAddVoucher: () => void;
  onOpenHistory: () => void;
};

function MyVoucherScreen({
  onAddVoucher,
  onOpenHistory,
}: MyVoucherScreenProps) {
  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor={VOUCHER_BLUE} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>VOUCHER CỦA TÔI</Text>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerIconButton}
          onPress={onAddVoucher}>
          <PlusIcon color="#ffffff" size={31} strokeWidth={3} />
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.75}
          style={styles.headerIconButton}
          onPress={onOpenHistory}>
          <HistoryIcon color="#ffffff" size={34} strokeWidth={3} />
        </TouchableOpacity>
      </View>

      <View style={styles.empty}>
        <GiftIcon color="#dddddd" size={94} strokeWidth={5} />
        <Text style={styles.emptyTitle}>Kho chưa có voucher nào</Text>
        <Text style={styles.emptyDescription}>
          Bạn hãy nhận voucher miễn phí hoặc thêm voucher mới nhé
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 84,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VOUCHER_BLUE,
    paddingLeft: 20,
    paddingRight: 10,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: 0,
  },
  headerIconButton: {
    width: 51,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 48,
  },
  emptyTitle: {
    marginTop: 16,
    color: VOUCHER_TEXT,
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '900',
    textAlign: 'center',
  },
  emptyDescription: {
    marginTop: 8,
    color: '#b0b0b0',
    fontSize: 21,
    lineHeight: 28,
    textAlign: 'center',
  },
});

export default MyVoucherScreen;

import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {VOUCHER_BLUE} from '../constants';
import {BackIcon} from './VoucherActionIcons';

type VoucherHeaderProps = {
  title: string;
  onBack: () => void;
};

function VoucherHeader({title, onBack}: VoucherHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        activeOpacity={0.75}
        style={styles.backButton}
        onPress={onBack}>
        <BackIcon />
      </TouchableOpacity>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: VOUCHER_BLUE,
  },
  backButton: {
    width: 72,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 29,
    fontWeight: '900',
    letterSpacing: 0,
  },
});

export default VoucherHeader;

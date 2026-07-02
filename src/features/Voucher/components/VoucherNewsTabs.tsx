import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {VoucherNewsTab} from '../types';

const BORDER = '#eeeeee';

type VoucherNewsTabsProps = {
  activeTab: VoucherNewsTab;
  onChangeTab: (tab: VoucherNewsTab) => void;
};

function VoucherNewsTabs({activeTab, onChangeTab}: VoucherNewsTabsProps) {
  return (
    <View style={styles.tabRow}>
      <TabButton
        label="KHUYẾN MÃI MỚI"
        isActive={activeTab === 'promotions'}
        onPress={() => onChangeTab('promotions')}
      />
      <TabButton
        label="TIN BÊN LỀ"
        isActive={activeTab === 'sideNews'}
        onPress={() => onChangeTab('sideNews')}
      />
    </View>
  );
}

function TabButton({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
        {label}
      </Text>
      {isActive && <View style={styles.tabIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    height: 62,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
    backgroundColor: '#ffffff',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#b0b0b0',
    fontSize: 21,
    lineHeight: 26,
    fontWeight: '800',
  },
  tabTextActive: {
    color: '#111111',
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 3,
    backgroundColor: '#7f5b50',
  },
});

export default VoucherNewsTabs;

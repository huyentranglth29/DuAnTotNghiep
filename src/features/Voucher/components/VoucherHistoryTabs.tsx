import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {VOUCHER_BLUE} from '../constants';
import {VoucherHistoryFilter} from '../types';
import {CheckCircleIcon, ClockIcon, ListIcon} from './VoucherActionIcons';

type HistoryTabIcon = 'list' | 'check' | 'clock';

type VoucherHistoryTabsProps = {
  activeFilter: VoucherHistoryFilter;
  onChangeFilter: (filter: VoucherHistoryFilter) => void;
};

const historyTabs: {
  key: VoucherHistoryFilter;
  label: string;
  icon: HistoryTabIcon;
}[] = [
  {key: 'all', label: 'Tất cả', icon: 'list'},
  {key: 'used', label: 'Đã sử dụng', icon: 'check'},
  {key: 'expired', label: 'Hết hạn', icon: 'clock'},
];

function VoucherHistoryTabs({
  activeFilter,
  onChangeFilter,
}: VoucherHistoryTabsProps) {
  return (
    <View style={styles.wrap}>
      {historyTabs.map(tab => {
        const isActive = activeFilter === tab.key;
        const color = isActive ? '#ffffff' : '#8d8d8d';

        return (
          <TouchableOpacity
            key={tab.key}
            activeOpacity={0.78}
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onChangeFilter(tab.key)}>
            <HistoryTabIcon name={tab.icon} color={color} />
            <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function HistoryTabIcon({name, color}: {name: HistoryTabIcon; color: string}) {
  if (name === 'list') {
    return <ListIcon color={color} />;
  }

  if (name === 'check') {
    return <CheckCircleIcon color={color} size={22} strokeWidth={0} filled />;
  }

  return <ClockIcon color={color} size={23} strokeWidth={2.8} />;
}

const styles = StyleSheet.create({
  wrap: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.11,
    shadowRadius: 8,
    shadowOffset: {width: 0, height: 3},
    elevation: 4,
  },
  tab: {
    flex: 1,
    height: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabActive: {
    backgroundColor: VOUCHER_BLUE,
  },
  tabText: {
    marginLeft: 8,
    color: '#8d8d8d',
    fontSize: 19,
    lineHeight: 25,
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
});

export default VoucherHistoryTabs;

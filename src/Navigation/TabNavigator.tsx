import React, { useState } from 'react';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import Different from '../features/Different/Index';
import Promotion from '../features/Promotion/Index';
import Showtime from '../features/Showtime/Index';
import TrangChu from '../features/TrangChu/Index';
import VoucherNavigator from './VoucherNavigator';
import { MAU_CHU_DE } from '../theme/cinemaNoir';
import {useQueryClient} from '@tanstack/react-query';
import {clearAuthSession} from '../services/voucherService';

const BLUE = '#005f98';
const GRAY = '#a9afb5';
const RED_ACCENT = '#e51937';

type TabKey = 'home' | 'movieSchedule' | 'voucher' | 'member' | 'different';

type TabItem = {
  key: TabKey;
  label: string;
  icon: 'home' | 'flag' | 'ticket' | 'gift' | 'grid';
};

const tabs: TabItem[] = [
  { key: 'home', label: 'Trang chủ', icon: 'home' },
  { key: 'movieSchedule', label: 'Lịch chiếu\ntheo phim', icon: 'flag' },
  { key: 'voucher', label: 'Voucher', icon: 'ticket' },
  { key: 'member', label: 'Ưu đãi', icon: 'gift' },
  { key: 'different', label: 'Khác', icon: 'grid' },
];

function TabNavigator({onLoggedOut}: {onLoggedOut: () => void}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isVoucherDetail, setIsVoucherDetail] = useState(false);
  const [isDifferentDetail, setIsDifferentDetail] = useState(false);
  const [isPromotionDetail, setIsPromotionDetail] = useState(false);
  const [openMemberDirectly, setOpenMemberDirectly] = useState(false);

  const handleTabPress = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    setIsVoucherDetail(false);
    setIsDifferentDetail(false);
    setIsPromotionDetail(false);
    setOpenMemberDirectly(false);
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
      />
      <View style={styles.container}>
        <View style={styles.content}>
          {renderTabContent(
            activeTab,
            setIsVoucherDetail,
            setIsDifferentDetail,
            setIsPromotionDetail,
            () => {
              setOpenMemberDirectly(true);
              setActiveTab('different');
              setIsDifferentDetail(true);
            },
            openMemberDirectly,
            async () => {
              await clearAuthSession();
              queryClient.clear();
              onLoggedOut();
            },
          )}
        </View>

        {!isVoucherDetail && !isDifferentDetail && !isPromotionDetail && (
          <View style={styles.tabBar}>
            {tabs.map(tab => {
              const isActive = activeTab === tab.key;
              const color = isActive
                ? tab.key === 'home'
                  ? RED_ACCENT
                  : BLUE
                : GRAY;

              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.75}
                  style={styles.tabItem}
                  onPress={() => handleTabPress(tab.key)}>
                  <TabIcon name={tab.icon} color={color} />
                  <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function renderTabContent(
  activeTab: TabKey,
  setIsVoucherDetail: (isDetail: boolean) => void,
  setIsDifferentDetail: (isDetail: boolean) => void,
  setIsPromotionDetail: (isDetail: boolean) => void,
  onOpenMember: () => void,
  openMemberDirectly: boolean,
  onLogout: () => void,
) {
  if (activeTab === 'home') {
    return <TrangChu />;
  }

  if (activeTab === 'movieSchedule') {
    return <Showtime onOpenMember={onOpenMember} />;
  }

  if (activeTab === 'voucher') {
    return <VoucherNavigator onDetailChange={setIsVoucherDetail} />;
  }

  if (activeTab === 'member') {
    return <Promotion onDetailChange={setIsPromotionDetail} />;
  }

  return <Different initialScreen={openMemberDirectly ? 'member' : 'menu'} onDetailChange={setIsDifferentDetail} onLogout={onLogout} />;
}

function TabIcon({ name, color }: { name: TabItem['icon']; color: string }) {
  return (
    <Svg width={27} height={27} viewBox="0 0 35 35" fill="none">
      {name === 'home' && (
        <Path
          d="M6 14.5L17.5 5l11.5 9.5V29a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V14.5z"
          stroke={color}
          strokeWidth={2.5}
          strokeLinejoin="round"
          fill="none"
        />
      )}

      {name === 'flag' && (
        <G>
          <Path d="M7 7h4v22H7z" fill={color} />
          <Path d="M11 8h17v16H11z" fill={color} />
          <Path d="M18 13l7 3.5-7 3.5z" fill="#ffffff" />
        </G>
      )}

      {name === 'ticket' && (
        <G
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Path d="M6.5 10.5h22v5a3 3 0 0 0 0 6v5h-22v-5a3 3 0 0 0 0-6z" />
          <Line x1={15} y1={11} x2={15} y2={26} strokeDasharray="2 4" />
        </G>
      )}

      {name === 'gift' && (
        <G
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round">
          <Rect x={7} y={15} width={21} height={15} rx={1.5} />
          <Rect x={5.5} y={10} width={24} height={6} rx={1.5} />
          <Line x1={17.5} y1={10} x2={17.5} y2={30} />
          <Path d="M17.5 10c-3.8 0-6-1.5-6-4 0-2 1.5-3 3.1-3 2.4 0 2.9 3 2.9 7z" />
          <Path d="M17.5 10c3.8 0 6-1.5 6-4 0-2-1.5-3-3.1-3-2.4 0-2.9 3-2.9 7z" />
        </G>
      )}

      {name === 'grid' && (
        <G fill={color}>
          <Rect x={6} y={6} width={9} height={9} rx={1.5} />
          <Rect x={20} y={6} width={9} height={9} rx={1.5} />
          <Rect x={6} y={20} width={9} height={9} rx={1.5} />
          <Rect x={20} y={20} width={9} height={9} rx={1.5} />
        </G>
      )}
    </Svg>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  safeAreaToi: {
    backgroundColor: MAU_CHU_DE.nenChinh,
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerToi: {
    backgroundColor: MAU_CHU_DE.nenChinh,
  },
  content: {
    flex: 1,
  },
  tabBar: {
    minHeight: 104,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eceff1',
    flexDirection: 'row',
    paddingTop: 13,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  tabLabel: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '400',
  },
});

export default TabNavigator;

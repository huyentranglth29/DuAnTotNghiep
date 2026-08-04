import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, Modal, PanResponder, Pressable, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { G, Line, Path, Rect } from 'react-native-svg';
import Different from '../features/Different/Index';
import Promotion from '../features/Promotion/Index';
import Showtime from '../features/Showtime/Index';
import TrangChu from '../features/TrangChu/Index';
import VoucherNavigator from './VoucherNavigator';
import { MAU_CHU_DE } from '../theme/cinemaNoir';
import {useQueryClient} from '@tanstack/react-query';
import CustomerAiScreen from '../features/CustomerAi/CustomerAiScreen';
import iconAi from '../assets/logo/iconai.jpg';
import {useLanguage} from '../contexts/LanguageContext';

const BLUE = '#005f98';
const GRAY = '#a9afb5';
const RED_ACCENT = '#e51937';

type TabKey = 'home' | 'movieSchedule' | 'voucher' | 'member' | 'different';

type TabItem = {
  key: TabKey;
  label: string;
  icon: 'home' | 'flag' | 'ticket' | 'gift' | 'grid';
};

function TabNavigator({onLoggedOut}: {onLoggedOut: () => void}) {
  const {language} = useLanguage();
  const tabs: TabItem[] = language === 'vi'
    ? [
        {key: 'home', label: 'Trang chủ', icon: 'home'},
        {key: 'movieSchedule', label: 'Lịch chiếu', icon: 'flag'},
        {key: 'voucher', label: 'Voucher', icon: 'ticket'},
        {key: 'member', label: 'Ưu đãi', icon: 'gift'},
        {key: 'different', label: 'Khác', icon: 'grid'},
      ]
    : [
        {key: 'home', label: 'Home', icon: 'home'},
        {key: 'movieSchedule', label: 'Showtimes', icon: 'flag'},
        {key: 'voucher', label: 'Voucher', icon: 'ticket'},
        {key: 'member', label: 'Offers', icon: 'gift'},
        {key: 'different', label: 'More', icon: 'grid'},
      ];
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const aiFabOffset = useRef(new Animated.ValueXY({x: 0, y: 0})).current;
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [isVoucherDetail, setIsVoucherDetail] = useState(false);
  const [isDifferentDetail, setIsDifferentDetail] = useState(false);
  const [isPromotionDetail, setIsPromotionDetail] = useState(false);
  const [openMemberDirectly, setOpenMemberDirectly] = useState(false);
  const [showCustomerAi, setShowCustomerAi] = useState(false);

  const handleTabPress = (tabKey: TabKey) => {
    setActiveTab(tabKey);
    setIsVoucherDetail(false);
    setIsDifferentDetail(false);
    setIsPromotionDetail(false);
    setOpenMemberDirectly(false);
  };

  const aiFabPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          aiFabOffset.stopAnimation();
        },
        onPanResponderMove: Animated.event(
          [null, {dx: aiFabOffset.x, dy: aiFabOffset.y}],
          {useNativeDriver: false},
        ),
        onPanResponderRelease: () => {
          Animated.spring(aiFabOffset, {
            toValue: {x: 0, y: 0},
            useNativeDriver: true,
            speed: 16,
            bounciness: 7,
          }).start();
        },
        onPanResponderTerminate: () => {
          Animated.spring(aiFabOffset, {
            toValue: {x: 0, y: 0},
            useNativeDriver: true,
            speed: 16,
            bounciness: 7,
          }).start();
        },
      }),
    [aiFabOffset],
  );

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

        {!showCustomerAi && (
          <Animated.View
            {...aiFabPanResponder.panHandlers}
            style={[
              styles.aiFab,
              {bottom: Math.max(insets.bottom + 92, 92)},
              {
                transform: [
                  {translateX: aiFabOffset.x},
                  {translateY: aiFabOffset.y},
                ],
              },
            ]}
          >
            <Pressable
              style={styles.aiFabPressable}
              android_ripple={{color: 'rgba(255,255,255,0.25)', borderless: true}}
              accessibilityRole="button"
              accessibilityLabel="Mở trợ lý FilmGo AI"
              onPress={() => setShowCustomerAi(true)}>
              <Image source={iconAi} style={styles.aiFabImage} />
            </Pressable>
          </Animated.View>
        )}

        <Modal
          visible={showCustomerAi}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowCustomerAi(false)}>
          <View style={styles.aiFullScreen}>
            <CustomerAiScreen onClose={() => setShowCustomerAi(false)} />
          </View>
        </Modal>
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
    height: 78,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eceff1',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
  },
  tabItem: {
    flex: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'flex-start',
    minWidth: 0,
  },
  tabLabel: {
    width: '100%',
    minHeight: 20,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    fontWeight: '400',
    textAlignVertical: 'top',
  },
  aiFab: {
    position: 'absolute',
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ffffff',
    zIndex: 999,
    elevation: 18,
    shadowColor: '#001426',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.24,
    shadowRadius: 14,
  },
  aiFabPressable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
  },
  aiFabImage: {
    width: 56,
    height: 56,
    resizeMode: 'cover',
  },
  aiFullScreen: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },
});

export default TabNavigator;

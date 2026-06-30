import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MenuIcon, { MenuIconName } from '../component/MenuIcon';

const TITLE_COLOR = '#173247';

export type DifferentScreenName = 'menu' | 'voucher' | 'notification';

type MenuItem = {
  title: string;
  icon: MenuIconName;
  color: string;
  backgroundColor: string;
  screen?: DifferentScreenName;
};

const menuItems: MenuItem[] = [
  {
    title: 'Voucher miễn phí',
    icon: 'voucher',
    color: '#f5bf31',
    backgroundColor: '#fffaf0',
    screen: 'voucher',
  },
  {
    title: 'Thành viên BETA',
    icon: 'member',
    color: '#a7d62b',
    backgroundColor: '#fbfff1',
  },
  {
    title: 'Thông báo',
    icon: 'notification',
    color: '#f28b1d',
    backgroundColor: '#fff7ef',
    screen: 'notification',
  },
  {
    title: 'Tuyển dụng',
    icon: 'career',
    color: '#ee7898',
    backgroundColor: '#fff3f7',
  },
  {
    title: 'Cài đặt',
    icon: 'setting',
    color: '#b956b7',
    backgroundColor: '#fbf2fc',
  },
];

type DifferentMenuScreenProps = {
  onOpenScreen: (screen: DifferentScreenName) => void;
};

function DifferentMenuScreen({ onOpenScreen }: DifferentMenuScreenProps) {
  const handlePress = (screen?: DifferentScreenName) => {
    if (!screen || screen === 'menu') {
      return;
    }

    onOpenScreen(screen);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>KHÁC</Text>

      <View style={styles.grid}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.title}
            activeOpacity={0.8}
            style={styles.card}
            onPress={() => handlePress(item.screen)}
          >
            <View
              style={[
                styles.iconBox,
                { backgroundColor: item.backgroundColor },
              ]}
            >
              <MenuIcon name={item.icon} color={item.color} />
            </View>
            <Text style={styles.cardTitle}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 94,
    paddingBottom: 36,
  },
  heading: {
    color: TITLE_COLOR,
    fontSize: 31,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 50,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 20,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f2f4f6',
    shadowColor: '#152232',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.11,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBox: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  cardTitle: {
    color: TITLE_COLOR,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});

export default DifferentMenuScreen;

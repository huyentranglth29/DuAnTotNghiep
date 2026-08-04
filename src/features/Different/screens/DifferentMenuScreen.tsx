import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MenuIcon, { MenuIconName } from '../component/MenuIcon';
import {useLanguage} from '../../../contexts/LanguageContext';

const TITLE_COLOR = '#173247';

export type DifferentScreenName =
  | 'menu'
  | 'voucher'
  | 'notification'
  | 'member'
  | 'career'
  | 'setting'
  | 'myTickets';

type MenuItem = {
  title: {vi: string; en: string};
  icon: MenuIconName;
  color: string;
  backgroundColor: string;
  screen?: DifferentScreenName;
};

const menuItems: MenuItem[] = [
  {
    title: {vi: 'Vé của tôi', en: 'My Tickets'},
    icon: 'voucher',
    color: '#e51937',
    backgroundColor: '#fff3f7',
    screen: 'myTickets',
  },
  {
    title: {vi: 'Voucher miễn phí', en: 'Free Vouchers'},
    icon: 'voucher',
    color: '#f5bf31',
    backgroundColor: '#fffaf0',
    screen: 'voucher',
  },
  {
    title: {vi: 'Thành viên', en: 'Membership'},
    icon: 'member',
    color: '#a7d62b',
    backgroundColor: '#fbfff1',
    screen: 'member',
  },
  {
    title: {vi: 'Thông báo', en: 'Notifications'},
    icon: 'notification',
    color: '#f28b1d',
    backgroundColor: '#fff7ef',
    screen: 'notification',
  },
  {
    title: {vi: 'Tuyển dụng', en: 'Careers'},
    icon: 'career',
    color: '#ee7898',
    backgroundColor: '#fff3f7',
    screen: 'career',
  },
  {
    title: {vi: 'Cài đặt', en: 'Settings'},
    icon: 'setting',
    color: '#b956b7',
    backgroundColor: '#fbf2fc',
    screen: 'setting',
  },
];

type DifferentMenuScreenProps = {
  onOpenScreen: (screen: DifferentScreenName) => void;
};

function DifferentMenuScreen({ onOpenScreen }: DifferentMenuScreenProps) {
  const {language} = useLanguage();
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
      <Text style={styles.heading}>{language === 'vi' ? 'KHÁC' : 'MORE'}</Text>

      <View style={styles.grid}>
        {menuItems.map(item => (
          <TouchableOpacity
            key={item.screen}
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
            <Text style={styles.cardTitle}>{item.title[language]}</Text>
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
    paddingTop: 34,
    paddingBottom: 36,
  },
  heading: {
    color: TITLE_COLOR,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 0,
    marginBottom: 24,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  card: {
    width: '48%',
    minHeight: 122,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#f2f4f6',
    shadowColor: '#152232',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBox: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    color: TITLE_COLOR,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});

export default DifferentMenuScreen;

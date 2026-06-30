import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

const TITLE_COLOR = '#173247';

type MenuIcon =
  | 'voucher'
  | 'cinema'
  | 'member'
  | 'notification'
  | 'career'
  | 'setting';

type MenuItem = {
  title: string;
  icon: MenuIcon;
  color: string;
  backgroundColor: string;
};

const menuItems: MenuItem[] = [
  {
    title: 'Voucher miễn phí',
    icon: 'voucher',
    color: '#f5bf31',
    backgroundColor: '#fffaf0',
  },
  {
    title: 'Rạp phim BETA',
    icon: 'cinema',
    color: '#45c5c8',
    backgroundColor: '#f0fbfd',
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

function Different() {
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

function MenuIcon({ name, color }: { name: MenuIcon; color: string }) {
  return (
    <Svg width={34} height={34} viewBox="0 0 34 34" fill="none">
      {name === 'voucher' && (
        <>
          <Path
            d="M6 10h22v4.4a3.1 3.1 0 0 0 0 5.2V24H6v-4.4a3.1 3.1 0 0 0 0-5.2V10z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Line
            x1={16}
            y1={11}
            x2={16}
            y2={23}
            stroke={color}
            strokeWidth={2.4}
            strokeDasharray="2 3"
          />
          <TextIcon x={20.3} y={14.2} color={color} />
        </>
      )}

      {name === 'cinema' && (
        <>
          <Circle cx={15.5} cy={16} r={10} stroke={color} strokeWidth={3} />
          <Circle cx={12} cy={12.5} r={2.2} fill={color} />
          <Circle cx={19} cy={13.5} r={2.2} fill={color} />
          <Circle cx={13.5} cy={20.2} r={2.2} fill={color} />
          <Path
            d="M21.2 22.5h6.5c-1.6 2.4-4.7 3.1-8.2 1.9"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'member' && (
        <>
          <Circle cx={17} cy={12} r={5} stroke={color} strokeWidth={3} />
          <Path
            d="M7.5 27c1.9-5 5.2-7.5 9.5-7.5s7.6 2.5 9.5 7.5"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'notification' && (
        <>
          <Path
            d="M10 24h14l-1.8-3.2V15a5.2 5.2 0 0 0-10.4 0v5.8L10 24z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M14.7 27.5a3 3 0 0 0 4.6 0"
            stroke={color}
            strokeWidth={3}
            strokeLinecap="round"
          />
        </>
      )}

      {name === 'career' && (
        <>
          <Path
            d="M10 6h10l5 5v17H10V6z"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Path
            d="M20 6v6h6"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
          />
          <Line
            x1={14}
            y1={17}
            x2={22}
            y2={17}
            stroke={color}
            strokeWidth={3}
          />
          <Line
            x1={14}
            y1={22}
            x2={21}
            y2={22}
            stroke={color}
            strokeWidth={3}
          />
        </>
      )}

      {name === 'setting' && (
        <Path
          d="M18.8 5.5l1 3.1 2.9 1.2 3-1.4 2.2 3.8-2.6 1.9v3.4l2.6 1.9-2.2 3.8-3-1.4-2.9 1.2-1 3.1h-4.4l-1-3.1-2.9-1.2-3 1.4-2.2-3.8 2.6-1.9v-3.4l-2.6-1.9 2.2-3.8 3 1.4 2.9-1.2 1-3.1h4.4z"
          fill={color}
        />
      )}
      {name === 'setting' && <Circle cx={17} cy={17} r={4} fill="#ffffff" />}
    </Svg>
  );
}

function TextIcon({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <>
      <Rect x={x} y={y - 4.2} width={6.6} height={4.6} rx={0.8} fill={color} />
      <Line
        x1={x + 1.2}
        y1={y - 1.9}
        x2={x + 5.4}
        y2={y - 1.9}
        stroke="#fff"
        strokeWidth={0.7}
      />
    </>
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

export default Different;

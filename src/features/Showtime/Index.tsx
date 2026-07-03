import React, {useEffect, useState} from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ShowtimeNavigator from '../../Navigation/ShowtimeNavigator';

const BLUE = '#005f98';

function Showtime() {
  const [dangTim, setDangTim] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [tuKhoaDebounced, setTuKhoaDebounced] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setTuKhoaDebounced(tuKhoa), 300);
    return () => clearTimeout(timer);
  }, [tuKhoa]);

  const dongTimKiem = () => {
    setDangTim(false);
    setTuKhoa('');
    setTuKhoaDebounced('');
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>L</Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.greeting}>
            Chào <Text style={styles.userName}>Lê Thị Ngọc Anh</Text>
          </Text>
          <View style={styles.memberRow}>
            <Text style={styles.memberIcon}>♟</Text>
            <Text style={styles.memberText}>MEMBER</Text>
            <Text style={styles.starText}>☆ 0</Text>
            <Text style={styles.ticketText}>▣ 0</Text>
          </View>
        </View>
        <View style={styles.logoBlock}>
          <Text style={styles.logoFilm}>FilmGo</Text>
          <TouchableOpacity
            activeOpacity={0.75}
            style={styles.searchButton}
            onPress={() => setDangTim(current => !current)}>
            <Text style={styles.searchIcon}>{dangTim ? '✕' : '⌕'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ShowtimeNavigator
        dangTim={dangTim}
        tuKhoa={tuKhoa}
        tuKhoaDebounced={tuKhoaDebounced}
        onChangeTuKhoa={setTuKhoa}
        onDongTimKiem={dongTimKiem}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  profileHeader: {
    minHeight: 72,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d7d7d7',
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0c0c0c',
    marginRight: 12,
  },
  avatarText: {
    color: '#0c0c0c',
    fontSize: 18,
    fontWeight: '500',
  },
  memberInfo: {
    flex: 1,
    minWidth: 0,
  },
  greeting: {
    color: '#1b1b1b',
    fontSize: 17,
    lineHeight: 23,
  },
  userName: {
    fontWeight: '800',
  },
  memberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 1,
  },
  memberIcon: {
    color: BLUE,
    fontSize: 16,
  },
  memberText: {
    color: '#1d1d1d',
    fontSize: 14,
    fontWeight: '800',
  },
  starText: {
    color: '#8fbf25',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  ticketText: {
    color: '#ec761b',
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  logoBlock: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  logoFilm: {
    color: BLUE,
    fontSize: 25,
    fontWeight: '800',
    lineHeight: 26,
  },
  searchButton: {
    marginTop: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce3ea',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  searchIcon: {
    color: BLUE,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 20,
  },
});

export default Showtime;

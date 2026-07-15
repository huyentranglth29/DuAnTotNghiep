import React, {useEffect, useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import ShowtimeNavigator from '../../Navigation/ShowtimeNavigator';
import MyTicketsScreen from '../Different/screens/MyTicketsScreen';

const BLUE = '#005f98';

function Showtime() {
  const [dangTim, setDangTim] = useState(false);
  const [tuKhoa, setTuKhoa] = useState('');
  const [tuKhoaDebounced, setTuKhoaDebounced] = useState('');
  const [searchPressed, setSearchPressed] = useState(false);
  const [anThanhTim, setAnThanhTim] = useState(false);
  const [xemVe, setXemVe] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTuKhoaDebounced(tuKhoa), 300);
    return () => clearTimeout(timer);
  }, [tuKhoa]);

  const dongTimKiem = () => {
    setDangTim(false);
    setTuKhoa('');
    setTuKhoaDebounced('');
  };

  const moTimKiem = () => {
    if (!dangTim) {
      setDangTim(true);
    }
  };

  if (xemVe) {
    return <MyTicketsScreen onBack={() => setXemVe(false)} />;
  }

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={styles.container}>
      {!anThanhTim && (
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
              <Pressable onPress={() => setXemVe(true)} hitSlop={8}>
                <Text style={styles.ticketText}>▣ Vé</Text>
              </Pressable>
            </View>
          </View>
          <View style={styles.logoBlock}>
            <Text style={styles.logoFilm}>FilmGo</Text>
          </View>
        </View>
      )}

      {!anThanhTim && (
        <View style={styles.searchSection}>
          <Pressable
            onPressIn={() => setSearchPressed(true)}
            onPressOut={() => setSearchPressed(false)}
            onPress={moTimKiem}
            style={[
              styles.searchBar,
              searchPressed && styles.searchBarHover,
              dangTim && styles.searchBarActive,
            ]}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={tuKhoa}
              onChangeText={text => {
                setTuKhoa(text);
                if (!dangTim) {
                  setDangTim(true);
                }
              }}
              onFocus={moTimKiem}
              placeholder="Tìm tên phim..."
              placeholderTextColor="#9aa3ad"
              style={styles.input}
              returnKeyType="search"
            />
            {dangTim && (
              <Pressable
                hitSlop={8}
                onPress={dongTimKiem}
                style={({pressed}) => [
                  styles.clearButton,
                  pressed && styles.clearButtonPressed,
                ]}>
                <Text style={styles.clearIcon}>✕</Text>
              </Pressable>
            )}
          </Pressable>
        </View>
      )}

      <ShowtimeNavigator
        dangTim={dangTim && !anThanhTim}
        tuKhoaDebounced={tuKhoaDebounced}
        onMovieFlowChange={setAnThanhTim}
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
  searchSection: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d7e3ef',
    backgroundColor: '#ffffff',
    shadowColor: '#0f2744',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: {width: 0, height: 4},
    elevation: 5,
    gap: 8,
  },
  searchBarHover: {
    transform: [{scale: 1.02}],
    borderColor: '#8eb8da',
    shadowOpacity: 0.22,
    elevation: 8,
  },
  searchBarActive: {
    borderColor: BLUE,
  },
  searchIcon: {
    color: BLUE,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  input: {
    flex: 1,
    color: '#1b1b1b',
    fontSize: 15,
    paddingVertical: 0,
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eef3f8',
  },
  clearButtonPressed: {
    transform: [{scale: 1.12}],
    backgroundColor: '#d9e6f2',
  },
  clearIcon: {
    color: BLUE,
    fontSize: 13,
    fontWeight: '800',
  },
});

export default Showtime;

import React from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import ShowtimeNavigator from '../../Navigation/ShowtimeNavigator';

const BLUE = '#005f98';

function Showtime() {
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
        </View>
      </View>

      <ShowtimeNavigator />
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
});

export default Showtime;

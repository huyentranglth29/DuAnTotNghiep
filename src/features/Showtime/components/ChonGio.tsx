import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';

const showtimeGroups = [
  {
    cinema: 'Beta Giải Phóng',
    roomType: '2D PHỤ ĐỀ',
    note: 'Suất chiếu muộn từ 22h00',
    times: [
      {time: '17:45', seats: '93 trống'},
      {time: '19:30', seats: '47 trống'},
      {time: '23:15', date: '01/07', seats: '89 trống', late: true},
    ],
  },
];

type ChonGioProps = {
  onShowtimePress?: () => void;
};

function ChonGio({onShowtimePress}: ChonGioProps) {
  return (
    <View style={styles.showtimeList}>
      {showtimeGroups.map(group => (
        <View key={group.cinema} style={styles.showtimeCard}>
          <Text style={styles.cinemaName}>{group.cinema}</Text>
          <Text style={styles.roomType}>{group.roomType}</Text>

          <View style={styles.timeRow}>
            {group.times.map(item => (
              <TouchableOpacity
                key={`${item.time}-${item.date ?? ''}`}
                activeOpacity={0.78}
                style={[styles.timeBlock, item.late && styles.timeBlockLate]}
                onPress={onShowtimePress}>
                <Text style={styles.timeText}>{item.time}</Text>
                {item.date && <Text style={styles.timeDate}>{item.date}</Text>}
                <Text style={styles.seatText}>{item.seats}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.noteRow}>
            <View style={styles.noteDot} />
            <Text style={styles.noteText}>{group.note}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  showtimeList: {
    paddingHorizontal: 8,
    paddingTop: 2,
  },
  showtimeCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d6d6d6',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  cinemaName: {
    color: '#2b2b2b',
    fontSize: 15,
    fontWeight: '500',
  },
  roomType: {
    color: '#1d1d1d',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 9,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 9,
  },
  timeBlock: {
    minWidth: 92,
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28,
    backgroundColor: '#e9eeee',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  timeBlockLate: {
    backgroundColor: '#b9d4f4',
  },
  timeText: {
    color: '#111111',
    fontSize: 17,
    fontWeight: '900',
  },
  timeDate: {
    color: '#111111',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  seatText: {
    color: '#555555',
    fontSize: 14,
    marginTop: 5,
  },
  noteRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  noteDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#b9d4f4',
    marginRight: 7,
  },
  noteText: {
    color: '#5a5a5a',
    fontSize: 13,
  },
});

export default ChonGio;

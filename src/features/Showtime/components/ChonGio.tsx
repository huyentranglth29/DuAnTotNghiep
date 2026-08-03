import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  formatGio,
  layDanhSachSuatChieu,
  SuatChieuApi,
} from '../../../services/showtimeService';

export type SelectedShowtimeInfo = {
  id: string;
  startTime: string;
  endTime: string;
  price: number;
  roomName: string;
  roomType: string;
  cinemaName: string;
};

type ChonGioProps = {
  movieId?: string | number;
  selectedDateKey?: string;
  selectedShowtimeId?: string;
  onShowtimePress?: (showtime: SelectedShowtimeInfo) => void;
};

function ChonGio({movieId, selectedDateKey, selectedShowtimeId, onShowtimePress}: ChonGioProps) {
  const [items, setItems] = useState<SuatChieuApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!movieId) {
        setItems([]);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const data = await layDanhSachSuatChieu({
          movieId: String(movieId),
          date: selectedDateKey,
          bookable: true,
        });
        if (!cancelled) {
          setItems(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError((err as Error)?.message || 'Không tải được suất chiếu');
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [movieId, selectedDateKey]);

  const groups = useMemo(() => {
    const map = new Map<
      string,
      {dateLabel: string; roomName: string; roomType: string; showtimes: SuatChieuApi[]}
    >();

    items.forEach(item => {
      const date = new Date(item.startTime);
      const dateLabel = Number.isNaN(date.getTime())
        ? 'Ngày chiếu'
        : date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            day: '2-digit',
            month: '2-digit',
          });
      const roomName = item.room?.name || 'Phòng chiếu';
      const roomType = item.room?.type || '2D';
      const key = `${dateLabel}|${roomName}|${roomType}`;
      if (!map.has(key)) {
        map.set(key, {dateLabel, roomName, roomType, showtimes: []});
      }
      map.get(key)!.showtimes.push(item);
    });

    return Array.from(map.values());
  }, [items]);

  if (!movieId) {
    return (
      <Text style={styles.empty}>Chưa có mã phim để tải suất chiếu.</Text>
    );
  }

  if (loading) {
    return <ActivityIndicator style={styles.loadingIndicator} color="#005f98" />;
  }

  if (error) {
    return <Text style={styles.empty}>{error}</Text>;
  }

  if (groups.length === 0) {
    return (
      <Text style={styles.empty}>
        {selectedDateKey
          ? 'Chưa có suất chiếu còn đặt được cho ngày đã chọn.'
          : 'Phim này chưa có suất chiếu còn đặt được. Vui lòng quay lại sau.'}
      </Text>
    );
  }

  return (
    <View style={styles.showtimeList}>
      {groups.map(group => (
        <View
          key={`${group.dateLabel}-${group.roomName}-${group.roomType}`}
          style={styles.showtimeCard}>
          <Text style={styles.cinemaName}>FilmGo Hà Trung (Thanh Hóa)</Text>
          <Text style={styles.dateLabel}>{group.dateLabel}</Text>
          <Text style={styles.roomType}>
            {group.roomName} · {group.roomType}
          </Text>

          <View style={styles.timeRow}>
            {group.showtimes.map(item => {
              const hour = new Date(item.startTime).getHours();
              const late = hour >= 22;
              const selected = selectedShowtimeId === item._id;
              return (
                <TouchableOpacity
                  key={item._id}
                  activeOpacity={0.78}
                  style={[
                    styles.timeBlock,
                    late && styles.timeBlockLate,
                    selected && styles.timeBlockSelected,
                  ]}
                  onPress={() =>
                    onShowtimePress?.({
                      id: item._id,
                      startTime: item.startTime,
                      endTime: item.endTime,
                      price: Number(item.price) || 0,
                      roomName: group.roomName,
                      roomType: group.roomType,
                      cinemaName: 'FilmGo Hà Trung (Thanh Hóa)',
                    })
                  }>
                  <Text style={[styles.timeText, selected && styles.selectedText]}>{formatGio(item.startTime)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

        </View>
      ))}
    </View>
  );
}

export default ChonGio;

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
    marginBottom: 12,
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
    marginTop: 5,
  },
  dateLabel: {
    color: '#005f98',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 8,
    textTransform: 'capitalize',
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
  timeBlockSelected: {
    backgroundColor: '#ec168c',
    borderWidth: 2,
    borderColor: '#bd0f6d',
  },
  selectedText: {color: '#ffffff'},
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
    flex: 1,
  },
  loadingIndicator: {
    marginTop: 24,
  },
  empty: {
    marginTop: 18,
    marginHorizontal: 16,
    textAlign: 'center',
    color: '#64748b',
    fontSize: 14,
    lineHeight: 20,
  },
});

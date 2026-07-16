import React, {useEffect, useMemo, useState} from 'react';
import {
  ImageBackground,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import ChonGio, {SelectedShowtimeInfo} from './ChonGio';
import {
  layDanhSachSuatChieu,
  toDateKey,
} from '../../../services/showtimeService';

const BLUE = '#005f98';

export type MovieBookingInfo = {
  id?: string | number;
  title: string;
  duration?: string;
  genre?: string;
  poster: ImageSourcePropType;
  description?: string;
  tomTat?: string;
};

type MovieNameProps = {
  movie: MovieBookingInfo;
  onBack: () => void;
  onDetailPress: () => void;
  onShowtimePress: (showtime: SelectedShowtimeInfo) => void;
};

const WEEKDAY = ['CN', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7'];

function MovieName({
  movie,
  onBack,
  onDetailPress,
  onShowtimePress,
}: MovieNameProps) {
  const genre = movie.genre ?? 'Giật gân, Kinh dị';
  const duration = movie.duration ?? '109 phút';
  const [dateKeys, setDateKeys] = useState<string[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadDates = async () => {
      if (!movie.id) {
        setDateKeys([]);
        setSelectedDateKey('');
        return;
      }

      try {
        const data = await layDanhSachSuatChieu({
          movieId: String(movie.id),
          bookable: true,
        });
        if (cancelled) return;

        const keys = Array.from(
          new Set(data.map(item => toDateKey(item.startTime))),
        ).sort();

        setDateKeys(keys);
        setSelectedDateKey(keys[0] || '');
      } catch {
        if (!cancelled) {
          setDateKeys([]);
          setSelectedDateKey('');
        }
      }
    };

    loadDates();
    return () => {
      cancelled = true;
    };
  }, [movie.id]);

  const dateItems = useMemo(() => {
    return dateKeys.map(key => {
      const d = new Date(`${key}T12:00:00`);
      const todayKey = toDateKey(new Date());
      return {
        key,
        day: `${d.getDate()}`.padStart(2, '0'),
        label: key === todayKey ? 'Hôm nay' : `${WEEKDAY[d.getDay()]}`,
      };
    });
  }, [dateKeys]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.75} style={styles.backButton} onPress={onBack}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5L8 12l7 7"
              stroke="#ffffff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ĐẶT VÉ THEO PHIM</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        <ImageBackground source={movie.poster} style={styles.hero} imageStyle={styles.heroImage}>
          <View style={styles.heroOverlay} />
          <View style={styles.heroContent}>
            <Text numberOfLines={1} style={styles.movieTitle}>
              {movie.title}
            </Text>
            <Text style={styles.movieMeta}>
              {genre} | {duration}
            </Text>
            <TouchableOpacity
              activeOpacity={0.75}
              style={styles.detailButton}
              onPress={onDetailPress}>
              <Text style={styles.detailText}>Chi tiết phim</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        <View style={styles.dateRow}>
          {dateItems.length === 0 ? (
            <Text style={styles.noDate}>Chưa có ngày chiếu từ Admin</Text>
          ) : (
            dateItems.map(date => {
              const isActive = selectedDateKey === date.key;
              return (
                <TouchableOpacity
                  key={date.key}
                  activeOpacity={0.75}
                  style={styles.dateItem}
                  onPress={() => setSelectedDateKey(date.key)}>
                  <Text style={[styles.dateDay, isActive && styles.dateDayActive]}>
                    {date.day}
                  </Text>
                  <Text style={[styles.dateLabel, isActive && styles.dateLabelActive]}>
                    {date.label}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <ChonGio
          movieId={movie.id}
          selectedDateKey={selectedDateKey || undefined}
          onShowtimePress={onShowtimePress}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollBody: {
    paddingBottom: 18,
  },
  header: {
    height: 72,
    alignItems: 'center',
    backgroundColor: BLUE,
    flexDirection: 'row',
    paddingHorizontal: 14,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
  },
  hero: {
    height: 178,
    justifyContent: 'flex-end',
  },
  heroImage: {
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.58)',
  },
  heroContent: {
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingBottom: 36,
  },
  movieTitle: {
    color: '#111111',
    fontSize: 24,
    fontWeight: '900',
  },
  movieMeta: {
    color: '#1f1f1f',
    fontSize: 14,
    marginTop: 4,
  },
  detailButton: {
    borderWidth: 1.5,
    borderColor: BLUE,
    borderRadius: 20,
    marginTop: 9,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  detailText: {
    color: BLUE,
    fontSize: 15,
    fontWeight: '800',
  },
  dateRow: {
    minHeight: 82,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
  },
  noDate: {
    color: '#94a3b8',
    fontSize: 13,
  },
  dateItem: {
    alignItems: 'center',
    minWidth: 48,
  },
  dateDay: {
    color: '#737373',
    fontSize: 27,
    fontWeight: '900',
  },
  dateDayActive: {
    color: '#ff3030',
  },
  dateLabel: {
    color: '#8a8a8a',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  dateLabelActive: {
    color: '#ff3030',
  },
});

export default MovieName;

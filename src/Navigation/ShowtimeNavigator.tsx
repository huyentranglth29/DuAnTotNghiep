import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DangChieu from '../features/Showtime/components/DangChieu';
import MovieName, {
  MovieBookingInfo,
} from '../features/Showtime/components/MovieName';
import MovieNameDetail from '../features/Showtime/screen/MovieNameDetail';
import SapChieu from '../features/Showtime/components/SapChieu';
import SuatChieuSom from '../features/Showtime/components/SuatChieuSom';

const BLUE = '#005f98';

const scheduleTabs = ['SẮP CHIẾU', 'ĐANG CHIẾU', 'SUẤT CHIẾU SỚM'];

function ShowtimeNavigator() {
  const [activeScheduleTab, setActiveScheduleTab] = useState('ĐANG CHIẾU');
  const [selectedMovie, setSelectedMovie] = useState<MovieBookingInfo | null>(null);
  const [showMovieDetail, setShowMovieDetail] = useState(false);

  if (selectedMovie && showMovieDetail) {
    return (
      <MovieNameDetail
        movie={selectedMovie}
        onBack={() => setShowMovieDetail(false)}
      />
    );
  }

  if (selectedMovie) {
    return (
      <MovieName
        movie={selectedMovie}
        onBack={() => setSelectedMovie(null)}
        onDetailPress={() => setShowMovieDetail(true)}
      />
    );
  }

  return (
    <View>
      <View style={styles.scheduleTabBar}>
        {scheduleTabs.map(item => {
          const isActive = activeScheduleTab === item;
          return (
            <TouchableOpacity
              key={item}
              activeOpacity={0.75}
              style={styles.scheduleTabItem}
              onPress={() => setActiveScheduleTab(item)}>
              <Text
                style={[
                  styles.scheduleTabText,
                  isActive && styles.scheduleTabTextActive,
                ]}>
                {item}
              </Text>
              {isActive && <View style={styles.scheduleUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {activeScheduleTab === 'SẮP CHIẾU' ? (
        <SapChieu
          onMoviePress={movie => {
            setSelectedMovie(movie);
            setShowMovieDetail(false);
          }}
        />
      ) : activeScheduleTab === 'ĐANG CHIẾU' ? (
        <DangChieu
          onMoviePress={movie => {
            setSelectedMovie(movie);
            setShowMovieDetail(false);
          }}
        />
      ) : (
        <SuatChieuSom
          onMoviePress={movie => {
            setSelectedMovie(movie);
            setShowMovieDetail(false);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  scheduleTabBar: {
    height: 58,
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d7d7d7',
    backgroundColor: '#f6f6f6',
  },
  scheduleTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scheduleTabText: {
    color: '#a5a5a5',
    fontSize: 13,
    fontWeight: '800',
  },
  scheduleTabTextActive: {
    color: BLUE,
    fontSize: 15,
  },
  scheduleUnderline: {
    position: 'absolute',
    bottom: 0,
    width: '78%',
    height: 3,
    backgroundColor: BLUE,
  },
});

export default ShowtimeNavigator;

import React, {useState} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import DangChieu from '../features/Showtime/components/DangChieu';
import DatVe from '../features/Showtime/components/DatVe';
import MovieName, {
  MovieBookingInfo,
} from '../features/Showtime/components/MovieName';
import DatVeDetail from '../features/Showtime/screen/DatVeDetail';
import MovieNameDetail from '../features/Showtime/screen/MovieNameDetail';
import SapChieu from '../features/Showtime/components/SapChieu';
import SuatChieuSom from '../features/Showtime/components/SuatChieuSom';

const BLUE = '#005f98';

const scheduleTabs = ['SẮP CHIẾU', 'ĐANG CHIẾU', 'SUẤT CHIẾU SỚM'];

function ShowtimeNavigator() {
  const [activeScheduleTab, setActiveScheduleTab] = useState('ĐANG CHIẾU');
  const [selectedMovie, setSelectedMovie] = useState<MovieBookingInfo | null>(null);
  const [showMovieDetail, setShowMovieDetail] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<{
    seats: string[];
    totalPrice: number;
  } | null>(null);

  if (selectedMovie && bookingSummary) {
    return (
      <DatVeDetail
        movie={selectedMovie}
        seats={bookingSummary.seats}
        totalPrice={bookingSummary.totalPrice}
        onClose={() => setBookingSummary(null)}
      />
    );
  }

  if (selectedMovie && showBooking) {
    return (
      <DatVe
        movie={selectedMovie}
        onBack={() => setShowBooking(false)}
        onContinue={summary => setBookingSummary(summary)}
      />
    );
  }

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
        onBack={() => {
          setSelectedMovie(null);
          setShowBooking(false);
          setBookingSummary(null);
        }}
        onDetailPress={() => setShowMovieDetail(true)}
        onShowtimePress={() => setShowBooking(true)}
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
            setShowBooking(false);
            setBookingSummary(null);
          }}
        />
      ) : activeScheduleTab === 'ĐANG CHIẾU' ? (
        <DangChieu
          onMoviePress={movie => {
            setSelectedMovie(movie);
            setShowMovieDetail(false);
            setShowBooking(false);
            setBookingSummary(null);
          }}
        />
      ) : (
        <SuatChieuSom
          onMoviePress={movie => {
            setSelectedMovie(movie);
            setShowMovieDetail(false);
            setShowBooking(false);
            setBookingSummary(null);
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

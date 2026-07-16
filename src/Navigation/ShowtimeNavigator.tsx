import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DangChieu from '../features/Showtime/components/DangChieu';
import DatVe from '../features/Showtime/components/DatVe';
import KetQuaTimKiem from '../features/Showtime/components/KetQuaTimKiem';
import MovieName, {
  MovieBookingInfo,
} from '../features/Showtime/components/MovieName';
import {SelectedShowtimeInfo} from '../features/Showtime/components/ChonGio';
import { layTrangThaiTuTab } from '../features/Showtime/components/phimUtils';
import SapChieu from '../features/Showtime/components/SapChieu';
import SuatChieuSom from '../features/Showtime/components/SuatChieuSom';
import DatVeDetail from '../features/Showtime/screen/DatVeDetail';
import MovieNameDetail from '../features/Showtime/screen/MovieNameDetail';
import WriteReview from '../features/Showtime/screen/WriteReview';

const BLUE = '#005f98';

const scheduleTabs = ['SẮP CHIẾU', 'ĐANG CHIẾU', 'SUẤT CHIẾU SỚM'];

type ShowtimeNavigatorProps = {
  dangTim: boolean;
  tuKhoaDebounced: string;
  onMovieFlowChange?: (inFlow: boolean) => void;
};

function ShowtimeNavigator({
  dangTim,
  tuKhoaDebounced,
  onMovieFlowChange,
}: ShowtimeNavigatorProps) {
  const [activeScheduleTab, setActiveScheduleTab] = useState('ĐANG CHIẾU');
  const [selectedMovie, setSelectedMovie] = useState<MovieBookingInfo | null>(
    null,
  );
  const [selectedShowtime, setSelectedShowtime] =
    useState<SelectedShowtimeInfo | null>(null);
  const [showMovieDetail, setShowMovieDetail] = useState(false);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<{
    seats: string[];
    totalPrice: number;
  } | null>(null);

  useEffect(() => {
    onMovieFlowChange?.(!!selectedMovie);
  }, [selectedMovie, onMovieFlowChange]);

  const chonPhim = (movie: MovieBookingInfo) => {
    setSelectedMovie(movie);
    setSelectedShowtime(null);
    setShowMovieDetail(false);
    setShowWriteReview(false);
    setShowBooking(false);
    setBookingSummary(null);
  };

  if (selectedMovie && showWriteReview) {
    return (
      <WriteReview
        movieId={selectedMovie.id ?? ''}
        title={selectedMovie.title ?? 'Bộ phim'}
        onBack={() => setShowWriteReview(false)}
      />
    );
  }

  if (selectedMovie && bookingSummary && selectedShowtime) {
    return (
      <DatVeDetail
        movie={selectedMovie}
        seats={bookingSummary.seats}
        totalPrice={bookingSummary.totalPrice}
        showtime={selectedShowtime}
        onClose={() => setBookingSummary(null)}
      />
    );
  }

  if (selectedMovie && showBooking && selectedShowtime) {
    return (
      <DatVe
        movie={selectedMovie}
        showtime={selectedShowtime}
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
        onWriteReview={() => setShowWriteReview(true)}
        onShowtimeSelect={showtime => {
          setSelectedShowtime(showtime);
          setShowBooking(true);
        }}
      />
    );
  }

  if (selectedMovie) {
    return (
      <MovieName
        movie={selectedMovie}
        onBack={() => {
          setSelectedMovie(null);
          setSelectedShowtime(null);
          setShowBooking(false);
          setBookingSummary(null);
          setShowWriteReview(false);
        }}
        onDetailPress={() => setShowMovieDetail(true)}
        onShowtimePress={showtime => {
          setSelectedShowtime(showtime);
          setShowBooking(true);
        }}
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

      {dangTim ? (
        <KetQuaTimKiem
          tuKhoa={tuKhoaDebounced}
          trangThai={layTrangThaiTuTab(activeScheduleTab)}
          onMoviePress={chonPhim}
        />
      ) : activeScheduleTab === 'SẮP CHIẾU' ? (
        <SapChieu onMoviePress={chonPhim} />
      ) : activeScheduleTab === 'ĐANG CHIẾU' ? (
        <DangChieu onMoviePress={chonPhim} />
      ) : (
        <SuatChieuSom onMoviePress={chonPhim} />
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

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
import {useAuth} from '../contexts/AuthContext';
import {useLanguage} from '../contexts/LanguageContext';

const BLUE = '#005f98';

type ScheduleTab = 'upcoming' | 'nowShowing' | 'early';

type ShowtimeNavigatorProps = {
  dangTim: boolean;
  tuKhoaDebounced: string;
  onMovieFlowChange?: (inFlow: boolean) => void;
  onGoToMyTickets?: () => void;
};

function ShowtimeNavigator({
  dangTim,
  tuKhoaDebounced,
  onMovieFlowChange,
  onGoToMyTickets,
}: ShowtimeNavigatorProps) {
  const {requestAuth} = useAuth();
  const {language} = useLanguage();
  const isEnglish = language === 'en';
  const scheduleTabs: Array<{key: ScheduleTab; label: string}> = [
    {key: 'upcoming', label: isEnglish ? 'COMING SOON' : 'SẮP CHIẾU'},
    {key: 'nowShowing', label: isEnglish ? 'NOW SHOWING' : 'ĐANG CHIẾU'},
    {key: 'early', label: isEnglish ? 'EARLY SCREENINGS' : 'SUẤT CHIẾU SỚM'},
  ];
  const [activeScheduleTab, setActiveScheduleTab] = useState<ScheduleTab>('nowShowing');
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
    holdToken: string;
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
        title={selectedMovie.title ?? (isEnglish ? 'Movie' : 'Bộ phim')}
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
        holdToken={bookingSummary.holdToken}
        showtime={selectedShowtime}
        onClose={() => setBookingSummary(null)}
        onPaymentSuccess={() => {
          setBookingSummary(null);
          setSelectedShowtime(null);
          setShowBooking(false);
          setSelectedMovie(null);
          setShowMovieDetail(false);
          setShowWriteReview(false);
          onGoToMyTickets?.();
        }}
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
        onWriteReview={() => {
          const openReview = () => setShowWriteReview(true);
          if (!requestAuth(
            {
              title: 'Đăng nhập để tiếp tục',
              message: 'Đăng nhập để tham gia bình luận và đánh giá phim.',
            },
            openReview,
          )) {
            return;
          }
        }}
        onShowtimeSelect={showtime => {
          const startBooking = () => {
            setSelectedShowtime(showtime);
            setShowBooking(true);
          };
          if (!requestAuth(
            {
              title: 'Đăng nhập để tiếp tục',
              message: 'Đăng nhập để đăng ký và quản lý vé xem phim.',
            },
            startBooking,
          )) {
            return;
          }
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
          const startBooking = () => {
            setSelectedShowtime(showtime);
            setShowBooking(true);
          };
          if (!requestAuth(
            {
              title: 'Đăng nhập để tiếp tục',
              message: 'Đăng nhập để đăng ký và quản lý vé xem phim.',
            },
            startBooking,
          )) {
            return;
          }
        }}
      />
    );
  }

  return (
    <View>
      <View style={styles.scheduleTabBar}>
        {scheduleTabs.map(item => {
          const isActive = activeScheduleTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              activeOpacity={0.75}
              style={styles.scheduleTabItem}
              onPress={() => setActiveScheduleTab(item.key)}>
              <Text
                style={[
                  styles.scheduleTabText,
                  isActive && styles.scheduleTabTextActive,
                ]}>
                {item.label}
              </Text>
              {isActive && <View style={styles.scheduleUnderline} />}
            </TouchableOpacity>
          );
        })}
      </View>

      {dangTim ? (
        <KetQuaTimKiem
          tuKhoa={tuKhoaDebounced}
          trangThai={layTrangThaiTuTab(
            activeScheduleTab === 'upcoming'
              ? 'SẮP CHIẾU'
              : activeScheduleTab === 'early'
                ? 'SUẤT CHIẾU SỚM'
                : 'ĐANG CHIẾU',
          )}
          onMoviePress={chonPhim}
        />
      ) : activeScheduleTab === 'upcoming' ? (
        <SapChieu onMoviePress={chonPhim} />
      ) : activeScheduleTab === 'nowShowing' ? (
        <DangChieu
          onMoviePress={chonPhim}
          onShowtimePress={(movie, showtime) => {
            const startBooking = () => {
              chonPhim(movie);
              setSelectedShowtime(showtime);
              setShowBooking(true);
            };
            if (!requestAuth(
              {
                title: 'Đăng nhập để tiếp tục',
                message: 'Đăng nhập để đăng ký và quản lý vé xem phim.',
              },
              startBooking,
            )) {
              return;
            }
          }}
        />
      ) : (
        <SuatChieuSom
          onMoviePress={chonPhim}
          onShowtimePress={(movie, showtime) => {
            const startBooking = () => {
              chonPhim(movie);
              setSelectedShowtime(showtime);
              setShowBooking(true);
            };
            if (!requestAuth(
              {
                title: 'Đăng nhập để tiếp tục',
                message: 'Đăng nhập để đăng ký và quản lý vé xem phim.',
              },
              startBooking,
            )) {
              return;
            }
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

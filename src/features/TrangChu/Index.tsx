import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  FlatList,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Dimensions,
  TextInput,
  Modal,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {
  useMoviesDangChieu,
  useMoviesSapChieu,
  useMovies,
  usePhimNoiBat,
  useTimKiemPhim,
} from '../../hooks/useMovies';
import {
  getVouchers,
  getProducts,
  getNotifications,
  getNewsEvents,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../services/apiService';
import TrangThaiTai from './components/TrangThaiTai';
import {Phim} from '../../types/phim';
import MovieNameDetail from '../Showtime/screen/MovieNameDetail';
import DatVe from '../Showtime/components/DatVe';
import DatVeDetail from '../Showtime/screen/DatVeDetail';
import {
  formatGio,
  layDanhSachSuatChieu,
} from '../../services/showtimeService';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

function TrangChu() {
  const phimNoiBat = usePhimNoiBat();
  const phimDangChieu = useMoviesDangChieu();
  const phimSapChieu = useMoviesSapChieu();
  const quickMoviesQuery = useMovies({coSuatChieu: true});

  const vouchersQuery = useQuery({
    queryKey: ['vouchers'],
    queryFn: getVouchers,
  });

  const productsQuery = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  });
  const newsEventsQuery = useQuery({
    queryKey: ['news-events'],
    queryFn: getNewsEvents,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchQueryDebounced, setSearchQueryDebounced] = useState('');
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQueryDebounced(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchMoviesQuery = useTimKiemPhim(searchQueryDebounced);
  const listSearchResults = searchMoviesQuery.data ?? [];

  const dangTai =
    phimNoiBat.isLoading ||
    phimDangChieu.isLoading ||
    phimSapChieu.isLoading ||
    quickMoviesQuery.isLoading ||
    vouchersQuery.isLoading ||
    productsQuery.isLoading ||
    notificationsQuery.isLoading ||
    newsEventsQuery.isLoading ||
    (isSearching && searchMoviesQuery.isLoading);

  const loi =
    phimNoiBat.error ??
    phimDangChieu.error ??
    phimSapChieu.error ??
    quickMoviesQuery.error ??
    vouchersQuery.error ??
    productsQuery.error ??
    notificationsQuery.error ??
    newsEventsQuery.error;

  const thuLai = useCallback(() => {
    phimNoiBat.refetch();
    phimDangChieu.refetch();
    phimSapChieu.refetch();
    quickMoviesQuery.refetch();
    vouchersQuery.refetch();
    productsQuery.refetch();
    notificationsQuery.refetch();
    newsEventsQuery.refetch();
  }, [
    phimNoiBat,
    phimDangChieu,
    phimSapChieu,
    quickMoviesQuery,
    vouchersQuery,
    productsQuery,
    notificationsQuery,
    newsEventsQuery,
  ]);

  const listPhimNoiBat = phimNoiBat.data ?? [];
  const listDangChieu = phimDangChieu.data ?? [];
  const listSapChieu = phimSapChieu.data ?? [];
  const listQuickMovies = quickMoviesQuery.data ?? [];
  const listVouchers = (vouchersQuery.data as any) ?? [];
  const listProducts = (productsQuery.data as any) ?? [];
  const listNotifications = (notificationsQuery.data as any) ?? [];
  const listNews = (newsEventsQuery.data as any) ?? [];
  const unreadNotifications = Array.isArray(listNotifications)
    ? listNotifications.filter((item: any) => !item.isRead).length
    : 0;

  // Gộp các phim nổi bật + phim đang chiếu hot lên Banner
  const listBannerPhim = [
    ...listPhimNoiBat,
    ...listDangChieu.filter(m => m.laPhimHot && !listPhimNoiBat.some(p => p.id === m.id))
  ];

  // State cho Đặt Vé Nhanh
  const [selectedMovie, setSelectedMovie] = useState<Phim | null>(null);
  const [selectedCinema, setSelectedCinema] = useState<string>('FilmGo Hà Trung');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [showMovieDropdown, setShowMovieDropdown] = useState(false);
  const [quickMovieSearch, setQuickMovieSearch] = useState('');
  const filteredQuickMovies = listQuickMovies.filter(movie =>
    movie.tieuDe.toLocaleLowerCase('vi-VN').includes(
      quickMovieSearch.trim().toLocaleLowerCase('vi-VN'),
    ),
  );
  const quickShowtimesQuery = useQuery({
    queryKey: ['quick-showtimes', selectedMovie?.id],
    queryFn: () =>
      layDanhSachSuatChieu({
        movieId: String(selectedMovie!.id),
        bookable: true,
      }),
    enabled: Boolean(selectedMovie?.id),
  });

  // State cho Chi tiết Phim
  const [selectedDetailMovie, setSelectedDetailMovie] = useState<Phim | null>(null);

  // State quản lý luồng đặt vé từ chi tiết phim
  const [showBooking, setShowBooking] = useState(false);
  const [selectedBookingTime, setSelectedBookingTime] = useState('');
  const [bookingSummary, setBookingSummary] = useState<{
    seats: string[];
    totalPrice: number;
    holdToken: string;
  } | null>(null);
  const [selectedShowtime, setSelectedShowtime] = useState<{
    id: string;
    startTime: string;
    endTime?: string;
    roomName: string;
    roomType: string;
    price: number;
    cinemaName?: string;
  } | null>(null);

  // Cấu hình Auto-slide cho Banner
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (listBannerPhim.length <= 1) return;

    const interval = setInterval(() => {
      let nextIndex = activeBannerIndex + 1;
      if (nextIndex >= listBannerPhim.length) {
        nextIndex = 0;
      }
      setActiveBannerIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 3000); // Tự động trượt sau mỗi 3 giây

    return () => clearInterval(interval);
  }, [activeBannerIndex, listBannerPhim.length]);

  const onMomentumScrollEnd = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / SCREEN_WIDTH);
    setActiveBannerIndex(index);
  };

  const handleQuickBook = () => {
    if (!selectedMovie) {
      Alert.alert('Thông báo', 'Vui lòng chọn phim muốn xem!');
      return;
    }
    if (!selectedCinema) {
      Alert.alert('Thông báo', 'Vui lòng chọn rạp chiếu!');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Thông báo', 'Vui lòng chọn suất chiếu!');
      return;
    }

    const item = quickShowtimesQuery.data?.find(showtime => showtime._id === selectedTime);
    if (!item) {
      Alert.alert('Thông báo', 'Suất chiếu không còn khả dụng, vui lòng chọn lại!');
      return;
    }

    const realShowtime = {
      id: item._id,
      startTime: item.startTime,
      endTime: item.endTime,
      price: Number(item.price) || 0,
      roomName: item.room?.name || 'Phòng chiếu',
      roomType: item.room?.type || '2D',
      cinemaName: selectedCinema,
    };

    setSelectedDetailMovie(selectedMovie);
    setSelectedShowtime(realShowtime);
    setShowBooking(true);
  };

  const renderMovieCard = ({item}: {item: Phim}) => {
    return (
      <View style={styles.movieCard}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setSelectedDetailMovie(item)}
        >
          <View style={styles.posterContainer}>
            <Image source={{uri: item.posterUrl}} style={styles.moviePoster} />
            {!!item.nhanTuoi && (
              <View
                style={[
                  styles.ageBadge,
                  {
                    backgroundColor: item.nhanTuoi.includes('18')
                      ? '#e51937'
                      : '#ffa000',
                  },
                ]}>
                <Text style={styles.ageText}>{item.nhanTuoi}</Text>
              </View>
            )}
            {typeof item.diemDanhGia === 'number' && (
              <View style={styles.ratingBadge}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.ratingText}>{item.diemDanhGia.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.movieTitle} numberOfLines={2}>
            {item.tieuDe}
          </Text>
          <Text style={styles.movieGenre} numberOfLines={1}>
            {item.theLoai}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.bookBtn}
          activeOpacity={0.8}
          onPress={() => {
            setSelectedDetailMovie(item);
          }}>
          <Text style={styles.bookBtnText}>Mua vé</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderProductCard = ({item}: {item: any}) => {
    return (
      <View style={styles.productCard}>
        <Image source={{uri: item.image}} style={styles.productImage} />
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productDesc} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.productFooter}>
            <Text style={styles.productPrice}>
              {item.price.toLocaleString('vi-VN')} đ
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() =>
                Alert.alert('Đã thêm', `Đã thêm ${item.name} vào giỏ hàng bắp nước!`)
              }>
              <Text style={styles.addBtnText}>Thêm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderVoucherCard = ({item}: {item: any}) => {
    return (
      <TouchableOpacity
        style={styles.voucherCard}
        activeOpacity={0.9}
        onPress={() => {
          Alert.alert(
            'Ưu đãi',
            `Mã Voucher: ${item.code}\n${item.description}\nHạn sử dụng đến: ${new Date(
              item.endDate,
            ).toLocaleDateString('vi-VN')}`,
          );
        }}>
        <View style={styles.voucherLeft}>
          <Text style={styles.voucherType}>
            {item.discountType === 'percent'
              ? `${item.discountValue}%`
              : `-${Math.round(item.discountValue / 1000)}k`}
          </Text>
          <Text style={styles.voucherLabel}>OFF</Text>
        </View>
        <View style={styles.voucherRight}>
          <Text style={styles.voucherCode} numberOfLines={1}>
            {item.code}
          </Text>
          <Text style={styles.voucherDesc} numberOfLines={2}>
            {item.description}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNewsCard = ({item}: {item: any}) => {
    return (
      <TouchableOpacity
        style={styles.newsCard}
        activeOpacity={0.9}
        onPress={() => setSelectedNews(item)}>
        <Image source={{uri: item.image}} style={styles.newsImage} />
        <View style={styles.newsContent}>
          <View style={styles.newsMetaRow}>
        <Text style={styles.newsBadge}>
          {item.category === 'tin_tuc' ? 'TIN TỨC' : item.category === 'khuyen_mai' ? 'KHUYẾN MÃI' : 'SỰ KIỆN'}
        </Text>
            <Text style={styles.newsDate}>
              {item.publishDate ? new Date(item.publishDate).toLocaleDateString('vi-VN') : 'FilmGo'}
            </Text>
          </View>
          <Text style={styles.newsTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.newsDesc} numberOfLines={2}>
            {item.summary || item.content}
          </Text>
          <Text style={styles.newsReadMore}>Xem chi tiết  ›</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSearchResultItem = ({item}: {item: Phim}) => {
    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        activeOpacity={0.9}
        onPress={() => setSelectedDetailMovie(item)}
      >
        <Image source={{uri: item.posterUrl}} style={styles.searchResultPoster} />
        <View style={styles.searchResultInfo}>
          <Text style={styles.searchResultTitle}>{item.tieuDe}</Text>
          <Text style={styles.searchResultGenre}>{item.theLoai}</Text>
          <View style={styles.searchResultRow}>
            {!!item.nhanTuoi && (
              <View style={[
                styles.searchResultAgeBadge,
                {
                  backgroundColor: item.nhanTuoi.includes('18') ? '#e51937' : '#ffa000',
                }
              ]}>
                <Text style={styles.ageText}>{item.nhanTuoi}</Text>
              </View>
            )}
            <Text style={styles.searchResultDuration}>{item.thoiLuong}</Text>
          </View>
          {typeof item.diemDanhGia === 'number' && (
            <Text style={styles.searchResultRating}>⭐ {item.diemDanhGia.toFixed(1)}/10</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.searchResultBtn}
          onPress={() => {
            setIsSearching(false);
            setSelectedMovie(item);
            Alert.alert(
              'Thông báo',
              `Đã chọn phim "${item.tieuDe}" cho bảng Đặt vé nhanh!`,
            );
          }}
        >
          <Text style={styles.searchResultBtnText}>Chọn</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Nếu đã chọn ghế xong và chuyển sang chi tiết đặt vé / thanh toán
  if (selectedDetailMovie && bookingSummary) {
    return (
      <DatVeDetail
        movie={{
          title: selectedDetailMovie.tieuDe,
          duration: selectedDetailMovie.thoiLuong,
          genre: selectedDetailMovie.theLoai,
          poster: {uri: selectedDetailMovie.posterUrl},
        }}
        seats={bookingSummary.seats}
        totalPrice={bookingSummary.totalPrice}
        holdToken={bookingSummary.holdToken}
        showtime={selectedShowtime ?? undefined}
        onClose={() => {
          setBookingSummary(null);
          setShowBooking(false);
          setSelectedDetailMovie(null);
          setSelectedShowtime(null);
        }}
      />
    );
  }

  // Nếu đang ở màn hình chọn ghế
  if (selectedDetailMovie && showBooking) {
    // Tạo showtime mặc định nếu chưa có từ MovieNameDetail
    const defaultShowtime = selectedShowtime ?? {
      id: 'default-showtime-id',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      price: 55000,
      roomName: 'Phòng chiếu 07',
      roomType: '2D Phụ đề',
      cinemaName: 'FilmGo Hà Trung (Thanh Hóa)',
    };
    return (
      <DatVe
        movie={{
          title: selectedDetailMovie.tieuDe,
          duration: selectedDetailMovie.thoiLuong,
          poster: {uri: selectedDetailMovie.posterUrl},
        }}
        showtime={defaultShowtime as any}
        onBack={() => setShowBooking(false)}
        onContinue={(summary) => setBookingSummary(summary)}
      />
    );
  }

  // Nếu đang xem chi tiết phim
  if (selectedDetailMovie) {
    return (
      <MovieNameDetail
        movie={{
          id: selectedDetailMovie.id,
          title: selectedDetailMovie.tieuDe,
          duration: selectedDetailMovie.thoiLuong,
          genre: selectedDetailMovie.theLoai,
          poster: {uri: selectedDetailMovie.posterUrl},
          description: selectedDetailMovie.tomTat,
          director: selectedDetailMovie.daoDien,
          cast: selectedDetailMovie.danhSachDienVien?.map(item => item.ten),
          releaseDate: selectedDetailMovie.ngayPhatHanh,
          ageRating: selectedDetailMovie.nhanTuoi,
        } as any}
        onBack={() => setSelectedDetailMovie(null)}
        onShowtimeSelect={(showtime) => {
          setSelectedBookingTime(showtime.startTime);
          setSelectedShowtime(showtime);
          setShowBooking(true);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      {isSearching ? (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backSearchBtn}
            onPress={() => {
              setIsSearching(false);
              setSearchQuery('');
              setSearchQueryDebounced('');
            }}>
            <Text style={styles.backSearchIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.searchInputBox}>
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Tìm tên phim đang chiếu, sắp chiếu..."
              placeholderTextColor="#888888"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ) : (
        <View style={styles.header}>
          <View>
            <Text style={styles.logoText}>
              Film<Text style={{color: '#e51937'}}>Go</Text>
            </Text>
            <Text style={styles.locationText}>📍 Hà Trung, Thanh Hóa</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => {
                setShowNotifications(true);
                void notificationsQuery.refetch();
              }}>
              <Text style={styles.headerIcon}>🔔</Text>
              {unreadNotifications > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{Math.min(unreadNotifications, 99)}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setIsSearching(true)}>
              <Text style={styles.headerIcon}>🔍</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal visible={showNotifications} animationType="slide" onRequestClose={() => setShowNotifications(false)}>
        <View style={styles.notificationScreen}>
          <View style={styles.notificationHeader}>
            <TouchableOpacity onPress={() => setShowNotifications(false)}><Text style={styles.notificationBack}>‹</Text></TouchableOpacity>
            <Text style={styles.notificationTitle}>THÔNG BÁO</Text>
            <TouchableOpacity onPress={async () => { try { await markAllNotificationsRead(); await notificationsQuery.refetch(); } catch (e) { Alert.alert('Thông báo', (e as Error).message); } }}>
              <Text style={styles.notificationReadAll}>Đọc tất cả</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={Array.isArray(listNotifications) ? listNotifications : []}
            keyExtractor={(item: any) => String(item._id)}
            contentContainerStyle={styles.notificationList}
            ListEmptyComponent={<Text style={styles.notificationEmpty}>Chưa có thông báo nào</Text>}
            renderItem={({item}: any) => (
              <TouchableOpacity style={[styles.notificationItem, item.isRead ? styles.notificationRead : styles.notificationUnread]} onPress={async () => {
                try {
                  if (!item.isRead) await markNotificationRead(item._id);
                  await notificationsQuery.refetch();
                } catch (error) {
                  Alert.alert('Không thể đánh dấu đã đọc', (error as Error).message);
                  return;
                }
                if (item.type === 'voucher') Alert.alert(item.title, `${item.content}\n\nVào tab Voucher để bấm Nhận ngay.`);
                else setSelectedNews(item);
              }}>
                <Text style={styles.notificationType}>{item.type === 'voucher' ? '🎟️' : item.type === 'phim' ? '🎬' : item.type === 'dat_ve' ? '🎫' : item.type === 'thanh_toan' ? '💳' : '🔔'}</Text>
                <View style={{flex: 1}}><Text style={[styles.notificationItemTitle, item.isRead && styles.notificationReadTitle]}>{item.title}</Text><Text style={[styles.notificationContent, item.isRead && styles.notificationReadContent]} numberOfLines={3}>{item.content}</Text><Text style={styles.notificationTime}>{item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : ''}</Text></View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>

      <TrangThaiTai dangTai={dangTai} loi={loi} onThuLai={thuLai}>
        {isSearching ? (
          <FlatList
            data={searchQueryDebounced.trim().length >= 2 ? listSearchResults : []}
            keyExtractor={item => String(item.id)}
            renderItem={renderSearchResultItem}
            contentContainerStyle={styles.searchListContent}
            ListEmptyComponent={
              <View style={styles.searchEmptyContainer}>
                <Text style={styles.searchEmptyText}>
                  {searchQueryDebounced.trim().length < 2
                    ? 'Nhập ít nhất 2 ký tự để tìm kiếm phim...'
                    : 'Không tìm thấy bộ phim nào phù hợp.'}
                </Text>
              </View>
            }
          />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
          
          {/* Banner Slider */}
          {listBannerPhim.length > 0 && (
            <View style={styles.bannerContainer}>
              <FlatList
                ref={flatListRef}
                data={listBannerPhim}
                keyExtractor={item => String(item.id)}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onMomentumScrollEnd}
                getItemLayout={(data, index) => ({
                  length: SCREEN_WIDTH,
                  offset: SCREEN_WIDTH * index,
                  index,
                })}
                renderItem={({item}) => (
                  <TouchableOpacity
                    activeOpacity={0.9}
                    style={styles.bannerSlide}
                    onPress={() => setSelectedDetailMovie(item)}>
                    <Image
                      source={{uri: item.anhNen || item.posterUrl}}
                      style={styles.bannerImage}
                    />
                    <View style={styles.bannerOverlay}>
                      <Text style={styles.bannerTitle}>{item.tieuDe}</Text>
                      <Text style={styles.bannerGenre}>{item.theLoai}</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </View>
          )}

          {/* Quick Booking */}
          <View style={styles.quickBookCard}>
            <Text style={styles.quickBookHeader}>ĐẶT VÉ NHANH</Text>

            {/* Dropdown Phim */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Chọn Phim</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => {
                  setQuickMovieSearch('');
                  setShowMovieDropdown(true);
                }}>
                <Text style={styles.dropdownValue}>
                  {selectedMovie ? selectedMovie.tieuDe : '-- Chọn Phim --'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>
            </View>

            {/* Rạp chiếu mặc định duy nhất */}
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownLabel}>Rạp chiếu</Text>
              <View style={styles.fixedCinemaBox}>
                <Text style={styles.fixedCinemaText}>FilmGo Hà Trung (Thanh Hóa)</Text>
              </View>
            </View>

            {/* Chọn suất chiếu */}
            <View style={styles.timeSelectContainer}>
              <Text style={styles.dropdownLabel}>Suất chiếu</Text>
              <View style={styles.timeButtonsRow}>
                {(quickShowtimesQuery.data ?? []).map(showtime => {
                  const isSelected = selectedTime === showtime._id;
                  return (
                    <TouchableOpacity
                      key={showtime._id}
                      style={[styles.timeBtn, isSelected && styles.timeBtnSelected]}
                      onPress={() => setSelectedTime(showtime._id)}>
                      <Text
                        style={[
                          styles.timeBtnText,
                          isSelected && styles.timeBtnTextSelected,
                        ]}>
                        {formatGio(showtime.startTime)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {selectedMovie && !quickShowtimesQuery.isLoading &&
                (quickShowtimesQuery.data ?? []).length === 0 ? (
                  <Text>Chưa có suất chiếu khả dụng</Text>
                ) : null}
              </View>
            </View>

            {/* Nút đặt vé */}
            <TouchableOpacity style={styles.quickBookBtn} onPress={handleQuickBook}>
              <Text style={styles.quickBookBtnText}>ĐẶT VÉ NGAY</Text>
            </TouchableOpacity>
          </View>

          {/* Đang chiếu (Now Showing) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PHIM ĐANG CHIẾU</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Xem tất cả', 'Mở danh sách Phim đang chiếu')
                }>
                <Text style={styles.seeAllText}>Tất cả &gt;</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={listDangChieu}
              keyExtractor={item => String(item.id)}
              renderItem={renderMovieCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có phim đang chiếu</Text>
              }
            />
          </View>

          {/* Top bán chạy (Best Sellers) */}
          <View
            style={[
              styles.section,
              {backgroundColor: '#fff9fa', paddingVertical: 14},
            ]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, {color: '#e51937'}]}>
                TOP BÁN CHẠY
              </Text>
              <Text style={styles.badgeHot}>BÁN CHẠY</Text>
            </View>
            <FlatList
              data={listDangChieu.filter(
                m => m.laPhimHot || (m.diemDanhGia && m.diemDanhGia >= 8.5),
              )}
              keyExtractor={item => String(item.id)}
              renderItem={renderMovieCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={<Text style={styles.emptyText}>Chưa có phim hot</Text>}
            />
          </View>

          {/* Sắp chiếu (Coming Soon) */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>PHIM SẮP CHIẾU</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert('Xem tất cả', 'Mở danh sách Phim sắp chiếu')
                }>
                <Text style={styles.seeAllText}>Tất cả &gt;</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={listSapChieu}
              keyExtractor={item => String(item.id)}
              renderItem={renderMovieCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có phim sắp chiếu</Text>
              }
            />
          </View>

          {/* Ưu đãi / Voucher */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>VOUCHER ƯU ĐÃI</Text>
            </View>
            <FlatList
              data={listVouchers}
              keyExtractor={item => String(item._id || item.code)}
              renderItem={renderVoucherCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có voucher</Text>
              }
            />
          </View>

          {/* Combo bắp nước */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>COMBO BẮP NƯỚC</Text>
            </View>
            <FlatList
              data={listProducts}
              keyExtractor={item => String(item._id || item.name)}
              renderItem={renderProductCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có combo bắp nước</Text>
              }
            />
          </View>

          {/* Tin tức / Sự kiện */}
          <View style={[styles.section, {marginBottom: 30}]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>TIN TỨC & SỰ KIỆN</Text>
            </View>
            <FlatList
              data={listNews}
              keyExtractor={item => String(item._id || item.title)}
              renderItem={renderNewsCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Chưa có tin tức</Text>
              }
            />
          </View>

        </ScrollView>
        )}
      </TrangThaiTai>

      <Modal
        transparent
        visible={showMovieDropdown}
        animationType="slide"
        onRequestClose={() => setShowMovieDropdown(false)}>
        <View style={styles.moviePickerOverlay}>
          <View style={styles.moviePickerSheet}>
            <View style={styles.moviePickerHandle} />
            <View style={styles.moviePickerHeader}>
              <View>
                <Text style={styles.moviePickerTitle}>Chọn phim đặt vé nhanh</Text>
                <Text style={styles.moviePickerSubtitle}>
                  {listQuickMovies.length} phim đang có suất chiếu khả dụng
                </Text>
              </View>
              <TouchableOpacity
                style={styles.moviePickerClose}
                onPress={() => setShowMovieDropdown(false)}>
                <Text style={styles.moviePickerCloseText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.moviePickerSearchBox}>
              <Text style={styles.moviePickerSearchIcon}>⌕</Text>
              <TextInput
                value={quickMovieSearch}
                onChangeText={setQuickMovieSearch}
                placeholder="Tìm tên phim..."
                placeholderTextColor="#999999"
                style={styles.moviePickerSearchInput}
              />
              {!!quickMovieSearch && (
                <TouchableOpacity onPress={() => setQuickMovieSearch('')}>
                  <Text style={styles.moviePickerClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <FlatList
              data={filteredQuickMovies}
              keyExtractor={movie => String(movie.id)}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.moviePickerList}
              renderItem={({item: movie}) => {
                const selected = selectedMovie?.id === movie.id;
                return (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.moviePickerItem, selected && styles.moviePickerItemSelected]}
                    onPress={() => {
                      setSelectedMovie(movie);
                      setSelectedTime('');
                      setShowMovieDropdown(false);
                    }}>
                    <Image source={{uri: movie.posterUrl}} style={styles.moviePickerPoster} />
                    <View style={styles.moviePickerInfo}>
                      <Text style={styles.moviePickerName} numberOfLines={2}>{movie.tieuDe}</Text>
                      <Text style={styles.moviePickerMeta} numberOfLines={1}>
                        {movie.theLoai || 'Đang có suất chiếu'}
                      </Text>
                      <Text style={styles.moviePickerAvailable}>● Có thể đặt vé</Text>
                    </View>
                    <View style={[styles.moviePickerRadio, selected && styles.moviePickerRadioSelected]}>
                      {selected && <View style={styles.moviePickerRadioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.moviePickerEmpty}>
                  <Text style={styles.moviePickerEmptyIcon}>🎬</Text>
                  <Text style={styles.moviePickerEmptyText}>
                    {quickMovieSearch ? 'Không tìm thấy phim phù hợp' : 'Chưa có phim nào có suất đặt được'}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal
        transparent
        visible={Boolean(selectedNews)}
        animationType="fade"
        onRequestClose={() => setSelectedNews(null)}>
        <View style={styles.newsModalOverlay}>
          <View style={styles.newsModalCard}>
            <View style={styles.newsModalImageWrap}>
              <Image
                source={{uri: selectedNews?.image}}
                style={styles.newsModalImage}
              />
              <View style={styles.newsModalTopRow}>
                <Text style={styles.newsModalBadge}>TIN TỨC & SỰ KIỆN</Text>
                <TouchableOpacity
                  style={styles.newsModalClose}
                  onPress={() => setSelectedNews(null)}>
                  <Text style={styles.newsModalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              style={styles.newsModalBody}
              contentContainerStyle={styles.newsModalBodyContent}
              showsVerticalScrollIndicator={false}>
              <Text style={styles.newsModalDate}>
                🗓 {selectedNews?.publishDate
                  ? new Date(selectedNews.publishDate).toLocaleDateString('vi-VN')
                  : 'FilmGo Hà Trung'}
              </Text>
              <Text style={styles.newsModalTitle}>{selectedNews?.title}</Text>
              <View style={styles.newsModalDivider} />
              <Text style={styles.newsModalContent}>{selectedNews?.content}</Text>
              <View style={styles.newsModalNote}>
                <Text style={styles.newsModalNoteIcon}>🎬</Text>
                <Text style={styles.newsModalNoteText}>
                  Theo dõi FilmGo thường xuyên để không bỏ lỡ những chương trình mới nhất.
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.newsModalButton}
              onPress={() => setSelectedNews(null)}>
              <Text style={styles.newsModalButtonText}>Đã hiểu</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  notificationScreen: {flex: 1, backgroundColor: '#f5f7fa'},
  notificationHeader: {height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#006ba6'},
  notificationBack: {fontSize: 32, lineHeight: 36, color: '#fff', paddingRight: 12},
  notificationTitle: {flex: 1, color: '#fff', fontSize: 18, fontWeight: '900'},
  notificationReadAll: {color: '#fff', fontWeight: '700', fontSize: 13},
  notificationList: {padding: 14, paddingBottom: 40},
  notificationItem: {flexDirection: 'row', gap: 10, padding: 13, marginBottom: 10, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb'},
  notificationUnread: {backgroundColor: '#eef8ff', borderColor: '#9dd8f7'},
  notificationRead: {backgroundColor: '#ffffff', borderColor: '#e5e7eb'},
  notificationType: {fontSize: 20},
  notificationItemTitle: {fontSize: 16, fontWeight: '800', color: '#1f2937'},
  notificationReadTitle: {fontWeight: '700', color: '#667085'},
  notificationContent: {fontSize: 13, lineHeight: 19, color: '#667085', marginTop: 4},
  notificationReadContent: {color: '#98a2b3'},
  notificationTime: {fontSize: 11, color: '#9ca3af', marginTop: 7},
  notificationEmpty: {textAlign: 'center', color: '#9ca3af', marginTop: 90, fontSize: 16},
  unreadDot: {width: 9, height: 9, borderRadius: 5, backgroundColor: '#e51937', marginTop: 6},
  notificationBadge: {position: 'absolute', right: 3, top: 3, minWidth: 18, height: 18, paddingHorizontal: 4, borderRadius: 9, backgroundColor: '#e51937', alignItems: 'center', justifyContent: 'center'},
  notificationBadgeText: {color: '#fff', fontSize: 10, fontWeight: '900'},
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  header: {
    height: 70,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#005f98',
  },
  locationText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f2f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  headerIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerContainer: {
    height: 164,
    backgroundColor: '#ffffff',
  },
  bannerSlide: {
    width: SCREEN_WIDTH,
    height: 164,
    position: 'relative',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bannerGenre: {
    color: '#dfdfdf',
    fontSize: 12,
    marginTop: 2,
  },
  quickBookCard: {
    marginHorizontal: 14,
    marginTop: 14,
    marginBottom: 12,
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 5,
  },
  fixedCinemaBox: {
    height: 40,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
  },
  fixedCinemaText: {
    fontSize: 14,
    color: '#005f98',
    fontWeight: '600',
  },
  quickBookHeader: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  dropdownContainer: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 10,
  },
  dropdownLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666666',
    marginBottom: 4,
  },
  dropdownButton: {
    height: 40,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  dropdownValue: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  dropdownArrow: {
    fontSize: 10,
    color: '#888888',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 6,
    maxHeight: 150,
    zIndex: 99,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  moviePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  moviePickerSheet: {
    height: '78%',
    backgroundColor: '#f7f8fa',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 9,
  },
  moviePickerHandle: {
    width: 46,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#d0d0d0',
    alignSelf: 'center',
  },
  moviePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 15,
    paddingBottom: 12,
  },
  moviePickerTitle: {fontSize: 19, color: '#1b1b1b', fontWeight: '900'},
  moviePickerSubtitle: {fontSize: 11, color: '#888888', marginTop: 3},
  moviePickerClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9eaec',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moviePickerCloseText: {fontSize: 15, color: '#444444', fontWeight: '700'},
  moviePickerSearchBox: {
    height: 46,
    marginHorizontal: 18,
    marginBottom: 12,
    borderRadius: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e1e2e5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  moviePickerSearchIcon: {fontSize: 22, color: '#005f98', marginRight: 8},
  moviePickerSearchInput: {flex: 1, color: '#222222', fontSize: 14, paddingVertical: 0},
  moviePickerClear: {color: '#888888', fontSize: 13, padding: 6},
  moviePickerList: {paddingHorizontal: 18, paddingBottom: 30},
  moviePickerItem: {
    minHeight: 102,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#e5e6e8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  moviePickerItemSelected: {borderColor: '#e51937', backgroundColor: '#fff8f9'},
  moviePickerPoster: {width: 58, height: 82, borderRadius: 8, backgroundColor: '#eeeeee'},
  moviePickerInfo: {flex: 1, marginLeft: 12},
  moviePickerName: {fontSize: 15, lineHeight: 20, color: '#222222', fontWeight: '800'},
  moviePickerMeta: {fontSize: 11, color: '#777777', marginTop: 4},
  moviePickerAvailable: {fontSize: 10, color: '#00a467', fontWeight: '700', marginTop: 6},
  moviePickerRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#b5b5b5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  moviePickerRadioSelected: {borderColor: '#e51937'},
  moviePickerRadioDot: {width: 12, height: 12, borderRadius: 6, backgroundColor: '#e51937'},
  moviePickerEmpty: {alignItems: 'center', paddingTop: 70},
  moviePickerEmptyIcon: {fontSize: 45},
  moviePickerEmptyText: {fontSize: 13, color: '#888888', marginTop: 12},
  timeSelectContainer: {
    marginBottom: 16,
  },
  timeButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  timeBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: 15,
    backgroundColor: '#ffffff',
  },
  timeBtnSelected: {
    backgroundColor: '#e51937',
    borderColor: '#e51937',
  },
  timeBtnText: {
    fontSize: 13,
    color: '#555555',
  },
  timeBtnTextSelected: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  quickBookBtn: {
    height: 44,
    backgroundColor: '#e51937',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBookBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  section: {
    backgroundColor: '#ffffff',
    paddingVertical: 14,
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1a1a1a',
  },
  seeAllText: {
    fontSize: 13,
    color: '#e51937',
    fontWeight: '600',
  },
  badgeHot: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#e51937',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#888888',
    paddingVertical: 10,
  },
  movieCard: {
    width: 132,
    marginRight: 12,
  },
  posterContainer: {
    width: 132,
    height: 188,
    borderRadius: 8,
    backgroundColor: '#eaeaea',
    position: 'relative',
    overflow: 'hidden',
  },
  moviePoster: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  ageBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  ageText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ratingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  starIcon: {
    color: '#ffa000',
    fontSize: 10,
    marginRight: 2,
  },
  ratingText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  movieTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 6,
    height: 36,
  },
  movieGenre: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  bookBtn: {
    marginTop: 6,
    height: 28,
    borderWidth: 1,
    borderColor: '#e51937',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  bookBtnText: {
    color: '#e51937',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productCard: {
    width: 250,
    height: 96,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    flexDirection: 'row',
    padding: 8,
    marginRight: 12,
    backgroundColor: '#fafafa',
  },
  productImage: {
    width: 80,
    height: '100%',
    borderRadius: 6,
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  productDesc: {
    fontSize: 10,
    color: '#888888',
    lineHeight: 12,
  },
  productFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#e51937',
  },
  addBtn: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: '#e51937',
    borderRadius: 4,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  voucherCard: {
    width: 212,
    height: 76,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#ffe0b2',
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    marginRight: 12,
    overflow: 'hidden',
  },
  voucherLeft: {
    width: 66,
    backgroundColor: '#ffa726',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voucherType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  voucherLabel: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  voucherRight: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  voucherCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e65100',
  },
  voucherDesc: {
    fontSize: 10,
    color: '#5d4037',
    marginTop: 2,
  },
  newsCard: {
    width: 258,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  newsImage: {
    width: '100%',
    height: 132,
    resizeMode: 'cover',
  },
  newsContent: {
    padding: 12,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  newsBadge: {
    color: '#e51937',
    backgroundColor: '#fff0f2',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 9,
    fontWeight: '800',
  },
  newsDate: {
    color: '#999999',
    fontSize: 10,
  },
  newsTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '800',
    color: '#1a1a1a',
    minHeight: 40,
  },
  newsDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 17,
    marginTop: 6,
  },
  newsReadMore: {
    color: '#e51937',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  newsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 40,
  },
  newsModalCard: {
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    overflow: 'hidden',
  },
  newsModalImageWrap: {
    height: 220,
    backgroundColor: '#e9eaec',
  },
  newsModalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  newsModalTopRow: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsModalBadge: {
    color: '#ffffff',
    backgroundColor: '#e51937',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 10,
    fontWeight: '800',
  },
  newsModalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.58)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsModalCloseText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  newsModalBody: {
    flexGrow: 0,
  },
  newsModalBodyContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
  },
  newsModalDate: {
    color: '#888888',
    fontSize: 12,
    marginBottom: 8,
  },
  newsModalTitle: {
    color: '#1b1b1b',
    fontSize: 23,
    lineHeight: 30,
    fontWeight: '900',
  },
  newsModalDivider: {
    width: 52,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e51937',
    marginTop: 14,
    marginBottom: 16,
  },
  newsModalContent: {
    color: '#4d4d4d',
    fontSize: 15,
    lineHeight: 24,
  },
  newsModalNote: {
    flexDirection: 'row',
    backgroundColor: '#fff5f6',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
  },
  newsModalNoteIcon: {
    fontSize: 20,
    marginRight: 9,
  },
  newsModalNoteText: {
    flex: 1,
    color: '#6b4146',
    fontSize: 12,
    lineHeight: 18,
  },
  newsModalButton: {
    height: 52,
    marginHorizontal: 20,
    marginBottom: 18,
    borderRadius: 13,
    backgroundColor: '#e51937',
    alignItems: 'center',
    justifyContent: 'center',
  },
  newsModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  backSearchBtn: {
    paddingRight: 12,
  },
  backSearchIcon: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },
  searchInputBox: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    paddingVertical: 0,
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#888888',
    paddingHorizontal: 4,
  },
  searchListContent: {
    padding: 16,
  },
  searchEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  searchEmptyText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  searchResultItem: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  searchResultPoster: {
    width: 60,
    height: 90,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  searchResultInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  searchResultTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchResultGenre: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  searchResultDuration: {
    fontSize: 11,
    color: '#888888',
  },
  searchResultRating: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffa000',
    marginTop: 4,
  },
  searchResultBtn: {
    backgroundColor: '#e51937',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  searchResultBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  searchResultAgeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 32,
  },
});

export default TrangChu;

import {useEffect, useMemo, useState} from 'react';
import bookingApi from '../../api/bookingApi';
import {formatDateTime, formatVnd, getUserName, shortId} from '../../utils/adminFormatters';

const bookingStatusMap = {
  pending: {label: 'Chờ xử lý', tone: 'warning'},
  paid: {label: 'Hoàn tất', tone: 'success'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
};

const paymentStatusMap = {
  unpaid: {label: 'Chưa thanh toán', tone: 'warning'},
  paid: {label: 'Đã thanh toán', tone: 'success'},
  refunded: {label: 'Hoàn tiền', tone: 'info'},
};

const paymentMethodMap = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  momo: 'Momo',
  vnpay: 'VNPay',
};

function StatusBadge({map, value}) {
  const status = map[value] || {label: value || 'Chưa có', tone: 'info'};
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

function DetailItem({label, value}) {
  return (
    <div className="bookingDetailItem">
      <span>{label}</span>
      <strong>{value || 'Chưa có'}</strong>
    </div>
  );
}

function BookingDetail() {
  const [bookings, setBookings] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await bookingApi.getAll({limit: 500, sort: '-createdAt'});
      const data = Array.isArray(response) ? response : response?.data || [];
      setBookings(data);
      setSelectedId(current => current || data[0]?._id || '');
    } catch (err) {
      setError(err.message || 'Không tải được đơn đặt vé.');
      setBookings([]);
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return bookings;

    return bookings.filter(booking => {
      const searchable = [
        `DH-${shortId(booking)}`,
        booking.ticketCode,
        getUserName(booking),
        booking.user?.email,
        booking.movieTitle,
        booking.showtime?.movie?.title,
        booking.seatLabels?.join(', '),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedKeyword);
    });
  }, [bookings, keyword]);

  const selectedBooking = useMemo(
    () => filteredBookings.find(item => item._id === selectedId) || filteredBookings[0],
    [filteredBookings, selectedId],
  );

  useEffect(() => {
    if (filteredBookings.length === 0) {
      setSelectedId('');
      return;
    }
    if (!filteredBookings.some(item => item._id === selectedId)) {
      setSelectedId(filteredBookings[0]._id);
    }
  }, [filteredBookings, selectedId]);

  const movieTitle = selectedBooking?.movieTitle || selectedBooking?.showtime?.movie?.title || '';
  const seatLabels = selectedBooking?.seatLabels?.join(', ') || selectedBooking?.seats?.map(seat => `${seat.row || ''}${seat.number || ''}`).filter(Boolean).join(', ');

  return (
    <section className="bookingAdminPage">
      <div className="pageTitle">
        <h2>Xem chi tiết đơn đặt vé</h2>
        <button type="button" onClick={loadData}>Tải lại</button>
      </div>

      <div className="panel bookingFilters">
        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã đơn, khách hàng, phim..."
        />
        <select
          value={selectedBooking?._id || ''}
          onChange={event => setSelectedId(event.target.value)}
          disabled={filteredBookings.length === 0}
          aria-label="Chọn đơn đặt vé"
        >
          {filteredBookings.length === 0 ? (
            <option value="">Không có đơn</option>
          ) : (
            filteredBookings.map(booking => (
              <option key={booking._id} value={booking._id}>
                DH-{shortId(booking)} - {getUserName(booking) || booking.movieTitle || 'Đơn đặt vé'}
              </option>
            ))
          )}
        </select>
      </div>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải chi tiết đơn...</p>
      ) : !selectedBooking ? (
        <div className="placeholder">Không có đơn đặt vé phù hợp.</div>
      ) : (
        <div className="bookingDetailGrid">
          <article className="panel bookingDetailMain">
            <div className="bookingDetailHead">
              <div>
                <span>Mã đơn</span>
                <h3>DH-{shortId(selectedBooking)}</h3>
              </div>
              <div className="bookingDetailBadges">
                <StatusBadge map={bookingStatusMap} value={selectedBooking.status} />
                <StatusBadge map={paymentStatusMap} value={selectedBooking.paymentStatus} />
              </div>
            </div>

            <div className="bookingDetailItems">
              <DetailItem label="Khách hàng" value={getUserName(selectedBooking)} />
              <DetailItem label="Email" value={selectedBooking.user?.email} />
              <DetailItem label="Phim" value={movieTitle} />
              <DetailItem label="Suất chiếu" value={formatDateTime(selectedBooking.showtime?.startTime)} />
              <DetailItem label="Rạp" value={selectedBooking.cinemaName} />
              <DetailItem label="Phòng" value={selectedBooking.roomName || selectedBooking.showtime?.room?.name} />
              <DetailItem label="Ghế" value={seatLabels} />
              <DetailItem label="Mã vé" value={selectedBooking.ticketCode} />
              <DetailItem label="Phương thức" value={paymentMethodMap[selectedBooking.paymentMethod]} />
              <DetailItem label="Ngày đặt" value={formatDateTime(selectedBooking.createdAt)} />
            </div>
          </article>

          <aside className="panel bookingDetailAside">
            <span>Tổng thanh toán</span>
            <strong>{formatVnd(selectedBooking.totalPrice)}</strong>
            <p>Voucher: {selectedBooking.voucher?.code || 'Không áp dụng'}</p>
          </aside>
        </div>
      )}
    </section>
  );
}

export default BookingDetail;

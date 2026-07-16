import {useEffect, useMemo, useState} from 'react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
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

function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await bookingApi.getAll({limit: 500, sort: '-createdAt'});
      setBookings(Array.isArray(response) ? response : response?.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử đặt vé.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return bookings.filter(booking => {
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      const searchable = [
        `DH-${shortId(booking)}`,
        booking.ticketCode,
        getUserName(booking),
        booking.user?.email,
        booking.movieTitle,
        booking.showtime?.movie?.title,
        booking.seatLabels?.join(', '),
        booking.status,
        booking.paymentStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!normalizedKeyword || searchable.includes(normalizedKeyword));
    });
  }, [bookings, keyword, statusFilter]);

  const summary = useMemo(() => ({
    total: filteredBookings.length,
    paid: filteredBookings.filter(item => item.status === 'paid').length,
    pending: filteredBookings.filter(item => item.status === 'pending').length,
    cancelled: filteredBookings.filter(item => item.status === 'cancelled').length,
  }), [filteredBookings]);

  const columns = [
    {key: 'code', title: 'Mã đơn', render: item => `DH-${shortId(item)}`},
    {key: 'customer', title: 'Khách hàng', render: getUserName},
    {key: 'movie', title: 'Phim', render: item => item.movieTitle || item.showtime?.movie?.title || ''},
    {key: 'seats', title: 'Ghế', render: item => item.seatLabels?.join(', ') || item.seats?.length || ''},
    {key: 'totalPrice', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice)},
    {key: 'method', title: 'Thanh toán', render: item => paymentMethodMap[item.paymentMethod] || 'Chưa chọn'},
    {key: 'paymentStatus', title: 'Kết quả', render: item => <StatusBadge map={paymentStatusMap} value={item.paymentStatus} />},
    {key: 'status', title: 'Trạng thái đơn', render: item => <StatusBadge map={bookingStatusMap} value={item.status} />},
    {key: 'createdAt', title: 'Ngày đặt', render: item => formatDateTime(item.createdAt)},
  ];

  return (
    <section className="bookingAdminPage">
      <div className="pageTitle">
        <h2>Xem lịch sử đặt vé</h2>
        <button type="button" onClick={loadData}>Tải lại</button>
      </div>

      <div className="metricGrid">
        <article className="metricCard"><span>Tổng đơn</span><strong>{summary.total}</strong></article>
        <article className="metricCard"><span>Hoàn tất</span><strong>{summary.paid}</strong></article>
        <article className="metricCard"><span>Chờ xử lý</span><strong>{summary.pending}</strong></article>
        <article className="metricCard"><span>Đã hủy</span><strong>{summary.cancelled}</strong></article>
      </div>

      <div className="panel bookingFilters">
        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã đơn, khách hàng, phim, ghế..."
        />
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          aria-label="Lọc trạng thái đơn"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ xử lý</option>
          <option value="paid">Hoàn tất</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải lịch sử đặt vé...</p>
      ) : (
        <Table columns={columns} data={filteredBookings} emptyText="Không có lịch sử đặt vé phù hợp" />
      )}
    </section>
  );
}

export default BookingHistory;

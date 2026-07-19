import {useEffect, useMemo, useState} from 'react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';

const bookingStatusMap = {
  pending: {label: 'Chờ xử lý', tone: 'warning'},
  paid: {label: 'Hoàn tất', tone: 'success'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
  refunded: {label: 'Hoàn tiền', tone: 'info'},
  cho_thanh_toan: {label: 'Chờ thanh toán', tone: 'warning'},
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  da_huy: {label: 'Đã hủy', tone: 'danger'},
  da_hoan_tien: {label: 'Đã hoàn tiền', tone: 'info'},
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
      const response = await bookingApi.getAll({limit: 100, sort: '-createdAt'});
      setBookings(Array.isArray(response?.data) ? response.data : []);
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
      const matchesStatus =
        statusFilter === 'all' ||
        booking.status === statusFilter ||
        booking.paymentStatus === statusFilter;
      const searchable = [
        booking.code,
        booking.customerName,
        booking.customerPhone,
        booking.customerEmail,
        booking.movieTitle,
        booking.showtimeLabel,
        (booking.seats || []).join(', '),
        booking.status,
        booking.paymentStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return matchesStatus && (!normalizedKeyword || searchable.includes(normalizedKeyword));
    });
  }, [bookings, keyword, statusFilter]);

  const summary = useMemo(
    () => ({
      total: filteredBookings.length,
      paid: filteredBookings.filter(item => item.status === 'paid' || item.paymentStatus === 'da_thanh_toan')
        .length,
      pending: filteredBookings.filter(
        item => item.status === 'pending' || item.paymentStatus === 'cho_thanh_toan',
      ).length,
      cancelled: filteredBookings.filter(
        item =>
          item.status === 'cancelled' ||
          item.status === 'refunded' ||
          item.paymentStatus === 'da_huy' ||
          item.paymentStatus === 'da_hoan_tien',
      ).length,
    }),
    [filteredBookings],
  );

  const columns = [
    {key: 'code', title: 'Mã đơn', render: item => item.code},
    {key: 'customer', title: 'Khách hàng', render: item => item.customerName},
    {key: 'movie', title: 'Phim', render: item => item.movieTitle},
    {key: 'seats', title: 'Ghế', render: item => (item.seats || []).join(', ')},
    {key: 'totalPrice', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice)},
    {
      key: 'paymentStatus',
      title: 'Thanh toán',
      render: item => <StatusBadge map={bookingStatusMap} value={item.paymentStatus || item.status} />,
    },
    {key: 'createdAt', title: 'Ngày đặt', render: item => formatDateTime(item.createdAt)},
  ];

  return (
    <section className="bookingAdminPage">
      <div className="pageTitle">
        <h2>Xem lịch sử đặt vé</h2>
        <button type="button" onClick={loadData}>
          Tải lại
        </button>
      </div>

      <div className="metricGrid">
        <article className="metricCard">
          <span>Tổng đơn</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metricCard">
          <span>Hoàn tất</span>
          <strong>{summary.paid}</strong>
        </article>
        <article className="metricCard">
          <span>Chờ xử lý</span>
          <strong>{summary.pending}</strong>
        </article>
        <article className="metricCard">
          <span>Đã hủy</span>
          <strong>{summary.cancelled}</strong>
        </article>
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
          aria-label="Lọc trạng thái đơn">
          <option value="all">Tất cả trạng thái</option>
          <option value="paid">Hoàn tất</option>
          <option value="pending">Chờ xử lý</option>
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

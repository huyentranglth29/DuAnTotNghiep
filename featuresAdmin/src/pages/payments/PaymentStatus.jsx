import { useEffect, useMemo, useState } from 'react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
import { formatDateTime, formatVnd, getUserName, shortId } from '../../utils/adminFormatters';

const paymentStatusMap = {
  unpaid: { label: 'Chưa thanh toán', tone: 'warning' },
  paid: { label: 'Đã thanh toán', tone: 'success' },
  refunded: { label: 'Hoàn tiền', tone: 'info' },
};

const bookingStatusMap = {
  pending: { label: 'Chờ xử lý', tone: 'warning' },
  paid: { label: 'Hoàn tất', tone: 'success' },
  cancelled: { label: 'Đã hủy', tone: 'danger' },
};

const paymentMethodMap = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  momo: 'Momo',
  vnpay: 'VNPay',
};

function StatusBadge({ map, value }) {
  const status = map[value] || { label: value || 'Chưa có', tone: 'info' };
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

function PaymentStatus() {
  const [bookings, setBookings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await bookingApi.getAll({
        limit: 500,
        sort: '-createdAt',
      });
      setBookings(Array.isArray(response) ? response : response?.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu thanh toán.');
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
        statusFilter === 'all' || booking.paymentStatus === statusFilter;
      const matchesMethod =
        methodFilter === 'all' || booking.paymentMethod === methodFilter;

      const searchable = [
        `DH-${shortId(booking)}`,
        booking.ticketCode,
        getUserName(booking),
        booking.user?.email,
        booking.movieTitle,
        booking.showtime?.movie?.title,
        booking.paymentStatus,
        booking.paymentMethod,
        booking.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesStatus &&
        matchesMethod &&
        (!normalizedKeyword || searchable.includes(normalizedKeyword))
      );
    });
  }, [bookings, keyword, methodFilter, statusFilter]);

  const summary = useMemo(() => {
    const paid = bookings.filter(item => item.paymentStatus === 'paid');
    const unpaid = bookings.filter(item => item.paymentStatus === 'unpaid');
    const refunded = bookings.filter(item => item.paymentStatus === 'refunded');

    return {
      total: bookings.length,
      paid: paid.length,
      unpaid: unpaid.length,
      refunded: refunded.length,
      revenue: paid.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    };
  }, [bookings]);

  const columns = [
    { key: 'code', title: 'Mã đơn', render: item => `DH-${shortId(item)}` },
    { key: 'customer', title: 'Khách hàng', render: getUserName },
    {
      key: 'movie',
      title: 'Phim',
      render: item => item.movieTitle || item.showtime?.movie?.title || '',
    },
    { key: 'totalPrice', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice) },
    {
      key: 'paymentMethod',
      title: 'Phương thức',
      render: item => paymentMethodMap[item.paymentMethod] || item.paymentMethod || 'Chưa chọn',
    },
    {
      key: 'paymentStatus',
      title: 'Thanh toán',
      render: item => <StatusBadge map={paymentStatusMap} value={item.paymentStatus} />,
    },
    {
      key: 'status',
      title: 'Trạng thái đơn',
      render: item => <StatusBadge map={bookingStatusMap} value={item.status} />,
    },
    { key: 'createdAt', title: 'Ngày tạo', render: item => formatDateTime(item.createdAt) },
  ];

  return (
    <section className="paymentPage">
      <div className="pageTitle">
        <h2>Theo dõi trạng thái thanh toán</h2>
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
          <span>Đã thanh toán</span>
          <strong>{summary.paid}</strong>
          <small>{formatVnd(summary.revenue)}</small>
        </article>
        <article className="metricCard">
          <span>Chưa thanh toán</span>
          <strong>{summary.unpaid}</strong>
        </article>
        <article className="metricCard">
          <span>Hoàn tiền</span>
          <strong>{summary.refunded}</strong>
        </article>
      </div>

      <div className="panel paymentFilters">
        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã đơn, khách hàng, phim..."
        />
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          aria-label="Lọc trạng thái thanh toán"
        >
          <option value="all">Tất cả thanh toán</option>
          <option value="unpaid">Chưa thanh toán</option>
          <option value="paid">Đã thanh toán</option>
          <option value="refunded">Hoàn tiền</option>
        </select>
        <select
          value={methodFilter}
          onChange={event => setMethodFilter(event.target.value)}
          aria-label="Lọc phương thức thanh toán"
        >
          <option value="all">Tất cả phương thức</option>
          <option value="cash">Tiền mặt</option>
          <option value="card">Thẻ</option>
          <option value="momo">Momo</option>
          <option value="vnpay">VNPay</option>
        </select>
      </div>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải dữ liệu thanh toán...</p>
      ) : (
        <Table
          columns={columns}
          data={filteredBookings}
          emptyText="Không có đơn thanh toán phù hợp"
        />
      )}
    </section>
  );
}

export default PaymentStatus;

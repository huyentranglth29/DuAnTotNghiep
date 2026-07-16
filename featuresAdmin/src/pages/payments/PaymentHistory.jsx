import {useEffect, useMemo, useState} from 'react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
import {formatDateTime, formatVnd, getUserName, shortId} from '../../utils/adminFormatters';

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

function StatusBadge({value}) {
  const status = paymentStatusMap[value] || {label: value || 'Chưa có', tone: 'info'};
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

const toDateInput = value => {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
};

function PaymentHistory() {
  const [bookings, setBookings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await bookingApi.getAll({
        limit: 500,
        sort: '-updatedAt',
      });
      setBookings(Array.isArray(response) ? response : response?.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được lịch sử thanh toán.');
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
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return bookings.filter(booking => {
      const historyTime = new Date(booking.updatedAt || booking.createdAt).getTime();
      const matchesFrom = !fromTime || historyTime >= fromTime;
      const matchesTo = !toTime || historyTime <= toTime;
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
        booking.paymentMethod,
        booking.paymentStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return (
        matchesFrom &&
        matchesTo &&
        matchesStatus &&
        matchesMethod &&
        (!normalizedKeyword || searchable.includes(normalizedKeyword))
      );
    });
  }, [bookings, fromDate, keyword, methodFilter, statusFilter, toDate]);

  const summary = useMemo(() => {
    const paid = filteredBookings.filter(item => item.paymentStatus === 'paid');
    const refunded = filteredBookings.filter(item => item.paymentStatus === 'refunded');
    const latest = filteredBookings[0];

    return {
      total: filteredBookings.length,
      paidRevenue: paid.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
      refunded: refunded.length,
      latestTime: latest ? formatDateTime(latest.updatedAt || latest.createdAt) : 'Chưa có',
    };
  }, [filteredBookings]);

  const columns = [
    {
      key: 'time',
      title: 'Thời gian',
      render: item => formatDateTime(item.updatedAt || item.createdAt),
    },
    {key: 'code', title: 'Mã đơn', render: item => `DH-${shortId(item)}`},
    {key: 'ticketCode', title: 'Mã vé', render: item => item.ticketCode || ''},
    {key: 'customer', title: 'Khách hàng', render: getUserName},
    {
      key: 'movie',
      title: 'Phim',
      render: item => item.movieTitle || item.showtime?.movie?.title || '',
    },
    {key: 'amount', title: 'Số tiền', render: item => formatVnd(item.totalPrice)},
    {
      key: 'method',
      title: 'Phương thức',
      render: item => paymentMethodMap[item.paymentMethod] || item.paymentMethod || 'Chưa chọn',
    },
    {
      key: 'paymentStatus',
      title: 'Kết quả',
      render: item => <StatusBadge value={item.paymentStatus} />,
    },
  ];

  return (
    <section className="paymentPage">
      <div className="pageTitle">
        <h2>Xem lịch sử thanh toán</h2>
        <button type="button" onClick={loadData}>
          Tải lại
        </button>
      </div>

      <div className="metricGrid">
        <article className="metricCard">
          <span>Giao dịch hiển thị</span>
          <strong>{summary.total}</strong>
        </article>
        <article className="metricCard">
          <span>Doanh thu đã thanh toán</span>
          <strong>{formatVnd(summary.paidRevenue)}</strong>
        </article>
        <article className="metricCard">
          <span>Lượt hoàn tiền</span>
          <strong>{summary.refunded}</strong>
        </article>
        <article className="metricCard">
          <span>Gần nhất</span>
          <strong className="paymentLatest">{summary.latestTime}</strong>
        </article>
      </div>

      <div className="panel paymentHistoryFilters">
        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã đơn, mã vé, khách hàng, phim..."
        />
        <select
          value={statusFilter}
          onChange={event => setStatusFilter(event.target.value)}
          aria-label="Lọc kết quả thanh toán"
        >
          <option value="all">Tất cả kết quả</option>
          <option value="paid">Đã thanh toán</option>
          <option value="unpaid">Chưa thanh toán</option>
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
        <input
          type="date"
          value={fromDate}
          max={toDate || undefined}
          onChange={event => setFromDate(event.target.value)}
          aria-label="Từ ngày"
        />
        <input
          type="date"
          value={toDate}
          min={fromDate || undefined}
          max={toDate || toDateInput(new Date())}
          onChange={event => setToDate(event.target.value)}
          aria-label="Đến ngày"
        />
      </div>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải lịch sử thanh toán...</p>
      ) : (
        <Table
          columns={columns}
          data={filteredBookings}
          emptyText="Không có lịch sử thanh toán phù hợp"
        />
      )}
    </section>
  );
}

export default PaymentHistory;

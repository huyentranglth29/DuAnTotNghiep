import { useEffect, useMemo, useState } from 'react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
import { formatDateTime, formatVnd, getUserName, shortId } from '../../utils/adminFormatters';

const paymentStatusMap = {
  cho_thanh_toan: { label: 'Chưa thanh toán', tone: 'warning' },
  da_thanh_toan: { label: 'Đã thanh toán', tone: 'success' },
  da_hoan_tien: { label: 'Đã hoàn tiền', tone: 'info' },
  da_huy: { label: 'Đã hủy', tone: 'danger' },
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
  payos: 'PayOS',
  PAYOS: 'PayOS',
  ncb: 'Ngân hàng NCB',
  NCB: 'Ngân hàng NCB',
};

function normalizePaymentStatus(value) {
  const aliases = {
    paid: 'da_thanh_toan',
    unpaid: 'cho_thanh_toan',
    pending: 'cho_thanh_toan',
    refunded: 'da_hoan_tien',
    cancelled: 'da_huy',
  };
  return aliases[value] || value || 'cho_thanh_toan';
}

function toLocalDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function StatusBadge({ map, value }) {
  const status = map[value] || { label: value || 'Chưa có', tone: 'info' };
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

function PaymentStatus() {
  const [bookings, setBookings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
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
      const paymentStatus = normalizePaymentStatus(booking.paymentStatus);
      const matchesStatus =
        statusFilter === 'all' || paymentStatus === statusFilter;
      const matchesMethod =
        methodFilter === 'all' ||
        String(booking.paymentMethod || '').toLowerCase() === methodFilter;
      const createdDate = toLocalDateKey(booking.createdAt);
      const matchesDateFrom = !dateFrom || (createdDate && createdDate >= dateFrom);
      const matchesDateTo = !dateTo || (createdDate && createdDate <= dateTo);

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
        matchesDateFrom &&
        matchesDateTo &&
        (!normalizedKeyword || searchable.includes(normalizedKeyword))
      );
    });
  }, [bookings, dateFrom, dateTo, keyword, methodFilter, statusFilter]);

  const summary = useMemo(() => {
    const paid = filteredBookings.filter(
      item => normalizePaymentStatus(item.paymentStatus) === 'da_thanh_toan',
    );
    const unpaid = filteredBookings.filter(
      item => normalizePaymentStatus(item.paymentStatus) === 'cho_thanh_toan',
    );
    const refunded = filteredBookings.filter(
      item => normalizePaymentStatus(item.paymentStatus) === 'da_hoan_tien',
    );
    const cancelled = filteredBookings.filter(
      item => normalizePaymentStatus(item.paymentStatus) === 'da_huy',
    );

    return {
      total: filteredBookings.length,
      paid: paid.length,
      unpaid: unpaid.length,
      refunded: refunded.length,
      cancelled: cancelled.length,
      revenue: paid.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    };
  }, [filteredBookings]);

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
      render: item => (
        <StatusBadge
          map={paymentStatusMap}
          value={normalizePaymentStatus(item.paymentStatus)}
        />
      ),
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
          Làm mới
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
        <article className="metricCard">
          <span>Đã hủy</span>
          <strong>{summary.cancelled}</strong>
        </article>
      </div>

      <p className="paymentReconcileHint">
        Đối soát: {summary.paid} đã thanh toán + {summary.unpaid} chưa thanh toán +{' '}
        {summary.refunded} hoàn tiền + {summary.cancelled} đã hủy = {summary.total} đơn
      </p>

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
          <option value="cho_thanh_toan">Chưa thanh toán</option>
          <option value="da_thanh_toan">Đã thanh toán</option>
          <option value="da_hoan_tien">Đã hoàn tiền</option>
          <option value="da_huy">Đã hủy</option>
        </select>
        <select
          value={methodFilter}
          onChange={event => setMethodFilter(event.target.value)}
          aria-label="Lọc phương thức thanh toán"
        >
          <option value="all">Tất cả phương thức</option>
          <option value="card">Thẻ</option>
          <option value="momo">Momo</option>
          <option value="vnpay">VNPay</option>
          <option value="payos">PayOS</option>
          <option value="ncb">Ngân hàng NCB</option>
        </select>
        <label className="paymentDateFilter">
          <span>Từ ngày</span>
          <input
            type="date"
            value={dateFrom}
            max={dateTo || undefined}
            onChange={event => setDateFrom(event.target.value)}
          />
        </label>
        <label className="paymentDateFilter">
          <span>Đến ngày</span>
          <input
            type="date"
            value={dateTo}
            min={dateFrom || undefined}
            onChange={event => setDateTo(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setKeyword('');
            setStatusFilter('all');
            setMethodFilter('all');
            setDateFrom('');
            setDateTo('');
          }}>
          Xóa bộ lọc
        </button>
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

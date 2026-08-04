import {useEffect, useMemo, useState} from 'react';
import paymentApi from '../../api/paymentApi';
import Table from '../../components/Table';
import {formatDateTime, formatVnd, getUserName, shortId} from '../../utils/adminFormatters';

const paymentStatusMap = {
  cho_thanh_toan: {label: 'Chưa thanh toán', tone: 'warning'},
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  that_bai: {label: 'Thất bại', tone: 'danger'},
};

const paymentMethodMap = {
  cash: 'Tiền mặt',
  card: 'Thẻ',
  momo: 'Momo',
  vnpay: 'VNPay',
  payos: 'PayOS',
  PAYOS: 'PayOS',
  mo_phong: 'Mô phỏng',
  ncb: 'Ngân hàng NCB',
  NCB: 'Ngân hàng NCB',
};

function normalizePaymentStatus(value) {
  const aliases = {
    paid: 'da_thanh_toan',
    unpaid: 'cho_thanh_toan',
    pending: 'cho_thanh_toan',
    da_hoan_tien: 'that_bai',
    da_huy: 'that_bai',
    het_han: 'that_bai',
    refunded: 'that_bai',
    cancelled: 'that_bai',
    expired: 'that_bai',
    failed: 'that_bai',
  };
  return aliases[value] || value || 'cho_thanh_toan';
}

function StatusBadge({value}) {
  const normalized = normalizePaymentStatus(value);
  const status = paymentStatusMap[normalized] || {label: normalized || 'Chưa có', tone: 'info'};
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
      const response = await paymentApi.getAll({
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
      const paymentStatus = normalizePaymentStatus(booking.status);
      const historyTime = new Date(booking.updatedAt || booking.createdAt).getTime();
      const matchesFrom = !fromTime || historyTime >= fromTime;
      const matchesTo = !toTime || historyTime <= toTime;
      const matchesStatus =
        statusFilter === 'all' || paymentStatus === statusFilter;
      const matchesMethod =
        methodFilter === 'all' ||
        String(booking.provider || '').toLowerCase() === methodFilter;

      const searchable = [
        `DH-${shortId(booking)}`,
        booking.orderCode,
        getUserName(booking),
        booking.user?.email,
        booking.bookingData?.movieTitle,
        booking.bookingData?.seats?.join(' '),
        booking.provider,
        booking.status,
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
    const paid = filteredBookings.filter(
      item => normalizePaymentStatus(item.status) === 'da_thanh_toan',
    );
    const failed = filteredBookings.filter(
      item => normalizePaymentStatus(item.status) === 'that_bai',
    );
    const latest = filteredBookings[0];

    return {
      total: filteredBookings.length,
      paidRevenue: paid.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      failed: failed.length,
      latestTime: latest ? formatDateTime(latest.updatedAt || latest.createdAt) : 'Chưa có',
    };
  }, [filteredBookings]);

  const columns = [
    {
      key: 'time',
      title: 'Thời gian',
      render: item => formatDateTime(item.updatedAt || item.createdAt),
    },
    {key: 'code', title: 'Mã giao dịch', render: item => item.orderCode || `GD-${shortId(item)}`},
    {key: 'seats', title: 'Ghế', render: item => item.bookingData?.seats?.join(', ') || ''},
    {key: 'customer', title: 'Khách hàng', render: getUserName},
    {
      key: 'movie',
      title: 'Phim',
      render: item => item.bookingData?.movieTitle || '',
    },
    {key: 'amount', title: 'Số tiền', render: item => formatVnd(item.amount)},
    {
      key: 'method',
      title: 'Phương thức',
      render: item => paymentMethodMap[item.provider] || item.provider || 'Chưa chọn',
    },
    {
      key: 'paymentStatus',
      title: 'Kết quả',
      render: item => <StatusBadge value={item.status} />,
    },
  ];

  return (
    <section className="paymentPage">
      <div className="pageTitle">
        <h2>Xem lịch sử thanh toán</h2>
        <button type="button" onClick={loadData}>
          Làm mới
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
          <span>Thất bại</span>
          <strong>{summary.failed}</strong>
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
          <option value="all">Tất cả thanh toán</option>
          <option value="cho_thanh_toan">Chưa thanh toán</option>
          <option value="da_thanh_toan">Đã thanh toán</option>
          <option value="that_bai">Thất bại</option>
        </select>
        <select
          value={methodFilter}
          onChange={event => setMethodFilter(event.target.value)}
          aria-label="Lọc phương thức thanh toán"
        >
          <option value="all">Tất cả phương thức</option>
          <option value="vnpay">VNPay</option>
          <option value="payos">PayOS</option>
          <option value="mo_phong">Mô phỏng</option>
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

import {useEffect, useMemo, useState} from 'react';
import {
  Search,
  Calendar,
  RefreshCw,
  FileSpreadsheet,
  RotateCcw,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import paymentApi from '../../api/paymentApi';
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

function exportToCsv(rows) {
  const headers = [
    'Mã GD',
    'Khách hàng',
    'Phim',
    'Ghế',
    'Số tiền',
    'Phương thức',
    'Trạng thái',
    'Thời gian thanh toán',
  ];
  const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [
    headers.join(','),
    ...rows.map(item =>
      [
        item.orderCode || `GD-${shortId(item)}`,
        getUserName(item),
        item.bookingData?.movieTitle || '',
        item.bookingData?.seats?.join(' ') || '',
        item.amount || 0,
        paymentMethodMap[item.provider] || item.provider || 'Chưa chọn',
        paymentStatusMap[normalizePaymentStatus(item.status)]?.label || item.status || '',
        item.updatedAt || item.createdAt
          ? new Date(item.updatedAt || item.createdAt).toLocaleString('vi-VN')
          : '',
      ]
        .map(escape)
        .join(','),
    ),
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\n')], {type: 'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `thanh-toan-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const ITEMS_PER_PAGE = 15;

function PaymentHistory() {
  const [bookings, setBookings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
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
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return bookings.filter(booking => {
      const paymentStatus = normalizePaymentStatus(booking.status);
      const historyTime = new Date(booking.updatedAt || booking.createdAt).getTime();
      const matchesFrom = !fromTime || historyTime >= fromTime;
      const matchesTo = !toTime || historyTime <= toTime;
      const matchesStatus = statusFilter === 'all' || paymentStatus === statusFilter;
      const matchesMethod =
        methodFilter === 'all' ||
        String(booking.provider || '').toLowerCase() === methodFilter;

      const searchable = [
        `GD-${shortId(booking)}`,
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

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, statusFilter, methodFilter, fromDate, toDate]);

  const summary = useMemo(() => {
    const paid = filteredBookings.filter(
      item => normalizePaymentStatus(item.status) === 'da_thanh_toan',
    );
    const unpaid = filteredBookings.filter(
      item => normalizePaymentStatus(item.status) === 'cho_thanh_toan',
    );
    const failed = filteredBookings.filter(
      item => normalizePaymentStatus(item.status) === 'that_bai',
    );
    const latest = filteredBookings[0];

    return {
      total: filteredBookings.length,
      paid: paid.length,
      paidRevenue: paid.reduce((sum, item) => sum + Number(item.amount || 0), 0),
      unpaid: unpaid.length,
      failed: failed.length,
      latestTime: latest ? formatDateTime(latest.updatedAt || latest.createdAt) : 'Chưa có',
    };
  }, [filteredBookings]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / ITEMS_PER_PAGE));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBookings, currentPage]);

  const clearFilters = () => {
    setKeyword('');
    setStatusFilter('all');
    setMethodFilter('all');
    setFromDate('');
    setToDate('');
  };

  const hasActiveFilters = Boolean(keyword || statusFilter !== 'all' || methodFilter !== 'all' || fromDate || toDate);

  return (
    <section className="paymentPage">
      {/* Header */}
      <header className="paymentHeader">
        <div>
          <h2>Quản lý thanh toán</h2>
          <p>Theo dõi luồng tiền, lịch sử và trạng thái các giao dịch thanh toán.</p>
        </div>
        <div className="paymentHeaderActions">
          <button
            type="button"
            className="paymentBtnGhost"
            onClick={() => exportToCsv(filteredBookings)}
            disabled={filteredBookings.length === 0}
          >
            <FileSpreadsheet size={16} />
            Xuất CSV
          </button>
          <button type="button" className="paymentBtnPrimary" onClick={loadData} disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Làm mới
          </button>
        </div>
      </header>

      {/* Metrics */}
      <div className="paymentMetricGrid">
        <article className="paymentMetricCard total">
          <div className="paymentMetricIcon">
            <CreditCard size={22} />
          </div>
          <div className="paymentMetricInfo">
            <span>Tổng giao dịch</span>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className="paymentMetricCard paid">
          <div className="paymentMetricIcon">
            <CheckCircle2 size={22} />
          </div>
          <div className="paymentMetricInfo">
            <span>Đã thanh toán</span>
            <strong>{summary.paid}</strong>
            <small>{formatVnd(summary.paidRevenue)}</small>
          </div>
        </article>

        <article className="paymentMetricCard unpaid">
          <div className="paymentMetricIcon">
            <Clock size={22} />
          </div>
          <div className="paymentMetricInfo">
            <span>Chưa thanh toán</span>
            <strong>{summary.unpaid}</strong>
          </div>
        </article>

        <article className="paymentMetricCard failed">
          <div className="paymentMetricIcon">
            <XCircle size={22} />
          </div>
          <div className="paymentMetricInfo">
            <span>Thất bại / Hủy</span>
            <strong>{summary.failed}</strong>
          </div>
        </article>

        <article className="paymentMetricCard latest">
          <div className="paymentMetricIcon">
            <TrendingUp size={22} />
          </div>
          <div className="paymentMetricInfo">
            <span>Gần nhất</span>
            <strong className="latestTime">{summary.latestTime}</strong>
          </div>
        </article>
      </div>

      {/* Toolbar */}
      <div className="paymentToolbar">
        <div className="paymentFilterBar">
          <label className="paymentSearch">
            <Search size={16} />
            <input
              value={keyword}
              onChange={event => setKeyword(event.target.value)}
              placeholder="Tìm mã GD, khách hàng, phim, ghế..."
            />
          </label>

          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            aria-label="Lọc trạng thái thanh toán"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="da_thanh_toan">Đã thanh toán</option>
            <option value="cho_thanh_toan">Chưa thanh toán</option>
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
            <option value="momo">Momo</option>
            <option value="cash">Tiền mặt</option>
            <option value="card">Thẻ</option>
            <option value="ncb">Ngân hàng NCB</option>
            <option value="mo_phong">Mô phỏng</option>
          </select>

          <label className="paymentDateWrap">
            <Calendar size={16} />
            <input
              type="date"
              value={fromDate}
              max={toDate || undefined}
              onChange={event => setFromDate(event.target.value)}
              title="Từ ngày"
            />
          </label>

          <label className="paymentDateWrap">
            <Calendar size={16} />
            <input
              type="date"
              value={toDate}
              min={fromDate || undefined}
              onChange={event => setToDate(event.target.value)}
              title="Đến ngày"
            />
          </label>

          {hasActiveFilters && (
            <button type="button" className="paymentClearBtn" onClick={clearFilters}>
              <RotateCcw size={14} />
              Xóa lọc
            </button>
          )}
        </div>

        {/* Reconcile & Summary Bar */}
        <div className="paymentReconcileBar">
          <div className="paymentReconcilePills">
            <span className="paymentPill">
              <span className="paymentPillDot paid" />
              Đã thanh toán: <strong>{summary.paid}</strong>
            </span>
            <span className="paymentPill">
              <span className="paymentPillDot unpaid" />
              Chưa thanh toán: <strong>{summary.unpaid}</strong>
            </span>
            <span className="paymentPill">
              <span className="paymentPillDot failed" />
              Thất bại: <strong>{summary.failed}</strong>
            </span>
          </div>
          <span>
            Tổng đối soát: <strong>{summary.total}</strong> giao dịch
          </span>
        </div>
      </div>

      {error && <p className="loginError">{error}</p>}

      {/* Table Card */}
      <div className="paymentTableCard">
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>Mã giao dịch</th>
                <th>Khách hàng</th>
                <th>Phim</th>
                <th>Ghế</th>
                <th>Số tiền</th>
                <th>Phương thức</th>
                <th>Trạng thái</th>
                <th>Thời gian thanh toán</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{textAlign: 'center', padding: '36px', color: '#64748b'}}>
                    Đang tải dữ liệu giao dịch...
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{textAlign: 'center', padding: '36px', color: '#64748b'}}>
                    Không có giao dịch thanh toán phù hợp
                  </td>
                </tr>
              ) : (
                paginatedData.map(item => (
                  <tr key={item._id || item.id}>
                    <td>
                      <span className="paymentTxCode">{item.orderCode || `GD-${shortId(item)}`}</span>
                    </td>
                    <td>
                      <strong>{getUserName(item)}</strong>
                    </td>
                    <td>{item.bookingData?.movieTitle || '—'}</td>
                    <td>
                      <strong>{item.bookingData?.seats?.join(', ') || '—'}</strong>
                    </td>
                    <td>
                      <span className="paymentAmount">{formatVnd(item.amount)}</span>
                    </td>
                    <td>
                      <span className="paymentMethodTag">
                        {paymentMethodMap[item.provider] || item.provider || 'Chưa chọn'}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={item.status} />
                    </td>
                    <td>{formatDateTime(item.updatedAt || item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!loading && filteredBookings.length > 0 && (
          <div className="paymentPagination">
            <span>
              Hiển thị {(currentPage - 1) * ITEMS_PER_PAGE + 1} -{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} / {filteredBookings.length} giao dịch
            </span>
            <div className="paymentPaginationBtns">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({length: totalPages}, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <span key={page} style={{display: 'inline-flex', alignItems: 'center'}}>
                      {prev && page - prev > 1 && <span style={{padding: '0 4px'}}>...</span>}
                      <button
                        type="button"
                        className={currentPage === page ? 'active' : ''}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </span>
                  );
                })}
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default PaymentHistory;

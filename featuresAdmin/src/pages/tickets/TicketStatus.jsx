import {useEffect, useMemo, useState} from 'react';
import {CheckCircle2, RefreshCw, Search, Ticket, XCircle} from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';

const STATUS_META = {
  valid: {label: 'Hợp lệ', tone: 'success'},
  used: {label: 'Đã dùng', tone: 'info'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
};

const PAYMENT_STATUS_META = {
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  cho_thanh_toan: {label: 'Chờ thanh toán', tone: 'warning'},
  da_huy: {label: 'Đã hủy', tone: 'danger'},
  da_hoan_tien: {label: 'Đã hoàn tiền', tone: 'danger'},
};

function StatusBadge({status}) {
  const meta = STATUS_META[status] || {label: status || 'Chưa rõ', tone: 'info'};
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function PaymentBadge({status}) {
  const meta = PAYMENT_STATUS_META[status] || {label: status || 'Chưa rõ', tone: 'info'};
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function getTicketStatus(order) {
  if (order.paymentStatus === 'da_huy' || order.paymentStatus === 'da_hoan_tien') {
    return 'cancelled';
  }
  if (order.checkedIn) {
    return 'used';
  }
  return 'valid';
}

function TicketStatus() {
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        limit: 100,
        keyword: keyword || undefined,
      };

      if (status === 'valid') {
        params.payment = 'da_thanh_toan';
        params.checkIn = 'chua_check_in';
      }

      if (status === 'used') {
        params.payment = 'da_thanh_toan';
        params.checkIn = 'da_check_in';
      }

      if (status === 'cancelled') {
        params.payment = 'da_huy';
      }

      const response = await bookingApi.getAll(params);
      const rows = Array.isArray(response?.data) ? response.data : [];
      setOrders(rows);
    } catch (err) {
      setError(err.message || 'Không tải được trạng thái vé.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const stats = useMemo(() => {
    const initial = {total: orders.length, valid: 0, used: 0, cancelled: 0};
    orders.forEach(order => {
      const nextStatus = getTicketStatus(order);
      initial[nextStatus] += 1;
    });
    return initial;
  }, [orders]);

  const updateStatus = async (order, nextStatus) => {
    if (getTicketStatus(order) === nextStatus) return;
    setSavingId(order._id);
    try {
      if (nextStatus === 'used') {
        await bookingApi.update(order._id, {action: 'checkin'});
      }

      if (nextStatus === 'cancelled') {
        const reason = window.prompt('Nhập lý do hủy vé (tối thiểu 5 ký tự):');
        if (!reason || reason.trim().length < 5) {
          window.alert('Vui lòng nhập lý do hủy tối thiểu 5 ký tự.');
          return;
        }
        await bookingApi.update(order._id, {action: 'cancel', reason: reason.trim()});
      }

      await loadTickets();
    } catch (err) {
      window.alert(err.message || 'Cập nhật trạng thái vé thất bại.');
    } finally {
      setSavingId('');
    }
  };

  const columns = [
    {key: 'code', title: 'Mã vé / đơn', render: item => item.code},
    {
      key: 'customer',
      title: 'Khách hàng',
      render: item => (
        <div className="orderCustomerCell">
          <strong>{item.customerName}</strong>
          <span>{item.customerPhone || item.customerEmail || '—'}</span>
        </div>
      ),
    },
    {key: 'movie', title: 'Phim', render: item => item.movieTitle || 'Phim chưa xác định'},
    {key: 'showtime', title: 'Suất chiếu', render: item => item.showtimeLabel || '—'},
    {key: 'room', title: 'Phòng', render: item => item.roomName || '—'},
    {key: 'seat', title: 'Ghế', render: item => (item.seats || []).join(', ') || '—'},
    {key: 'price', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice)},
    {key: 'paymentStatus', title: 'Thanh toán', render: item => <PaymentBadge status={item.paymentStatus} />},
    {key: 'status', title: 'Trạng thái vé', render: item => <StatusBadge status={getTicketStatus(item)} />},
    {key: 'createdAt', title: 'Ngày đặt', render: item => formatDateTime(item.createdAt)},
    {
      key: 'actions',
      title: 'Cập nhật',
      render: item => (
        <div className="actionGroup">
          <button
            type="button"
            disabled={
              savingId === item._id ||
              getTicketStatus(item) === 'used' ||
              getTicketStatus(item) === 'cancelled'
            }
            onClick={() => updateStatus(item, 'used')}>
            Đã dùng
          </button>
          <button
            type="button"
            disabled={
              savingId === item._id ||
              getTicketStatus(item) === 'cancelled' ||
              item.checkedIn ||
              item.paymentStatus !== 'da_thanh_toan'
            }
            onClick={() => updateStatus(item, 'cancelled')}>
            Hủy vé
          </button>
        </div>
      ),
    },
  ];

  const submitSearch = event => {
    event.preventDefault();
    loadTickets();
  };

  return (
    <section className="statusDataPage">
      <div className="statusHeader">
        <div>
          <h2>Theo dõi trạng thái vé</h2>
          <p>Dữ liệu lấy trực tiếp từ đơn đặt vé thật của người dùng, gồm trạng thái thanh toán và check-in.</p>
        </div>
        <button type="button" className="ghost" onClick={loadTickets}>
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="statusMetricGrid">
        <article className="statusMetric">
          <Ticket size={18} />
          <span>Tổng vé</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="statusMetric success">
          <CheckCircle2 size={18} />
          <span>Hợp lệ</span>
          <strong>{stats.valid}</strong>
        </article>
        <article className="statusMetric info">
          <CheckCircle2 size={18} />
          <span>Đã dùng</span>
          <strong>{stats.used}</strong>
        </article>
        <article className="statusMetric danger">
          <XCircle size={18} />
          <span>Đã hủy</span>
          <strong>{stats.cancelled}</strong>
        </article>
      </div>

      <form className="toolbar statusToolbar" onSubmit={submitSearch}>
        <label className="statusSearch">
          <Search size={16} />
          <input
            value={keyword}
            onChange={event => setKeyword(event.target.value)}
            placeholder="Tìm mã vé, khách hàng, phim..."
          />
        </label>
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="valid">Hợp lệ</option>
          <option value="used">Đã dùng</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button type="submit">Lọc dữ liệu</button>
      </form>

      {error ? <p className="loginError">{error}</p> : null}
      {loading ? <p>Đang tải dữ liệu vé...</p> : <Table columns={columns} data={orders} emptyText="Không có vé phù hợp" />}
    </section>
  );
}

export default TicketStatus;

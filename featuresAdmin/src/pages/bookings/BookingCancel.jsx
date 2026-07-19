import {useEffect, useMemo, useState} from 'react';
import {RefreshCw, Search, XCircle} from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import Table from '../../components/Table';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';

const PAYMENT_BADGE = {
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  cho_thanh_toan: {label: 'Chờ thanh toán', tone: 'warning'},
  da_huy: {label: 'Đã hủy', tone: 'danger'},
  da_hoan_tien: {label: 'Đã hoàn tiền', tone: 'danger'},
};

function PaymentBadge({value}) {
  const meta = PAYMENT_BADGE[value] || {label: value || '—', tone: 'info'};
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function BookingCancel() {
  const [orders, setOrders] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [view, setView] = useState('cancellable');
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const params =
        view === 'cancelled'
          ? {payment: 'da_huy'}
          : {payment: 'da_thanh_toan', checkIn: 'chua_check_in'};
      const response = await bookingApi.getAll({
        ...params,
        keyword: keyword || undefined,
        limit: 100,
      });
      setOrders(Array.isArray(response?.data) ? response.data : []);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách đơn hủy.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [view]);

  const stats = useMemo(() => {
    const cancellable = orders.filter(order => order.paymentStatus === 'da_thanh_toan' && !order.checkedIn).length;
    const cancelled = orders.filter(order => order.paymentStatus === 'da_huy' || order.paymentStatus === 'da_hoan_tien').length;
    const revenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0);
    return {total: orders.length, cancellable, cancelled, revenue};
  }, [orders]);

  const openCancel = order => {
    setSelected(order);
    setReason('');
  };

  const closeCancel = () => {
    setSelected(null);
    setReason('');
  };

  const submitCancel = async () => {
    if (!selected) return;
    const cleanReason = reason.trim();
    if (cleanReason.length < 5) {
      window.alert('Vui lòng nhập lý do hủy tối thiểu 5 ký tự.');
      return;
    }
    setActing(true);
    try {
      await bookingApi.update(selected._id, {
        action: 'cancel',
        reason: cleanReason,
      });
      closeCancel();
      await loadOrders();
    } catch (err) {
      window.alert(err.message || 'Hủy đơn thất bại.');
    } finally {
      setActing(false);
    }
  };

  const columns = [
    {key: 'code', title: 'Mã đơn'},
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
    {key: 'movieTitle', title: 'Phim'},
    {key: 'showtimeLabel', title: 'Suất chiếu', render: item => item.showtimeLabel || '—'},
    {key: 'seats', title: 'Ghế', render: item => (item.seats || []).join(', ') || '—'},
    {key: 'totalPrice', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice)},
    {key: 'paymentStatus', title: 'Trạng thái', render: item => <PaymentBadge value={item.paymentStatus} />},
    {key: 'createdAt', title: 'Ngày đặt', render: item => formatDateTime(item.createdAt)},
    {
      key: 'actions',
      title: 'Thao tác',
      render: item =>
        item.paymentStatus === 'da_thanh_toan' && !item.checkedIn ? (
          <button type="button" className="orderBtnCancel compact" onClick={() => openCancel(item)}>
            <XCircle size={15} />
            Hủy đơn
          </button>
        ) : (
          <span className="mutedText">{item.cancelReason || 'Đã xử lý'}</span>
        ),
    },
  ];

  const submitSearch = event => {
    event.preventDefault();
    loadOrders();
  };

  return (
    <section className="statusDataPage">
      <div className="statusHeader">
        <div>
          <h2>Hủy đặt vé</h2>
          <p>Dữ liệu lấy từ đơn đặt vé thật; khi hủy sẽ cập nhật trạng thái và giải phóng ghế đã đặt.</p>
        </div>
        <button type="button" className="ghost" onClick={loadOrders}>
          <RefreshCw size={16} />
          Làm mới
        </button>
      </div>

      <div className="statusMetricGrid">
        <article className="statusMetric">
          <XCircle size={18} />
          <span>Đơn đang xem</span>
          <strong>{stats.total}</strong>
        </article>
        <article className="statusMetric success">
          <XCircle size={18} />
          <span>Có thể hủy</span>
          <strong>{stats.cancellable}</strong>
        </article>
        <article className="statusMetric danger">
          <XCircle size={18} />
          <span>Đã hủy/hoàn tiền</span>
          <strong>{stats.cancelled}</strong>
        </article>
        <article className="statusMetric info">
          <XCircle size={18} />
          <span>Giá trị đơn</span>
          <strong>{formatVnd(stats.revenue)}</strong>
        </article>
      </div>

      <form className="toolbar statusToolbar" onSubmit={submitSearch}>
        <label className="statusSearch">
          <Search size={16} />
          <input
            value={keyword}
            onChange={event => setKeyword(event.target.value)}
            placeholder="Tìm mã đơn, khách hàng, phim..."
          />
        </label>
        <select value={view} onChange={event => setView(event.target.value)}>
          <option value="cancellable">Đơn có thể hủy</option>
          <option value="cancelled">Đơn đã hủy / hoàn tiền</option>
        </select>
        <button type="submit">Lọc dữ liệu</button>
      </form>

      {error ? <p className="loginError">{error}</p> : null}
      {loading ? <p>Đang tải dữ liệu đơn đặt vé...</p> : <Table columns={columns} data={orders} emptyText="Không có đơn phù hợp" />}

      {selected ? (
        <div className="orderConfirmOverlay" role="dialog" aria-modal="true">
          <div className="orderConfirmModal">
            <h3>Hủy đơn đặt vé</h3>
            <p>
              Đơn <strong>{selected.code}</strong> — {selected.customerName} / {selected.movieTitle}
            </p>
            <label>
              Lý do hủy (bắt buộc)
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: Khách yêu cầu hủy, suất chiếu thay đổi..."
              />
            </label>
            <div className="orderConfirmActions">
              <button type="button" className="orderBtnGhost" onClick={closeCancel}>
                Đóng
              </button>
              <button type="button" className="orderBtnCancel" disabled={acting} onClick={submitCancel}>
                {acting ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default BookingCancel;

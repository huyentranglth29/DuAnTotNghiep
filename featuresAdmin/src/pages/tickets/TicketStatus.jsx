import {useEffect, useMemo, useState} from 'react';
import {CheckCircle2, Eye, Printer, RefreshCw, Search, Ticket, XCircle} from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';

const STATUS_META = {
  valid: {label: 'Chưa check-in', tone: 'warning'},
  used: {label: 'Đã check-in', tone: 'success'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
};

const PAYMENT_STATUS_META = {
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  cho_thanh_toan: {label: 'Chờ thanh toán', tone: 'warning'},
  da_huy: {label: 'Đã hủy', tone: 'danger'},
  da_hoan_tien: {label: 'Đã hoàn tiền', tone: 'danger'},
};

const PRINT_STATUS_META = {
  da_in: {label: 'Đã in', tone: 'success'},
  chua_in: {label: 'Chưa in', tone: 'warning'},
};

function StatusBadge({status}) {
  const meta = STATUS_META[status] || {label: status || 'Chưa rõ', tone: 'info'};
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function PaymentBadge({status}) {
  const meta = PAYMENT_STATUS_META[status] || {label: status || 'Chưa rõ', tone: 'info'};
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function PrintBadge({isPrinted, cancelled}) {
  if (cancelled) return <span className="badge muted">—</span>;
  const meta = isPrinted ? PRINT_STATUS_META.da_in : PRINT_STATUS_META.chua_in;
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
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [printFilter, setPrintFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

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

      if (paymentFilter !== 'all') {
        params.payment = paymentFilter;
      }

      if (printFilter !== 'all') {
        params.print = printFilter;
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
    const initial = {
      total: orders.length,
      paid: 0,
      unpaid: 0,
      printed: 0,
      unprinted: 0,
      valid: 0,
      used: 0,
      cancelled: 0,
    };
    orders.forEach(order => {
      const nextStatus = getTicketStatus(order);
      initial[nextStatus] = (initial[nextStatus] || 0) + 1;
      if (order.paymentStatus === 'da_thanh_toan') initial.paid += 1;
      else if (order.paymentStatus === 'cho_thanh_toan') initial.unpaid += 1;
      if (order.isPrinted) initial.printed += 1;
      else initial.unprinted += 1;
    });
    return initial;
  }, [orders]);

  const handlePrintOrder = async order => {
    if (!order || savingId) return;
    setSavingId(order._id);
    try {
      await bookingApi.update(order._id, {action: 'print'});
      await loadTickets();
      setSelectedOrder(current =>
        current
          ? {
              ...current,
              isPrinted: true,
              printedCount: Number(current.printedCount || 0) + 1,
              checkedIn: true,
            }
          : null,
      );
      window.print();
    } catch (err) {
      window.alert(err.message || 'In vé thất bại.');
    } finally {
      setSavingId('');
    }
  };

  const handleCancelOrder = async order => {
    if (!order || savingId) return;
    const reason = window.prompt('Nhập lý do hủy vé (tối thiểu 5 ký tự):');
    if (!reason || reason.trim().length < 5) {
      if (reason !== null) window.alert('Vui lòng nhập lý do hủy tối thiểu 5 ký tự.');
      return;
    }
    setSavingId(order._id);
    try {
      await bookingApi.update(order._id, {action: 'cancel', reason: reason.trim()});
      await loadTickets();
      setSelectedOrder(current =>
        current
          ? {
              ...current,
              paymentStatus: 'da_huy',
              status: 'cancelled',
            }
          : null,
      );
    } catch (err) {
      window.alert(err.message || 'Hủy vé thất bại.');
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
    {
      key: 'isPrinted',
      title: 'In vé',
      render: item => (
        <PrintBadge
          isPrinted={item.isPrinted}
          cancelled={item.paymentStatus === 'da_huy' || item.paymentStatus === 'da_hoan_tien'}
        />
      ),
    },
    {key: 'status', title: 'Trạng thái vé', render: item => <StatusBadge status={getTicketStatus(item)} />},
    {key: 'createdAt', title: 'Ngày đặt', render: item => formatDateTime(item.createdAt)},
    {
      key: 'actions',
      title: 'Thao tác',
      render: item => (
        <button
          type="button"
          className="ghost"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            fontSize: 13,
            cursor: 'pointer',
            borderRadius: 6,
          }}
          onClick={() => setSelectedOrder(item)}>
          <Eye size={15} />
          Chi tiết / In
        </button>
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
          <p>Dữ liệu lấy trực tiếp từ đơn đặt vé thật của người dùng, gồm trạng thái thanh toán, in vé và check-in.</p>
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
          <span>Đã thanh toán</span>
          <strong>{stats.paid}</strong>
        </article>
        <article className="statusMetric warning">
          <Ticket size={18} />
          <span>Chưa check-in</span>
          <strong>{stats.valid}</strong>
        </article>
        <article className="statusMetric info">
          <CheckCircle2 size={18} />
          <span>Đã check-in</span>
          <strong>{stats.used}</strong>
        </article>
        <article className="statusMetric success">
          <CheckCircle2 size={18} />
          <span>Đã in</span>
          <strong>{stats.printed}</strong>
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
        <select value={paymentFilter} onChange={event => setPaymentFilter(event.target.value)}>
          <option value="all">Tất cả thanh toán</option>
          <option value="da_thanh_toan">Đã thanh toán</option>
          <option value="cho_thanh_toan">Chờ thanh toán</option>
          <option value="da_huy">Đã hủy</option>
        </select>
        <select value={printFilter} onChange={event => setPrintFilter(event.target.value)}>
          <option value="all">In vé (Tất cả)</option>
          <option value="da_in">Đã in</option>
          <option value="chua_in">Chưa in</option>
        </select>
        <select value={status} onChange={event => setStatus(event.target.value)}>
          <option value="all">Trạng thái check-in (Tất cả)</option>
          <option value="valid">Chưa check-in</option>
          <option value="used">Đã check-in</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button type="submit">Lọc dữ liệu</button>
      </form>

      {error ? <p className="loginError">{error}</p> : null}
      {loading ? <p>Đang tải dữ liệu vé...</p> : <Table columns={columns} data={orders} emptyText="Không có vé phù hợp" />}

      <Modal
        open={Boolean(selectedOrder)}
        className="ticketDetailModal"
        title={`Chi tiết đơn vé ${selectedOrder?.code || ''}`}
        onClose={() => setSelectedOrder(null)}>
        {selectedOrder ? (
          <div className="ticketDetailContent">
            <div className="ticketDetailHero">
              <div className="ticketDetailIdentity">
                <span className="ticketDetailEyebrow">VÉ ĐIỆN TỬ FILMGO</span>
                <strong>{selectedOrder.code}</strong>
                <small>Mã đơn đặt vé của khách hàng</small>
              </div>
              <div className="ticketDetailHeroStatus">
                <span className="ticketDetailHeroStatusLabel">Trạng thái vé</span>
                <StatusBadge status={getTicketStatus(selectedOrder)} />
              </div>
            </div>

            <div className="ticketDetailSectionHeading">
              <div>
                <h3>Thông tin vé & Lịch chiếu</h3>
                <p>Kiểm tra thông tin phim, suất chiếu, ghế ngồi và thanh toán.</p>
              </div>
            </div>

            <div className="ticketDetailGrid">
              <div className="ticketDetailItem ticketDetailItemWide">
                <span>Phim</span>
                <strong>{selectedOrder.movieTitle || 'Không tìm thấy phim'}</strong>
              </div>
              <div className="ticketDetailItem">
                <span>Suất chiếu</span>
                <strong>{selectedOrder.showtimeLabel || '—'}</strong>
              </div>
              <div className="ticketDetailItem">
                <span>Phòng chiếu</span>
                <strong>{selectedOrder.roomName || '—'}</strong>
              </div>
              <div className="ticketDetailItem">
                <span>Ghế</span>
                <strong style={{color: '#e11d48'}}>{(selectedOrder.seats || []).join(', ') || '—'}</strong>
              </div>
              <div className="ticketDetailItem">
                <span>Tổng tiền</span>
                <strong>{formatVnd(selectedOrder.totalPrice)}</strong>
              </div>
              <div className="ticketDetailItem ticketDetailItemWide">
                <span>Khách hàng</span>
                <strong>{selectedOrder.customerName}</strong>
                <small>{selectedOrder.customerEmail || 'Chưa có email'}</small>
                <small>{selectedOrder.customerPhone || 'Chưa có số điện thoại'}</small>
              </div>
              <div className="ticketDetailItem">
                <span>Thanh toán</span>
                <PaymentBadge status={selectedOrder.paymentStatus} />
              </div>
              <div className="ticketDetailItem">
                <span>Trạng thái in</span>
                <PrintBadge
                  isPrinted={selectedOrder.isPrinted}
                  cancelled={selectedOrder.paymentStatus === 'da_huy' || selectedOrder.paymentStatus === 'da_hoan_tien'}
                />
                {selectedOrder.printedAt ? <small>Lúc: {formatDateTime(selectedOrder.printedAt)}</small> : null}
              </div>
              <div className="ticketDetailItem">
                <span>Trạng thái check-in</span>
                <StatusBadge status={getTicketStatus(selectedOrder)} />
              </div>
              <div className="ticketDetailItem">
                <span>Ngày đặt</span>
                <strong>{formatDateTime(selectedOrder.createdAt)}</strong>
              </div>
              {selectedOrder.combos?.length ? (
                <div className="ticketDetailItem ticketDetailItemWide">
                  <span>Combo bắp nước</span>
                  <strong>
                    {selectedOrder.combos.map(item => `${item.name} × ${item.quantity}`).join(', ')}
                  </strong>
                </div>
              ) : null}
            </div>

            <div className="formActions" style={{marginTop: 24, justifyContent: 'flex-end', gap: 10}}>
              {selectedOrder.paymentStatus === 'da_thanh_toan' && !selectedOrder.checkedIn && (
                <button
                  type="button"
                  className="danger ghost"
                  disabled={savingId === selectedOrder._id}
                  onClick={() => handleCancelOrder(selectedOrder)}>
                  Hủy vé
                </button>
              )}
              {selectedOrder.paymentStatus === 'da_thanh_toan' && (
                <button
                  type="button"
                  style={{display: 'inline-flex', alignItems: 'center', gap: 8}}
                  disabled={savingId === selectedOrder._id}
                  onClick={() => handlePrintOrder(selectedOrder)}>
                  <Printer size={16} />
                  {savingId === selectedOrder._id
                    ? 'Đang xử lý...'
                    : selectedOrder.isPrinted
                    ? 'In lại vé'
                    : 'In vé & Check-in'}
                </button>
              )}
              <button type="button" className="ghost" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

export default TicketStatus;

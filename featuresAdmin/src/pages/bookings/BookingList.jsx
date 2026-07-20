import {useEffect, useMemo, useRef, useState} from 'react';
import {QRCodeSVG} from 'qrcode.react';
import {
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  FileSpreadsheet,
  MoreHorizontal,
  Printer,
  RefreshCw,
  Search,
  Undo2,
  X,
  XCircle,
} from 'lucide-react';
import bookingApi from '../../api/bookingApi';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';
import {useAdminTheme} from '../../theme/AdminThemeContext';

const PAYMENT_BADGE = {
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  cho_thanh_toan: {label: 'Chờ thanh toán', tone: 'warning'},
  da_huy: {label: 'Đã hủy', tone: 'danger'},
  da_hoan_tien: {label: 'Đã hoàn tiền', tone: 'danger'},
};

const METHOD_LABEL = {
  MBBANK_MO_PHONG: 'MB Bank (mô phỏng)',
  VCB_MO_PHONG: 'Vietcombank (mô phỏng)',
  NCB_MO_PHONG: 'NCB (mô phỏng)',
  momo: 'MoMo',
  vnpay: 'VNPay',
  cash: 'Tiền mặt',
  card: 'Thẻ',
};

function Badge({map, value}) {
  const item = map[value] || {label: value || '—', tone: 'muted'};
  return <span className={`orderBadge orderBadge--${item.tone}`}>{item.label}</span>;
}

function CheckInBadge({checkedIn, cancelled}) {
  if (cancelled) {
    return <span className="orderBadge orderBadge--muted">—</span>;
  }
  if (checkedIn) {
    return <span className="orderBadge orderBadge--success">Đã check-in</span>;
  }
  return <span className="orderBadge orderBadge--muted">Chưa check-in</span>;
}

function Timeline({order}) {
  const steps = [
    {key: 'booked', label: 'Đặt vé', at: order.timeline?.bookedAt},
    {key: 'paid', label: 'Thanh toán', at: order.timeline?.paidAt},
    {key: 'ticket', label: 'Xuất vé', at: order.timeline?.ticketIssuedAt},
    {key: 'checkin', label: 'Check-in', at: order.timeline?.checkedInAt},
    {
      key: 'done',
      label: 'Hoàn thành',
      at: order.checkedIn ? order.timeline?.completedAt : null,
    },
  ];

  return (
    <ol className="orderTimeline">
      {steps.map((step, index) => {
        const done = Boolean(step.at);
        return (
          <li key={step.key} className={done ? 'is-done' : ''}>
            <div className="orderTimelineMark">
              {done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
              {index < steps.length - 1 ? <i /> : null}
            </div>
            <div>
              <strong>{step.label}</strong>
              <span>{done ? formatDateTime(step.at) : 'Chưa tới bước này'}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function BookingList() {
  const {darkMode} = useAdminTheme();
  const [orders, setOrders] = useState([]);
  const [movies, setMovies] = useState([]);
  const [pagination, setPagination] = useState({page: 1, totalPages: 1, total: 0, limit: 10});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [menuId, setMenuId] = useState('');
  const [acting, setActing] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null); // {order, action: 'cancel'|'refund'}
  const [actionReason, setActionReason] = useState('');

  const [draft, setDraft] = useState({
    keyword: '',
    movie: '',
    date: '',
    payment: '',
    checkIn: '',
  });
  const [filters, setFilters] = useState(draft);
  const skipFirstFilterLoad = useRef(true);

  const loadMovies = async () => {
    try {
      const response = await bookingApi.getMovies();
      setMovies(Array.isArray(response?.data) ? response.data : []);
    } catch {
      setMovies([]);
    }
  };

  const loadOrders = async (page = 1, nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const response = await bookingApi.getAll({
        page,
        limit: 10,
        keyword: nextFilters.keyword || undefined,
        movie: nextFilters.movie || undefined,
        date: nextFilters.date || undefined,
        payment: nextFilters.payment || undefined,
        checkIn: nextFilters.checkIn || undefined,
      });
      const rows = Array.isArray(response?.data) ? response.data : [];
      setOrders(rows);
      setPagination(response?.pagination || {page: 1, totalPages: 1, total: rows.length, limit: 10});
      setSelected(current => {
        if (!current) return null;
        return rows.find(item => item._id === current._id) || null;
      });
    } catch (err) {
      setError(err.message || 'Không tải được đơn đặt vé.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMovies();
    loadOrders(1, filters);
  }, []);

  // Dropdown / ngày: lọc ngay khi đổi
  useEffect(() => {
    if (skipFirstFilterLoad.current) {
      skipFirstFilterLoad.current = false;
      return;
    }
    setFilters(draft);
    loadOrders(1, draft);
  }, [draft.movie, draft.date, draft.payment, draft.checkIn]);

  // Ô tìm kiếm: debounce 350ms rồi lọc
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(current => {
        if (current.keyword === draft.keyword) {
          return current;
        }
        const next = {...current, keyword: draft.keyword};
        loadOrders(1, next);
        return next;
      });
    }, 350);
    return () => clearTimeout(timer);
  }, [draft.keyword]);

  const rangeLabel = useMemo(() => {
    if (!pagination.total) return 'Hiển thị 0 đơn đặt vé';
    const from = (pagination.page - 1) * pagination.limit + 1;
    const to = Math.min(pagination.page * pagination.limit, pagination.total);
    return `Hiển thị ${from} đến ${to} của ${pagination.total} đơn đặt vé`;
  }, [pagination]);

  const updateDraft = (key, value) => {
    setDraft(current => ({...current, [key]: value}));
  };

  const refresh = () => loadOrders(pagination.page, filters);

  const openDetail = order => {
    setSelected(order);
    setMenuId('');
  };

  const canCancelOrder = order =>
    order &&
    order.paymentStatus === 'da_thanh_toan' &&
    !order.checkedIn;

  const canRefundOrder = order => order && order.paymentStatus === 'da_thanh_toan';

  const openActionModal = (order, action) => {
    if (action === 'cancel' && !canCancelOrder(order)) {
      window.alert(
        order?.checkedIn
          ? 'Không thể hủy đơn đã check-in.'
          : 'Chỉ hủy được đơn đã thanh toán và chưa check-in.',
      );
      return;
    }
    if (action === 'refund' && !canRefundOrder(order)) {
      window.alert('Chỉ hoàn tiền đơn đã thanh toán.');
      return;
    }
    setConfirmModal({order, action});
    setActionReason('');
    setMenuId('');
  };

  const closeActionModal = () => {
    setConfirmModal(null);
    setActionReason('');
  };

  const runAction = async (order, action, reason = '') => {
    if (action === 'checkin') {
      if (!window.confirm('Xác nhận check-in?')) return;
    }

    setActing(true);
    try {
      const payload = {action};
      if (reason) payload.reason = reason;
      const response = await bookingApi.update(order._id, payload);
      const next = response?.data;
      if (next) {
        setOrders(current => current.map(item => (item._id === next._id ? next : item)));
        setSelected(current => (current?._id === next._id ? next : current));
      } else {
        await refresh();
      }
      closeActionModal();
    } catch (err) {
      window.alert(err.message || 'Thao tác thất bại.');
    } finally {
      setActing(false);
      setMenuId('');
    }
  };

  const submitConfirmModal = () => {
    if (!confirmModal) return;
    const reason = actionReason.trim();
    if (reason.length < 5) {
      window.alert(
        confirmModal.action === 'cancel'
          ? 'Vui lòng nhập lý do hủy (tối thiểu 5 ký tự).'
          : 'Vui lòng nhập lý do hoàn tiền (tối thiểu 5 ký tự).',
      );
      return;
    }
    void runAction(confirmModal.order, confirmModal.action, reason);
  };

  const exportExcel = () => {
    const header = [
      'Mã đơn',
      'Khách hàng',
      'SĐT',
      'Phim',
      'Suất chiếu',
      'Ghế',
      'Tổng tiền',
      'Thanh toán',
      'Check-in',
      'Thời gian đặt',
    ];
    const lines = orders.map(order => [
      order.code,
      order.customerName,
      order.customerPhone,
      order.movieTitle,
      order.showtimeLabel,
      (order.seats || []).join(' '),
      order.totalPrice,
      PAYMENT_BADGE[order.paymentStatus]?.label || order.paymentStatus,
      order.checkedIn ? 'Đã check-in' : 'Chưa check-in',
      formatDateTime(order.createdAt),
    ]);
    const csv = [header, ...lines]
      .map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `don-dat-ve-page-${pagination.page}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const printTicket = () => {
    if (!selected) return;
    window.print();
  };

  const isCancelled =
    selected?.paymentStatus === 'da_huy' || selected?.paymentStatus === 'da_hoan_tien';

  return (
    <section className={`orderManagePage ${selected ? 'has-panel' : ''}`}>
      <div className="orderManageMain">
        <header className="orderManageHeader">
          <div>
            <h2>Quản lý đơn đặt vé</h2>
            <p>Theo dõi và quản lý tất cả đơn đặt vé của người dùng.</p>
          </div>
          <div className="orderManageActions">
            <button type="button" className="orderBtnGhost" onClick={exportExcel}>
              <FileSpreadsheet size={16} />
              Xuất Excel
            </button>
            <button type="button" className="orderBtnGhost" onClick={refresh}>
              <RefreshCw size={16} />
              Làm mới
            </button>
          </div>
        </header>

        <div className="orderFilterBar">
          <label className="orderSearch">
            <Search size={16} />
            <input
              value={draft.keyword}
              onChange={event => updateDraft('keyword', event.target.value)}
              placeholder="Tìm mã đơn, tên khách, số điện thoại..."
            />
          </label>
          <select
            value={draft.movie}
            onChange={event => updateDraft('movie', event.target.value)}
            aria-label="Lọc theo phim">
            <option value="">Phim</option>
            {movies.map(title => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
          <label className="orderDate">
            <Calendar size={16} />
            <input
              type="date"
              value={draft.date}
              onChange={event => updateDraft('date', event.target.value)}
            />
          </label>
          <select
            value={draft.payment}
            onChange={event => updateDraft('payment', event.target.value)}
            aria-label="Lọc thanh toán">
            <option value="">Thanh toán</option>
            <option value="da_thanh_toan">Đã thanh toán</option>
            <option value="cho_thanh_toan">Chờ thanh toán</option>
            <option value="da_huy">Đã hủy</option>
          </select>
          <select
            value={draft.checkIn}
            onChange={event => updateDraft('checkIn', event.target.value)}
            aria-label="Lọc check-in">
            <option value="">Check-in</option>
            <option value="da_check_in">Đã check-in</option>
            <option value="chua_check_in">Chưa check-in</option>
          </select>
        </div>

        {error ? <p className="orderError">{error}</p> : null}

        <div className="orderTableCard">
          <div className="orderTableWrap">
            <table className="orderTable">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Phim</th>
                  <th>Suất chiếu</th>
                  <th>Ghế</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Check-in</th>
                  <th>Thời gian đặt</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={10} className="orderEmpty">
                      Đang tải đơn đặt vé...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="orderEmpty">
                      Không có đơn đặt vé phù hợp.
                    </td>
                  </tr>
                ) : (
                  orders.map(order => {
                    const cancelled =
                      order.paymentStatus === 'da_huy' || order.paymentStatus === 'da_hoan_tien';
                    return (
                      <tr
                        key={order._id}
                        className={selected?._id === order._id ? 'is-active' : ''}>
                        <td>
                          <strong className="orderCode">{order.code}</strong>
                        </td>
                        <td>
                          <div className="orderCustomerCell">
                            <strong>{order.customerName}</strong>
                            <span>{order.customerPhone || order.customerEmail || '—'}</span>
                          </div>
                        </td>
                        <td>{order.movieTitle}</td>
                        <td>{order.showtimeLabel || '—'}</td>
                        <td>{(order.seats || []).join(', ') || '—'}</td>
                        <td>{formatVnd(order.totalPrice)}</td>
                        <td>
                          <Badge map={PAYMENT_BADGE} value={order.paymentStatus} />
                        </td>
                        <td>
                          <CheckInBadge checkedIn={order.checkedIn} cancelled={cancelled} />
                        </td>
                        <td>{formatDateTime(order.createdAt)}</td>
                        <td>
                          <div className="orderRowActions">
                            <button
                              type="button"
                              className="orderIconBtn"
                              title="Xem chi tiết"
                              onClick={() => openDetail(order)}>
                              <Eye size={16} />
                            </button>
                            <div className="orderMoreWrap">
                              <button
                                type="button"
                                className="orderIconBtn"
                                title="Thêm thao tác"
                                onClick={() =>
                                  setMenuId(current => (current === order._id ? '' : order._id))
                                }>
                                <MoreHorizontal size={16} />
                              </button>
                              {menuId === order._id ? (
                                <div className="orderMoreMenu">
                                  <button type="button" onClick={() => openDetail(order)}>
                                    Xem chi tiết
                                  </button>
                                  <button
                                    type="button"
                                    disabled={
                                      acting ||
                                      order.paymentStatus !== 'da_thanh_toan' ||
                                      order.checkedIn
                                    }
                                    onClick={() => runAction(order, 'checkin')}>
                                    Check-in
                                  </button>
                                  <button
                                    type="button"
                                    disabled={acting || !canRefundOrder(order)}
                                    onClick={() => openActionModal(order, 'refund')}>
                                    Hoàn tiền
                                  </button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="orderPagination">
            <span>{rangeLabel}</span>
            <div>
              <button
                type="button"
                disabled={pagination.page <= 1 || loading}
                onClick={() => loadOrders(pagination.page - 1, filters)}>
                ‹
              </button>
              {Array.from({length: Math.min(5, pagination.totalPages)}, (_, index) => {
                const page = index + 1;
                return (
                  <button
                    key={page}
                    type="button"
                    className={page === pagination.page ? 'is-active' : ''}
                    onClick={() => loadOrders(page, filters)}>
                    {page}
                  </button>
                );
              })}
              {pagination.totalPages > 5 ? <span>...</span> : null}
              {pagination.totalPages > 5 ? (
                <button
                  type="button"
                  className={pagination.page === pagination.totalPages ? 'is-active' : ''}
                  onClick={() => loadOrders(pagination.totalPages, filters)}>
                  {pagination.totalPages}
                </button>
              ) : null}
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => loadOrders(pagination.page + 1, filters)}>
                ›
              </button>
            </div>
          </footer>
        </div>
      </div>

      {selected ? (
        <aside className="orderDetailPanel" id="order-print-area">
          <div className="orderDetailHead">
            <div>
              <h3>Chi tiết đơn đặt vé</h3>
              <strong>{selected.code}</strong>
            </div>
            <button type="button" className="orderIconBtn" onClick={() => setSelected(null)}>
              <X size={16} />
            </button>
          </div>

          <div className="orderDetailBadges">
            <Badge map={PAYMENT_BADGE} value={selected.paymentStatus} />
            <CheckInBadge checkedIn={selected.checkedIn} cancelled={isCancelled} />
          </div>

          <div className="orderDetailSections">
            <div>
              <span>Khách hàng</span>
              <strong>{selected.customerName}</strong>
              <small>{selected.customerPhone || selected.customerEmail || '—'}</small>
            </div>
            <div>
              <span>Phim</span>
              <strong>{selected.movieTitle}</strong>
            </div>
            <div>
              <span>Suất chiếu</span>
              <strong>{selected.showtimeLabel || '—'}</strong>
            </div>
            <div>
              <span>Phòng / Rạp</span>
              <strong>{selected.roomName || '—'}</strong>
              <small>{selected.cinema}</small>
            </div>
            <div>
              <span>Ghế</span>
              <strong>{(selected.seats || []).join(', ') || '—'}</strong>
            </div>
            <div>
              <span>Thanh toán</span>
              <strong>{METHOD_LABEL[selected.paymentMethod] || selected.paymentMethod || '—'}</strong>
              <small>{formatVnd(selected.totalPrice)}</small>
            </div>
            <div>
              <span>Combo</span>
              <strong>
                {(selected.combos || []).length
                  ? selected.combos.map(item => `${item.quantity}× ${item.name}`).join(', ')
                  : 'Không có'}
              </strong>
            </div>
            <div>
              <span>Voucher</span>
              <strong>{selected.voucherCode || 'Không áp dụng'}</strong>
              {selected.discount ? <small>−{formatVnd(selected.discount)}</small> : null}
            </div>
            <div>
              <span>Check-in</span>
              <strong>{selected.checkedIn ? formatDateTime(selected.checkedInAt) : 'Chưa check-in'}</strong>
            </div>
            <div>
              <span>Ghi chú</span>
              <strong>{selected.note || '—'}</strong>
            </div>
            {selected.cancelReason ? (
              <div>
                <span>Lý do hủy / hoàn tiền</span>
                <strong>{selected.cancelReason}</strong>
              </div>
            ) : null}
          </div>

          <div className="orderQrBox">
            <span>QR Code</span>
            <QRCodeSVG
              value={selected.code}
              size={132}
              bgColor={darkMode ? '#0F172A' : '#FFFFFF'}
              fgColor={darkMode ? '#F8FAFC' : '#0F172A'}
            />
            <small>{selected.code}</small>
          </div>

          <div className="orderTimelineWrap">
            <h4>Lịch sử đơn</h4>
            <Timeline order={selected} />
          </div>

          <div className="orderDetailFooter no-print">
            <button type="button" className="orderBtnPrint" onClick={printTicket}>
              <Printer size={16} />
              In vé
            </button>
            <button
              type="button"
              className="orderBtnRefund"
              disabled={acting || !canRefundOrder(selected)}
              onClick={() => openActionModal(selected, 'refund')}>
              <Undo2 size={16} />
              Hoàn tiền
            </button>
            <button
              type="button"
              className="orderBtnCancel"
              disabled={acting || !canCancelOrder(selected)}
              title={
                selected.checkedIn
                  ? 'Không hủy được đơn đã check-in'
                  : !canCancelOrder(selected)
                    ? 'Chỉ hủy đơn đã thanh toán và chưa check-in'
                    : 'Hủy đơn'
              }
              onClick={() => openActionModal(selected, 'cancel')}>
              <XCircle size={16} />
              Hủy đơn
            </button>
          </div>
        </aside>
      ) : null}

      {confirmModal ? (
        <div className="orderConfirmOverlay" role="dialog" aria-modal="true">
          <div className="orderConfirmModal">
            <h3>
              {confirmModal.action === 'cancel' ? 'Hủy đơn đặt vé' : 'Hoàn tiền đơn đặt vé'}
            </h3>
            <p>
              Đơn <strong>{confirmModal.order.code}</strong> — {confirmModal.order.customerName} /{' '}
              {confirmModal.order.movieTitle}
            </p>
            <label>
              Lý do {confirmModal.action === 'cancel' ? 'hủy' : 'hoàn tiền'} (bắt buộc)
              <textarea
                value={actionReason}
                onChange={event => setActionReason(event.target.value)}
                rows={4}
                placeholder={
                  confirmModal.action === 'cancel'
                    ? 'Ví dụ: User yêu cầu đổi suất, suất chiếu bị hủy...'
                    : 'Ví dụ: Thanh toán nhầm, sự cố hệ thống...'
                }
              />
            </label>
            <div className="orderConfirmActions">
              <button type="button" className="orderBtnGhost" onClick={closeActionModal}>
                Đóng
              </button>
              <button
                type="button"
                className={confirmModal.action === 'cancel' ? 'orderBtnCancel' : 'orderBtnRefund'}
                disabled={acting}
                onClick={submitConfirmModal}>
                {acting
                  ? 'Đang xử lý...'
                  : confirmModal.action === 'cancel'
                    ? 'Xác nhận hủy'
                    : 'Xác nhận hoàn tiền'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default BookingList;

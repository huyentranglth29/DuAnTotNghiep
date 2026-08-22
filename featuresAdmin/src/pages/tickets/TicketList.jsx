import {useEffect, useMemo, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import Modal from '../../components/Modal';
import {formatDate, formatDateTime, formatVnd, getSeatLabel} from '../../utils/adminFormatters';

const PAGE_SIZE = 10;

const STATUS_META = {
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  cho_thanh_toan: {label: 'Chưa thanh toán', tone: 'warning'},
  da_huy: {label: 'Đã hủy', tone: 'danger'},
};

const PRINT_META = {
  true: {label: 'Đã in', tone: 'success'},
  false: {label: 'Chưa in', tone: 'warning'},
};

function movieOf(ticket) {
  return ticket.showtime?.movie || ticket.booking?.showtime?.movie || {};
}

function roomOf(ticket) {
  return (
    ticket.showtime?.room ||
    ticket.booking?.showtime?.room ||
    ticket.seat?.room ||
    {}
  );
}

function customerOf(ticket) {
  const user = ticket.booking?.user;
  return {
    name: user?.fullName || user?.email || 'Khách hàng không còn tồn tại',
    email: user?.email || '',
    phone: user?.phone || '',
  };
}

function getTicketPaymentStatus(ticket) {
  const p = ticket.paymentStatus || ticket.booking?.paymentStatus;
  const s = ticket.status;
  if (s === 'cancelled' || p === 'da_huy' || p === 'da_hoan_tien' || p === 'refunded') {
    return 'da_huy';
  }
  if (p === 'da_thanh_toan' || p === 'paid' || s === 'valid' || s === 'used') {
    return 'da_thanh_toan';
  }
  return 'cho_thanh_toan';
}

function StatusBadge({status, map = STATUS_META}) {
  const meta = map[status] || {label: status || 'Chưa xác định', tone: 'muted'};
  return <span className={`badge ${meta.tone}`}>{meta.label}</span>;
}

function showtimeLabel(ticket) {
  const value = ticket.showtime?.startTime || ticket.booking?.showtime?.startTime;
  if (!value) return {time: 'Không còn dữ liệu', date: 'Suất chiếu đã bị xóa'};
  const date = new Date(value);
  return {
    time: date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}),
    date: formatDate(value),
  };
}

function showtimeDateKey(value) {
  if (!value) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const getPart = type => parts.find(part => part.type === type)?.value || '';
  return `${getPart('year')}-${getPart('month')}-${getPart('day')}`;
}

// Một đơn có thể chứa nhiều ghế. Giao diện quản trị hiển thị theo đơn
// để combo và tổng tiền không bị hiểu nhầm là lặp lại cho từng ghế.
function groupTicketsByOrder(rows) {
  const groups = new Map();
  rows.forEach(ticket => {
    const orderCode = ticket.orderCode || ticket.booking?.ticketCode || ticket.booking?._id || ticket.code;
    const key = String(orderCode || ticket.code);
    const seat = getSeatLabel(ticket);
    const current = groups.get(key);
    if (!current) {
      const comboTotal = (ticket.combos || []).reduce(
        (sum, combo) => sum + Number(combo.totalPrice || (combo.unitPrice || 0) * (combo.quantity || 0)),
        0,
      );
      groups.set(key, {
        ...ticket,
        code: key,
        orderCode: key,
        seatLabel: seat,
        price: Number(ticket.price || 0),
        _comboTotal: comboTotal,
        _seatTickets: [ticket],
      });
      return;
    }
    current._seatTickets.push(ticket);
    current.price += Number(ticket.price || 0);
    if (!current._comboTotal) {
      current._comboTotal = (ticket.combos || []).reduce(
        (sum, combo) => sum + Number(combo.totalPrice || (combo.unitPrice || 0) * (combo.quantity || 0)),
        0,
      );
    }
    const seats = current.seatLabel ? current.seatLabel.split(', ') : [];
    if (seat && !seats.includes(seat)) seats.push(seat);
    current.seatLabel = seats.join(', ');
    current.isPrinted = current.isPrinted && Boolean(ticket.isPrinted);
  });
  return [...groups.values()].map(group => ({
    ...group,
    // Cột giá của danh sách đơn phải khớp với tổng tiền người dùng đã thanh toán.
    price: group.price + Number(group._comboTotal || 0),
  }));
}

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [movieFilter, setMovieFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [printFilter, setPrintFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ticketApi.getAll({limit: 500, page: 1, sort: '-createdAt'});
      const rows = Array.isArray(response) ? response : response?.data || [];
      setTickets(groupTicketsByOrder(rows));
    } catch (loadError) {
      setError(loadError.message || 'Không tải được danh sách vé.');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const movieOptions = useMemo(() => {
    const values = new Map();
    tickets.forEach(ticket => {
      const movie = movieOf(ticket);
      const id = String(movie._id || movie.id || '');
      if (id) values.set(id, movie.title || 'Phim chưa xác định');
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  }, [tickets]);

  const roomOptions = useMemo(() => {
    const values = new Map();
    tickets.forEach(ticket => {
      const room = roomOf(ticket);
      const id = String(room._id || room.id || '');
      if (id) values.set(id, room.name || 'Phòng chưa xác định');
    });
    return [...values.entries()].sort((a, b) => a[1].localeCompare(b[1], 'vi'));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase('vi');
    return tickets.filter(ticket => {
      const movie = movieOf(ticket);
      const room = roomOf(ticket);
      const customer = customerOf(ticket);
      const movieId = String(movie._id || movie.id || '');
      const roomId = String(room._id || room.id || '');
      const status = getTicketPaymentStatus(ticket);
      const showtimeDate = showtimeDateKey(
        ticket.showtime?.startTime || ticket.booking?.showtime?.startTime,
      );

      if (movieFilter !== 'all' && movieId !== movieFilter) return false;
      if (roomFilter !== 'all' && roomId !== roomFilter) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
      if (printFilter === 'da_in' && !ticket.isPrinted) return false;
      if (printFilter === 'chua_in' && ticket.isPrinted) return false;
      if (dateFilter && showtimeDate !== dateFilter) return false;
      if (!query) return true;

      return [
        ticket.code,
        ticket.booking?.ticketCode,
        ticket.booking?._id,
        movie.title,
        room.name,
        room.type,
        getSeatLabel(ticket),
        customer.name,
        customer.email,
        customer.phone,
        showtimeLabel(ticket).time,
        STATUS_META[status]?.label,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('vi')
        .includes(query);
    });
  }, [dateFilter, keyword, movieFilter, printFilter, roomFilter, statusFilter, tickets]);

  useEffect(() => setPage(1), [dateFilter, keyword, movieFilter, printFilter, roomFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredTickets.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const clearFilters = () => {
    setKeyword('');
    setMovieFilter('all');
    setRoomFilter('all');
    setStatusFilter('all');
    setPrintFilter('all');
    setDateFilter('');
  };

  return (
    <section className="ticketManagementPage">
      <div className="pageTitle">
        <div>
          <h2>Danh sách vé</h2>
          <p>Theo dõi vé theo phim, suất chiếu, phòng, ghế, thanh toán và in ấn.</p>
        </div>
        <button type="button" onClick={loadData}>Làm mới</button>
      </div>

      <div className="panel ticketFilters">
        <input
          type="search"
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã vé, phim, khách hàng, ghế..."
        />
        <select value={movieFilter} onChange={event => setMovieFilter(event.target.value)}>
          <option value="all">Tất cả phim</option>
          {movieOptions.map(([id, title]) => <option key={id} value={id}>{title}</option>)}
        </select>
        <select value={roomFilter} onChange={event => setRoomFilter(event.target.value)}>
          <option value="all">Tất cả phòng</option>
          {roomOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={event => setDateFilter(event.target.value)}
          aria-label="Ngày chiếu"
        />
        <select value={statusFilter} onChange={event => setStatusFilter(event.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="da_thanh_toan">Đã thanh toán</option>
          <option value="cho_thanh_toan">Chưa thanh toán</option>
          <option value="da_huy">Đã hủy</option>
        </select>
        <select value={printFilter} onChange={event => setPrintFilter(event.target.value)}>
          <option value="all">In vé (Tất cả)</option>
          <option value="da_in">Đã in</option>
          <option value="chua_in">Chưa in</option>
        </select>
        <button className="ghost" type="button" onClick={clearFilters}>Xóa bộ lọc</button>
      </div>

      {error && <p className="inlineError">{error}</p>}
      {loading ? (
        <p className="mutedText">Đang tải danh sách vé...</p>
      ) : (
        <div className="panel ticketTableWrap">
          <table className="ticketTable">
            <thead>
              <tr>
                <th>Mã vé</th>
                <th>Phim</th>
                <th>Suất chiếu</th>
                <th>Phòng</th>
                <th>Ghế</th>
                <th>Khách hàng</th>
                <th>Tổng đơn</th>
                <th>In vé</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={10} className="emptyCell">Không có vé phù hợp.</td></tr>
              ) : pageRows.map(ticket => {
                const movie = movieOf(ticket);
                const room = roomOf(ticket);
                const customer = customerOf(ticket);
                const showtime = showtimeLabel(ticket);
                const ticketStatus = getTicketPaymentStatus(ticket);
                return (
                  <tr key={ticket._id}>
                    <td><strong className="ticketCodeCell">{ticket.code}</strong></td>
                    <td>
                      <div className="ticketMovieCell">
                        {movie.posterUrl ? <img src={movie.posterUrl} alt="" /> : <span>FG</span>}
                        <strong>{movie.title || ticket.booking?.movieTitle || 'Không tìm thấy phim'}</strong>
                      </div>
                    </td>
                    <td><strong>{showtime.time}</strong><small>{showtime.date}</small></td>
                    <td><strong>{room.name || ticket.booking?.roomName || 'Chưa có phòng'}</strong><small>{room.type || ''}</small></td>
                    <td><span className="ticketSeatBadge">{getSeatLabel(ticket) || '—'}</span></td>
                    <td><strong>{customer.name}</strong><small>{customer.email || customer.phone}</small></td>
                    <td><strong>{formatVnd(ticket.price)}</strong></td>
                    <td><StatusBadge status={String(Boolean(ticket.isPrinted))} map={PRINT_META} /></td>
                    <td><StatusBadge status={ticketStatus} /></td>
                    <td><button className="ghost" type="button" onClick={() => setSelected(ticket)}>Xem</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="tableFooter">
            <span>Hiển thị {filteredTickets.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filteredTickets.length)} trong {filteredTickets.length} vé</span>
            <div className="pager">
              <button type="button" disabled={currentPage <= 1} onClick={() => setPage(value => value - 1)}>‹</button>
              <span>{currentPage}/{totalPages}</span>
              <button type="button" disabled={currentPage >= totalPages} onClick={() => setPage(value => value + 1)}>›</button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(selected)}
        className="ticketDetailModal"
        title={`Chi tiết vé ${selected?.code || ''}`}
        onClose={() => setSelected(null)}>
        {selected ? (
          <div className="ticketDetailContent">
            <div className="ticketDetailHero">
              <div className="ticketDetailIdentity">
                <span className="ticketDetailEyebrow">VÉ ĐIỆN TỬ FILMGO</span>
                <strong>{selected.code}</strong>
                <small>Thông tin phát hành và sử dụng vé</small>
              </div>
              <div className="ticketDetailHeroStatus">
                <span className="ticketDetailHeroStatusLabel">Trạng thái</span>
                <StatusBadge status={getTicketPaymentStatus(selected)} />
              </div>
            </div>
            <div className="ticketDetailSectionHeading">
              <div>
                <h3>Thông tin vé</h3>
                <p>Kiểm tra lịch chiếu, ghế, khách hàng và trạng thái thanh toán.</p>
              </div>
            </div>
            <div className="ticketDetailGrid">
              <div className="ticketDetailItem ticketDetailItemWide"><span>Phim</span><strong>{movieOf(selected).title || selected.booking?.movieTitle || 'Không tìm thấy phim'}</strong></div>
              <div className="ticketDetailItem"><span>Suất chiếu</span><strong>{formatDateTime(selected.showtime?.startTime || selected.booking?.showtime?.startTime) || 'Suất chiếu không còn tồn tại'}</strong></div>
              <div className="ticketDetailItem"><span>Phòng chiếu</span><strong>{roomOf(selected).name || selected.booking?.roomName || 'Chưa có dữ liệu'} {roomOf(selected).type ? `· ${roomOf(selected).type}` : ''}</strong></div>
              <div className="ticketDetailItem"><span>Ghế</span><strong>{getSeatLabel(selected) || 'Chưa có dữ liệu'}</strong></div>
              <div className="ticketDetailItem"><span>Tổng đơn</span><strong>{formatVnd(selected.price)}</strong></div>
              <div className="ticketDetailItem ticketDetailItemWide"><span>Khách hàng</span><strong>{customerOf(selected).name}</strong><small>{customerOf(selected).email || 'Chưa có email'}</small><small>{customerOf(selected).phone || 'Chưa có số điện thoại'}</small></div>
              <div className="ticketDetailItem"><span>Mã đơn</span><strong>{selected.booking?.ticketCode || selected.booking?._id || 'Không tìm thấy đơn'}</strong></div>
              <div className="ticketDetailItem"><span>Trạng thái</span><StatusBadge status={getTicketPaymentStatus(selected)} /></div>
              <div className="ticketDetailItem">
                <span>Trạng thái in</span>
                <StatusBadge status={String(Boolean(selected.isPrinted))} map={PRINT_META} />
                {selected.printedAt ? <small>Lúc: {formatDateTime(selected.printedAt)}</small> : null}
              </div>
              <div className="ticketDetailItem"><span>Ngày tạo vé</span><strong>{formatDateTime(selected.createdAt)}</strong></div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

export default TicketList;

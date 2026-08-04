import {useEffect, useMemo, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import Modal from '../../components/Modal';
import {formatDate, formatDateTime, formatVnd, getSeatLabel} from '../../utils/adminFormatters';

const PAGE_SIZE = 10;

const STATUS_META = {
  valid: {label: 'Còn hiệu lực', tone: 'success'},
  used: {label: 'Đã sử dụng', tone: 'info'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
  expired: {label: 'Hết hạn', tone: 'muted'},
};

const PAYMENT_META = {
  paid: {label: 'Đã thanh toán', tone: 'success'},
  unpaid: {label: 'Chưa thanh toán', tone: 'warning'},
  refunded: {label: 'Đã hoàn tiền', tone: 'info'},
  da_thanh_toan: {label: 'Đã thanh toán', tone: 'success'},
  cho_thanh_toan: {label: 'Chưa thanh toán', tone: 'warning'},
  da_hoan_tien: {label: 'Đã hoàn tiền', tone: 'info'},
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

function effectiveStatus(ticket) {
  if (ticket.status !== 'valid') return ticket.status || 'valid';
  const endTime = ticket.showtime?.endTime || ticket.booking?.showtime?.endTime;
  return endTime && new Date(endTime).getTime() < Date.now() ? 'expired' : 'valid';
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

function TicketList() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [movieFilter, setMovieFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await ticketApi.getAll({limit: 500, page: 1, sort: '-createdAt'});
      setTickets(Array.isArray(response) ? response : response?.data || []);
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
      const status = effectiveStatus(ticket);
      const showtimeDate = showtimeDateKey(
        ticket.showtime?.startTime || ticket.booking?.showtime?.startTime,
      );

      if (movieFilter !== 'all' && movieId !== movieFilter) return false;
      if (roomFilter !== 'all' && roomId !== roomFilter) return false;
      if (statusFilter !== 'all' && status !== statusFilter) return false;
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
  }, [dateFilter, keyword, movieFilter, roomFilter, statusFilter, tickets]);

  useEffect(() => setPage(1), [dateFilter, keyword, movieFilter, roomFilter, statusFilter]);

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
    setDateFilter('');
  };

  return (
    <section className="ticketManagementPage">
      <div className="pageTitle">
        <div>
          <h2>Danh sách vé</h2>
          <p>Theo dõi vé theo phim, suất chiếu, phòng, ghế và khách hàng.</p>
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
          <option value="valid">Còn hiệu lực</option>
          <option value="used">Đã sử dụng</option>
          <option value="expired">Hết hạn</option>
          <option value="cancelled">Đã hủy</option>
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
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr><td colSpan={9} className="emptyCell">Không có vé phù hợp.</td></tr>
              ) : pageRows.map(ticket => {
                const movie = movieOf(ticket);
                const room = roomOf(ticket);
                const customer = customerOf(ticket);
                const showtime = showtimeLabel(ticket);
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
                    <td><StatusBadge status={effectiveStatus(ticket)} /></td>
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
              <div>
                <span>MÃ VÉ FILMGO</span>
                <strong>{selected.code}</strong>
              </div>
              <StatusBadge status={effectiveStatus(selected)} />
            </div>
            <div className="ticketDetailGrid">
              <div><span>Phim</span><strong>{movieOf(selected).title || selected.booking?.movieTitle || 'Không tìm thấy phim'}</strong></div>
              <div><span>Suất chiếu</span><strong>{formatDateTime(selected.showtime?.startTime || selected.booking?.showtime?.startTime) || 'Suất chiếu không còn tồn tại'}</strong></div>
              <div><span>Phòng chiếu</span><strong>{roomOf(selected).name || selected.booking?.roomName || 'Chưa có dữ liệu'} {roomOf(selected).type ? `· ${roomOf(selected).type}` : ''}</strong></div>
              <div><span>Ghế</span><strong>{getSeatLabel(selected) || 'Chưa có dữ liệu'}</strong></div>
              <div><span>Khách hàng</span><strong>{customerOf(selected).name}</strong><small>{customerOf(selected).email || 'Chưa có email'}</small><small>{customerOf(selected).phone || 'Chưa có số điện thoại'}</small></div>
              <div><span>Giá vé</span><strong>{formatVnd(selected.price)}</strong></div>
              <div><span>Mã đơn</span><strong>{selected.booking?.ticketCode || selected.booking?._id || 'Không tìm thấy đơn'}</strong></div>
              <div><span>Thanh toán</span><StatusBadge status={selected.booking?.paymentStatus} map={PAYMENT_META} /></div>
              <div><span>Ngày tạo vé</span><strong>{formatDateTime(selected.createdAt)}</strong></div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  );
}

export default TicketList;

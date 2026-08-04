import {useEffect, useMemo, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import {QRBlock} from '../../components/AdminUi';
import {formatDate, formatDateTime, formatVnd, getSeatLabel, getUserName} from '../../utils/adminFormatters';
import {ticketQrPayload} from '../../utils/ticketVerification';

const ticketStatusMap = {
  valid: {label: 'Hợp lệ', tone: 'success'},
  used: {label: 'Đã dùng', tone: 'info'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
};

const paymentStatusMap = {
  unpaid: {label: 'Chưa thanh toán', tone: 'warning'},
  paid: {label: 'Đã thanh toán', tone: 'success'},
  refunded: {label: 'Hoàn tiền', tone: 'info'},
};

function StatusBadge({map, value}) {
  const status = map[value] || {label: value || 'Chưa có', tone: 'info'};
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

function showtimeParts(value, fallbackDate, fallbackTime) {
  if (!value) return {date: fallbackDate || 'Chưa có ngày', time: fallbackTime || 'Chưa có giờ'};
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return {date: fallbackDate || 'Chưa có ngày', time: fallbackTime || 'Chưa có giờ'};
  }
  return {
    date: formatDate(value),
    time: date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}),
  };
}

function comboLabel(combos = []) {
  if (!Array.isArray(combos) || combos.length === 0) return 'Không có combo';
  return combos
    .map(item => `${item.name || 'Combo'} × ${Number(item.quantity || 1)}`)
    .join(', ');
}

function ElectronicTicket() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ticketApi.getAll({
        limit: 500,
        sort: '-createdAt',
      });
      const data = Array.isArray(response) ? response : response?.data || [];
      setTickets(data);
      setSelectedId(current => current || data[0]?._id || '');
    } catch (err) {
      setError(err.message || 'Không tải được danh sách vé điện tử.');
      setTickets([]);
      setSelectedId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTickets = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();
    if (!normalizedKeyword) return tickets;

    return tickets.filter(ticket => {
      const searchable = [
        ticket.code,
        ticket.booking?.ticketCode,
        getUserName(ticket.booking),
        ticket.booking?.user?.email,
        ticket.booking?.movieTitle,
        ticket.showtime?.movie?.title,
        getSeatLabel(ticket),
        ticket.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchable.includes(normalizedKeyword);
    });
  }, [keyword, tickets]);

  const selectedTicket = useMemo(
    () => filteredTickets.find(ticket => ticket._id === selectedId) || filteredTickets[0],
    [filteredTickets, selectedId],
  );

  useEffect(() => {
    if (filteredTickets.length === 0) {
      setSelectedId('');
      return;
    }

    if (!filteredTickets.some(ticket => ticket._id === selectedId)) {
      setSelectedId(filteredTickets[0]._id);
    }
  }, [filteredTickets, selectedId]);

  const booking = selectedTicket?.booking || {};
  const movieTitle =
    booking.movieTitle || selectedTicket?.showtime?.movie?.title || 'Chưa có tên phim';
  const customer = getUserName(booking) || booking.user?.email || 'Khách hàng';
  const seatLabel =
    getSeatLabel(selectedTicket) || booking.seatLabels?.join(', ') || 'Chưa có ghế';
  const showtime = selectedTicket?.showtime?.startTime;
  const ticketCode = selectedTicket?.code || booking.ticketCode || '';
  const qrValue = selectedTicket?.qrValue || ticketCode;
  const paymentStatus =
    selectedTicket?.status === 'used'
      ? 'paid'
      : selectedTicket?.paymentStatus || booking.paymentStatus || 'unpaid';
  const showtimeInfo = showtimeParts(
    showtime,
    selectedTicket?.bookingDate || booking.bookingDate,
    selectedTicket?.bookingTime || booking.bookingTime,
  );
  const roomName =
    selectedTicket?.roomName || selectedTicket?.showtime?.room?.name || booking.roomName || 'Chưa có phòng';
  const cinemaName =
    selectedTicket?.cinemaName || booking.cinemaName || booking.cinema || 'FilmGo Hà Trung (Thanh Hóa)';
  const orderCode = selectedTicket?.orderCode || booking.ticketCode || booking._id || 'Chưa có mã đơn';
  const bookedAt = selectedTicket?.bookedAt || booking.createdAt || selectedTicket?.createdAt;
  const combos = selectedTicket?.combos || booking.combos || [];
  const qrPayload = ticketQrPayload({
    code: qrValue,
    customerName: customer,
    movieTitle,
    cinemaName,
    roomName,
    seatLabel,
    showDate: showtimeInfo.date,
    showTime: showtimeInfo.time,
    price: selectedTicket?.price || booking.totalPrice,
    paymentStatus,
    status: selectedTicket?.status,
  });

  return (
    <section className="electronicTicketPage">
      <div className="pageTitle">
        <h2>Xem vé điện tử</h2>
        <button type="button" onClick={loadData}>
          Làm mới
        </button>
      </div>

      <div className="panel electronicTicketToolbar">
        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã vé, khách hàng, phim, ghế..."
        />
        <select
          value={selectedTicket?._id || ''}
          onChange={event => setSelectedId(event.target.value)}
          disabled={filteredTickets.length === 0}
          aria-label="Chọn vé điện tử"
        >
          {filteredTickets.length === 0 ? (
            <option value="">Không có vé</option>
          ) : (
            filteredTickets.map(ticket => (
              <option key={ticket._id} value={ticket._id}>
                {ticket.code} - {ticket.booking?.movieTitle || ticket.showtime?.movie?.title || 'Vé'}
              </option>
            ))
          )}
        </select>
      </div>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải vé điện tử...</p>
      ) : !selectedTicket ? (
        <div className="placeholder">Không có vé điện tử phù hợp.</div>
      ) : (
        <div className="electronicTicketLayout single">
          <article className="electronicTicketCard">
            <div className="electronicTicketStatus">
              <StatusBadge map={ticketStatusMap} value={selectedTicket.status} />
              <StatusBadge map={paymentStatusMap} value={paymentStatus} />
            </div>

            <div className="electronicTicketTop">
              <div>
                <span>FILMGO E-TICKET</span>
                <h3>{movieTitle}</h3>
                <p>{cinemaName}</p>
              </div>
            </div>

            <div className="electronicTicketGrid">
              <div>
                <small>Khách hàng</small>
                <strong>{customer}</strong>
              </div>
              <div>
                <small>Ngày chiếu</small>
                <strong>{showtimeInfo.date}</strong>
              </div>
              <div>
                <small>Giờ chiếu</small>
                <strong>{showtimeInfo.time}</strong>
              </div>
              <div>
                <small>Phòng</small>
                <strong>{roomName}</strong>
              </div>
              <div>
                <small>Rạp</small>
                <strong>{cinemaName}</strong>
              </div>
              <div>
                <small>Ghế</small>
                <strong>{seatLabel}</strong>
              </div>
              <div>
                <small>Giá vé</small>
                <strong>{formatVnd(selectedTicket.price || booking.totalPrice)}</strong>
              </div>
              <div>
                <small>Mã đơn</small>
                <strong>{orderCode}</strong>
              </div>
              <div>
                <small>Ngày đặt</small>
                <strong>{formatDateTime(bookedAt) || 'Chưa có dữ liệu'}</strong>
              </div>
              <div className="electronicTicketCombo">
                <small>Combo</small>
                <strong>{comboLabel(combos)}</strong>
              </div>
            </div>

            <div className="electronicTicketCut" />

            <div className="electronicTicketCode">
              <small>Mã vé điện tử</small>
              <strong>{ticketCode}</strong>
              <div className="electronicTicketMainQr">
                <QRBlock value={qrPayload} size={220} />
              </div>
              <p>Quét QR bằng điện thoại bất kỳ để đọc thông tin vé, không cần Internet.</p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

export default ElectronicTicket;

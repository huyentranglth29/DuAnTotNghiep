import {useEffect, useMemo, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import {QRBlock} from '../../components/AdminUi';
import {formatDateTime, formatVnd, getSeatLabel, getUserName} from '../../utils/adminFormatters';

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

function Barcode({value = ''}) {
  const source = String(value || 'FILMGO');
  const bars = Array.from({length: 34}, (_, index) => {
    const code = source.charCodeAt(index % source.length) || index;
    return 1 + ((code + index) % 4);
  });

  return (
    <div className="electronicBarcode" aria-label={`Barcode ${source}`}>
      {bars.map((width, index) => (
        <span key={`${width}-${index}`} style={{width}} />
      ))}
    </div>
  );
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

  return (
    <section className="electronicTicketPage">
      <div className="pageTitle">
        <h2>Xem vé điện tử</h2>
        <button type="button" onClick={loadData}>
          Tải lại
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
        <div className="electronicTicketLayout">
          <article className="electronicTicketCard">
            <div className="electronicTicketStatus">
              <StatusBadge map={ticketStatusMap} value={selectedTicket.status} />
              <StatusBadge map={paymentStatusMap} value={booking.paymentStatus} />
            </div>

            <div className="electronicTicketTop">
              <span>FILMGO E-TICKET</span>
              <h3>{movieTitle}</h3>
              <p>{booking.cinemaName || 'FilmGo Cinema'}</p>
            </div>

            <div className="electronicTicketGrid">
              <div>
                <small>Khách hàng</small>
                <strong>{customer}</strong>
              </div>
              <div>
                <small>Suất chiếu</small>
                <strong>{formatDateTime(showtime)}</strong>
              </div>
              <div>
                <small>Ghế</small>
                <strong>{seatLabel}</strong>
              </div>
              <div>
                <small>Giá vé</small>
                <strong>{formatVnd(selectedTicket.price || booking.totalPrice)}</strong>
              </div>
            </div>

            <div className="electronicTicketCut" />

            <div className="electronicTicketCode">
              <small>Mã vé điện tử</small>
              <strong>{ticketCode}</strong>
              <Barcode value={ticketCode} />
            </div>
          </article>

          <aside className="panel electronicTicketQr">
            <QRBlock value={ticketCode} />
            <h3>{ticketCode}</h3>
            <p>Xuất trình QR hoặc mã vé này tại quầy/checkin.</p>
            <div className="formActions">
              <button type="button" onClick={() => window.print()}>
                In vé điện tử
              </button>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}

export default ElectronicTicket;

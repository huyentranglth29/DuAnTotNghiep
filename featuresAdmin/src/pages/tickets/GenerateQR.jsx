import {useEffect, useMemo, useState} from 'react';
import {useSearchParams} from 'react-router-dom';
import ticketApi from '../../api/ticketApi';
import {PageTitle, QRBlock} from '../../components/AdminUi';
import {formatDateTime, formatVnd, getSeatLabel, getUserName} from '../../utils/adminFormatters';
import {ticketQrPayload} from '../../utils/ticketVerification';

const STATUS_LABEL = {valid: 'Hợp lệ', used: 'Đã sử dụng', cancelled: 'Đã hủy'};
const PAYMENT_LABEL = {paid: 'Đã thanh toán', unpaid: 'Chưa thanh toán', refunded: 'Đã hoàn tiền'};

function GenerateQR() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();

  useEffect(() => {
    ticketApi.getAll({limit: 100})
      .then(response => {
        const data = Array.isArray(response) ? response : response.data || [];
        setTickets(data);
        const requestedCode = searchParams.get('code');
        const requested = requestedCode
          ? data.find(ticket => ticket.code?.toLowerCase() === requestedCode.toLowerCase())
          : null;
        setSelectedId(requested?._id || data[0]?._id || '');
      })
      .catch(err => setError(err.message || 'Không tải được vé.'));
  }, [searchParams]);

  const selectedTicket = useMemo(
    () => tickets.find(ticket => ticket._id === selectedId),
    [tickets, selectedId],
  );

  const qrPayload = selectedTicket ? ticketQrPayload({
    code: selectedTicket.qrValue || selectedTicket.code,
    customerName: getUserName(selectedTicket.booking) || 'Khách FilmGo',
    movieTitle: selectedTicket.booking?.movieTitle || selectedTicket.showtime?.movie?.title,
    cinemaName: selectedTicket.cinemaName || selectedTicket.booking?.cinemaName,
    roomName: selectedTicket.roomName || selectedTicket.showtime?.room?.name,
    seatLabel: getSeatLabel(selectedTicket),
    showDate: selectedTicket.bookingDate || (selectedTicket.showtime?.startTime
      ? new Date(selectedTicket.showtime.startTime).toLocaleDateString('vi-VN') : ''),
    showTime: selectedTicket.bookingTime || (selectedTicket.showtime?.startTime
      ? new Date(selectedTicket.showtime.startTime).toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'}) : ''),
    price: selectedTicket.price,
    paymentStatus: selectedTicket.paymentStatus || selectedTicket.booking?.paymentStatus,
    status: selectedTicket.status,
  }) : '';

  return (
    <section>
      <PageTitle title="Sinh QR / Barcode" />
      {error && <p className="loginError">{error}</p>}
      <div className="panel qrPage">
        <label>
          Mã vé
          <select value={selectedId} onChange={event => setSelectedId(event.target.value)}>
            {tickets.map(ticket => (
              <option key={ticket._id} value={ticket._id}>
                {ticket.code}
              </option>
            ))}
          </select>
        </label>
        {selectedTicket && (
          <article id="ticket-qr-print-area" className="qrTicketDetail">
            <header>
              <span>FILMGO · PHIẾU VÀO RẠP</span>
              <h3>{selectedTicket.booking?.movieTitle || selectedTicket.showtime?.movie?.title || 'Phim chưa xác định'}</h3>
              <p>{selectedTicket.cinemaName || selectedTicket.booking?.cinemaName || 'FilmGo Hà Trung (Thanh Hóa)'}</p>
            </header>
            <div className="qrTicketImage"><QRBlock value={qrPayload} size={220} /></div>
            <strong className="qrTicketCode">{selectedTicket.code}</strong>
            <div className="qrTicketInfoGrid">
              <div><span>Khách hàng</span><strong>{getUserName(selectedTicket.booking) || 'Khách FilmGo'}</strong></div>
              <div><span>Ghế</span><strong>{getSeatLabel(selectedTicket) || '—'}</strong></div>
              <div><span>Suất chiếu</span><strong>{formatDateTime(selectedTicket.showtime?.startTime) || [selectedTicket.bookingTime, selectedTicket.bookingDate].filter(Boolean).join(' · ') || '—'}</strong></div>
              <div><span>Phòng</span><strong>{selectedTicket.roomName || selectedTicket.showtime?.room?.name || '—'}</strong></div>
              <div><span>Mã đơn</span><strong>{selectedTicket.orderCode || selectedTicket.booking?.ticketCode || '—'}</strong></div>
              <div><span>Giá vé</span><strong>{formatVnd(selectedTicket.price)}</strong></div>
              <div><span>Ngày đặt</span><strong>{formatDateTime(selectedTicket.bookedAt || selectedTicket.createdAt)}</strong></div>
              <div><span>Trạng thái</span><strong>{STATUS_LABEL[selectedTicket.status] || selectedTicket.status}</strong></div>
              <div><span>Thanh toán</span><strong>{PAYMENT_LABEL[selectedTicket.paymentStatus || selectedTicket.booking?.paymentStatus] || 'Chưa xác định'}</strong></div>
              <div className="wide"><span>Combo</span><strong>{selectedTicket.combos?.length ? selectedTicket.combos.map(item => `${item.name} × ${item.quantity}`).join(', ') : 'Không có combo'}</strong></div>
            </div>
            <footer>Xuất trình phiếu này tại cửa phòng chiếu. Mỗi QR chỉ áp dụng cho một ghế.</footer>
          </article>
        )}
        <div className="formActions">
          <button type="button" onClick={() => window.print()}>In vé</button>
        </div>
      </div>
    </section>
  );
}

export default GenerateQR;

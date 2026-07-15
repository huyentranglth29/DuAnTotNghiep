import {useEffect, useRef, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import {PageTitle, QRBlock} from '../../components/AdminUi';
import {formatDateTime, getSeatLabel} from '../../utils/adminFormatters';

const SCANNER_ID = 'filmgo-ticket-scanner';

function TicketCheckin() {
  const scannerRef = useRef(null);
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);

  const findTicket = async nextCode => {
    const keyword = String(nextCode || '').trim();
    if (!keyword) {
      setError('Vui lòng nhập hoặc quét mã vé.');
      return;
    }

    setError('');
    setTicket(null);

    try {
      const response = await ticketApi.getAll({keyword, limit: 10});
      const data = Array.isArray(response) ? response : response.data || [];
      const found = data.find(item => item.code?.toLowerCase() === keyword.toLowerCase()) || data[0];

      if (!found) {
        setError('Không tìm thấy vé.');
        return;
      }

      setTicket(found);
    } catch (err) {
      setError(err.message || 'Không tìm thấy vé.');
    }
  };

  const handleFind = event => {
    event.preventDefault();
    findTicket(code);
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      await scannerRef.current.stop();
      await scannerRef.current.clear();
    } catch (err) {
      // Scanner may already be stopped by the browser.
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const startScanner = async () => {
    setError('');

    try {
      const {Html5Qrcode} = await import('html5-qrcode');
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        {facingMode: 'environment'},
        {fps: 10, qrbox: {width: 240, height: 240}},
        decodedText => {
          setCode(decodedText);
          findTicket(decodedText);
          stopScanner();
        },
      );
    } catch (err) {
      setScanning(false);
      setError('Không mở được camera. Hãy cấp quyền camera hoặc nhập mã thủ công.');
    }
  };

  useEffect(() => () => {
    stopScanner();
  }, []);

  const handleCheckin = async () => {
    if (!ticket) return;
    setSaving(true);

    try {
      const payload = {
        booking: ticket.booking?._id || ticket.booking,
        showtime: ticket.showtime?._id || ticket.showtime,
        seat: ticket.seat?._id || ticket.seat,
        code: ticket.code,
        price: ticket.price,
        status: 'used',
      };
      await ticketApi.update(ticket._id, payload);
      setTicket({...ticket, status: 'used'});
    } catch (err) {
      window.alert(err.message || 'Checkin thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageTitle title="Checkin vé" />
      <div className="panel scanPanel">
        <div className="tabs">
          <button className="active" type="button">Quét / nhập mã</button>
        </div>
        <form className="toolbar" onSubmit={handleFind}>
          <input
            placeholder="Nhập mã vé..."
            value={code}
            onChange={event => setCode(event.target.value)}
          />
          <button type="submit">Kiểm tra</button>
          <button className="ghost" type="button" onClick={scanning ? stopScanner : startScanner}>
            {scanning ? 'Tắt camera' : 'Quét QR'}
          </button>
        </form>
        {error && <p className="loginError">{error}</p>}
        <div className="scanner">
          <div id={SCANNER_ID} className="scannerCamera" />
          {!scanning && <QRBlock value={ticket?.code || code} />}
          <span>{scanning ? 'Đưa QR vé vào khung camera' : 'Quét QR hoặc nhập mã vé để checkin'}</span>
        </div>
        {ticket && (
          <div className="resultPanel">
            <p><span>Mã vé</span><strong>{ticket.code}</strong></p>
            <p><span>Ghế</span><strong>{getSeatLabel(ticket)}</strong></p>
            <p><span>Suất chiếu</span><strong>{formatDateTime(ticket.showtime?.startTime)}</strong></p>
            <p><span>Trạng thái</span><strong>{ticket.status}</strong></p>
            <button type="button" disabled={saving || ticket.status === 'used'} onClick={handleCheckin}>
              {ticket.status === 'used' ? 'Đã checkin' : 'Xác nhận checkin'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

export default TicketCheckin;

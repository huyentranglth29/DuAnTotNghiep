import {useEffect, useMemo, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import {PageTitle, QRBlock} from '../../components/AdminUi';
import {formatDateTime, getSeatLabel} from '../../utils/adminFormatters';

function GenerateQR() {
  const [tickets, setTickets] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    ticketApi.getAll({limit: 100})
      .then(response => {
        const data = Array.isArray(response) ? response : response.data || [];
        setTickets(data);
        setSelectedId(data[0]?._id || '');
      })
      .catch(err => setError(err.message || 'Không tải được vé.'));
  }, []);

  const selectedTicket = useMemo(
    () => tickets.find(ticket => ticket._id === selectedId),
    [tickets, selectedId],
  );

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
        <QRBlock value={selectedTicket?.code} />
        {selectedTicket && (
          <div>
            <p><strong>{selectedTicket.code}</strong></p>
            <p>Ghế: {getSeatLabel(selectedTicket)}</p>
            <p>Suất: {formatDateTime(selectedTicket.showtime?.startTime)}</p>
            <p>Trạng thái: {selectedTicket.status}</p>
          </div>
        )}
        <div className="formActions">
          <button type="button" onClick={() => window.print()}>In vé</button>
        </div>
      </div>
    </section>
  );
}

export default GenerateQR;

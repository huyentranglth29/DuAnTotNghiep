import {useEffect, useState} from 'react';
import ticketApi from '../../api/ticketApi';
import {PageTitle} from '../../components/AdminUi';
import {formatDateTime, getSeatLabel} from '../../utils/adminFormatters';

function CheckinResult() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    ticketApi.getAll({status: 'used', limit: 20})
      .then(response => setTickets(Array.isArray(response) ? response : response.data || []))
      .catch(err => setError(err.message || 'Không tải được kết quả checkin.'));
  }, []);

  return (
    <section>
      <PageTitle title="Kết quả checkin" />
      {error && <p className="loginError">{error}</p>}
      <div className="panel resultPanel">
        {tickets.length === 0 ? (
          <p>Chưa có vé đã checkin.</p>
        ) : tickets.map(ticket => (
          <div key={ticket._id} className="successBanner">
            {ticket.code} - Ghế {getSeatLabel(ticket)} - {formatDateTime(ticket.showtime?.startTime)}
          </div>
        ))}
      </div>
    </section>
  );
}

export default CheckinResult;

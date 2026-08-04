import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import showtimeApi from '../../api/showtimeApi';
import {
  formatDate,
  formatTime,
  getDisplayStatus,
  shortCode,
} from '../../utils/showtimeHelpers';

const STATUS_OPTIONS = [
  {value: 'scheduled', label: 'Chưa bắt đầu'},
  {value: 'completed', label: 'Đã kết thúc'},
  {value: 'cancelled', label: 'Đã hủy'},
];

function getStatusOptions(displayStatus) {
  if (displayStatus.key !== 'showing') {
    return STATUS_OPTIONS;
  }

  return [
    {value: 'showing', label: 'Đang diễn ra', disabled: true},
    ...STATUS_OPTIONS,
  ];
}

function ShowtimeStatus() {
  const [, setClockTick] = useState(() => Date.now());
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await showtimeApi.getAll({ limit: 500, page: 1 });
      setShowtimes(Array.isArray(data) ? data : data?.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được trạng thái suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setClockTick(Date.now()), 30 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    try {
      const response = await showtimeApi.update(id, {status});
      const updated = response?.data || response;
      setShowtimes(current =>
        current.map(item => (item._id === id ? updated : item)),
      );
    } catch (err) {
      window.alert(err.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setSavingId('');
    }
  };

  return (
    <section className="showtimePage">
      <div className="pageTitle">
        <div>
          <h2>Quản lý trạng thái suất chiếu</h2>
          <p>Quản lý trạng thái vận hành của từng suất chiếu</p>
        </div>
        <div className="showtimeHeaderActions">
          <button type="button" className="ghost" onClick={loadData}>
            Làm mới
          </button>
          <Link className="primaryAction" to="/showtimes">
            Về danh sách
          </Link>
        </div>
      </div>

      {error && <p className="inlineError">{error}</p>}
      {loading ? (
        <p className="mutedText">Đang tải...</p>
      ) : (
        <div className="panel showtimeTableWrap">
          <table className="showtimeTable">
            <thead>
              <tr>
                <th>Mã suất</th>
                <th>Phim</th>
                <th>Phòng</th>
                <th>Ngày</th>
                <th>Giờ</th>
                <th>Trạng thái suất</th>
                <th>Cập nhật</th>
              </tr>
            </thead>
            <tbody>
              {showtimes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="emptyCell">
                    Chưa có suất chiếu
                  </td>
                </tr>
              ) : (
                showtimes.map(item => {
                  const status = getDisplayStatus(item);
                  return (
                    <tr key={item._id}>
                      <td className="monoCell">{shortCode(item._id)}</td>
                      <td>{item.movie?.title || '--'}</td>
                      <td>{item.room?.name || '--'}</td>
                      <td>{formatDate(item.startTime)}</td>
                      <td>{formatTime(item.startTime)}</td>
                      <td>
                        <span className={`statusPill ${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <select
                          disabled={savingId === item._id}
                          value={status.key}
                          onChange={event =>
                            updateStatus(item._id, event.target.value)
                          }>
                          {getStatusOptions(status).map(option => (
                            <option
                              key={option.value}
                              value={option.value}
                              disabled={option.disabled}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default ShowtimeStatus;

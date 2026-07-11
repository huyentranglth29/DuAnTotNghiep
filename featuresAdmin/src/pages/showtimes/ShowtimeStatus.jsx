import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import showtimeApi from '../../api/showtimeApi';
import {
  formatDate,
  formatTime,
  getDisplayStatus,
  shortCode,
} from '../../utils/showtimeHelpers';

function ShowtimeStatus() {
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await showtimeApi.getAll();
      setShowtimes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Không tải được trạng thái suất chiếu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateStatus = async (id, status) => {
    setSavingId(id);
    try {
      const updated = await showtimeApi.update(id, {status});
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
          <p>Đổi trạng thái lên lịch / đã chiếu / đã hủy</p>
        </div>
        <Link className="primaryAction" to="/showtimes">
          Về danh sách
        </Link>
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
                <th>Trạng thái hiện tại</th>
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
                          value={item.status || 'scheduled'}
                          onChange={event =>
                            updateStatus(item._id, event.target.value)
                          }>
                          <option value="scheduled">Lên lịch</option>
                          <option value="completed">Đã chiếu</option>
                          <option value="cancelled">Đã hủy</option>
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

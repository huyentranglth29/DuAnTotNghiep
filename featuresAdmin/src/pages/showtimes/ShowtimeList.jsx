import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import movieApi from '../../api/movieApi';
import roomApi from '../../api/roomApi';
import showtimeApi from '../../api/showtimeApi';
import Modal from '../../components/Modal';
import SelectDropdown from '../../components/SelectDropdown';
import {
  formatDate,
  formatDuration,
  formatTime,
  formatVnd,
  getDisplayStatus,
  shortCode,
} from '../../utils/showtimeHelpers';

const PAGE_SIZE = 8;

function ShowtimeList() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({
    movie: '',
    room: '',
    date: '',
    status: '',
  });

  const loadData = async (nextFilters = filters) => {
    setLoading(true);
    setError('');

    try {
      const params = {};
      if (nextFilters.movie) params.movie = nextFilters.movie;
      if (nextFilters.room) params.room = nextFilters.room;
      if (nextFilters.date) params.date = nextFilters.date;
      if (nextFilters.status) params.status = nextFilters.status;

      const [showtimeData, movieData, roomData] = await Promise.all([
        showtimeApi.getAll(params),
        movieApi.getAll(),
        roomApi.getAll(),
      ]);

      setShowtimes(Array.isArray(showtimeData) ? showtimeData : showtimeData?.data || []);
      setMovies(Array.isArray(movieData) ? movieData : movieData?.data || []);
      setRooms(Array.isArray(roomData) ? roomData : roomData?.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message || 'Không tải được suất chiếu. Hãy chạy backend.');
      setShowtimes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return showtimes.filter(item => {
      if (filters.status) {
        const display = getDisplayStatus(item);
        if (filters.status === 'scheduled') {
          if (!(item.status === 'scheduled' && display.key !== 'showing')) {
            return false;
          }
        } else if (filters.status === 'showing') {
          if (display.key !== 'showing') {
            return false;
          }
        } else if (
          item.status !== filters.status &&
          display.key !== filters.status
        ) {
          return false;
        }
      }

      if (!keyword) {
        return true;
      }

      const display = getDisplayStatus(item);
      const haystack = [
        shortCode(item._id),
        item.movie?.title,
        item.room?.name,
        item.room?.type,
        display.label,
        formatDate(item.startTime),
        formatTime(item.startTime),
        String(item.price ?? ''),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(keyword);
    });
  }, [showtimes, filters.status, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const updateFilter = (key, value) => {
    setFilters(current => ({...current, [key]: value}));
  };

  const applyFilters = event => {
    event.preventDefault();
    loadData(filters);
  };

  const clearFilters = () => {
    const empty = {movie: '', room: '', date: '', status: ''};
    setFilters(empty);
    setSearch('');
    loadData(empty);
  };

  const handleSearch = event => {
    event.preventDefault();
    setPage(1);
  };

  const handleDelete = async id => {
    const ok = window.confirm('Bạn có chắc muốn xóa suất chiếu này?');
    if (!ok) {
      return;
    }

    try {
      await showtimeApi.remove(id);
      setShowtimes(current => current.filter(item => item._id !== id));
    } catch (err) {
      window.alert(err.message || 'Xóa suất chiếu thất bại');
    }
  };

  return (
    <section className="showtimePage">
      <div className="pageTitle showtimePageTitle">
        <div>
          <h2>Danh sách suất chiếu</h2>
          <p>Quản lý và điều phối các lịch chiếu phim tại tất cả các cụm rạp</p>
        </div>
        <Link className="primaryAction" to="/showtimes/create">
          + Tạo suất chiếu mới
        </Link>
      </div>

      <form className="showtimeSearchBar" onSubmit={handleSearch}>
        <input
          type="search"
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Tìm theo tên phim, phòng, mã suất, trạng thái..."
        />
        <button type="submit">Tìm kiếm</button>
      </form>

      <form className="showtimeFilters" onSubmit={applyFilters}>
        <SelectDropdown
          label="Chọn Phim"
          value={filters.movie}
          placeholder="Tất cả phim"
          onChange={value => updateFilter('movie', value)}
          options={[
            {value: '', label: 'Tất cả phim'},
            ...movies.map(movie => ({
              value: movie.id || movie._id,
              label: movie.title,
            })),
          ]}
        />
        <SelectDropdown
          label="Phòng chiếu"
          value={filters.room}
          placeholder="Tất cả phòng"
          onChange={value => updateFilter('room', value)}
          options={[
            {value: '', label: 'Tất cả phòng'},
            ...rooms.map(room => ({
              value: room._id,
              label: room.name,
            })),
          ]}
        />
        <label>
          Ngày chiếu
          <input
            type="date"
            value={filters.date}
            onChange={event => updateFilter('date', event.target.value)}
          />
        </label>
        <SelectDropdown
          label="Trạng thái"
          value={filters.status}
          placeholder="Tất cả trạng thái"
          onChange={value => updateFilter('status', value)}
          options={[
            {value: '', label: 'Tất cả trạng thái'},
            {value: 'scheduled', label: 'Sắp chiếu'},
            {value: 'showing', label: 'Đang chiếu'},
            {value: 'completed', label: 'Đã chiếu'},
            {value: 'cancelled', label: 'Đã hủy'},
          ]}
        />
        <div className="filterActions">
          <button type="submit">Lọc</button>
          <button className="ghost" type="button" onClick={clearFilters}>
            Xóa bộ lọc
          </button>
        </div>
      </form>

      {error && <p className="inlineError">{error}</p>}
      {loading ? (
        <p className="mutedText">Đang tải suất chiếu...</p>
      ) : (
        <div className="panel showtimeTableWrap">
          <table className="showtimeTable">
            <thead>
              <tr>
                <th>Mã suất</th>
                <th>Phim</th>
                <th>Phòng chiếu</th>
                <th>Suất chiếu</th>
                <th>Giá vé</th>
                <th>Ghế trống</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="emptyCell">
                    Chưa có suất chiếu. Hãy tạo suất mới hoặc kiểm tra backend.
                  </td>
                </tr>
              ) : (
                pageRows.map(item => {
                  const movie = item.movie || {};
                  const room = item.room || {};
                  const status = getDisplayStatus(item);
                  const totalSeats = room.totalSeats || 0;
                  const soldEstimate = 0;
                  const available = Math.max(totalSeats - soldEstimate, 0);
                  const percent =
                    totalSeats > 0
                      ? Math.round((soldEstimate / totalSeats) * 100)
                      : 0;

                  return (
                    <tr key={item._id}>
                      <td className="monoCell">{shortCode(item._id)}</td>
                      <td>
                        <div className="movieCell">
                          {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt={movie.title} />
                          ) : (
                            <div className="posterFallback">FG</div>
                          )}
                          <div>
                            <strong>{movie.title || 'Phim đã xóa'}</strong>
                            <span>
                              {formatDuration(movie.duration)}
                              {movie.ageRating ? ` • ${movie.ageRating}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="roomCell">
                          <strong>{room.name || '--'}</strong>
                          {room.type && (
                            <span className="roomBadge">{room.type}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="timeCell">
                          <strong>
                            {formatTime(item.startTime)} -{' '}
                            {formatTime(item.endTime)}
                          </strong>
                          <span>{formatDate(item.startTime)}</span>
                        </div>
                      </td>
                      <td className="priceCell">{formatVnd(item.price)}</td>
                      <td>
                        <div className="seatCell">
                          <div className="seatBar">
                            <span style={{width: `${percent}%`}} />
                          </div>
                          <small>
                            {soldEstimate}/{totalSeats || '--'} · trống{' '}
                            {available || '--'}
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`statusPill ${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>
                        <div className="rowActions">
                          <button
                            className="iconAction"
                            type="button"
                            title="Xem"
                            onClick={() => setViewing(item)}>
                            👁
                          </button>
                          <Link
                            className="iconAction"
                            to={`/showtimes/${item._id}/edit`}
                            title="Sửa">
                            ✎
                          </Link>
                          <button
                            className="iconAction danger"
                            type="button"
                            title="Xóa"
                            onClick={() => handleDelete(item._id)}>
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="tableFooter">
            <span>
              Hiển thị{' '}
              {filteredRows.length === 0
                ? 0
                : (currentPage - 1) * PAGE_SIZE + 1}{' '}
              - {Math.min(currentPage * PAGE_SIZE, filteredRows.length)} của{' '}
              {filteredRows.length} suất chiếu
            </span>
            <div className="pager">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage(current => Math.max(1, current - 1))}>
                ‹
              </button>
              <span>
                {currentPage}/{totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage(current => Math.min(totalPages, current + 1))
                }>
                ›
              </button>
            </div>
          </div>
        </div>
      )}

      <Modal
        open={Boolean(viewing)}
        title="Chi tiết suất chiếu"
        onClose={() => setViewing(null)}>
        {viewing && (
          <div className="showtimeDetail">
            <div className="showtimeDetailHeader">
              {viewing.movie?.posterUrl ? (
                <img src={viewing.movie.posterUrl} alt={viewing.movie.title} />
              ) : (
                <div className="posterFallback large">FG</div>
              )}
              <div>
                <h3>{viewing.movie?.title || 'Phim đã xóa'}</h3>
                <p>
                  {formatDuration(viewing.movie?.duration)}
                  {viewing.movie?.ageRating
                    ? ` • ${viewing.movie.ageRating}`
                    : ''}
                  {viewing.movie?.genre ? ` • ${viewing.movie.genre}` : ''}
                </p>
                <span className={`statusPill ${getDisplayStatus(viewing).tone}`}>
                  {getDisplayStatus(viewing).label}
                </span>
              </div>
            </div>

            <div className="showtimeDetailGrid">
              <p>
                <span>Mã suất</span>
                <strong>{shortCode(viewing._id)}</strong>
              </p>
              <p>
                <span>Phòng chiếu</span>
                <strong>
                  {viewing.room?.name || '--'}
                  {viewing.room?.type ? ` (${viewing.room.type})` : ''}
                </strong>
              </p>
              <p>
                <span>Ngày chiếu</span>
                <strong>{formatDate(viewing.startTime)}</strong>
              </p>
              <p>
                <span>Giờ chiếu</span>
                <strong>
                  {formatTime(viewing.startTime)} - {formatTime(viewing.endTime)}
                </strong>
              </p>
              <p>
                <span>Giá vé</span>
                <strong>{formatVnd(viewing.price)}</strong>
              </p>
              <p>
                <span>Tổng ghế</span>
                <strong>{viewing.room?.totalSeats || 0}</strong>
              </p>
              <p>
                <span>Trạng thái DB</span>
                <strong>{viewing.status || 'scheduled'}</strong>
              </p>
              <p>
                <span>ID đầy đủ</span>
                <strong className="monoCell">{viewing._id}</strong>
              </p>
            </div>

            <div className="showtimeDetailActions">
              <Link
                className="primaryAction"
                to={`/showtimes/${viewing._id}/edit`}
                onClick={() => setViewing(null)}>
                Sửa suất chiếu
              </Link>
              <button type="button" className="ghost" onClick={() => setViewing(null)}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </Modal>
    </section>
  );
}

export default ShowtimeList;

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
  groupShowtimesByRoom,
  shortCode,
  toDateInputValue,
} from '../../utils/showtimeHelpers';

const PAGE_SIZE = 8;

function ShowtimeList() {
  const [showtimes, setShowtimes] = useState([]);
  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [occupancy, setOccupancy] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [viewing, setViewing] = useState(null);
  const [filters, setFilters] = useState({
    movie: '',
    room: '',
    date: '',
    status: '',
  });
  const [timelineDate, setTimelineDate] = useState(toDateInputValue(new Date()));

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const [showtimeData, movieData, roomData, occupancyData] =
        await Promise.all([
          showtimeApi.getAll({limit: 500, page: 1, sort: 'startTime'}),
          movieApi.getAll({limit: 500, page: 1}),
          roomApi.getAll({limit: 500, page: 1}),
          showtimeApi.getOccupancy().catch(() => ({data: {}})),
        ]);

      setShowtimes(
        Array.isArray(showtimeData) ? showtimeData : showtimeData?.data || [],
      );
      setMovies(Array.isArray(movieData) ? movieData : movieData?.data || []);
      setRooms(Array.isArray(roomData) ? roomData : roomData?.data || []);
      setOccupancy(occupancyData?.data || occupancyData || {});
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
      const movieId = String(item.movie?._id || item.movie?.id || item.movie || '');
      const roomId = String(item.room?._id || item.room?.id || item.room || '');

      if (filters.movie && movieId !== String(filters.movie)) {
        return false;
      }

      if (filters.room && roomId !== String(filters.room)) {
        return false;
      }

      if (filters.date) {
        const start = item.startTime ? new Date(item.startTime) : null;
        if (!start || Number.isNaN(start.getTime())) {
          return false;
        }
        if (toDateInputValue(start) !== filters.date) {
          return false;
        }
      }

      const display = getDisplayStatus(item);

      if (filters.status) {
        if (filters.status === 'scheduled' && display.key !== 'scheduled') {
          return false;
        }
        if (filters.status === 'showing' && display.key !== 'showing') {
          return false;
        }
        if (filters.status === 'completed' && display.key !== 'completed') {
          return false;
        }
        if (
          filters.status === 'cancelled' &&
          item.status !== 'cancelled' &&
          display.key !== 'cancelled'
        ) {
          return false;
        }
      }

      if (!keyword) {
        return true;
      }

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
  }, [showtimes, filters, search]);

  const timelineGroups = useMemo(() => {
    const dayRows = showtimes.filter(item => {
      if (!item.startTime) {
        return false;
      }
      return toDateInputValue(item.startTime) === timelineDate;
    });
    return groupShowtimesByRoom(dayRows);
  }, [showtimes, timelineDate]);

  const timelineBounds = useMemo(() => {
    const all = timelineGroups.flatMap(group => group.showtimes);
    if (!all.length) {
      return {startHour: 8, endHour: 24};
    }
    let min = 24;
    let max = 0;
    all.forEach(item => {
      const start = new Date(item.startTime);
      const end = new Date(item.endTime);
      min = Math.min(min, start.getHours() + start.getMinutes() / 60);
      max = Math.max(max, end.getHours() + end.getMinutes() / 60);
    });
    return {
      startHour: Math.max(0, Math.floor(min) - 1),
      endHour: Math.min(24, Math.ceil(max) + 1),
    };
  }, [timelineGroups]);

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
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({movie: '', room: '', date: '', status: ''});
    setSearch('');
    setPage(1);
  };

  const handleSearch = event => {
    event.preventDefault();
    setPage(1);
  };

  const handleDelete = async showtimeId => {
    const ok = window.confirm('Bạn có chắc muốn xóa suất chiếu này?');
    if (!ok) {
      return;
    }

    try {
      await showtimeApi.remove(showtimeId);
      setShowtimes(current => current.filter(item => item._id !== showtimeId));
    } catch (err) {
      window.alert(err.message || 'Xóa suất chiếu thất bại');
    }
  };

  const seatStats = item => {
    const totalSeats = Number(item.room?.totalSeats || 0);
    const sold = Number(occupancy[String(item._id)] || 0);
    const available = Math.max(totalSeats - sold, 0);
    const percent =
      totalSeats > 0 ? Math.min(100, Math.round((sold / totalSeats) * 100)) : 0;
    return {totalSeats, sold, available, percent};
  };

  const blockStyle = item => {
    const span = Math.max(timelineBounds.endHour - timelineBounds.startHour, 1);
    const start = new Date(item.startTime);
    const end = new Date(item.endTime);
    const startPos =
      (start.getHours() + start.getMinutes() / 60 - timelineBounds.startHour) /
      span;
    const endPos =
      (end.getHours() + end.getMinutes() / 60 - timelineBounds.startHour) / span;
    const left = Math.max(0, startPos) * 100;
    const width = Math.max(2, (endPos - startPos) * 100);
    return {left: `${left}%`, width: `${width}%`};
  };

  const hourMarks = [];
  for (let hour = timelineBounds.startHour; hour <= timelineBounds.endHour; hour += 1) {
    hourMarks.push(hour);
  }

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

      <div className="showtimeViewTabs" role="tablist">
        <button
          type="button"
          className={viewMode === 'list' ? 'active' : ''}
          onClick={() => setViewMode('list')}>
          Danh sách
        </button>
        <button
          type="button"
          className={viewMode === 'timeline' ? 'active' : ''}
          onClick={() => setViewMode('timeline')}>
          Lịch chiếu
        </button>
      </div>

      {viewMode === 'list' && (
        <>
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
                {value: 'completed', label: 'Đã kết thúc'},
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
        </>
      )}

      {viewMode === 'timeline' && (
        <div className="showtimeTimelineToolbar">
          <label>
            Ngày lịch chiếu
            <input
              type="date"
              value={timelineDate}
              onChange={event => setTimelineDate(event.target.value)}
            />
          </label>
          <p>
            Timeline theo từng phòng · khoảng{' '}
            {String(timelineBounds.startHour).padStart(2, '0')}:00 –{' '}
            {String(timelineBounds.endHour).padStart(2, '0')}:00
          </p>
        </div>
      )}

      {error && <p className="inlineError">{error}</p>}
      {loading ? (
        <p className="mutedText">Đang tải suất chiếu...</p>
      ) : viewMode === 'list' ? (
        <div className="panel showtimeTableWrap">
          <table className="showtimeTable">
            <thead>
              <tr>
                <th>Mã suất</th>
                <th>Phim</th>
                <th>Phòng chiếu</th>
                <th>Suất chiếu</th>
                <th>Giá vé</th>
                <th>Ghế</th>
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
                  const seats = seatStats(item);

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
                            <span style={{width: `${seats.percent}%`}} />
                          </div>
                          <small>
                            Đã bán {seats.sold}/{seats.totalSeats || '--'} · trống{' '}
                            {seats.available || '--'}
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
      ) : (
        <div className="panel showtimeTimelinePanel">
          {!timelineGroups.length ? (
            <p className="mutedText">
              Không có suất chiếu nào trong ngày {formatDate(`${timelineDate}T12:00:00`)}.
            </p>
          ) : (
            <>
              <div className="showtimeTimelineHours">
                <div className="showtimeTimelineRoomLabel" />
                <div className="showtimeTimelineTrack">
                  {hourMarks.map(hour => (
                    <span key={hour}>
                      {String(hour).padStart(2, '0')}:00
                    </span>
                  ))}
                </div>
              </div>
              {timelineGroups.map(group => (
                <div className="showtimeTimelineRow" key={group.roomId}>
                  <div className="showtimeTimelineRoomLabel">
                    <strong>{group.name}</strong>
                    {group.type ? <span>{group.type}</span> : null}
                  </div>
                  <div className="showtimeTimelineTrack">
                    {group.showtimes.map(item => {
                      const status = getDisplayStatus(item);
                      return (
                        <button
                          key={item._id}
                          type="button"
                          className={`showtimeTimelineBlock ${status.tone}`}
                          style={blockStyle(item)}
                          title={`${item.movie?.title || 'Phim'} · ${formatTime(item.startTime)}-${formatTime(item.endTime)}`}
                          onClick={() => setViewing(item)}>
                          <strong>
                            {formatTime(item.startTime)} - {formatTime(item.endTime)}
                          </strong>
                          <span>{item.movie?.title || 'Phim'}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </>
          )}
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
                  {viewing.room?.type ? ` • ${viewing.room.type}` : ''}
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
                <span>Ghế đã bán</span>
                <strong>
                  {seatStats(viewing).sold}/{seatStats(viewing).totalSeats}
                </strong>
              </p>
              <p>
                <span>Ghế trống</span>
                <strong>{seatStats(viewing).available}</strong>
              </p>
              <p>
                <span>Trạng thái DB</span>
                <strong>{viewing.status || 'scheduled'}</strong>
              </p>
            </div>

            <div className="showtimeDetailActions">
              <Link
                className="primaryAction"
                to={`/showtimes/${viewing._id}/edit`}
                onClick={() => setViewing(null)}>
                Sửa suất chiếu
              </Link>
              <button
                type="button"
                className="ghost"
                onClick={() => setViewing(null)}>
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

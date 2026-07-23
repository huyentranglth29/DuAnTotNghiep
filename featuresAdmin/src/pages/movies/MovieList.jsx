import {useCallback, useEffect, useMemo, useState} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {
  BarChart3,
  CalendarDays,
  Clapperboard,
  Eye,
  Film,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import movieApi from '../../api/movieApi';
import showtimeApi from '../../api/showtimeApi';
import {formatDate, formatVnd} from '../../utils/adminFormatters';

const AGE_OPTIONS = ['P', 'T13', 'T16', 'T18'];

const STATUS_META = {
  'now-showing': {key: 'showing', label: 'Đang chiếu', tone: 'success'},
  now_showing: {key: 'showing', label: 'Đang chiếu', tone: 'success'},
  featured: {key: 'showing', label: 'Đang chiếu', tone: 'success'},
  'coming-soon': {key: 'upcoming', label: 'Sắp chiếu', tone: 'warning'},
  coming_soon: {key: 'upcoming', label: 'Sắp chiếu', tone: 'warning'},
  ended: {key: 'ended', label: 'Đã chiếu', tone: 'muted'},
  stopped: {key: 'stopped', label: 'Ngừng chiếu', tone: 'danger'},
};

const PAGE_SIZE = 10;

function getMovieId(movie) {
  return String(movie?._id || movie?.id || '');
}

function getStatusMeta(status) {
  return STATUS_META[status] || {key: 'unknown', label: status || '—', tone: 'muted'};
}

function formatDuration(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' && /h|m|phút/i.test(value)) return value;
  const minutes = Number(value);
  if (Number.isNaN(minutes)) return String(value);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour <= 0) return `${minute}m`;
  return minute ? `${hour}h ${minute}m` : `${hour}h`;
}

function formatGenre(genre) {
  if (Array.isArray(genre)) return genre.filter(Boolean).join(', ');
  return genre || '—';
}

function formatCast(cast) {
  if (!cast) return '—';
  if (Array.isArray(cast)) {
    return (
      cast
        .map(item => (typeof item === 'object' ? item.name || item : item))
        .filter(Boolean)
        .join(', ') || '—'
    );
  }
  return String(cast);
}

function toDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function todayKey() {
  return toDateKey(new Date());
}

function StatusBadge({status}) {
  const meta = getStatusMeta(status);
  return <span className={`movieBadge movieBadge--${meta.tone}`}>{meta.label}</span>;
}

function AgeBadge({value}) {
  if (!value) return <span className="movieAgeBadge movieAgeBadge--muted">—</span>;
  const key = String(value).toUpperCase();
  const tone =
    key === 'T18' || key === '18+'
      ? 'danger'
      : key === 'T16' || key === '16+'
        ? 'orange'
        : key === 'T13' || key === '13+'
          ? 'warning'
          : 'success';
  return <span className={`movieAgeBadge movieAgeBadge--${tone}`}>{key}</span>;
}

function MovieList() {
  const navigate = useNavigate();
  const [movies, setMovies] = useState([]);
  const [showtimeCountMap, setShowtimeCountMap] = useState({});
  const [todayShowtimeMap, setTodayShowtimeMap] = useState({});
  const [revenueMap, setRevenueMap] = useState({});
  const [ticketMap, setTicketMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [menuId, setMenuId] = useState('');
  const [acting, setActing] = useState(false);
  const [page, setPage] = useState(1);
  const [fullDetailOpen, setFullDetailOpen] = useState(false);

  const [draft, setDraft] = useState({
    keyword: '',
    genre: '',
    status: '',
    ageRating: '',
    showingToday: false,
    hasShowtimes: false,
  });
  const [filters, setFilters] = useState(draft);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [movieRes, showtimeRes, revenueRes, topRes] = await Promise.all([
        movieApi.getAll({limit: 500, page: 1, sort: '-createdAt'}),
        showtimeApi.getAll({limit: 500, page: 1}).catch(() => ({data: []})),
        dashboardApi.getRevenueByMovie().catch(() => []),
        dashboardApi.getTopMovies().catch(() => []),
      ]);

      const movieRows = Array.isArray(movieRes) ? movieRes : movieRes?.data || [];
      const showtimeRows = Array.isArray(showtimeRes)
        ? showtimeRes
        : showtimeRes?.data || [];
      const revenueRows = Array.isArray(revenueRes) ? revenueRes : revenueRes?.data || [];
      const topRows = Array.isArray(topRes) ? topRes : topRes?.data || [];

      const countMap = {};
      const todayMap = {};
      const today = todayKey();
      showtimeRows.forEach(item => {
        const movieId = String(item.movie?._id || item.movie?.id || item.movie || '');
        if (!movieId) return;
        countMap[movieId] = (countMap[movieId] || 0) + 1;
        if (toDateKey(item.startTime) === today) {
          todayMap[movieId] = true;
        }
      });

      const nextRevenue = {};
      revenueRows.forEach(item => {
        const key = String(item.movieId || item.title || '').trim();
        if (!key) return;
        nextRevenue[key] = Number(item.revenue || 0);
        if (item.title) nextRevenue[String(item.title).trim()] = Number(item.revenue || 0);
      });

      const nextTickets = {};
      topRows.forEach(item => {
        const title = String(item.title || '').trim();
        if (!title) return;
        nextTickets[title] = Number(item.tickets || item.ticketCount || 0);
      });

      setMovies(movieRows);
      setShowtimeCountMap(countMap);
      setTodayShowtimeMap(todayMap);
      setRevenueMap(nextRevenue);
      setTicketMap(nextTickets);
      setSelectedId(current => {
        if (current && movieRows.some(item => getMovieId(item) === current)) return current;
        return '';
      });
    } catch (err) {
      setError(err.message || 'Không tải được danh sách phim.');
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(current => {
        if (current.keyword === draft.keyword) return current;
        setPage(1);
        return {...current, keyword: draft.keyword};
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [draft.keyword]);

  const genreOptions = useMemo(() => {
    const set = new Set();
    movies.forEach(movie => {
      const raw = movie.genre;
      const parts = Array.isArray(raw)
        ? raw
        : String(raw || '')
            .split(',')
            .map(item => item.trim())
            .filter(Boolean);
      parts.forEach(item => set.add(item));
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [movies]);

  const enrichedMovies = useMemo(
    () =>
      movies.map(movie => {
        const id = getMovieId(movie);
        const title = movie.title || '';
        return {
          ...movie,
          id,
          showtimeCount: showtimeCountMap[id] || 0,
          showingToday: Boolean(todayShowtimeMap[id]),
          revenue: revenueMap[id] ?? revenueMap[title] ?? null,
          ticketsSold: ticketMap[title] ?? null,
        };
      }),
    [movies, showtimeCountMap, todayShowtimeMap, revenueMap, ticketMap],
  );

  const filteredMovies = useMemo(() => {
    const keyword = filters.keyword.trim().toLowerCase();
    return enrichedMovies.filter(movie => {
      if (keyword && !String(movie.title || '').toLowerCase().includes(keyword)) {
        return false;
      }
      if (filters.genre) {
        const genreText = formatGenre(movie.genre).toLowerCase();
        if (!genreText.includes(filters.genre.toLowerCase())) return false;
      }
      if (filters.status) {
        const meta = getStatusMeta(movie.status);
        if (meta.key !== filters.status) return false;
      }
      if (filters.ageRating) {
        if (String(movie.ageRating || '').toUpperCase() !== filters.ageRating.toUpperCase()) {
          return false;
        }
      }
      if (filters.showingToday && !movie.showingToday) return false;
      if (filters.hasShowtimes && movie.showtimeCount <= 0) return false;
      return true;
    });
  }, [enrichedMovies, filters]);

  const stats = useMemo(() => {
    const base = {total: enrichedMovies.length, showing: 0, upcoming: 0, ended: 0, stopped: 0};
    enrichedMovies.forEach(movie => {
      const key = getStatusMeta(movie.status).key;
      if (key === 'showing') base.showing += 1;
      else if (key === 'upcoming') base.upcoming += 1;
      else if (key === 'ended') base.ended += 1;
      else if (key === 'stopped') base.stopped += 1;
    });
    return base;
  }, [enrichedMovies]);

  const totalPages = Math.max(1, Math.ceil(filteredMovies.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredMovies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const selected = useMemo(
    () => enrichedMovies.find(item => item.id === selectedId) || null,
    [enrichedMovies, selectedId],
  );

  const updateDraft = (key, value) => {
    setDraft(current => ({...current, [key]: value}));
  };

  const applySelectFilter = (key, value) => {
    setDraft(current => ({...current, [key]: value}));
    setFilters(current => ({...current, [key]: value}));
    setPage(1);
  };

  const toggleQuickFilter = key => {
    setDraft(current => {
      const next = {...current, [key]: !current[key]};
      setFilters(prev => ({...prev, [key]: next[key]}));
      setPage(1);
      return next;
    });
  };

  const applyStatFilter = statusKey => {
    const nextStatus = filters.status === statusKey ? '' : statusKey;
    applySelectFilter('status', nextStatus);
  };

  const openDetail = movie => {
    setSelectedId(movie.id);
    setMenuId('');
  };

  const openFullDetail = movie => {
    setSelectedId(movie.id);
    setMenuId('');
    setFullDetailOpen(true);
  };

  const goShowtimes = movie => {
    navigate(`/showtimes?movie=${movie.id}`);
  };

  const goRevenue = movie => {
    navigate(`/movies/${movie.id}/revenue`);
  };

  const stopMovie = async movie => {
    if (!window.confirm(`Ngừng chiếu phim "${movie.title}"?`)) return;
    setActing(true);
    try {
      await movieApi.update(movie.id, {status: 'stopped'});
      await loadData();
    } catch (err) {
      window.alert(err.message || 'Không thể ngừng chiếu phim.');
    } finally {
      setActing(false);
      setMenuId('');
    }
  };

  const deleteMovie = async movie => {
    if (!window.confirm(`Xóa phim "${movie.title}"? Thao tác không thể hoàn tác.`)) return;
    setActing(true);
    try {
      await movieApi.remove(movie.id);
      if (selectedId === movie.id) setSelectedId('');
      await loadData();
    } catch (err) {
      window.alert(err.message || 'Xóa phim thất bại.');
    } finally {
      setActing(false);
      setMenuId('');
    }
  };

  const rangeLabel = useMemo(() => {
    if (!filteredMovies.length) return 'Hiển thị 0 phim';
    const from = (currentPage - 1) * PAGE_SIZE + 1;
    const to = Math.min(currentPage * PAGE_SIZE, filteredMovies.length);
    return `Hiển thị ${from} đến ${to} trong tổng số ${filteredMovies.length} phim`;
  }, [filteredMovies.length, currentPage]);

  return (
    <section className={`movieManagePage ${selected ? 'has-panel' : ''}`}>
      <div className="movieManageMain">
        <header className="movieManageHeader">
          <div>
            <h2>Quản lý phim</h2>
            <p>Theo dõi danh mục phim, suất chiếu và doanh thu theo từng tựa phim.</p>
          </div>
          <Link className="movieBtnPrimary" to="/movies/add">
            <Plus size={16} />
            Thêm phim
          </Link>
        </header>

        <div className="movieStatGrid">
          <button type="button" className="movieStatCard" onClick={() => applySelectFilter('status', '')}>
            <Film size={18} />
            <span>Tổng phim</span>
            <strong>{stats.total}</strong>
          </button>
          <button
            type="button"
            className={`movieStatCard movieStatCard--success ${filters.status === 'showing' ? 'is-active' : ''}`}
            onClick={() => applyStatFilter('showing')}>
            <Clapperboard size={18} />
            <span>Đang chiếu</span>
            <strong>{stats.showing}</strong>
          </button>
          <button
            type="button"
            className={`movieStatCard movieStatCard--warning ${filters.status === 'upcoming' ? 'is-active' : ''}`}
            onClick={() => applyStatFilter('upcoming')}>
            <CalendarDays size={18} />
            <span>Sắp chiếu</span>
            <strong>{stats.upcoming}</strong>
          </button>
          <button
            type="button"
            className={`movieStatCard movieStatCard--muted ${filters.status === 'ended' ? 'is-active' : ''}`}
            onClick={() => applyStatFilter('ended')}>
            <Eye size={18} />
            <span>Đã chiếu</span>
            <strong>{stats.ended}</strong>
          </button>
          <button
            type="button"
            className={`movieStatCard movieStatCard--danger ${filters.status === 'stopped' ? 'is-active' : ''}`}
            onClick={() => applyStatFilter('stopped')}>
            <X size={18} />
            <span>Ngừng chiếu</span>
            <strong>{stats.stopped}</strong>
          </button>
        </div>

        <div className="movieFilterBar">
          <label className="movieSearch">
            <Search size={16} />
            <input
              value={draft.keyword}
              onChange={event => updateDraft('keyword', event.target.value)}
              placeholder="Tìm kiếm phim..."
            />
          </label>
          <select
            value={draft.genre}
            onChange={event => applySelectFilter('genre', event.target.value)}
            aria-label="Thể loại">
            <option value="">Thể loại</option>
            {genreOptions.map(genre => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            value={draft.status}
            onChange={event => applySelectFilter('status', event.target.value)}
            aria-label="Trạng thái">
            <option value="">Trạng thái</option>
            <option value="showing">Đang chiếu</option>
            <option value="upcoming">Sắp chiếu</option>
            <option value="ended">Đã chiếu</option>
            <option value="stopped">Ngừng chiếu</option>
          </select>
          <select
            value={draft.ageRating}
            onChange={event => applySelectFilter('ageRating', event.target.value)}
            aria-label="Độ tuổi">
            <option value="">Độ tuổi</option>
            {AGE_OPTIONS.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`movieChip ${draft.showingToday ? 'is-active' : ''}`}
            onClick={() => toggleQuickFilter('showingToday')}>
            Đang chiếu hôm nay
          </button>
          <button
            type="button"
            className={`movieChip ${draft.hasShowtimes ? 'is-active' : ''}`}
            onClick={() => toggleQuickFilter('hasShowtimes')}>
            Có suất chiếu
          </button>
          <button type="button" className="movieBtnGhost" onClick={loadData} title="Làm mới">
            <RefreshCw size={16} />
            Làm mới
          </button>
        </div>

        {error ? <p className="movieError">{error}</p> : null}

        <div className="movieTableCard">
          <div className="movieTableWrap">
            <table className="movieTable">
              <thead>
                <tr>
                  <th>Poster</th>
                  <th>Phim</th>
                  <th>Thể loại</th>
                  <th>Thời lượng</th>
                  <th>Khởi chiếu</th>
                  <th>Suất chiếu</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="movieEmpty">
                      Đang tải danh sách phim...
                    </td>
                  </tr>
                ) : pageRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="movieEmpty">
                      Không có phim phù hợp.
                    </td>
                  </tr>
                ) : (
                  pageRows.map(movie => (
                    <tr
                      key={movie.id}
                      className={selectedId === movie.id ? 'is-active' : ''}
                      onClick={() => openDetail(movie)}>
                      <td>
                        {movie.posterUrl || movie.poster ? (
                          <img
                            className="moviePosterThumb"
                            src={movie.posterUrl || movie.poster}
                            alt={movie.title}
                            loading="lazy"
                          />
                        ) : (
                          <div className="moviePosterFallback">FG</div>
                        )}
                      </td>
                      <td>
                        <div className="movieTitleCell">
                          <div className="movieTitleRow">
                            <strong>{movie.title}</strong>
                            <AgeBadge value={movie.ageRating} />
                          </div>
                          {movie.synopsis || movie.description ? (
                            <span className="movieSynopsis">
                              {String(movie.synopsis || movie.description).slice(0, 72)}
                              {String(movie.synopsis || movie.description).length > 72 ? '…' : ''}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{formatGenre(movie.genre)}</td>
                      <td>{formatDuration(movie.duration)}</td>
                      <td>{formatDate(movie.releaseDate) || '—'}</td>
                      <td>
                        <button
                          type="button"
                          className="movieShowtimeLink"
                          onClick={event => {
                            event.stopPropagation();
                            goShowtimes(movie);
                          }}>
                          {movie.showtimeCount} suất
                        </button>
                      </td>
                      <td>
                        <StatusBadge status={movie.status} />
                      </td>
                      <td>
                        <div className="movieRowActions" onClick={event => event.stopPropagation()}>
                          <button
                            type="button"
                            className="movieIconBtn"
                            title="Xem"
                            onClick={() => openDetail(movie)}>
                            <Eye size={16} />
                          </button>
                          <div className="movieMoreWrap">
                            <button
                              type="button"
                              className="movieIconBtn"
                              title="Thêm thao tác"
                              onClick={() =>
                                setMenuId(current => (current === movie.id ? '' : movie.id))
                              }>
                              <MoreHorizontal size={16} />
                            </button>
                            {menuId === movie.id ? (
                              <div className="movieMoreMenu">
                                <button type="button" onClick={() => openFullDetail(movie)}>
                                  Xem
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate(`/movies/${movie.id}/edit`)}>
                                  Chỉnh sửa
                                </button>
                                <button type="button" onClick={() => goShowtimes(movie)}>
                                  Quản lý suất chiếu
                                </button>
                                <button type="button" onClick={() => goRevenue(movie)}>
                                  Thống kê doanh thu
                                </button>
                                <button
                                  type="button"
                                  disabled={acting || getStatusMeta(movie.status).key === 'stopped'}
                                  onClick={() => stopMovie(movie)}>
                                  Ngừng chiếu
                                </button>
                                <button
                                  type="button"
                                  className="is-danger"
                                  disabled={acting}
                                  onClick={() => deleteMovie(movie)}>
                                  Xóa
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="moviePagination">
            <span>{rangeLabel}</span>
            <div>
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
                onClick={() => setPage(current => Math.min(totalPages, current + 1))}>
                ›
              </button>
            </div>
          </footer>
        </div>
      </div>

      {selected ? (
        <aside className="movieDetailPanel">
          <div className="movieDetailHead">
            <h3>Chi tiết phim</h3>
            <button type="button" className="movieIconBtn" onClick={() => setSelectedId('')}>
              <X size={16} />
            </button>
          </div>

          <div className="movieDetailHero">
            {selected.posterUrl || selected.poster ? (
              <img src={selected.posterUrl || selected.poster} alt={selected.title} />
            ) : (
              <div className="moviePosterFallback large">FG</div>
            )}
            <div>
              <h4>{selected.title}</h4>
              <div className="movieDetailBadges">
                <StatusBadge status={selected.status} />
                <AgeBadge value={selected.ageRating} />
              </div>
              <p>{formatDuration(selected.duration)}</p>
              {selected.synopsis || selected.description ? (
                <small>
                  {String(selected.synopsis || selected.description).slice(0, 140)}
                  {String(selected.synopsis || selected.description).length > 140 ? '…' : ''}
                </small>
              ) : null}
            </div>
          </div>

          <dl className="movieDetailGrid">
            <div>
              <dt>Thể loại</dt>
              <dd>{formatGenre(selected.genre)}</dd>
            </div>
            <div>
              <dt>Đạo diễn</dt>
              <dd>{selected.director || '—'}</dd>
            </div>
            <div>
              <dt>Diễn viên</dt>
              <dd>{formatCast(selected.cast)}</dd>
            </div>
            <div>
              <dt>Ngày khởi chiếu</dt>
              <dd>{formatDate(selected.releaseDate) || '—'}</dd>
            </div>
            {selected.endDate ? (
              <div>
                <dt>Ngày kết thúc</dt>
                <dd>{formatDate(selected.endDate)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Số suất chiếu</dt>
              <dd>{selected.showtimeCount} suất</dd>
            </div>
            {selected.revenue != null ? (
              <div>
                <dt>Doanh thu</dt>
                <dd>{formatVnd(selected.revenue)}</dd>
              </div>
            ) : null}
            {selected.ticketsSold != null ? (
              <div>
                <dt>Tổng vé đã bán</dt>
                <dd>{selected.ticketsSold}</dd>
              </div>
            ) : null}
            {selected.rating != null && Number(selected.rating) > 0 ? (
              <div>
                <dt>Đánh giá</dt>
                <dd className="movieRatingValue">
                  <Star size={14} /> {Number(selected.rating).toFixed(1)}/10
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="movieDetailActions">
            <button
              type="button"
              className="movieActionBtn"
              onClick={() => openFullDetail(selected)}>
              <Eye size={15} /> Xem chi tiết
            </button>
            <button
              type="button"
              className="movieActionBtn movieActionBtn--blue"
              onClick={() => navigate(`/movies/${selected.id}/edit`)}>
              <Pencil size={15} /> Chỉnh sửa phim
            </button>
            <button
              type="button"
              className="movieActionBtn movieActionBtn--purple"
              onClick={() => goShowtimes(selected)}>
              <CalendarDays size={15} /> Quản lý suất chiếu
            </button>
            <button type="button" className="movieActionBtn" onClick={() => goRevenue(selected)}>
              <BarChart3 size={15} /> Xem thống kê doanh thu
            </button>
            <button
              type="button"
              className="movieActionBtn movieActionBtn--danger"
              disabled={acting || getStatusMeta(selected.status).key === 'stopped'}
              onClick={() => stopMovie(selected)}>
              <X size={15} /> Ngừng chiếu
            </button>
            <button
              type="button"
              className="movieActionBtn movieActionBtn--danger"
              disabled={acting}
              onClick={() => deleteMovie(selected)}>
              <Trash2 size={15} /> Xóa phim
            </button>
          </div>
        </aside>
      ) : null}

      {fullDetailOpen && selected ? (
        <div
          className="movieFullDetailOverlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setFullDetailOpen(false)}>
          <div
            className="movieFullDetailModal"
            onClick={event => event.stopPropagation()}>
            <div className="movieDetailHead">
              <h3>Chi tiết phim</h3>
              <button
                type="button"
                className="movieIconBtn"
                onClick={() => setFullDetailOpen(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="movieFullDetailBody">
              {selected.posterUrl || selected.poster ? (
                <img
                  className="movieFullPoster"
                  src={selected.posterUrl || selected.poster}
                  alt={selected.title}
                />
              ) : (
                <div className="moviePosterFallback large">FG</div>
              )}

              <div className="movieFullDetailContent">
                <h4>{selected.title}</h4>
                <div className="movieDetailBadges">
                  <StatusBadge status={selected.status} />
                  <AgeBadge value={selected.ageRating} />
                </div>

                <dl className="movieDetailGrid movieFullDetailGrid">
                  <div>
                    <dt>Thể loại</dt>
                    <dd>{formatGenre(selected.genre)}</dd>
                  </div>
                  <div>
                    <dt>Thời lượng</dt>
                    <dd>{formatDuration(selected.duration)}</dd>
                  </div>
                  <div>
                    <dt>Đạo diễn</dt>
                    <dd>{selected.director || '—'}</dd>
                  </div>
                  <div>
                    <dt>Diễn viên</dt>
                    <dd>{formatCast(selected.cast)}</dd>
                  </div>
                  <div>
                    <dt>Ngày khởi chiếu</dt>
                    <dd>{formatDate(selected.releaseDate) || '—'}</dd>
                  </div>
                  {selected.endDate ? (
                    <div>
                      <dt>Ngày kết thúc</dt>
                      <dd>{formatDate(selected.endDate)}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>Số suất chiếu</dt>
                    <dd>{selected.showtimeCount} suất</dd>
                  </div>
                  {selected.price != null ? (
                    <div>
                      <dt>Giá vé</dt>
                      <dd>{formatVnd(selected.price)}</dd>
                    </div>
                  ) : null}
                  {selected.revenue != null ? (
                    <div>
                      <dt>Doanh thu</dt>
                      <dd>{formatVnd(selected.revenue)}</dd>
                    </div>
                  ) : null}
                  {selected.ticketsSold != null ? (
                    <div>
                      <dt>Tổng vé đã bán</dt>
                      <dd>{selected.ticketsSold}</dd>
                    </div>
                  ) : null}
                  {selected.rating != null && Number(selected.rating) > 0 ? (
                    <div>
                      <dt>Đánh giá</dt>
                      <dd className="movieRatingValue">
                        <Star size={14} /> {Number(selected.rating).toFixed(1)}/10
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <div className="movieFullSynopsis">
                  <strong>Mô tả</strong>
                  <p>{selected.synopsis || selected.description || 'Chưa có mô tả.'}</p>
                </div>

                <div className="movieFullDetailFooter">
                  <button
                    type="button"
                    className="movieActionBtn movieActionBtn--blue"
                    onClick={() => {
                      setFullDetailOpen(false);
                      navigate(`/movies/${selected.id}/edit`);
                    }}>
                    <Pencil size={15} /> Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    className="movieBtnGhost"
                    onClick={() => setFullDetailOpen(false)}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default MovieList;

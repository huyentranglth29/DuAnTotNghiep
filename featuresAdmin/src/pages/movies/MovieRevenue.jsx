import {useEffect, useMemo, useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Download,
  Percent,
  Star,
  Ticket,
  WalletCards,
} from 'lucide-react';
import dashboardApi from '../../api/dashboardApi';
import {DataBars} from '../../components/AdminUi';
import {formatDate, formatVnd} from '../../utils/adminFormatters';

function toInputDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function defaultFrom() {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toInputDate(date);
}

function formatDuration(value) {
  if (value == null || value === '') return '—';
  if (typeof value === 'string' && /h|m|phút/i.test(value)) return value;
  const minutes = Number(value);
  if (Number.isNaN(minutes)) return String(value);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  if (hour <= 0) return `${minute} phút`;
  return minute ? `${hour}h ${minute}m` : `${hour}h`;
}

function formatGenre(genre) {
  if (Array.isArray(genre)) return genre.filter(Boolean).join(', ');
  return genre || '—';
}

function statusLabel(status) {
  const map = {
    'now-showing': 'Đang chiếu',
    now_showing: 'Đang chiếu',
    featured: 'Đang chiếu',
    'coming-soon': 'Sắp chiếu',
    coming_soon: 'Sắp chiếu',
    ended: 'Đã chiếu',
    stopped: 'Ngừng chiếu',
  };
  return map[status] || status || '—';
}

function formatChartDate(value) {
  const parts = String(value || '').split('-');
  if (parts.length < 3) return value;
  return `${parts[2]}/${parts[1]}`;
}

function pickMoneyUnit(maxValue) {
  const max = Math.max(Number(maxValue) || 0, 1);
  if (max >= 1_000_000_000) {
    return {divisor: 1_000_000_000, label: 'Tỷ đồng', digits: 1};
  }
  if (max >= 1_000_000) {
    return {divisor: 1_000_000, label: 'Triệu đồng', digits: 1};
  }
  if (max >= 1_000) {
    return {divisor: 1_000, label: 'Nghìn đồng', digits: 0};
  }
  return {divisor: 1, label: 'Đồng', digits: 0};
}

function niceCeiling(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function buildSmoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const p0 = points[index === 0 ? 0 : index - 1];
    const p1 = points[index];
    const p2 = points[index + 1];
    const p3 = points[index + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return path;
}

function aggregateRevenue(items, mode) {
  if (mode !== 'week') return items;
  const weeks = new Map();
  items.forEach(item => {
    const date = new Date(`${item.date}T00:00:00`);
    if (Number.isNaN(date.getTime())) return;
    const day = date.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    const key = monday.toISOString().slice(0, 10);
    const current = weeks.get(key) || {
      date: key,
      revenue: 0,
      tickets: 0,
      bookings: 0,
    };
    current.revenue += Number(item.revenue || 0);
    current.tickets += Number(item.tickets || 0);
    current.bookings += Number(item.bookings || 0);
    weeks.set(key, current);
  });
  return [...weeks.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function DailyRevenueChart({items = []}) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [mode, setMode] = useState('day');

  const chartItems = useMemo(() => aggregateRevenue(items, mode), [items, mode]);

  const chart = useMemo(() => {
    const width = 760;
    const height = 180;
    const padding = {top: 22, right: 14, bottom: 28, left: 46};
    const values = chartItems.map(item => Number(item.revenue || 0));
    const rawMax = Math.max(...values, 0);
    const unit = pickMoneyUnit(rawMax);
    const scaledMax = niceCeiling(rawMax / unit.divisor || 1);
    const maxValue = scaledMax * unit.divisor;
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;
    const tickCount = 5;
    const ticks = Array.from({length: tickCount}, (_, index) => {
      const ratio = index / (tickCount - 1);
      return {
        ratio,
        value: scaledMax * (1 - ratio),
        y: padding.top + innerH * ratio,
      };
    });

    const points = chartItems.map((item, index) => {
      const x =
        padding.left +
        (chartItems.length === 1 ? innerW / 2 : (index / (chartItems.length - 1)) * innerW);
      const y = padding.top + innerH - (Number(item.revenue || 0) / maxValue) * innerH;
      return {x, y, ...item, revenue: Number(item.revenue || 0)};
    });

    const linePath = buildSmoothPath(points);
    const areaPath = points.length
      ? `${linePath} L ${points[points.length - 1].x} ${padding.top + innerH} L ${
          points[0].x
        } ${padding.top + innerH} Z`
      : '';

    const labelStep = Math.max(1, Math.ceil(chartItems.length / 12));

    return {
      width,
      height,
      padding,
      unit,
      scaledMax,
      ticks,
      points,
      linePath,
      areaPath,
      labelStep,
      maxValue,
    };
  }, [chartItems]);

  if (!items.length) {
    return <p className="movieRevenueEmpty">Chưa có doanh thu trong khoảng đã chọn.</p>;
  }

  const tip =
    activeIndex != null
      ? chart.points[activeIndex]
      : chart.points.find(point => point.revenue > 0) || chart.points[0];

  return (
    <div className="movieRevenueAreaChartWrap">
      <div className="movieRevenuePanelHead">
        <h3>Doanh thu theo {mode === 'week' ? 'tuần' : 'ngày'}</h3>
        <select
          className="movieRevenueModeSelect"
          value={mode}
          onChange={event => {
            setMode(event.target.value);
            setActiveIndex(null);
          }}>
          <option value="day">Theo ngày</option>
          <option value="week">Theo tuần</option>
        </select>
      </div>

      <div
        className="movieRevenueAreaChart"
        onMouseLeave={() => setActiveIndex(null)}>
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img">
          <defs>
            <linearGradient id="movieRevenueAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.45" />
              <stop offset="70%" stopColor="#3b82f6" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>

          <text
            x={chart.padding.left}
            y={16}
            className="movieRevenueAxisLabel">
            {chart.unit.label}
          </text>

          {chart.ticks.map(tick => (
            <g key={tick.value}>
              <line
                x1={chart.padding.left}
                x2={chart.width - chart.padding.right}
                y1={tick.y}
                y2={tick.y}
                className="movieRevenueGridLine"
              />
              <text
                x={chart.padding.left - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="movieRevenueAxisText">
                {tick.value.toFixed(chart.unit.digits)}
              </text>
            </g>
          ))}

          {chart.areaPath ? (
            <path d={chart.areaPath} fill="url(#movieRevenueAreaFill)" />
          ) : null}
          {chart.linePath ? (
            <path d={chart.linePath} className="movieRevenueAreaPath" fill="none" />
          ) : null}

          {chart.points.map((point, index) => (
            <g key={point.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r={activeIndex === index ? 5 : 3.5}
                className={`movieRevenueAreaDot ${activeIndex === index ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
              />
              <rect
                x={point.x - Math.max(8, chart.width / chart.points.length / 2)}
                y={chart.padding.top}
                width={Math.max(16, chart.width / chart.points.length)}
                height={chart.height - chart.padding.top - chart.padding.bottom}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
              />
              {index % chart.labelStep === 0 || index === chart.points.length - 1 ? (
                <text
                  x={point.x}
                  y={chart.height - 10}
                  textAnchor="middle"
                  className="movieRevenueAxisText">
                  {formatChartDate(point.date)}
                </text>
              ) : null}
            </g>
          ))}

          {tip ? (
            <line
              x1={tip.x}
              x2={tip.x}
              y1={chart.padding.top}
              y2={chart.height - chart.padding.bottom}
              className="movieRevenueGuide"
            />
          ) : null}
        </svg>

        {tip ? (
          <div className="movieRevenueFloatTip">
            <strong>{formatChartDate(tip.date)}</strong>
            <span>{formatVnd(tip.revenue)}</span>
            <em>
              {tip.tickets || 0} vé · {tip.bookings || 0} đơn
            </em>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MovieRevenue() {
  const {id} = useParams();
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(toInputDate(new Date()));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);

  const loadData = async (nextFrom = from, nextTo = to) => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const response = await dashboardApi.getMovieRevenue({
        movieId: id,
        from: nextFrom,
        to: nextTo,
      });
      setData(response?.data || response);
    } catch (err) {
      setError(err.message || 'Không tải được thống kê doanh thu phim.');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const movie = data?.movie;
  const summary = data?.summary;

  const kpis = useMemo(
    () => [
      {
        label: 'Tổng doanh thu',
        value: formatVnd(summary?.totalRevenue),
        icon: WalletCards,
        tone: 'green',
      },
      {
        label: 'Tổng vé bán',
        value: summary?.totalTickets ?? 0,
        icon: Ticket,
        tone: 'blue',
      },
      {
        label: 'Tổng suất chiếu',
        value: summary?.totalShowtimes ?? 0,
        icon: Clapperboard,
        tone: 'orange',
      },
      {
        label: 'Tỷ lệ lấp đầy TB',
        value: `${summary?.occupancyRate ?? 0}%`,
        icon: Percent,
        tone: 'violet',
      },
    ],
    [summary],
  );

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ['Chỉ số', 'Giá trị'],
      ['Phim', movie?.title || ''],
      ['Từ ngày', from],
      ['Đến ngày', to],
      ['Doanh thu', summary?.totalRevenue ?? 0],
      ['Vé bán', summary?.totalTickets ?? 0],
      ['Suất chiếu', summary?.totalShowtimes ?? 0],
      ['Lấp đầy (%)', summary?.occupancyRate ?? 0],
      [],
      ['Ngày', 'Doanh thu', 'Vé', 'Đơn'],
      ...(data.revenueByDay || []).map(item => [
        item.date,
        item.revenue,
        item.tickets,
        item.bookings,
      ]),
    ];
    const csv = rows
      .map(row => row.map(cell => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${csv}`], {type: 'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `doanh-thu-${(movie?.title || 'phim').replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="movieRevenuePage">
      <header className="movieRevenueHeader">
        <div>
          <Link className="movieRevenueBack" to="/movies">
            <ArrowLeft size={16} /> Quay lại quản lý phim
          </Link>
          <h2>Thống kê doanh thu theo phim</h2>
          <p>{movie?.title || 'Đang tải thông tin phim...'}</p>
        </div>
        <div className="movieRevenueToolbar">
          <label>
            Từ ngày
            <input type="date" value={from} onChange={event => setFrom(event.target.value)} />
          </label>
          <label>
            Đến ngày
            <input type="date" value={to} onChange={event => setTo(event.target.value)} />
          </label>
          <button type="button" className="movieBtnGhost" onClick={() => loadData(from, to)}>
            <CalendarDays size={15} /> Áp dụng
          </button>
          <button type="button" className="movieBtnPrimary" onClick={exportCsv} disabled={!data}>
            <Download size={15} /> Xuất báo cáo
          </button>
        </div>
      </header>

      {error ? <p className="movieError">{error}</p> : null}
      {loading ? <p className="movieRevenueEmpty">Đang tải thống kê doanh thu...</p> : null}

      {!loading && movie ? (
        <>
          <article className="movieRevenueHero">
            {movie.posterUrl ? (
              <img src={movie.posterUrl} alt={movie.title} />
            ) : (
              <div className="moviePosterFallback large">FG</div>
            )}
            <div className="movieRevenueHeroMain">
              <h3>{movie.title}</h3>
              <div className="movieDetailBadges">
                {movie.ageRating ? (
                  <span className="movieAgeBadge movieAgeBadge--warning">{movie.ageRating}</span>
                ) : null}
                <span className="movieBadge movieBadge--muted">{formatGenre(movie.genre)}</span>
                <span className="movieBadge movieBadge--success">{statusLabel(movie.status)}</span>
              </div>
              <div className="movieRevenueMeta">
                <span>Thời lượng: {formatDuration(movie.duration)}</span>
                <span>Khởi chiếu: {formatDate(movie.releaseDate) || '—'}</span>
                <span>Đạo diễn: {movie.director || '—'}</span>
              </div>
              <p>{movie.synopsis || 'Chưa có mô tả phim.'}</p>
            </div>
            <div className="movieRevenueRating">
              <strong>
                <Star size={18} /> {Number(movie.rating || 0).toFixed(1)}/10
              </strong>
              <span>{movie.ratingCount || 0} lượt đánh giá</span>
            </div>
          </article>

          <div className="movieRevenueKpiGrid">
            {kpis.map(item => {
              const Icon = item.icon;
              return (
                <article key={item.label} className={`movieRevenueKpi movieRevenueKpi--${item.tone}`}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </article>
              );
            })}
          </div>

          <div className="movieRevenueGrid">
            <article className="panel movieRevenuePanel movieRevenuePanel--wide">
              <DailyRevenueChart items={data.revenueByDay || []} />
            </article>

            <article className="panel movieRevenuePanel">
              <h3>Doanh thu theo suất chiếu</h3>
              {(data.revenueByShowtime || []).length === 0 ? (
                <p className="movieRevenueEmpty">Chưa có suất có doanh thu.</p>
              ) : (
                <DataBars
                  items={(data.revenueByShowtime || []).slice(0, 8).map(item => ({
                    label: `${item.label}${item.percent ? ` (${item.percent}%)` : ''}`,
                    revenue: item.revenue,
                  }))}
                  labelKey="label"
                  valueKey="revenue"
                  formatValue={formatVnd}
                />
              )}
            </article>

            <article className="panel movieRevenuePanel">
              <h3>Doanh thu theo phòng</h3>
              <div className="movieRevenueTableWrap">
                <table className="movieRevenueTable">
                  <thead>
                    <tr>
                      <th>Phòng</th>
                      <th>Doanh thu</th>
                      <th>Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.revenueByRoom || []).length === 0 ? (
                      <tr>
                        <td colSpan={3}>Chưa có dữ liệu.</td>
                      </tr>
                    ) : (
                      data.revenueByRoom.map(item => (
                        <tr key={item.room}>
                          <td>{item.room}</td>
                          <td>{formatVnd(item.revenue)}</td>
                          <td>{item.percent}%</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel movieRevenuePanel">
              <h3>Top khung giờ đông khách</h3>
              <div className="movieRevenueTableWrap">
                <table className="movieRevenueTable">
                  <thead>
                    <tr>
                      <th>Khung giờ</th>
                      <th>Lấp đầy</th>
                      <th>Số suất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.topHourSlots || []).length === 0 ? (
                      <tr>
                        <td colSpan={3}>Chưa có dữ liệu.</td>
                      </tr>
                    ) : (
                      data.topHourSlots.map(item => (
                        <tr key={item.label}>
                          <td>{item.label}</td>
                          <td>{item.occupancy}%</td>
                          <td>{item.showtimes}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </article>

            <article className="panel movieRevenuePanel">
              <h3>Ghế bán chạy theo hàng</h3>
              <DataBars
                items={(data.seatRows || []).map(item => ({
                  label: `${item.label} (${item.percent}%)`,
                  tickets: item.tickets,
                }))}
                labelKey="label"
                valueKey="tickets"
              />
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}

export default MovieRevenue;

import {useEffect, useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import dashboardApi from '../../api/dashboardApi';

const money = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;
const time = value =>
  value
    ? new Date(value).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—';

const countdown = value => {
  const minutes = Math.max(
    0,
    Math.round((new Date(value).getTime() - Date.now()) / 60000),
  );
  if (minutes < 60) return `${minutes} phút`;
  return `${Math.floor(minutes / 60)} giờ ${minutes % 60} phút`;
};

const buildChart = rows => {
  const values = rows.map(item => Number(item.revenue || 0));
  const max = Math.max(...values, 1);
  const step = rows.length > 1 ? 700 / (rows.length - 1) : 0;
  const points = rows.map((item, index) => ({
    x: 40 + step * index,
    y: 195 - (Number(item.revenue || 0) / max) * 164,
    ...item,
  }));
  return {
    max,
    points,
    polyline: points.map(point => `${point.x},${point.y}`).join(' '),
    area: points.length
      ? `M${points[0].x} 195 L${points
          .map(point => `${point.x} ${point.y}`)
          .join(' L')} L${points[points.length - 1].x} 195 Z`
      : '',
  };
};

function SectionHeader({title, to}) {
  return (
    <div className="overviewSectionHeader">
      <h3>{title}</h3>
      {to ? <Link to={to}>Xem tất cả</Link> : null}
    </div>
  );
}

function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const today = new Date().toLocaleDateString('vi-VN');
  const admin = (() => {
    try {
      return JSON.parse(localStorage.getItem('filmgo_admin_user') || '{}');
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    dashboardApi
      .getOverview()
      .then(response => setOverview(response?.data || response))
      .catch(err => setError(err.message || 'Không tải được dữ liệu tổng quan.'))
      .finally(() => setLoading(false));
  }, []);

  const chart = useMemo(
    () => buildChart(overview?.revenueByDay || []),
    [overview?.revenueByDay],
  );

  if (loading) {
    return (
      <section className="overviewState">
        <span className="overviewSpinner" />
        <p>Đang tổng hợp dữ liệu User và Admin...</p>
      </section>
    );
  }

  if (error || !overview) {
    return (
      <section className="overviewState">
        <h2>Không tải được Tổng quan</h2>
        <p>{error || 'Backend chưa trả về dữ liệu.'}</p>
        <button type="button" onClick={() => window.location.reload()}>
          Tải lại
        </button>
      </section>
    );
  }

  const metricConfig = [
    {key: 'revenue', label: 'Doanh thu hôm nay', icon: '$', tone: 'green', format: money},
    {key: 'tickets', label: 'Vé đã bán', icon: '▣', tone: 'purple', format: value => value},
    {key: 'showtimes', label: 'Suất chiếu hôm nay', icon: '▦', tone: 'blue', format: value => value},
    {key: 'movies', label: 'Phim đang chiếu', icon: '●', tone: 'orange', format: value => value},
    {key: 'users', label: 'Người dùng mới', icon: '◎', tone: 'cyan', format: value => value},
  ];
  const metrics = metricConfig.map(item => {
    const metric = overview.metrics?.[item.key] || {value: 0, change: 0};
    const isShowtime = item.key === 'showtimes';
    const noComparison = metric.change === null;
    return {
      ...item,
      value: item.format(metric.value),
      direction: Number(metric.change || 0) < 0 ? 'down' : 'up',
      changeText: noComparison
        ? 'Đang hoạt động trên hệ thống'
        : isShowtime
          ? `${Number(metric.change) >= 0 ? '+' : ''}${metric.change} suất so với hôm qua`
          : `${Math.abs(Number(metric.change || 0))}% so với hôm qua`,
    };
  });
  const playingMovies = overview.playingShowtimes || [];
  const upcomingMovies = overview.upcomingShowtimes || [];
  const topMovies = overview.topMovies || [];
  const combos = overview.topCombos || [];
  const rooms = overview.occupancy?.rooms || [];
  const recentOrders = overview.recentOrders || [];
  const activity = overview.activities || [];
  const notifications = overview.notifications || [];
  const schedule = overview.todaySchedule || [];
  const distribution = overview.occupancy?.distribution || [];
  const averageOccupancy = Number(overview.occupancy?.average || 0);
  const donutStops = distribution.reduce(
    (result, item, index) => {
      const start = result.total;
      const end = start + Number(item.percentage || 0);
      result.parts.push(
        `var(--overview-${item.tone}) ${start}% ${index === distribution.length - 1 ? 100 : end}%`,
      );
      result.total = end;
      return result;
    },
    {parts: [], total: 0},
  );
  const maxMovieRevenue = Math.max(
    ...topMovies.map(item => Number(item.revenue || 0)),
    1,
  );

  return (
    <section className="overviewPage">
      <div className="overviewTopbar">
        <div>
          <div className="overviewTitleLine">
            <h2>Tổng quan</h2>
            <span>Chào mừng trở lại, {admin.fullName || 'Admin'}</span>
            <b className="live">DỮ LIỆU TRỰC TIẾP</b>
          </div>
          <p>Theo dõi nhanh hoạt động vận hành rạp FilmGo</p>
        </div>
        <div className="overviewTopActions">
          <button type="button">▦ {today}⌄</button>
          <button className="overviewIconButton" type="button" aria-label="Thông báo">♢<i>3</i></button>
          <button className="overviewIconButton" type="button" aria-label="Giao diện tối">◐</button>
          <span className="overviewAdmin">
            <strong>{String(admin.fullName || 'A').charAt(0).toUpperCase()}</strong>
            {admin.fullName || 'Admin'}⌄
          </span>
        </div>
      </div>

      <div className="overviewMetrics">
        {metrics.map(item => (
          <article className="overviewMetric" key={item.label}>
            <span className={`overviewMetricIcon ${item.tone}`}>{item.icon}</span>
            <div>
              <p>{item.label}</p>
              <strong>{item.value}</strong>
              <small className={item.direction}>
                {item.direction === 'down' ? '↓' : '↑'} {item.changeText}
              </small>
            </div>
          </article>
        ))}
      </div>

      <div className="overviewCharts">
        <article className="overviewPanel overviewRevenue">
          <div className="overviewSectionHeader">
            <div><h3>Doanh thu 30 ngày qua</h3><small><i /> Doanh thu (triệu đồng)</small></div>
            <button type="button">30 ngày⌄</button>
          </div>
          <svg className="overviewLineChart" viewBox="0 0 760 225" role="img" aria-label="Biểu đồ doanh thu thật 30 ngày">
            {[35, 75, 115, 155, 195].map(y => <line key={y} x1="38" y1={y} x2="742" y2={y} />)}
            <text x="2" y="40">{Math.round(chart.max / 1000000)}tr</text>
            <text x="2" y="80">{Math.round(chart.max * .75 / 1000000)}tr</text>
            <text x="2" y="120">{Math.round(chart.max * .5 / 1000000)}tr</text>
            <text x="2" y="160">{Math.round(chart.max * .25 / 1000000)}tr</text>
            <text x="14" y="200">0</text>
            {chart.area ? <path className="overviewArea" d={chart.area} /> : null}
            <polyline points={chart.polyline} />
            {chart.points.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="3.5" />)}
            {chart.points.filter((_, index) => index % 7 === 0 || index === chart.points.length - 1).map(point => (
              <text key={`label-${point.date}`} x={point.x} y="218" textAnchor="middle">{point.label}</text>
            ))}
          </svg>
        </article>
        <article className="overviewPanel overviewOccupancy">
          <SectionHeader title="Tỷ lệ lấp đầy ghế (Trung bình)" />
          <div className="overviewDonutWrap">
            <div
              className="overviewDonut"
              style={{background: donutStops.parts.length ? `conic-gradient(${donutStops.parts.join(', ')})` : undefined}}>
              <span><strong>{averageOccupancy}%</strong>Trung bình</span>
            </div>
            <div className="overviewLegend">
              {distribution.map(item => (
                <p key={item.label}>
                  <i className={item.tone} />
                  {item.label}
                  <span>{item.count} phòng ({item.percentage}%)</span>
                </p>
              ))}
            </div>
          </div>
        </article>
      </div>

      <div className="overviewShowtimes">
        <article className="overviewPanel">
          <SectionHeader title="Suất đang chiếu" to="/showtimes" />
          <div className="overviewPlayingList">
            {playingMovies.map(movie => (
              <div className="overviewMovieCard" key={movie.id}>
                {movie.poster ? <img src={movie.poster} alt="" /> : <div className="overviewPosterFallback">FG</div>}
                <div>
                  <span>Đang chiếu</span>
                  <h4>{movie.movieTitle}</h4>
                  <p>{movie.room}</p>
                  <p>{time(movie.startTime)} - {time(movie.endTime)}</p>
                  <small>{movie.soldSeats} / {movie.totalSeats} ghế</small>
                  <div><i style={{width: `${movie.occupancyRate}%`}} /></div>
                </div>
              </div>
            ))}
            {!playingMovies.length ? <p className="overviewEmpty">Hiện không có suất đang chiếu.</p> : null}
          </div>
        </article>
        <article className="overviewPanel">
          <SectionHeader title="Suất sắp chiếu" to="/showtimes" />
          <div className="overviewUpcomingGrid">
            {upcomingMovies.map(movie => (
              <div className="overviewUpcoming" key={movie.id}>
                {movie.poster ? <img src={movie.poster} alt="" /> : <div className="overviewPosterFallback small">FG</div>}
                <div>
                  <h4>{movie.movieTitle}</h4>
                  <p>{time(movie.startTime)} · {movie.room}</p>
                  <small>{movie.soldSeats} / {movie.totalSeats} ghế</small>
                </div>
                <b>{countdown(movie.startTime)}</b>
              </div>
            ))}
            {!upcomingMovies.length ? <p className="overviewEmpty">Hôm nay không còn suất sắp chiếu.</p> : null}
          </div>
        </article>
      </div>

      <div className="overviewDetails">
        <article className="overviewPanel">
          <SectionHeader title="Top phim doanh thu" to="/reports/revenue" />
          <div className="overviewRankList">
            {topMovies.map((movie, index) => (
              <div key={movie.title}>
                <b>{index + 1}</b><span>{movie.title}</span>
                <i><em style={{width: `${(Number(movie.revenue || 0) / maxMovieRevenue) * 100}%`}} /></i>
                <strong>{money(movie.revenue)}</strong>
              </div>
            ))}
            {!topMovies.length ? <p className="overviewEmpty">Chưa có doanh thu trong 30 ngày.</p> : null}
          </div>
        </article>
        <article className="overviewPanel">
          <SectionHeader title="Combo bán chạy" to="/products" />
          <div className="overviewSimpleList">
            {combos.map((combo, index) => <p key={combo.name}><b>{index + 1}</b><span>{combo.name}</span><strong>{combo.quantity}</strong></p>)}
            {!combos.length ? <p className="overviewEmpty">Chưa có combo được mua.</p> : null}
          </div>
        </article>
        <article className="overviewPanel">
          <SectionHeader title="Lấp đầy phòng chiếu" to="/rooms" />
          <div className="overviewRoomList">
            {rooms.map(room => <p key={room.name}><span>{room.name}</span><i><em style={{width: `${room.occupancyRate}%`}} /></i><strong>{room.occupancyRate}%</strong></p>)}
            {!rooms.length ? <p className="overviewEmpty">Hôm nay chưa có dữ liệu phòng.</p> : null}
          </div>
        </article>
        <article className="overviewPanel">
          <SectionHeader title="Đơn đặt vé mới" to="/bookings" />
          <div className="overviewOrderList">
            {recentOrders.map(order => <p key={order.id}><time>{time(order.createdAt)}</time><span>{order.customer}</span><b>{order.movieTitle}</b><strong>{order.ticketCount} vé</strong></p>)}
            {!recentOrders.length ? <p className="overviewEmpty">Chưa có đơn đặt vé.</p> : null}
          </div>
        </article>
      </div>

      <div className="overviewBottom">
        <article className="overviewPanel">
          <SectionHeader title="Hoạt động gần đây" />
          <div className="overviewActivity">
            {activity.map(item => <p key={item.id}><time>{time(item.createdAt)}</time><i /><span>{item.text}</span></p>)}
            {!activity.length ? <p className="overviewEmpty">Chưa có hoạt động mới.</p> : null}
          </div>
        </article>
        <article className="overviewPanel">
          <SectionHeader title="Thông báo" to="/notifications" />
          <div className="overviewNotices">
            {notifications.map(item => (
              <p key={item.id}>
                <i className={
                  item.type === 'thanh_toan'
                    ? 'warning'
                    : item.type === 'dat_ve'
                      ? 'success'
                      : 'info'
                }>
                  {item.type === 'dat_ve' ? '✓' : 'i'}
                </i>
                {item.title || item.content}
              </p>
            ))}
            {!notifications.length ? <p className="overviewEmpty">Chưa có thông báo.</p> : null}
          </div>
        </article>
        <article className="overviewPanel">
          <SectionHeader title="Lịch chiếu hôm nay" to="/showtimes" />
          <div className="overviewSchedule">
            {schedule.slice(0, 6).map(item => (
              <p key={item.id}>
                <time>{time(item.startTime)}</time><i />
                {item.movieTitle} – {item.room}
              </p>
            ))}
            {!schedule.length ? <p className="overviewEmpty">Hôm nay chưa có lịch chiếu.</p> : null}
          </div>
        </article>
      </div>
    </section>
  );
}

export default Dashboard;

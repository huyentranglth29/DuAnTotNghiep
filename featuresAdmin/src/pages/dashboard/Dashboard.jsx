import {useEffect, useState} from 'react';
import dashboardApi from '../../api/dashboardApi';
import {DataBars, PageTitle} from '../../components/AdminUi';
import {formatVnd} from '../../utils/adminFormatters';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState({
    revenueByDay: [],
    topMovies: [],
    occupancy: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRevenueByDay(),
      dashboardApi.getTopMovies(),
      dashboardApi.getSeatOccupancy(),
    ])
      .then(([statsResponse, revenueResponse, topMoviesResponse, occupancyResponse]) => {
        setStats(statsResponse.data || statsResponse);
        setReports({
          revenueByDay: revenueResponse.data || [],
          topMovies: topMoviesResponse.data || [],
          occupancy: occupancyResponse.data || [],
        });
      })
      .catch(err => setError(err.message || 'Không tải được dashboard.'));
  }, []);

  const metrics = [
    ['Tổng doanh thu', formatVnd(stats?.totalRevenue), 'Từ booking/ticket đã thanh toán'],
    ['Người dùng', stats?.totalUsers ?? 0, 'Tài khoản trong hệ thống'],
    ['Phim', stats?.totalMovies ?? 0, 'Tổng số phim'],
    ['Suất chiếu', stats?.totalShowtimes ?? 0, 'Tổng lịch chiếu'],
    ['Vé', stats?.totalTickets ?? 0, 'Tổng vé'],
    ['Đơn đặt vé', stats?.totalBookings ?? 0, 'Tổng booking'],
    ['Phòng chiếu', stats?.totalRooms ?? 0, 'Tổng phòng'],
    ['Sản phẩm', stats?.totalProducts ?? 0, 'Combo/bắp nước'],
  ];

  return (
    <section>
      <PageTitle title="Tổng quan" />
      {error && <p className="loginError">{error}</p>}
      <div className="metricGrid">
        {metrics.map(item => (
          <article className="metricCard" key={item[0]}>
            <span>{item[0]}</span>
            <strong>{item[1]}</strong>
            <small>{item[2]}</small>
          </article>
        ))}
      </div>
      <div className="dashboardGrid">
        <article className="panel wide">
          <h3>Doanh thu theo ngày</h3>
          <DataBars
            items={reports.revenueByDay}
            labelKey="date"
            valueKey="revenue"
            formatValue={formatVnd}
          />
        </article>
        <article className="panel">
          <h3>Top phim</h3>
          <DataBars
            items={reports.topMovies.map(item => ({...item, label: item.title}))}
            labelKey="label"
            valueKey="revenue"
            formatValue={formatVnd}
          />
        </article>
        <article className="panel">
          <h3>Tỷ lệ lấp đầy ghế</h3>
          <DataBars
            items={reports.occupancy.map(item => ({...item, label: item.room}))}
            labelKey="label"
            valueKey="occupancyRate"
            formatValue={value => `${value}%`}
          />
        </article>
        <article className="panel">
          <h3>Người dùng mới</h3>
          {(stats?.recentUsers || []).map(user => (
            <p key={user._id}>{user.fullName || user.email}</p>
          ))}
        </article>
        <article className="panel">
          <h3>Phim mới</h3>
          {(stats?.recentMovies || []).map(movie => (
            <p key={movie._id}>{movie.title}</p>
          ))}
        </article>
      </div>
    </section>
  );
}

export default Dashboard;

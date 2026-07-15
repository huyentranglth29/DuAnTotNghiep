import {useEffect, useMemo, useState} from 'react';
import dashboardApi from '../../api/dashboardApi';
import {DataBars, PageTitle} from '../../components/AdminUi';
import {formatVnd} from '../../utils/adminFormatters';

function RevenueReport() {
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState({
    revenueByDay: [],
    revenueByMovie: [],
    revenueByRoom: [],
    ticketsByDay: [],
    occupancy: [],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      dashboardApi.getStats(),
      dashboardApi.getRevenueByDay(),
      dashboardApi.getRevenueByMovie(),
      dashboardApi.getRevenueByRoom(),
      dashboardApi.getTicketsByDay(),
      dashboardApi.getSeatOccupancy(),
    ])
      .then(([
        statsResponse,
        revenueByDayResponse,
        revenueByMovieResponse,
        revenueByRoomResponse,
        ticketsByDayResponse,
        occupancyResponse,
      ]) => {
        setStats(statsResponse.data || statsResponse);
        setReports({
          revenueByDay: revenueByDayResponse.data || [],
          revenueByMovie: revenueByMovieResponse.data || [],
          revenueByRoom: revenueByRoomResponse.data || [],
          ticketsByDay: ticketsByDayResponse.data || [],
          occupancy: occupancyResponse.data || [],
        });
      })
      .catch(err => setError(err.message || 'Không tải được báo cáo.'));
  }, []);

  const averageOrder = stats?.totalBookings
    ? Math.round((stats.totalRevenue || 0) / stats.totalBookings)
    : 0;

  const ticketTotal = useMemo(
    () => reports.ticketsByDay.reduce((total, item) => total + Number(item.tickets || 0), 0),
    [reports.ticketsByDay],
  );

  return (
    <section>
      <PageTitle title="Thống kê doanh thu" />
      {error && <p className="loginError">{error}</p>}
      <div className="metricGrid">
        <article className="metricCard"><span>Doanh thu</span><strong>{formatVnd(stats?.totalRevenue)}</strong></article>
        <article className="metricCard"><span>Vé bán</span><strong>{ticketTotal || stats?.totalTickets || 0}</strong></article>
        <article className="metricCard"><span>Tổng đơn hàng</span><strong>{stats?.totalBookings || 0}</strong></article>
        <article className="metricCard"><span>Trung bình đơn</span><strong>{formatVnd(averageOrder)}</strong></article>
      </div>
      <div className="dashboardGrid">
        <article className="panel wide">
          <h3>Doanh thu theo ngày</h3>
          <DataBars items={reports.revenueByDay} labelKey="date" valueKey="revenue" formatValue={formatVnd} />
        </article>
        <article className="panel">
          <h3>Doanh thu theo phim</h3>
          <DataBars
            items={reports.revenueByMovie.map(item => ({...item, label: item.title}))}
            labelKey="label"
            valueKey="revenue"
            formatValue={formatVnd}
          />
        </article>
        <article className="panel">
          <h3>Doanh thu theo phòng</h3>
          <DataBars
            items={reports.revenueByRoom.map(item => ({...item, label: item.name}))}
            labelKey="label"
            valueKey="revenue"
            formatValue={formatVnd}
          />
        </article>
        <article className="panel">
          <h3>Vé bán theo ngày</h3>
          <DataBars items={reports.ticketsByDay} labelKey="date" valueKey="tickets" />
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
      </div>
    </section>
  );
}

export default RevenueReport;

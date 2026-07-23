import {useEffect, useMemo, useState} from 'react';
import {BarChart3, ReceiptText, Ticket, WalletCards} from 'lucide-react';
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

  const metrics = [
    {
      label: 'Doanh thu',
      value: formatVnd(stats?.totalRevenue),
      icon: WalletCards,
      tone: 'green',
      hint: 'Tổng tiền đã thanh toán',
    },
    {
      label: 'Vé bán',
      value: ticketTotal || stats?.totalTickets || 0,
      icon: Ticket,
      tone: 'blue',
      hint: 'Từ đơn thường và đặt nhanh',
    },
    {
      label: 'Tổng đơn hàng',
      value: stats?.totalBookings || 0,
      icon: ReceiptText,
      tone: 'orange',
      hint: 'Đơn đã ghi nhận',
    },
    {
      label: 'Trung bình đơn',
      value: formatVnd(averageOrder),
      icon: BarChart3,
      tone: 'violet',
      hint: 'Doanh thu chia tổng đơn',
    },
  ];

  return (
    <section className="reportPage">
      <div className="reportHero">
        <PageTitle title="Thống kê doanh thu" />
        <p>Theo dõi doanh thu, số vé và tỷ lệ lấp đầy từ dữ liệu đặt vé thật trong hệ thống.</p>
      </div>
      {error && <p className="reportError">{error}</p>}
      <div className="metricGrid reportMetricGrid">
        {metrics.map(item => {
          const Icon = item.icon;
          return (
            <article className={`metricCard reportMetric ${item.tone}`} key={item.label}>
              <span className="metricIcon"><Icon size={18} strokeWidth={2.2} /></span>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </article>
          );
        })}
      </div>
      <div className="dashboardGrid reportGrid">
        <article className="panel reportPanel wide">
          <h3>Doanh thu theo ngày</h3>
          <DataBars items={reports.revenueByDay} labelKey="date" valueKey="revenue" formatValue={formatVnd} />
        </article>
        <article className="panel reportPanel">
          <h3>Doanh thu theo phim</h3>
          <DataBars
            items={reports.revenueByMovie.map(item => ({...item, label: item.title}))}
            labelKey="label"
            valueKey="revenue"
            formatValue={formatVnd}
          />
        </article>
        <article className="panel reportPanel">
          <h3>Doanh thu theo phòng</h3>
          <DataBars
            items={reports.revenueByRoom.map(item => ({...item, label: item.name}))}
            labelKey="label"
            valueKey="revenue"
            formatValue={formatVnd}
          />
        </article>
        <article className="panel reportPanel">
          <h3>Vé bán theo ngày</h3>
          <DataBars items={reports.ticketsByDay} labelKey="date" valueKey="tickets" />
        </article>
        <article className="panel reportPanel">
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

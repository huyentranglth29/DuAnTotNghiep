import {MiniChart, PageTitle} from '../../components/AdminMock';

function Dashboard() {
  return (
    <section>
      <PageTitle title="Tổng quan" />
      <div className="metricGrid">
        {[
          ['Tổng doanh thu', '120.000.000', '+12.5% so với hôm qua'],
          ['Vé đã bán', '4.250', '+8.2% so với hôm qua'],
          ['Checkin hôm nay', '1.230', '+5.5% so với hôm qua'],
          ['Phim đang chiếu', '12', '+2 phim mới'],
        ].map(item => (
          <article className="metricCard" key={item[0]}>
            <span>{item[0]}</span>
            <strong>{item[1]}</strong>
            <small>{item[2]}</small>
          </article>
        ))}
      </div>
      <div className="dashboardGrid">
        <article className="panel wide">
          <h3>Doanh thu 7 ngày qua</h3>
          <MiniChart />
        </article>
        <article className="panel">
          <h3>Doanh thu theo phim</h3>
          <div className="barList">
            {['Avatar', 'Avengers', 'Superman', 'Mission Impossible', 'Fast & Furious'].map((name, index) => (
              <p key={name}><span style={{width: `${90 - index * 13}%`}} />{name}</p>
            ))}
          </div>
        </article>
        <article className="panel">
          <h3>Tỷ lệ lấp đầy ghế</h3>
          <div className="donut">65%</div>
        </article>
        <article className="panel">
          <h3>Doanh thu theo phòng</h3>
          <MiniChart type="bars" />
        </article>
        <article className="panel">
          <h3>Suất chiếu hôm nay</h3>
          <MiniChart type="area" />
        </article>
      </div>
    </section>
  );
}

export default Dashboard;

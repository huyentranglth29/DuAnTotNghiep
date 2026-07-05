import {MiniChart, PageTitle} from '../../components/AdminMock';

function RevenueReport() {
  return (
    <section>
      <PageTitle title="Thống kê doanh thu" />
      <div className="filterRow">
        <label>Khoảng thời gian<input defaultValue="16/05/2024 - 16/06/2024" /></label>
        <label>Theo phim<select><option>Tất cả</option></select></label>
        <button type="button">Xem</button>
      </div>
      <div className="metricGrid">
        <article className="metricCard"><span>Doanh thu</span><strong>120.000.000 đ</strong></article>
        <article className="metricCard"><span>Vé bán</span><strong>4.250</strong></article>
        <article className="metricCard"><span>Tổng đơn hàng</span><strong>2.150</strong></article>
        <article className="metricCard"><span>Trung bình đơn</span><strong>220.000 đ</strong></article>
      </div>
      <div className="dashboardGrid">
        <article className="panel wide"><h3>Doanh thu theo ngày</h3><MiniChart /></article>
        <article className="panel"><h3>Doanh thu theo phim</h3><div className="pie" /></article>
        <article className="panel"><h3>Doanh thu theo phòng</h3><MiniChart type="bars" /></article>
      </div>
    </section>
  );
}

export default RevenueReport;

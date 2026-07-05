import {Link} from 'react-router-dom';
import {DataTable, showtimes} from '../../components/AdminMock';

function ShowtimeList() {
  return (
    <section>
      <div className="pageTitle">
        <h2>Quản lý suất chiếu</h2>
        <Link to="/showtimes/create">Thêm suất chiếu</Link>
      </div>
      <DataTable
        headers={['Phim', 'Phòng', 'Ngày chiếu', 'Giờ', 'Giá vé', 'Trạng thái']}
        rows={showtimes}
      />
    </section>
  );
}

export default ShowtimeList;

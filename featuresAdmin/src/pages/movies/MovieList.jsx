import {Link} from 'react-router-dom';
import {DataTable, movies, SearchBar} from '../../components/AdminMock';

function MovieList() {
  return (
    <section>
      <div className="pageTitle">
        <h2>Quản lý phim</h2>
        <Link to="/movies/add">Thêm phim</Link>
      </div>
      <SearchBar placeholder="Tìm kiếm phim..." />
      <DataTable
        headers={['Tên phim', 'Thể loại', 'Thời lượng', 'Ngày khởi chiếu', 'Trạng thái']}
        rows={movies}
      />
    </section>
  );
}

export default MovieList;

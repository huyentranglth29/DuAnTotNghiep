import movieApi from '../../api/movieApi';
import AdminListPage from '../../components/AdminListPage';
import {formatDate} from '../../utils/adminFormatters';

function MovieList() {
  return (
    <AdminListPage
      title="Quản lý phim"
      api={movieApi}
      addLabel="Thêm phim"
      searchPlaceholder="Tìm kiếm phim..."
      fields={[
        {name: 'title', label: 'Tên phim', required: true},
        {name: 'genre', label: 'Thể loại (phân tách bằng dấu phẩy)', array: true},
        {name: 'duration', label: 'Thời lượng phút', type: 'number', required: true},
        {name: 'releaseDate', label: 'Ngày khởi chiếu', type: 'date'},
        {name: 'director', label: 'Đạo diễn'},
        {name: 'cast', label: 'Diễn viên (phân tách bằng dấu phẩy)', array: true},
        {name: 'synopsis', label: 'Mô tả', type: 'textarea'},
        {name: 'posterUrl', label: 'Poster URL'},
        {name: 'backdropUrl', label: 'Backdrop URL'},
        {name: 'price', label: 'Giá vé', type: 'number'},
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'coming_soon',
          options: [
            {value: 'coming_soon', label: 'Sắp chiếu'},
            {value: 'now_showing', label: 'Đang chiếu'},
            {value: 'featured', label: 'Nổi bật'},
            {value: 'ended', label: 'Đã kết thúc'},
          ],
        },
        {name: 'ageRating', label: 'Độ tuổi'},
      ]}
      columns={[
        {key: 'title', title: 'Tên phim'},
        {
          key: 'genre',
          title: 'Thể loại',
          render: item => Array.isArray(item.genre) ? item.genre.join(', ') : item.genre,
        },
        {key: 'duration', title: 'Thời lượng'},
        {key: 'releaseDate', title: 'Ngày khởi chiếu', render: item => formatDate(item.releaseDate)},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default MovieList;

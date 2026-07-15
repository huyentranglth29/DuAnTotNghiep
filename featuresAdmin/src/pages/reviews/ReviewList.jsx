import movieApi from '../../api/movieApi';
import reviewApi from '../../api/reviewApi';
import userApi from '../../api/userApi';
import AdminListPage from '../../components/AdminListPage';
import useAdminOptions from '../../hooks/useAdminOptions';

function ReviewList() {
  const fieldOptions = useAdminOptions({
    movie: {api: movieApi, label: movie => movie.title},
    user: {api: userApi, label: user => `${user.fullName || user.email} (${user.email})`},
  });

  return (
    <AdminListPage
      title="Quản lý đánh giá phim"
      api={reviewApi}
      searchPlaceholder="Tìm kiếm đánh giá..."
      fields={[
        {name: 'movie', label: 'Phim', type: 'select', ref: true},
        {name: 'user', label: 'Người dùng', type: 'select', ref: true},
        {name: 'rating', label: 'Số sao', type: 'number'},
        {name: 'comment', label: 'Nội dung', type: 'textarea'},
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'pending',
          options: [
            {value: 'pending', label: 'Chờ duyệt'},
            {value: 'approved', label: 'Đã duyệt'},
            {value: 'rejected', label: 'Từ chối'},
          ],
        },
      ]}
      fieldOptions={fieldOptions}
      columns={[
        {key: 'user', title: 'Khách hàng', render: item => item.user?.fullName || item.user?.email || ''},
        {key: 'movie', title: 'Phim', render: item => item.movie?.title || ''},
        {key: 'rating', title: 'Số sao'},
        {key: 'comment', title: 'Nội dung'},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default ReviewList;

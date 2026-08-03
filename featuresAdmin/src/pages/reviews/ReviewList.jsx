import reviewApi from '../../api/reviewApi';
import AdminListPage from '../../components/AdminListPage';

const STATUS_META = {
  pending: {label: 'Chờ duyệt', tone: 'pending'},
  approved: {label: 'Đã duyệt', tone: 'approved'},
  rejected: {label: 'Đã từ chối', tone: 'rejected'},
};

function MissingReference({children}) {
  return <span className="reviewMissingReference">{children}</span>;
}

function ReviewList() {
  return (
    <AdminListPage
      title="Quản lý đánh giá phim"
      api={reviewApi}
      hideCreate
      searchPlaceholder="Tìm theo nội dung hoặc trạng thái..."
      fields={[
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
      columns={[
        {
          key: 'user',
          title: 'Khách hàng',
          render: item => item.user ? (
            <div className="reviewPerson">
              <span className="reviewAvatar">
                {(item.user.fullName || item.user.email || '?').charAt(0).toUpperCase()}
              </span>
              <span>
                <strong>{item.user.fullName || 'Chưa cập nhật tên'}</strong>
                {item.user.email && <small>{item.user.email}</small>}
              </span>
            </div>
          ) : <MissingReference>Tài khoản không còn tồn tại</MissingReference>,
        },
        {
          key: 'movie',
          title: 'Phim',
          render: item => item.movie?.title || (
            <MissingReference>Phim không còn tồn tại</MissingReference>
          ),
        },
        {
          key: 'rating',
          title: 'Đánh giá',
          render: item => {
            const rating = Math.round(Math.max(0, Math.min(5, Number(item.rating) || 0)));
            return (
              <div className="reviewRating" aria-label={`${rating} trên 5 sao`}>
                <span>{'★'.repeat(rating)}{'☆'.repeat(5 - rating)}</span>
                <strong>{rating}/5</strong>
              </div>
            );
          },
        },
        {
          key: 'comment',
          title: 'Nội dung',
          render: item => <span className="reviewComment">{item.comment || 'Không có nội dung'}</span>,
        },
        {
          key: 'status',
          title: 'Trạng thái',
          render: item => {
            const meta = STATUS_META[item.status] || {label: item.status || 'Không rõ', tone: 'unknown'};
            return <span className={`reviewStatus reviewStatus--${meta.tone}`}>{meta.label}</span>;
          },
        },
      ]}
    />
  );
}

export default ReviewList;

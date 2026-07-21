import newsEventApi from '../../api/newsEventApi';
import AdminListPage from '../../components/AdminListPage';
import {formatDateTime} from '../../utils/adminFormatters';

const categoryLabels = {
  tin_tuc: 'Tin tức',
  su_kien: 'Sự kiện',
  khuyen_mai: 'Khuyến mãi',
};

function NewsEventList() {
  return (
    <AdminListPage
      title="Quản lý Tin tức & Sự kiện"
      api={newsEventApi}
      addLabel="+ Tạo bài viết"
      searchPlaceholder="Tìm theo tiêu đề hoặc nội dung..."
      fields={[
        {name: 'title', label: 'Tiêu đề', required: true},
        {name: 'summary', label: 'Mô tả ngắn', type: 'textarea'},
        {name: 'content', label: 'Nội dung chi tiết', type: 'textarea', required: true},
        {name: 'image', label: 'Đường dẫn hình ảnh'},
        {
          name: 'category', label: 'Loại bài', type: 'select', defaultValue: 'tin_tuc',
          options: [
            {value: 'tin_tuc', label: 'Tin tức'},
            {value: 'su_kien', label: 'Sự kiện'},
            {value: 'khuyen_mai', label: 'Khuyến mãi'},
          ],
        },
        {
          name: 'status', label: 'Trạng thái', type: 'select', defaultValue: 'nhap',
          options: [
            {value: 'nhap', label: 'Bản nháp'},
            {value: 'da_dang', label: 'Đã đăng'},
          ],
        },
        {name: 'publishDate', label: 'Ngày xuất bản', type: 'datetime-local'},
        {
          name: 'isFeatured', label: 'Bài nổi bật', type: 'select', defaultValue: 'false',
          options: [
            {value: 'false', label: 'Không'},
            {value: 'true', label: 'Có'},
          ],
        },
      ]}
      normalizeSubmit={payload => ({
        ...payload,
        isFeatured: payload.isFeatured === true || payload.isFeatured === 'true',
        publishDate: payload.publishDate || new Date().toISOString(),
      })}
      columns={[
        {key: 'title', title: 'Tiêu đề'},
        {key: 'category', title: 'Loại', render: item => categoryLabels[item.category] || item.category},
        {key: 'status', title: 'Trạng thái', render: item => item.status === 'da_dang' ? 'Đã đăng' : 'Bản nháp'},
        {key: 'isFeatured', title: 'Nổi bật', render: item => item.isFeatured ? 'Có' : 'Không'},
        {key: 'publishDate', title: 'Ngày xuất bản', render: item => formatDateTime(item.publishDate)},
      ]}
    />
  );
}

export default NewsEventList;

import notificationApi from '../../api/notificationApi';
import AdminListPage from '../../components/AdminListPage';
import {formatDateTime} from '../../utils/adminFormatters';

function NotificationList() {
  return (
    <AdminListPage
      title="Quản lý thông báo"
      api={notificationApi}
      addTo="/notifications/create"
      addLabel="+ Tạo thông báo"
      searchPlaceholder="Tìm kiếm thông báo..."
      fields={[
        {name: 'title', label: 'Tiêu đề', required: true},
        {name: 'content', label: 'Nội dung', type: 'textarea', required: true},
        {
          name: 'target',
          label: 'Đối tượng',
          type: 'select',
          defaultValue: 'all',
          options: [
            {value: 'all', label: 'Tất cả'},
            {value: 'vip', label: 'VIP'},
            {value: 'newUser', label: 'Người dùng mới'},
          ],
        },
        {name: 'image', label: 'Ảnh URL'},
        {name: 'sentAt', label: 'Ngày gửi', type: 'datetime-local'},
      ]}
      columns={[
        {key: 'title', title: 'Tiêu đề'},
        {key: 'target', title: 'Đối tượng'},
        {key: 'sentAt', title: 'Ngày gửi', render: item => formatDateTime(item.sentAt || item.createdAt)},
      ]}
    />
  );
}

export default NotificationList;

import notificationApi from '../../api/notificationApi';
import userApi from '../../api/userApi';
import AdminListPage from '../../components/AdminListPage';
import useAdminOptions from '../../hooks/useAdminOptions';
import {formatDateTime} from '../../utils/adminFormatters';

const formatRecipient = item => {
  if (item.recipientName) {
    return item.recipientName;
  }

  if (item.user) {
    if (typeof item.user === 'object') {
      const name = item.user.fullName || item.user.email || 'Không tìm thấy người nhận';
      return name;
    }

    return 'Không tìm thấy người nhận';
  }

  const labels = {
    all: 'Tất cả',
    vip: 'VIP',
    newUser: 'Người dùng mới',
  };

  return labels[item.target] || item.target || 'Tất cả người dùng đã bật thông báo';
};

function NotificationList() {
  const options = useAdminOptions({
    recipients: {
      api: userApi,
      params: {role: 'user', status: 'active', notificationEnabled: true},
      label: user => `${user.fullName || 'Người dùng'}${user.email ? ` (${user.email})` : ''}`,
    },
  });
  const recipientOptions = [
    {value: '', label: 'Tất cả người dùng đã bật thông báo'},
    ...(options.recipients || []),
  ];

  return (
    <AdminListPage
      title="Quản lý thông báo"
      api={notificationApi}
      addTo="/notifications/create"
      addLabel="+ Tạo thông báo"
      hideActions
      searchPlaceholder="Tìm kiếm thông báo..."
      normalizeSubmit={payload => ({...payload, user: payload.user || null})}
      fields={[
        {name: 'title', label: 'Tiêu đề', required: true},
        {name: 'content', label: 'Nội dung', type: 'textarea', required: true},
        {
          name: 'user',
          label: 'Người nhận',
          type: 'select',
          defaultValue: '',
          ref: true,
          options: recipientOptions,
        },
        {name: 'image', label: 'Ảnh URL'},
        {name: 'sentAt', label: 'Ngày gửi', type: 'datetime-local'},
      ]}
      columns={[
        {key: 'title', title: 'Tiêu đề'},
        {key: 'user', title: 'Người nhận', render: formatRecipient},
        {key: 'sentAt', title: 'Ngày gửi', render: item => formatDateTime(item.sentAt || item.createdAt)},
      ]}
    />
  );
}

export default NotificationList;

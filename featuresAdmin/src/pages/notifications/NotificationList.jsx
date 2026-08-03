import notificationApi from '../../api/notificationApi';
import AdminListPage from '../../components/AdminListPage';
import {formatDateTime} from '../../utils/adminFormatters';

const formatRecipient = item => {
  if (item.recipientLabel) {
    return (
      <span className={`notificationRecipient notificationRecipient--${item.recipientScope || 'enabledUsers'}`}>
        {item.recipientLabel}
      </span>
    );
  }

  if (item.recipientName) {
    return <span className="notificationRecipient notificationRecipient--singleUser">{item.recipientName}</span>;
  }

  if (item.user) {
    if (typeof item.user === 'object') {
      const name = item.user.fullName || 'Người dùng';
      return <span className="notificationRecipient notificationRecipient--singleUser">{name}</span>;
    }

    return 'Không tìm thấy người nhận';
  }

  return (
    <span className="notificationRecipient notificationRecipient--enabledUsers">
      Người dùng đã bật thông báo
    </span>
  );
};

function NotificationList() {
  return (
    <AdminListPage
      title="Quản lý thông báo"
      api={notificationApi}
      hideCreate
      hideActions
      searchPlaceholder="Tìm kiếm thông báo..."
      columns={[
        {key: 'title', title: 'Tiêu đề'},
        {key: 'user', title: 'Người nhận', render: formatRecipient},
        {key: 'sentAt', title: 'Ngày gửi', render: item => formatDateTime(item.sentAt || item.createdAt)},
      ]}
    />
  );
}

export default NotificationList;

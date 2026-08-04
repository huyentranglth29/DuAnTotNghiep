import {useState} from 'react';
import notificationApi from '../../api/notificationApi';
import AdminListPage from '../../components/AdminListPage';
import Modal from '../../components/Modal';
import {formatDateTime} from '../../utils/adminFormatters';

const formatRecipient = (item, onOpen) => {
  const label =
    item.recipientLabel ||
    item.recipientName ||
    (item.user && typeof item.user === 'object'
      ? item.user.fullName || item.user.email
      : '') ||
    'Người dùng đã bật thông báo';

  return (
    <button
      type="button"
      className={`notificationRecipient notificationRecipientButton notificationRecipient--${
        item.recipientScope || (item.user ? 'singleUser' : 'enabledUsers')
      }`}
      onClick={() => onOpen(item)}>
      {label}
    </button>
  );
};

function NotificationList() {
  const [recipientModal, setRecipientModal] = useState(null);
  const [recipients, setRecipients] = useState([]);
  const [recipientLoading, setRecipientLoading] = useState(false);
  const [recipientError, setRecipientError] = useState('');

  const openRecipients = async item => {
    setRecipientModal(item);
    setRecipients([]);
    setRecipientError('');
    setRecipientLoading(true);
    try {
      const response = await notificationApi.getRecipients(item._id || item.id);
      const payload = response?.data || response;
      setRecipients(payload?.recipients || []);
    } catch (error) {
      setRecipientError(error.message || 'Không tải được danh sách người nhận.');
    } finally {
      setRecipientLoading(false);
    }
  };

  return (
    <>
      <AdminListPage
        title="Quản lý thông báo"
        api={notificationApi}
        hideCreate
        hideActions
        searchPlaceholder="Tìm kiếm thông báo..."
        columns={[
          {key: 'title', title: 'Tiêu đề'},
          {key: 'user', title: 'Người nhận', render: item => formatRecipient(item, openRecipients)},
          {key: 'sentAt', title: 'Ngày gửi', render: item => formatDateTime(item.sentAt || item.createdAt)},
        ]}
      />

      <Modal
        open={Boolean(recipientModal)}
        className="notificationRecipientModal"
        title={`Người nhận · ${recipientModal?.title || 'Thông báo'}`}
        onClose={() => setRecipientModal(null)}>
        {recipientLoading ? (
          <p className="mutedText">Đang tải danh sách người nhận...</p>
        ) : recipientError ? (
          <p className="inlineError">{recipientError}</p>
        ) : recipients.length === 0 ? (
          <p className="mutedText">Không có người nhận phù hợp.</p>
        ) : (
          <div className="notificationRecipientList">
            <p className="notificationRecipientSummary">
              Tổng cộng <strong>{recipients.length}</strong> người nhận
            </p>
            <div className="notificationRecipientTableWrap">
              <table>
                <thead>
                  <tr>
                    <th>Họ tên</th>
                    <th>Email</th>
                    <th>Số điện thoại</th>
                    <th>Thông báo</th>
                  </tr>
                </thead>
                <tbody>
                  {recipients.map(user => (
                    <tr key={user.id}>
                      <td><strong>{user.fullName}</strong></td>
                      <td>{user.email || 'Chưa có'}</td>
                      <td>{user.phone || 'Chưa có'}</td>
                      <td>
                        <span className={`badge ${user.notificationEnabled ? 'success' : 'muted'}`}>
                          {user.notificationEnabled ? 'Đã bật' : 'Đã tắt'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

export default NotificationList;

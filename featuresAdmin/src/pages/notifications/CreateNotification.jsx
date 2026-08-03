import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import notificationApi from '../../api/notificationApi';
import userApi from '../../api/userApi';
import {PageTitle} from '../../components/AdminUi';
import useAdminOptions from '../../hooks/useAdminOptions';

function CreateNotification() {
  const navigate = useNavigate();
  const options = useAdminOptions({
    recipients: {
      api: userApi,
      params: {role: 'user', status: 'active', notificationEnabled: true},
      label: user => `${user.fullName || 'Người dùng'}${user.email ? ` (${user.email})` : ''}`,
    },
  });
  const [form, setForm] = useState({
    title: '',
    content: '',
    recipientMode: 'enabledUsers',
    user: '',
    image: '',
    sentAt: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateForm = (name, value) => {
    setForm(current => ({...current, [name]: value}));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await notificationApi.create({
        title: form.title,
        content: form.content,
        user: form.recipientMode === 'singleUser' ? form.user : '',
        image: form.image,
        sentAt: form.sentAt ? new Date(form.sentAt) : new Date(),
      });
      navigate('/notifications');
    } catch (err) {
      setError(err.message || 'Không thể tạo thông báo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageTitle title="Tạo thông báo" />
      <div className="panel notificationForm">
        {error && <p className="loginError">{error}</p>}
        <form className="formGrid" onSubmit={handleSubmit}>
          <label>Tiêu đề<input required value={form.title} onChange={event => updateForm('title', event.target.value)} /></label>
          <label>Nội dung<textarea required value={form.content} onChange={event => updateForm('content', event.target.value)} /></label>
          <div className="notificationRecipientBox">
            <span className="notificationRecipientLabel">Gửi đến</span>
            <div className="notificationRecipientModes">
              <button
                type="button"
                className={form.recipientMode === 'enabledUsers' ? 'active' : ''}
                onClick={() => setForm(current => ({...current, recipientMode: 'enabledUsers', user: ''}))}>
                Người dùng đã bật thông báo
              </button>
              <button
                type="button"
                className={form.recipientMode === 'singleUser' ? 'active' : ''}
                onClick={() => setForm(current => ({...current, recipientMode: 'singleUser'}))}>
                Một người dùng
              </button>
            </div>
            {form.recipientMode === 'singleUser' && (
              <select
                required
                value={form.user}
                onChange={event => updateForm('user', event.target.value)}>
                <option value="">Chọn người nhận...</option>
                {(options.recipients || []).map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            )}
            <small>
              {form.recipientMode === 'enabledUsers'
                ? 'Thông báo sẽ gửi cho tất cả tài khoản user đang bật nhận thông báo.'
                : 'Thông báo chỉ gửi đến người dùng được chọn.'}
            </small>
          </div>
          <label>Ảnh banner URL<input value={form.image} onChange={event => updateForm('image', event.target.value)} /></label>
          <label>Ngày gửi<input type="datetime-local" value={form.sentAt} onChange={event => updateForm('sentAt', event.target.value)} /></label>
          <div className="formActions">
            <button className="ghost" type="button" onClick={() => navigate('/notifications')}>Hủy</button>
            <button type="submit" disabled={saving}>{saving ? 'Đang gửi...' : 'Gửi ngay'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CreateNotification;

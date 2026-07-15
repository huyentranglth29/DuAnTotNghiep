import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import notificationApi from '../../api/notificationApi';
import {PageTitle} from '../../components/AdminUi';

function CreateNotification() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    content: '',
    target: 'all',
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
        ...form,
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
          <label>
            Đối tượng
            <select value={form.target} onChange={event => updateForm('target', event.target.value)}>
              <option value="all">Tất cả</option>
              <option value="vip">VIP</option>
              <option value="newUser">Người dùng mới</option>
            </select>
          </label>
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

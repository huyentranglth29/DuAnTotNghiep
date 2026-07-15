import {useEffect, useState} from 'react';
import authApi from '../../api/authApi';
import userApi from '../../api/userApi';
import {formatDateTime} from '../../utils/adminFormatters';

function InfoItem({label, value, tone}) {
  return (
    <div className="profileInfoItem">
      <span>{label.slice(0, 2).toUpperCase()}</span>
      <div>
        <small>{label}</small>
        <strong className={tone || ''}>{value || ''}</strong>
      </div>
    </div>
  );
}

function PersonalInformation() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({fullName: '', email: '', phone: '', status: 'active'});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authApi.me()
      .then(response => {
        const nextUser = response.user || response;
        setUser(nextUser);
        setForm({
          fullName: nextUser.fullName || '',
          email: nextUser.email || '',
          phone: nextUser.phone || '',
          status: nextUser.status || 'active',
        });
      })
      .catch(err => setError(err.message || 'Không tải được thông tin tài khoản.'));
  }, []);

  const updateForm = (name, value) => {
    setForm(current => ({...current, [name]: value}));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    if (!user?._id) return;
    setSaving(true);
    setError('');

    try {
      const response = await userApi.update(user._id, {
        ...form,
        role: user.role,
      });
      const updated = response.data || response;
      setUser(updated);
      localStorage.setItem('filmgo_admin_user', JSON.stringify(updated));
    } catch (err) {
      setError(err.message || 'Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profilePage">
      <h2>Thông tin tài khoản</h2>
      {error && <p className="loginError">{error}</p>}

      <div className="profileGrid">
        <aside className="panel profileCard">
          <div className="profileAvatarWrap">
            <div className="profileAvatar">{(user?.fullName || user?.email || 'A').slice(0, 1).toUpperCase()}</div>
          </div>
          <h3>{user?.fullName || user?.email}</h3>
          <span className="rolePill">{user?.role}</span>

          <div className="profileDivider" />

          <InfoItem label="Email" value={user?.email} />
          <InfoItem label="Số điện thoại" value={user?.phone} />
          <InfoItem label="Vai trò" value={user?.role} />
          <InfoItem label="Ngày tạo tài khoản" value={formatDateTime(user?.createdAt)} />
          <InfoItem label="Trạng thái" value={user?.status} tone={user?.status === 'active' ? 'greenText' : ''} />
        </aside>

        <div className="profileMain">
          <div className="panel accountPanel">
            <h3>Thông tin cá nhân</h3>
            <form className="accountForm" onSubmit={handleSubmit}>
              <label>Họ và tên<input value={form.fullName} onChange={event => updateForm('fullName', event.target.value)} /></label>
              <label>Email<input value={form.email} onChange={event => updateForm('email', event.target.value)} /></label>
              <label>Số điện thoại<input value={form.phone} onChange={event => updateForm('phone', event.target.value)} /></label>
              <label>Vai trò<input value={user?.role || ''} disabled /></label>
              <label>Ngày tạo tài khoản<input value={formatDateTime(user?.createdAt)} disabled /></label>
              <label>
                Trạng thái
                <select value={form.status} onChange={event => updateForm('status', event.target.value)}>
                  <option value="active">Đang hoạt động</option>
                  <option value="blocked">Tạm khóa</option>
                </select>
              </label>
              <div className="fullField">
                <button type="submit" disabled={saving}>{saving ? 'Đang cập nhật...' : 'Cập nhật thông tin'}</button>
              </div>
            </form>
          </div>

          <div className="panel securityPanel">
            <div>
              <h3>Bảo mật tài khoản</h3>
              <p>Tài khoản đang được xác thực bằng JWT từ backend.</p>
            </div>
            <div className="shieldArt">Bảo mật</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PersonalInformation;

function InfoItem({label, value, tone}) {
  return (
    <div className="profileInfoItem">
      <span>{label.slice(0, 2).toUpperCase()}</span>
      <div>
        <small>{label}</small>
        <strong className={tone || ''}>{value}</strong>
      </div>
    </div>
  );
}

function PersonalInformation() {
  return (
    <section className="profilePage">
      <h2>Thông tin tài khoản</h2>

      <div className="profileGrid">
        <aside className="panel profileCard">
          <div className="profileAvatarWrap">
            <div className="profileAvatar">A</div>
            <button type="button" aria-label="Đổi ảnh đại diện">Ảnh</button>
          </div>
          <h3>Admin FilmGo</h3>
          <span className="rolePill">Quản trị viên</span>

          <div className="profileDivider" />

          <InfoItem label="Email" value="admin@filmgo.vn" />
          <InfoItem label="Số điện thoại" value="0987 654 321" />
          <InfoItem label="Vai trò" value="Quản trị viên" />
          <InfoItem label="Ngày tạo tài khoản" value="01/01/2025 10:30" />
          <InfoItem label="Đăng nhập cuối" value="25/05/2025 14:45" />
          <InfoItem label="Trạng thái" value="Đang hoạt động" tone="greenText" />
        </aside>

        <div className="profileMain">
          <div className="panel accountPanel">
            <h3>Thông tin cá nhân</h3>
            <form className="accountForm">
              <label>
                Họ và tên
                <input defaultValue="Admin FilmGo" />
              </label>
              <label>
                Email
                <input defaultValue="admin@filmgo.vn" />
              </label>
              <label>
                Số điện thoại
                <input defaultValue="0987 654 321" />
              </label>
              <label>
                Vai trò
                <input defaultValue="Quản trị viên" disabled />
              </label>
              <label>
                Ngày tạo tài khoản
                <input defaultValue="01/01/2025 10:30" disabled />
              </label>
              <label>
                Trạng thái
                <select defaultValue="active">
                  <option value="active">Đang hoạt động</option>
                  <option value="locked">Tạm khóa</option>
                </select>
              </label>
              <label className="fullField">
                Giới thiệu bản thân
                <textarea defaultValue="Quản trị hệ thống rạp chiếu phim FilmGo." />
                <small>34/200</small>
              </label>
              <div className="fullField">
                <button type="button">Cập nhật thông tin</button>
              </div>
            </form>
          </div>

          <div className="panel securityPanel">
            <div>
              <h3>Bảo mật tài khoản</h3>
              <p>Để bảo mật tài khoản, vui lòng đổi mật khẩu định kỳ.</p>
              <button className="ghost" type="button">Đổi mật khẩu</button>
            </div>
            <div className="shieldArt">Bảo mật</div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default PersonalInformation;

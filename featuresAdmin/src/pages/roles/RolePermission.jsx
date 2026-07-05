import {PageTitle} from '../../components/AdminMock';

const permissions = [
  ['Dashboard', 'Xem tổng quan doanh thu, vé bán và suất chiếu.'],
  ['Quản lý người dùng', 'Thêm, sửa, khóa tài khoản người dùng.'],
  ['Quản lý phim', 'Tạo mới và cập nhật thông tin phim.'],
  ['Quản lý phòng chiếu', 'Cấu hình phòng chiếu và trạng thái phòng.'],
  ['Quản lý ghế', 'Thiết lập sơ đồ ghế theo từng phòng.'],
  ['Quản lý suất chiếu', 'Tạo lịch chiếu, giá vé và thời gian bán.'],
  ['Quản lý vé', 'Theo dõi vé, QR và trạng thái checkin.'],
  ['Quản lý sản phẩm', 'Quản lý combo, bắp nước và tồn kho.'],
  ['Quản lý voucher', 'Tạo và kiểm soát mã khuyến mãi.'],
  ['Thống kê doanh thu', 'Xem báo cáo theo ngày, phim và phòng.'],
  ['Quản lý notification', 'Gửi thông báo tới khách hàng.'],
  ['Cài đặt hệ thống', 'Thay đổi cấu hình vận hành.'],
];

function RolePermission() {
  return (
    <section>
      <PageTitle title="Phân quyền tài khoản" />
      <div className="rolePage">
        <div className="roleHero panel">
          <div>
            <span>Vai trò đang chỉnh</span>
            <h3>Quản lý rạp</h3>
            <p>Nhóm quyền dành cho người vận hành cụm rạp, có thể quản lý lịch chiếu, phòng, ghế, vé và báo cáo.</p>
          </div>
          <label>
            Chọn vai trò
            <select defaultValue="manager">
              <option value="manager">Quản lý rạp</option>
              <option value="staff">Nhân viên</option>
              <option value="admin">Admin</option>
            </select>
          </label>
        </div>

        <div className="panel roleCard">
          <div className="sectionHeader">
            <div>
              <h3>Danh sách quyền</h3>
              <p>Bật hoặc tắt các quyền mà tài khoản được phép sử dụng trong hệ thống.</p>
            </div>
            <label className="selectAll">
              <input defaultChecked type="checkbox" />
              Chọn tất cả
            </label>
          </div>

          <div className="permissionGrid">
            {permissions.map(([name, description]) => (
              <label className="permissionItem" key={name}>
                <input defaultChecked type="checkbox" />
                <span>
                  <strong>{name}</strong>
                  <small>{description}</small>
                </span>
              </label>
            ))}
          </div>

          <div className="roleActions">
            <button className="ghost" type="button">Hủy</button>
            <button type="button">Lưu thay đổi</button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default RolePermission;

import {NavLink, useNavigate} from 'react-router-dom';
import axiosClient from '../api/axiosClient';

const menuItems = [
  {to: '/', label: 'Tổng quan'},
  {to: '/users', label: 'Người dùng'},
  {to: '/roles', label: 'Phân quyền'},
  {to: '/movies', label: 'Phim'},
  {to: '/rooms', label: 'Phòng chiếu'},
  {to: '/seats', label: 'Ghế'},
  {
    label: 'Suất chiếu',
    children: [
      {to: '/showtimes', label: 'Danh sách suất chiếu'},
      {to: '/showtimes/create', label: 'Liên kết phim'},
      {to: '/showtimes/status', label: 'Trạng thái suất'},
    ],
  },
  {
    label: 'Đơn đặt vé',
    children: [
      {to: '/bookings', label: 'Quản lý đơn đặt vé'},
      {to: '/bookings/detail', label: 'Chi tiết đơn'},
    ],
  },
  {
    label: 'Thanh toán',
    children: [
      {to: '/payments/status', label: 'Theo dõi thanh toán'},
      {to: '/payments/history', label: 'Lịch sử thanh toán'},
    ],
  },
  {
    label: 'Vé',
    children: [
      {to: '/tickets', label: 'Danh sách vé'},
      {to: '/tickets/electronic', label: 'Vé điện tử'},
      {to: '/tickets/qr', label: 'QR / Barcode'},
      {to: '/tickets/checkin', label: 'Checkin vé'},
      {to: '/tickets/status', label: 'Theo dõi trạng thái vé'},
    ],
  },
  {to: '/vouchers', label: 'Voucher'},
  {to: '/products', label: 'Sản phẩm'},
  {to: '/reviews', label: 'Đánh giá phim'},
  {to: '/notifications', label: 'Thông báo'},
  {to: '/news-events', label: 'Tin tức & Sự kiện'},
];

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/offline', {});
    } catch {
      // Mất mạng — vẫn đăng xuất local
    }
    localStorage.removeItem('filmgo_admin_logged_in');
    localStorage.removeItem('filmgo_admin_token');
    localStorage.removeItem('filmgo_admin_user');
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div>
        <h1>FILMGO</h1>
        <nav>
          {menuItems.map(item =>
            item.children ? (
              <details className="menuGroup" key={item.label} open>
                <summary>{item.label}</summary>
                <div>
                  {item.children.map(child => (
                    <NavLink key={child.to} to={child.to}>
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              </details>
            ) : (
              <NavLink key={item.to} to={item.to}>
                {item.label}
              </NavLink>
            ),
          )}
        </nav>
      </div>
      <button className="logoutButton" type="button" onClick={handleLogout}>
        <span>↪</span>
        Đăng xuất
      </button>
    </aside>
  );
}

export default Sidebar;

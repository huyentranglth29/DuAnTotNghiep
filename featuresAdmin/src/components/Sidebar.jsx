import {NavLink, useNavigate} from 'react-router-dom';

const menuItems = [
  {to: '/', label: 'Tổng quan'},
  {to: '/users', label: 'Người dùng'},
  {
    label: 'Phim',
    children: [
      {to: '/movies', label: 'Quản lý phim'},
      {to: '/categories', label: 'Thể loại phim'},
    ],
  },
  {to: '/rooms', label: 'Phòng chiếu'},
  {to: '/seats', label: 'Ghế'},
  {
    label: 'Suất chiếu',
    children: [
      {to: '/showtimes', label: 'Danh sách suất chiếu'},
      {to: '/showtimes/status', label: 'Trạng thái suất'},
    ],
  },
  {to: '/bookings', label: 'Đơn đặt vé'},
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
  {to: '/ai-assistant', label: 'AI nội bộ'},
];

function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
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

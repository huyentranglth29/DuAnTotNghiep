export const BLUE = '#005f98';
export const DANGER = '#ff5964';
export const BORDER = '#dddddd';

export type MemberScreenName =
  | 'home'
  | 'points'
  | 'pointHistory'
  | 'transactions'
  | 'card'
  | 'account'
  | 'changePassword';

export type MemberIconName =
  | 'star'
  | 'history'
  | 'card'
  | 'person'
  | 'trash'
  | 'lock'
  | 'logout'
  | 'trend'
  | 'cart'
  | 'wallet';

export type MenuRow = {
  title: string;
  icon: MemberIconName;
  screen?: MemberScreenName;
  action?: 'delete';
};

export const memberRows: MenuRow[] = [
  { title: 'Điểm thành viên', icon: 'star', screen: 'points' },
  { title: 'Lịch sử giao dịch', icon: 'history', screen: 'transactions' },
  { title: 'Thẻ thành viên', icon: 'card', screen: 'card' },
  { title: 'Thông tin tài khoản', icon: 'person', screen: 'account' },
  { title: 'Xoá tài khoản', icon: 'trash', action: 'delete' },
  { title: 'Thay đổi mật khẩu', icon: 'lock', screen: 'changePassword' },
];

export const provinces = [
  'Thành phố Hà Nội',
  'Thành phố Hồ Chí Minh',
  'Thành phố Hải Phòng',
  'Thành phố Đà Nẵng',
  'Thành phố Cần Thơ',
  'Tỉnh An Giang',
  'Tỉnh Bà Rịa - Vũng Tàu',
  'Tỉnh Bắc Giang',
  'Tỉnh Bắc Kạn',
  'Tỉnh Bạc Liêu',
  'Tỉnh Bắc Ninh',
  'Tỉnh Bến Tre',
  'Tỉnh Bình Định',
  'Tỉnh Bình Dương',
  'Tỉnh Bình Phước',
  'Tỉnh Bình Thuận',
  'Tỉnh Cà Mau',
  'Tỉnh Cao Bằng',
  'Tỉnh Đắk Lắk',
  'Tỉnh Đắk Nông',
  'Tỉnh Điện Biên',
  'Tỉnh Đồng Nai',
  'Tỉnh Đồng Tháp',
  'Tỉnh Gia Lai',
  'Tỉnh Hà Giang',
  'Tỉnh Hà Nam',
  'Tỉnh Hà Tĩnh',
  'Tỉnh Hải Dương',
  'Tỉnh Hậu Giang',
  'Tỉnh Hòa Bình',
  'Tỉnh Hưng Yên',
  'Tỉnh Khánh Hòa',
  'Tỉnh Kiên Giang',
  'Tỉnh Kon Tum',
  'Tỉnh Lai Châu',
  'Tỉnh Lâm Đồng',
  'Tỉnh Lạng Sơn',
  'Tỉnh Lào Cai',
  'Tỉnh Long An',
  'Tỉnh Nam Định',
  'Tỉnh Nghệ An',
  'Tỉnh Ninh Bình',
  'Tỉnh Ninh Thuận',
  'Tỉnh Phú Thọ',
  'Tỉnh Phú Yên',
  'Tỉnh Quảng Bình',
  'Tỉnh Quảng Nam',
  'Tỉnh Quảng Ngãi',
  'Tỉnh Quảng Ninh',
  'Tỉnh Quảng Trị',
  'Tỉnh Sóc Trăng',
  'Tỉnh Sơn La',
  'Tỉnh Tây Ninh',
  'Tỉnh Thái Bình',
  'Tỉnh Thái Nguyên',
  'Tỉnh Thanh Hóa',
  'Tỉnh Thừa Thiên Huế',
  'Tỉnh Tiền Giang',
  'Tỉnh Trà Vinh',
  'Tỉnh Tuyên Quang',
  'Tỉnh Vĩnh Long',
  'Tỉnh Vĩnh Phúc',
  'Tỉnh Yên Bái',
];

export const districts = [
  'Quận Ba Đình',
  'Quận Cầu Giấy',
  'Quận Đống Đa',
  'Quận Hoàn Kiếm',
  'Quận Hai Bà Trưng',
];

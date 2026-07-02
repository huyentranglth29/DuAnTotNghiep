import {VoucherNewsItem} from '../types';

const promoImage1 = require('../../../assets/showtime/moana.jpg');
const promoImage2 = require('../../../assets/showtime/minions.jpg');
const promoImage3 = require('../../../assets/showtime/sheep-in-the-box.jpg');
const promoImage4 = require('../../../assets/showtime/bong-quy.jpg');
const promoImage5 = require('../../../assets/showtime/den-la-sat.jpg');
const promoImage6 = require('../../../assets/showtime/dong-dao-ma-quai.jpg');

export const voucherNewsItems: VoucherNewsItem[] = [
  {
    id: 'summer-deal',
    tab: 'promotions',
    title: 'ĐÓN SIÊU HÈ - SIÊU DEAL SỐC',
    publishedAt: '04:57:50 28/06/2026',
    image: promoImage1,
    summary: 'Tặng combo bắp nước cho khách hàng xem phim trong dịp hè.',
    body: [
      'Từ ngày 29/06 đến ngày 30/06/2026, khách hàng xem phim tại FilmGo sẽ được tặng 01 bắp vị Cốm Dừa 32oz.',
      'Điều khoản áp dụng tùy theo từng rạp và số lượng quà tặng có hạn trong thời gian diễn ra chương trình.',
    ],
  },
  {
    id: 'golden-army',
    tab: 'promotions',
    title: 'QUỶ VÀNG ĐỔ BỘ - GIÁ NHÍ HƠI TO',
    publishedAt: '09:30:00 25/06/2026',
    image: promoImage2,
    summary: 'Combo nước và bắp giá tốt cho các suất chiếu gia đình.',
    body: [
      'Ưu đãi áp dụng cho khách hàng mua vé tại quầy và trên ứng dụng trong khung giờ triển khai.',
      'Không áp dụng đồng thời cùng các chương trình giảm giá khác.',
    ],
  },
  {
    id: 'filmgo-vivu',
    tab: 'promotions',
    title: 'BẬT MOOD DELULU - TỚI FILMGO VI VU',
    publishedAt: '08:15:00 20/06/2026',
    image: promoImage3,
    summary: 'Vé xem phim và combo đồng giá cho thành viên FilmGo.',
    body: [
      'Thành viên đăng nhập tài khoản FilmGo có cơ hội nhận ưu đãi vé xem phim chỉ từ 16K.',
      'Chương trình có thể kết thúc sớm khi hết số lượng ưu đãi trong ngày.',
    ],
  },
  {
    id: 'student-fire',
    tab: 'promotions',
    title: 'SĨ TỬ BUNG LỤA - LỰA ƯU ĐÃI TO',
    publishedAt: '10:00:00 18/06/2026',
    image: promoImage4,
    summary: 'Ưu đãi mùa thi dành riêng cho học sinh, sinh viên.',
    body: [
      'Xuất trình thẻ học sinh, sinh viên hoặc giấy tờ hợp lệ để nhận ưu đãi tại rạp.',
      'Ưu đãi không có giá trị quy đổi thành tiền mặt.',
    ],
  },
  {
    id: 'combo-weekend',
    tab: 'promotions',
    title: 'CUỐI TUẦN RỰC RỠ - COMBO HỜI HẾT CỠ',
    publishedAt: '09:10:00 16/06/2026',
    image: promoImage5,
    summary: 'Mua vé cuối tuần nhận ưu đãi combo bắp nước cho nhóm bạn.',
    body: [
      'Khách hàng mua từ 02 vé xem phim cuối tuần có thể chọn thêm combo bắp nước với giá ưu đãi.',
      'Chương trình áp dụng cho một số cụm rạp và không áp dụng cho suất chiếu đặc biệt.',
    ],
  },
  {
    id: 'member-day',
    tab: 'promotions',
    title: 'NGÀY HỘI THÀNH VIÊN - GIẢM GIÁ CỰC ÊM',
    publishedAt: '13:25:00 14/06/2026',
    image: promoImage6,
    summary: 'Thành viên FilmGo nhận giá vé ưu đãi trong ngày hội tri ân.',
    body: [
      'Đăng nhập tài khoản thành viên trước khi đặt vé để hệ thống tự động ghi nhận ưu đãi.',
      'Số lượng vé ưu đãi có hạn theo từng rạp trong ngày diễn ra chương trình.',
    ],
  },
  {
    id: 'couple-night',
    tab: 'promotions',
    title: 'ĐÊM HẸN HÒ - VÉ ĐÔI GIÁ NHỎ',
    publishedAt: '18:40:00 11/06/2026',
    image: promoImage1,
    summary: 'Ưu đãi vé đôi cho các suất chiếu buổi tối trong tuần.',
    body: [
      'Các cặp đôi đặt vé online trong khung giờ áp dụng sẽ nhận mức giá ưu đãi cho 02 vé.',
      'Ưu đãi không áp dụng cho phòng chiếu đặc biệt hoặc phim có phụ thu theo quy định.',
    ],
  },
  {
    id: 'summer-movie',
    tab: 'sideNews',
    title: 'NGHỈ HÈ RỒI, XEM PHIM THÔI 🥳',
    publishedAt: '07:45:00 15/06/2026',
    image: promoImage5,
    summary: 'Loạt phim giải trí mùa hè đã sẵn sàng cho cả gia đình.',
    body: [
      'Mùa hè là thời điểm tuyệt vời để lên lịch xem phim cùng bạn bè và gia đình.',
      'Theo dõi lịch chiếu hằng ngày để chọn suất phim phù hợp nhất.',
    ],
  },
  {
    id: 'zalopay',
    tab: 'sideNews',
    title: 'ĐẶT VÉ XEM PHIM TRÊN ZALOPAY - GIẢM NGAY 15.000Đ',
    publishedAt: '14:20:00 12/06/2026',
    image: promoImage6,
    summary: 'Ưu đãi thanh toán online cho đơn vé đủ điều kiện.',
    body: [
      'Khách hàng thanh toán qua ví điện tử có thể nhận giảm giá trực tiếp trên đơn hàng.',
      'Mỗi tài khoản được áp dụng theo giới hạn của chương trình.',
    ],
  },
  {
    id: 'early-deal',
    tab: 'sideNews',
    title: 'DEAL DẬY SỚM - CHỐT KÈO THƠM',
    publishedAt: '06:30:00 10/06/2026',
    image: promoImage1,
    summary: 'Săn vé buổi sáng với mức giá dễ chịu hơn.',
    body: [
      'Các suất chiếu sớm trong ngày có thể đi kèm ưu đãi đặc biệt cho vé và combo.',
      'Vui lòng kiểm tra thông tin tại từng rạp trước khi đặt vé.',
    ],
  },
  {
    id: 'recruitment',
    tab: 'sideNews',
    title: 'TUYỂN DỤNG PART-TIME TOÀN HỆ THỐNG',
    publishedAt: '11:00:00 05/06/2026',
    image: promoImage2,
    summary: 'Cơ hội làm việc bán thời gian tại cụm rạp FilmGo.',
    body: [
      'FilmGo tuyển dụng nhân viên bán thời gian tại nhiều vị trí vận hành rạp.',
      'Ứng viên quan tâm có thể theo dõi thông tin chi tiết tại mục Khác trong ứng dụng.',
    ],
  },
  {
    id: 'movie-snack-guide',
    tab: 'sideNews',
    title: 'GỢI Ý COMBO ĐỒ ĂN CHO BUỔI XEM PHIM TRỌN VẸN',
    publishedAt: '16:05:00 03/06/2026',
    image: promoImage3,
    summary: 'Chọn combo phù hợp để buổi xem phim thêm thoải mái.',
    body: [
      'Với phim gia đình, combo bắp lớn và nước đôi là lựa chọn dễ chia sẻ cho cả nhóm.',
      'Nếu xem phim một mình, bạn có thể chọn phần nhỏ hơn để tiết kiệm và tránh lãng phí.',
    ],
  },
  {
    id: 'booking-tips',
    tab: 'sideNews',
    title: 'MẸO ĐẶT VÉ NHANH TRONG GIỜ CAO ĐIỂM',
    publishedAt: '12:35:00 01/06/2026',
    image: promoImage4,
    summary: 'Một vài cách giúp bạn giữ ghế đẹp khi phim hot mở bán.',
    body: [
      'Hãy đăng nhập tài khoản trước khi chọn suất chiếu để quá trình thanh toán diễn ra nhanh hơn.',
      'Nên kiểm tra lịch chiếu sớm và chọn sẵn rạp yêu thích để tránh hết ghế trung tâm.',
    ],
  },
  {
    id: 'family-movie-day',
    tab: 'sideNews',
    title: 'LÊN LỊCH XEM PHIM GIA ĐÌNH DỊP CUỐI TUẦN',
    publishedAt: '08:50:00 30/05/2026',
    image: promoImage5,
    summary: 'Gợi ý chọn suất chiếu phù hợp cho phụ huynh và trẻ nhỏ.',
    body: [
      'Các suất chiếu buổi sáng hoặc đầu giờ chiều thường phù hợp hơn với gia đình có trẻ nhỏ.',
      'Đừng quên kiểm tra phân loại độ tuổi của phim trước khi đặt vé.',
    ],
  },
];

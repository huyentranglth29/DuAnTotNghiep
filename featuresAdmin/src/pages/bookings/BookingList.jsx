import bookingApi from '../../api/bookingApi';
import seatApi from '../../api/seatApi';
import showtimeApi from '../../api/showtimeApi';
import userApi from '../../api/userApi';
import voucherApi from '../../api/voucherApi';
import AdminListPage from '../../components/AdminListPage';
import useAdminOptions from '../../hooks/useAdminOptions';
import {formatVnd, getUserName, shortId} from '../../utils/adminFormatters';

function BookingList() {
  const fieldOptions = useAdminOptions({
    user: {api: userApi, label: user => `${user.fullName || user.email} (${user.email})`},
    showtime: {api: showtimeApi, label: showtime => `${showtime.movie?.title || showtime.movie} - ${new Date(showtime.startTime).toLocaleString('vi-VN')}`},
    seats: {api: seatApi, label: seat => `${seat.room?.name || ''} ${seat.row}${seat.number}`},
    voucher: {api: voucherApi, label: voucher => voucher.code},
  });

  return (
    <AdminListPage
      title="Quản lý đơn đặt vé"
      api={bookingApi}
      searchPlaceholder="Tìm kiếm đơn hàng..."
      fields={[
        {name: 'user', label: 'Người dùng', type: 'select', ref: true, required: true},
        {name: 'showtime', label: 'Suất chiếu', type: 'select', ref: true, required: true},
        {name: 'seats', label: 'Ghế', type: 'multiselect', array: true, required: true},
        {name: 'voucher', label: 'Voucher', type: 'select', ref: true},
        {name: 'totalPrice', label: 'Tổng tiền', type: 'number', required: true},
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'pending',
          options: [
            {value: 'pending', label: 'Chờ xử lý'},
            {value: 'paid', label: 'Đã thanh toán'},
            {value: 'cancelled', label: 'Đã hủy'},
          ],
        },
        {
          name: 'paymentMethod',
          label: 'Phương thức',
          type: 'select',
          options: [
            {value: 'cash', label: 'Tiền mặt'},
            {value: 'card', label: 'Thẻ'},
            {value: 'momo', label: 'Momo'},
            {value: 'vnpay', label: 'VNPay'},
          ],
        },
        {
          name: 'paymentStatus',
          label: 'Thanh toán',
          type: 'select',
          defaultValue: 'unpaid',
          options: [
            {value: 'unpaid', label: 'Chưa thanh toán'},
            {value: 'paid', label: 'Đã thanh toán'},
            {value: 'refunded', label: 'Hoàn tiền'},
          ],
        },
      ]}
      fieldOptions={fieldOptions}
      columns={[
        {key: 'code', title: 'Mã đơn', render: item => `DH-${shortId(item)}`},
        {key: 'user', title: 'Khách hàng', render: getUserName},
        {key: 'showtime', title: 'Suất chiếu', render: item => item.showtime?.movie?.title || item.showtime?._id || ''},
        {key: 'totalPrice', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice)},
        {key: 'paymentStatus', title: 'Thanh toán'},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default BookingList;

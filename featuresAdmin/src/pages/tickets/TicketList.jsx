import bookingApi from '../../api/bookingApi';
import seatApi from '../../api/seatApi';
import showtimeApi from '../../api/showtimeApi';
import ticketApi from '../../api/ticketApi';
import AdminListPage from '../../components/AdminListPage';
import useAdminOptions from '../../hooks/useAdminOptions';
import {formatVnd, getSeatLabel} from '../../utils/adminFormatters';

function TicketList() {
  const fieldOptions = useAdminOptions({
    booking: {api: bookingApi, label: booking => `DH-${String(booking._id).slice(-6).toUpperCase()} - ${booking.user?.fullName || booking.user?.email || ''}`},
    showtime: {api: showtimeApi, label: showtime => `${showtime.movie?.title || showtime.movie} - ${new Date(showtime.startTime).toLocaleString('vi-VN')}`},
    seat: {api: seatApi, label: seat => `${seat.room?.name || ''} ${seat.row}${seat.number}`},
  });

  return (
    <AdminListPage
      title="Quản lý vé"
      api={ticketApi}
      searchPlaceholder="Tìm kiếm vé..."
      fields={[
        {name: 'booking', label: 'Booking', type: 'select', ref: true, required: true},
        {name: 'showtime', label: 'Suất chiếu', type: 'select', ref: true, required: true},
        {name: 'seat', label: 'Ghế', type: 'select', ref: true, required: true},
        {name: 'code', label: 'Mã vé', required: true},
        {name: 'price', label: 'Giá', type: 'number', required: true},
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'valid',
          options: [
            {value: 'valid', label: 'Hợp lệ'},
            {value: 'used', label: 'Đã dùng'},
            {value: 'cancelled', label: 'Đã hủy'},
          ],
        },
      ]}
      fieldOptions={fieldOptions}
      columns={[
        {key: 'code', title: 'Mã vé'},
        {key: 'booking', title: 'Mã đơn', render: item => item.booking?._id || item.booking || ''},
        {key: 'seat', title: 'Ghế', render: getSeatLabel},
        {key: 'price', title: 'Giá', render: item => formatVnd(item.price)},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default TicketList;

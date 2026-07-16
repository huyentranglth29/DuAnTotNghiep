import ticketApi from '../../api/ticketApi';
import AdminListPage from '../../components/AdminListPage';
import {getSeatLabel} from '../../utils/adminFormatters';

function TicketStatus() {
  return (
    <AdminListPage
      title="Theo dõi trạng thái vé"
      api={ticketApi}
      searchPlaceholder="Tìm kiếm vé..."
      fields={[
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
      normalizeSubmit={(payload, editingItem) => ({
        booking: editingItem.booking?._id || editingItem.booking,
        showtime: editingItem.showtime?._id || editingItem.showtime,
        seat: editingItem.seat?._id || editingItem.seat,
        code: editingItem.code,
        price: editingItem.price,
        status: payload.status,
      })}
      columns={[
        {key: 'code', title: 'Mã vé'},
        {key: 'booking', title: 'Mã đơn', render: item => item.booking?._id || item.booking || ''},
        {key: 'seat', title: 'Ghế', render: getSeatLabel},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default TicketStatus;

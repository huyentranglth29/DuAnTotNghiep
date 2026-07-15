import seatApi from '../../api/seatApi';
import roomApi from '../../api/roomApi';
import AdminListPage from '../../components/AdminListPage';
import useAdminOptions from '../../hooks/useAdminOptions';
import {getSeatLabel} from '../../utils/adminFormatters';

function SeatManagement() {
  const fieldOptions = useAdminOptions({
    room: {api: roomApi, label: room => `${room.name} (${room.type})`},
  });

  return (
    <AdminListPage
      title="Quản lý ghế"
      api={seatApi}
      searchPlaceholder="Tìm kiếm ghế..."
      fields={[
        {name: 'room', label: 'Phòng', type: 'select', ref: true, required: true},
        {name: 'row', label: 'Hàng', required: true},
        {name: 'number', label: 'Số ghế', type: 'number', required: true},
        {
          name: 'type',
          label: 'Loại ghế',
          type: 'select',
          defaultValue: 'normal',
          options: [
            {value: 'normal', label: 'Thường'},
            {value: 'vip', label: 'VIP'},
            {value: 'couple', label: 'Đôi'},
          ],
        },
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'active',
          options: [
            {value: 'active', label: 'Hoạt động'},
            {value: 'inactive', label: 'Tạm tắt'},
          ],
        },
      ]}
      fieldOptions={fieldOptions}
      columns={[
        {key: 'room', title: 'Phòng', render: item => item.room?.name || ''},
        {key: 'seat', title: 'Ghế', render: getSeatLabel},
        {key: 'type', title: 'Loại ghế'},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default SeatManagement;

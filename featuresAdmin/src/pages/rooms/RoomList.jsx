import roomApi from '../../api/roomApi';
import AdminListPage from '../../components/AdminListPage';

function RoomList() {
  return (
    <AdminListPage
      title="Quản lý phòng chiếu"
      api={roomApi}
      searchPlaceholder="Tìm kiếm phòng..."
      fields={[
        {name: 'name', label: 'Tên phòng', required: true},
        {
          name: 'type',
          label: 'Loại phòng',
          type: 'select',
          defaultValue: '2D',
          options: [
            {value: '2D', label: '2D'},
            {value: '3D', label: '3D'},
            {value: 'IMAX', label: 'IMAX'},
            {value: 'VIP', label: 'VIP'},
          ],
        },
        {name: 'totalSeats', label: 'Tổng ghế', type: 'number', required: true},
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'active',
          options: [
            {value: 'active', label: 'Hoạt động'},
            {value: 'maintenance', label: 'Bảo trì'},
            {value: 'inactive', label: 'Ngừng dùng'},
          ],
        },
      ]}
      columns={[
        {key: 'name', title: 'Tên phòng'},
        {key: 'type', title: 'Loại phòng'},
        {key: 'totalSeats', title: 'Số ghế'},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default RoomList;

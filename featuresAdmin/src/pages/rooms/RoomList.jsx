import {DataTable, PageTitle} from '../../components/AdminMock';

function RoomList() {
  return (
    <section>
      <PageTitle title="Quản lý phòng chiếu" action="+ Thêm phòng" />
      <DataTable
        headers={['Tên phòng', 'Loại phòng', 'Số ghế', 'Trạng thái']}
        rows={[
          ['Phòng 01', 'IMAX', '120', 'Hoạt động'],
          ['Phòng 02', '2D', '100', 'Hoạt động'],
          ['Phòng 03', '2D', '100', 'Hoạt động'],
          ['Phòng 04', 'VIP', '80', 'Hoạt động'],
          ['Phòng 05', '3D', '120', 'Bảo trì'],
        ]}
      />
    </section>
  );
}

export default RoomList;

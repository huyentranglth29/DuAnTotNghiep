import {DataTable, PageTitle} from '../../components/AdminMock';

function ShowtimeStatus() {
  return (
    <section>
      <PageTitle title="Quản lý trạng thái suất chiếu" />
      <DataTable
        headers={['Mã suất', 'Phim', 'Phòng', 'Ngày', 'Giờ', 'Trạng thái']}
        rows={[
          ['SC001', 'Avatar', 'P01', '16/05', '09:00', 'Đang mở bán'],
          ['SC002', 'Avatar', 'P01', '16/05', '13:00', 'Đã khóa'],
          ['SC003', 'Avengers', 'P02', '16/05', '16:00', 'Đang mở bán'],
          ['SC004', 'Superman', 'P03', '16/05', '19:00', 'Đã hủy'],
          ['SC005', 'Mission Impossible', 'P04', '16/05', '21:30', 'Đã kết thúc'],
        ]}
      />
    </section>
  );
}

export default ShowtimeStatus;

import {DataTable, PageTitle} from '../../components/AdminMock';

function NotificationList() {
  return (
    <section>
      <PageTitle title="Quản lý thông báo" action="+ Tạo thông báo" to="/notifications/create" />
      <DataTable
        headers={['Tiêu đề', 'Đối tượng', 'Ngày gửi', 'Trạng thái']}
        rows={[
          ['Khuyến mãi cuối tuần', 'Tất cả', '16/05/2024', 'Đã gửi'],
          ['Giảm giá cho thành viên VIP', 'Thành viên VIP', '15/05/2024', 'Đã gửi'],
          ['Phim mới ra rạp', 'Tất cả', '14/05/2024', 'Đã gửi'],
          ['Sinh nhật thành viên', 'Thành viên', '12/05/2024', 'Đã gửi'],
        ]}
      />
    </section>
  );
}

export default NotificationList;

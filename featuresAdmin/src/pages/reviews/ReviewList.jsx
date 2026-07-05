import {DataTable, PageTitle} from '../../components/AdminMock';

function ReviewList() {
  return (
    <section>
      <PageTitle title="Quản lý đánh giá phim" />
      <DataTable
        headers={['Khách hàng', 'Phim', 'Số sao', 'Nội dung', 'Trạng thái']}
        rows={[
          ['Nguyễn Văn A', 'Avatar', '★★★★★', 'Rất hay', 'Đã duyệt'],
          ['Trần Thị B', 'Avatar', '★★★★☆', 'Phim đỉnh', 'Đã duyệt'],
          ['Lê Văn C', 'Avengers', '★★★☆☆', 'Tuyệt vời', 'Đã duyệt'],
          ['Phạm Thị D', 'Superman', '★★☆☆☆', 'Kém', 'Ẩn'],
          ['Hoàng Văn E', 'Mission', '★★★☆☆', 'Tệ', 'Ẩn'],
        ]}
      />
    </section>
  );
}

export default ReviewList;

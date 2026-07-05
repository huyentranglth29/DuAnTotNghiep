import {FormShell} from '../../components/AdminMock';

function MovieAdd() {
  return (
    <FormShell title="Thêm phim">
      <div className="posterPreview">Avatar</div>
      <label>Tên phim<input defaultValue="Avatar" /></label>
      <label>Thể loại<select defaultValue="action"><option value="action">Hành động, Viễn tưởng</option></select></label>
      <label>Thời lượng (phút)<input defaultValue="162" /></label>
      <label>Ngày khởi chiếu<input defaultValue="2024-05-01" type="date" /></label>
      <label>Ngày kết thúc<input defaultValue="2024-06-01" type="date" /></label>
      <label>Đạo diễn<input defaultValue="James Cameron" /></label>
      <label>Diễn viên<textarea defaultValue="Sam Worthington, Zoe Saldana, Sigourney Weaver" /></label>
      <label>Mô tả<textarea defaultValue="Trạng thái đại dương và một cuộc phiêu lưu nhiệm màu." /></label>
      <div className="formActions"><button className="ghost" type="button">Hủy</button><button type="button">Lưu</button></div>
    </FormShell>
  );
}

export default MovieAdd;

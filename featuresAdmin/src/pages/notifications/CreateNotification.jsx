import {PageTitle} from '../../components/AdminMock';

function CreateNotification() {
  return (
    <section>
      <PageTitle title="Tạo thông báo" />
      <div className="panel notificationForm">
        <form className="formGrid">
          <label>
            Tiêu đề
            <input defaultValue="Khuyến mãi cuối tuần" />
          </label>
          <label>
            Nội dung
            <textarea defaultValue="Giảm 20% cho tất cả vé vào cuối tuần" />
          </label>
          <div className="audienceGroup">
            <span>Đối tượng</span>
            <label><input defaultChecked name="audience" type="radio" /> Tất cả</label>
            <label><input name="audience" type="radio" /> Thành viên VIP</label>
            <label><input name="audience" type="radio" /> Người dùng mới</label>
          </div>
          <label>
            Ảnh banner
            <input type="file" />
          </label>
          <div className="formActions">
            <button className="ghost" type="button">Hủy</button>
            <button type="button">Gửi ngay</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default CreateNotification;

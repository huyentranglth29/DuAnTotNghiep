import {PageTitle} from '../../components/AdminMock';

function CreateShowtime() {
  return (
    <section>
      <PageTitle title="Liên kết phim và suất chiếu" />
      <div className="showtimeCreate">
        <div className="panel showtimeFormCard">
          <div className="sectionHeader compact">
            <div>
              <h3>Thông tin suất chiếu</h3>
              <p>Chọn phim, phòng chiếu, thời gian và giá vé để mở bán.</p>
            </div>
          </div>
          <form className="showtimeForm">
            <label>
              Phim
              <select><option>Avatar</option><option>Avengers</option><option>Superman</option></select>
            </label>
            <label>
              Phòng chiếu
              <select><option>Phòng 01</option><option>Phòng 02</option><option>Phòng 03</option></select>
            </label>
            <label>
              Ngày chiếu
              <input defaultValue="2024-05-16" type="date" />
            </label>
            <label>
              Giờ chiếu
              <input defaultValue="19:00" type="time" />
            </label>
            <label>
              Giá vé
              <input defaultValue="120.000 đ" />
            </label>
            <label>
              Định dạng
              <select defaultValue="2d"><option value="2d">2D</option><option value="3d">3D</option><option value="imax">IMAX</option></select>
            </label>
            <label className="fullField">
              Ghi chú
              <textarea defaultValue="Suất chiếu tối, áp dụng giá vé tiêu chuẩn." />
            </label>
            <div className="formActions fullField">
              <button className="ghost" type="button">Hủy</button>
              <button type="button">Lưu</button>
            </div>
          </form>
        </div>

        <aside className="panel showtimeSummary">
          <h3>Tóm tắt</h3>
          <div className="moviePreview">
            <div className="miniPoster">Avatar</div>
            <div>
              <strong>Avatar</strong>
              <span>Hành động, Viễn tưởng</span>
              <small>162 phút • 2D</small>
            </div>
          </div>
          <div className="summaryGrid">
            <p><span>Phòng</span><strong>Phòng 01</strong></p>
            <p><span>Ngày</span><strong>16/05/2024</strong></p>
            <p><span>Giờ</span><strong>19:00</strong></p>
            <p><span>Giá vé</span><strong>120.000 đ</strong></p>
          </div>
          <div className="occupancy">
            <div>
              <strong>120</strong>
              <span>Ghế khả dụng</span>
            </div>
            <div>
              <strong>0</strong>
              <span>Vé đã bán</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateShowtime;

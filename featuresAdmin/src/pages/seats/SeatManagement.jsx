import {PageTitle} from '../../components/AdminMock';

const seatTypes = ['Ghế thường', 'Ghế VIP', 'Ghế đôi', 'Ghế hỏng'];

function SeatManagement() {
  return (
    <section>
      <PageTitle title="Quản lý ghế" />
      <div className="panel seatPanel">
        <div className="toolbar">
          <label>Phòng chiếu</label>
          <select defaultValue="p01"><option value="p01">Phòng 01</option></select>
        </div>
        <div className="screenLine">Màn hình</div>
        <div className="seatLayout">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map((row, rowIndex) => (
            <div className="seatRow" key={row}>
              <b>{row}</b>
              {Array.from({length: 12}, (_, index) => {
                const type = (rowIndex + index) % 17 === 0 ? 'broken' : (rowIndex + index) % 11 === 0 ? 'couple' : (rowIndex + index) % 5 === 0 ? 'vip' : 'normal';
                return <span className={`seat ${type}`} key={index}>{index + 1}</span>;
              })}
            </div>
          ))}
        </div>
        <div className="legend">
          {seatTypes.map(type => <span key={type}>{type}</span>)}
        </div>
        <button className="saveFloat" type="button">Lưu thay đổi</button>
      </div>
    </section>
  );
}

export default SeatManagement;

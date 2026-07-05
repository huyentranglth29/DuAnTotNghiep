import {PageTitle} from '../../components/AdminMock';

function CheckinResult() {
  return (
    <section>
      <PageTitle title="Kết quả checkin" />
      <div className="panel resultPanel">
        <div className="successBanner">✓ Checkin thành công</div>
        {[
          ['Mã vé', 'V001'],
          ['Khách hàng', 'Nguyễn Văn A'],
          ['Phim', 'Avatar'],
          ['Suất chiếu', '16/05/2024 - 19:00'],
          ['Phòng', 'Phòng 01'],
          ['Ghế', 'A5'],
        ].map(row => <p key={row[0]}><span>{row[0]}</span><strong>{row[1]}</strong></p>)}
        <button type="button">In vé</button>
      </div>
    </section>
  );
}

export default CheckinResult;

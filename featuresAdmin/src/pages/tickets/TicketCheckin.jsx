import {PageTitle, QRBlock} from '../../components/AdminMock';

function TicketCheckin() {
  return (
    <section>
      <PageTitle title="Checkin vé" />
      <div className="panel scanPanel">
        <div className="tabs"><button className="active" type="button">Quét mã</button><button type="button">Nhập mã</button></div>
        <div className="scanner">
          <QRBlock />
          <span>Đưa mã QR vào khung hình để quét</span>
        </div>
      </div>
    </section>
  );
}

export default TicketCheckin;

import {PageTitle, QRBlock} from '../../components/AdminMock';

function GenerateQR() {
  return (
    <section>
      <PageTitle title="Sinh QR / Barcode" />
      <div className="panel qrPage">
        <label>Mã vé<select><option>V001</option></select></label>
        <QRBlock />
        <div className="formActions">
          <button type="button">Tải xuống</button>
          <button className="ghost" type="button">In vé</button>
        </div>
      </div>
    </section>
  );
}

export default GenerateQR;

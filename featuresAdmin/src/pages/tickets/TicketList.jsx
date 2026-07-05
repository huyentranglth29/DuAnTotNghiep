import {DataTable, PageTitle, QRBlock, tickets} from '../../components/AdminMock';

function TicketList() {
  return (
    <section>
      <PageTitle title="Quản lý vé" />
      <DataTable
        headers={['Mã vé', 'Mã đơn', 'Khách hàng', 'Ghế', 'Trạng thái', 'QR']}
        rows={tickets.map(ticket => [...ticket, <QRBlock />])}
      />
    </section>
  );
}

export default TicketList;

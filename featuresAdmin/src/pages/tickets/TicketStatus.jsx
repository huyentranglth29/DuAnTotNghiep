import {DataTable, PageTitle, tickets} from '../../components/AdminMock';

function TicketStatus() {
  return (
    <section>
      <PageTitle title="Quản lý trạng thái vé" />
      <DataTable headers={['Mã vé', 'Khách hàng', 'Ghế', 'Trạng thái']} rows={tickets.map(item => [item[0], item[2], item[3], item[4]])} />
    </section>
  );
}

export default TicketStatus;

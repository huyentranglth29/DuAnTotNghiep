import {DataTable, PageTitle} from '../../components/AdminMock';

function VoucherList() {
  return (
    <section>
      <PageTitle title="Quản lý voucher" action="+ Thêm voucher" />
      <DataTable
        headers={['Mã voucher', 'Loại', 'Giá trị', 'Ngày hết hạn', 'Trạng thái']}
        rows={[
          ['WELCOME10', 'Giảm %', '10%', '31/05/2024', 'Hoạt động'],
          ['DISCOUNT50K', 'Giảm tiền', '50.000 đ', '31/05/2024', 'Hoạt động'],
          ['VIP20', 'Giảm %', '20%', '30/06/2024', 'Hoạt động'],
        ]}
      />
    </section>
  );
}

export default VoucherList;

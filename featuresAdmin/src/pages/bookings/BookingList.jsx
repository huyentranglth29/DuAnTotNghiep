import {bookings, DataTable, PageTitle, SearchBar} from '../../components/AdminMock';

function BookingList() {
  return (
    <section>
      <PageTitle title="Quản lý đơn đặt vé" />
      <SearchBar placeholder="Tìm kiếm đơn hàng..." />
      <DataTable
        headers={['Mã đơn', 'Khách hàng', 'Suất chiếu', 'Tổng tiền', 'Trạng thái']}
        rows={bookings}
      />
    </section>
  );
}

export default BookingList;

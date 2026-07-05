import {DataTable, PageTitle, SearchBar, users} from '../../components/AdminMock';

function UserList() {
  return (
    <section>
      <PageTitle title="Quản lý người dùng" action="+ Thêm người dùng" />
      <SearchBar placeholder="Tìm kiếm người dùng..." />
      <DataTable
        headers={['Họ tên', 'Email', 'SĐT', 'Vai trò', 'Trạng thái']}
        rows={users}
      />
    </section>
  );
}

export default UserList;

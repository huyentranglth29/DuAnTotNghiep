import userApi from '../../api/userApi';
import AdminListPage from '../../components/AdminListPage';

function UserList() {
  return (
    <AdminListPage
      title="Quản lý người dùng"
      api={userApi}
      searchPlaceholder="Tìm kiếm người dùng..."
      fields={[
        {name: 'fullName', label: 'Họ tên', required: true},
        {name: 'email', label: 'Email', type: 'email', required: true},
        {name: 'password', label: 'Mật khẩu mới', type: 'password'},
        {name: 'phone', label: 'SĐT'},
        {
          name: 'role',
          label: 'Vai trò',
          type: 'select',
          defaultValue: 'user',
          options: [
            {value: 'user', label: 'User'},
            {value: 'admin', label: 'Admin'},
          ],
        },
        {
          name: 'status',
          label: 'Trạng thái',
          type: 'select',
          defaultValue: 'active',
          options: [
            {value: 'active', label: 'Hoạt động'},
            {value: 'blocked', label: 'Khóa'},
          ],
        },
      ]}
      normalizeSubmit={(payload, editingItem) => {
        if (editingItem && !payload.password) {
          delete payload.password;
        }
        return payload;
      }}
      columns={[
        {key: 'fullName', title: 'Họ tên'},
        {key: 'email', title: 'Email'},
        {key: 'phone', title: 'SĐT'},
        {key: 'role', title: 'Vai trò'},
        {key: 'status', title: 'Trạng thái'},
      ]}
    />
  );
}

export default UserList;

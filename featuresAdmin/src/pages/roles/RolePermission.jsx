import {useEffect, useMemo, useState} from 'react';
import userApi from '../../api/userApi';
import {PageTitle} from '../../components/AdminUi';
import Table from '../../components/Table';

function RolePermission() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    userApi.getAll({limit: 100})
      .then(response => setUsers(Array.isArray(response) ? response : response.data || []))
      .catch(err => setError(err.message || 'Không tải được phân quyền.'));
  }, []);

  const summary = useMemo(() => {
    const adminCount = users.filter(user => user.role === 'admin').length;
    const userCount = users.filter(user => user.role === 'user').length;
    const blockedCount = users.filter(user => user.status === 'blocked').length;
    return {adminCount, userCount, blockedCount};
  }, [users]);

  return (
    <section>
      <PageTitle title="Phân quyền tài khoản" />
      {error && <p className="loginError">{error}</p>}
      <div className="metricGrid">
        <article className="metricCard"><span>Admin</span><strong>{summary.adminCount}</strong></article>
        <article className="metricCard"><span>User</span><strong>{summary.userCount}</strong></article>
        <article className="metricCard"><span>Bị khóa</span><strong>{summary.blockedCount}</strong></article>
        <article className="metricCard"><span>Tổng tài khoản</span><strong>{users.length}</strong></article>
      </div>
      <div className="panel">
        <h3>Vai trò lấy từ collection users</h3>
        <Table
          columns={[
            {key: 'fullName', title: 'Họ tên'},
            {key: 'email', title: 'Email'},
            {key: 'role', title: 'Vai trò'},
            {key: 'status', title: 'Trạng thái'},
          ]}
          data={users}
        />
      </div>
    </section>
  );
}

export default RolePermission;

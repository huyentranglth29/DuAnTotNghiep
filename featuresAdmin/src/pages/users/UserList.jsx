import {useCallback, useEffect, useMemo, useState} from 'react';
import {
  Eye,
  FileSpreadsheet,
  Lock,
  Mail,
  Pencil,
  RefreshCw,
  Search,
  Unlock,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import userApi from '../../api/userApi';
import {formatDate, formatDateTime, formatVnd} from '../../utils/adminFormatters';

const SORT_OPTIONS = [
  {value: 'newest', label: 'Người mới nhất'},
  {value: 'oldest', label: 'Người cũ nhất'},
  {value: 'mostTickets', label: 'Tổng vé mua nhiều nhất'},
  {value: 'highestSpend', label: 'Chi tiêu cao nhất'},
];

function GoogleIcon({size = 18}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const STAT_CARDS = [
  {
    key: 'total',
    label: 'Tổng người dùng',
    valueKey: 'totalUsers',
    tone: 'blue',
    Icon: Users,
    filter: {provider: '', status: '', role: '', online: ''},
  },
  {
    key: 'active',
    label: 'Hoạt động',
    valueKey: 'activeUsers',
    tone: 'green',
    Icon: UserCheck,
    filter: {provider: '', status: '', role: '', online: '1'},
  },
  {
    key: 'locked',
    label: 'Đã khóa',
    valueKey: 'lockedUsers',
    tone: 'red',
    Icon: Lock,
    filter: {provider: '', status: 'blocked', role: '', online: ''},
  },
  {
    key: 'google',
    label: 'Đăng nhập Google',
    valueKey: 'googleUsers',
    tone: 'orange',
    Icon: GoogleIcon,
    filter: {provider: 'google', status: '', role: '', online: ''},
  },
  {
    key: 'email',
    label: 'Đăng nhập Email',
    valueKey: 'emailUsers',
    tone: 'purple',
    Icon: Mail,
    filter: {provider: 'local', status: '', role: '', online: ''},
  },
];

function ProviderBadge({provider}) {
  const isGoogle = provider === 'google';
  return (
    <span className={`userBadge ${isGoogle ? 'userBadge--google' : 'userBadge--email'}`}>
      {isGoogle ? 'Google' : 'Email'}
    </span>
  );
}

function formatLastActive(lastSeen) {
  if (!lastSeen) return 'Chưa hoạt động';
  const at = new Date(lastSeen).getTime();
  if (Number.isNaN(at)) return 'Chưa hoạt động';

  const diffMs = Math.max(0, Date.now() - at);
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} ngày trước`;

  return formatDateTime(lastSeen);
}

function StatusBadge({status, isOnline, lastSeen}) {
  if (status === 'blocked') {
    return <span className="userBadge userBadge--danger">Bị khóa</span>;
  }
  if (isOnline) {
    return <span className="userBadge userBadge--online">Đang online</span>;
  }
  return (
    <span className="userStatusCell" title={lastSeen ? formatDateTime(lastSeen) : ''}>
      <span className="userBadge userBadge--offline">Offline</span>
      <small className="userLastSeen">{formatLastActive(lastSeen)}</small>
    </span>
  );
}

function RoleBadge({role}) {
  const isAdmin = role === 'admin';
  return (
    <span className={`userBadge ${isAdmin ? 'userBadge--admin' : 'userBadge--user'}`}>
      {isAdmin ? 'Admin' : 'User'}
    </span>
  );
}

function Avatar({user, size = 40}) {
  const letter = (user?.fullName || user?.email || 'U').trim().charAt(0).toUpperCase();
  if (user?.avatar) {
    return (
      <img
        className="userAvatar"
        src={user.avatar}
        alt=""
        style={{width: size, height: size}}
      />
    );
  }
  return (
    <span className="userAvatarFallback" style={{width: size, height: size, fontSize: size * 0.4}}>
      {letter}
    </span>
  );
}

function UserList() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    lockedUsers: 0,
    googleUsers: 0,
    emailUsers: 0,
  });
  const [pagination, setPagination] = useState({page: 1, totalPages: 1, total: 0, limit: 10});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [filters, setFilters] = useState({
    keyword: '',
    provider: '',
    status: '',
    role: '',
    sort: 'newest',
    online: '',
  });

  const [lockModal, setLockModal] = useState(null);
  const [lockReason, setLockReason] = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [acting, setActing] = useState(false);

  const queryParams = useMemo(
    () => ({
      page: pagination.page,
      limit: pagination.limit,
      keyword: filters.keyword || undefined,
      provider: filters.provider || undefined,
      status: filters.status || undefined,
      role: filters.role || undefined,
      online: filters.online || undefined,
      sort: filters.sort || 'newest',
    }),
    [filters, pagination.page, pagination.limit],
  );

  const loadStats = useCallback(async () => {
    try {
      const response = await userApi.getStats();
      setStats(response?.data || response || {});
    } catch {
      /* giữ stats cũ */
    }
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await userApi.getAll(queryParams);
      setUsers(response?.data || []);
      if (response?.pagination) {
        setPagination(current => ({...current, ...response.pagination}));
      }
    } catch (err) {
      setError(err.message || 'Không tải được danh sách người dùng');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [queryParams]);

  useEffect(() => {
    loadStats();
    const timer = setInterval(() => {
      loadStats();
      loadUsers();
    }, 30000);
    return () => clearInterval(timer);
  }, [loadStats, loadUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openDetail = async user => {
    setSelected(user);
    setDetailLoading(true);
    try {
      const response = await userApi.getById(user._id);
      setSelected(response?.data || response);
    } catch (err) {
      setError(err.message || 'Không tải được chi tiết');
    } finally {
      setDetailLoading(false);
    }
  };

  const updateFilters = patch => {
    setFilters(current => ({...current, ...patch}));
    setPagination(current => ({...current, page: 1}));
  };

  const applyStatFilter = card => {
    if (!card?.filter) return;
    setFilters(current => ({
      ...current,
      ...card.filter,
    }));
    setPagination(current => ({...current, page: 1}));
    setSelected(null);
  };

  const isStatActive = card => {
    if (!card?.filter) return false;
    return (
      (filters.provider || '') === (card.filter.provider || '') &&
      (filters.status || '') === (card.filter.status || '') &&
      (filters.role || '') === (card.filter.role || '') &&
      (filters.online || '') === (card.filter.online || '')
    );
  };

  const refresh = async () => {
    await Promise.all([loadStats(), loadUsers()]);
    if (selected?._id) {
      openDetail(selected);
    }
  };

  const exportExcel = async () => {
    try {
      const response = await userApi.exportRows({
        keyword: filters.keyword || undefined,
        provider: filters.provider || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined,
        sort: filters.sort || 'newest',
      });
      const rows = response?.data || [];
      const header = ['Họ tên', 'Email', 'SĐT', 'Provider', 'Tổng vé', 'Tổng tiền', 'Trạng thái'];
      const lines = [
        header.join(','),
        ...rows.map(row =>
          [
            `"${String(row.fullName || '').replace(/"/g, '""')}"`,
            `"${String(row.email || '').replace(/"/g, '""')}"`,
            `"${String(row.phone || '').replace(/"/g, '""')}"`,
            row.provider === 'google' ? 'Google' : 'Email',
            row.totalTickets ?? 0,
            row.totalSpent ?? 0,
            `"${String(row.status || '').replace(/"/g, '""')}"`,
          ].join(','),
        ),
      ];
      const blob = new Blob([`\uFEFF${lines.join('\n')}`], {
        type: 'text/csv;charset=utf-8;',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nguoi-dung-${Date.now()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      window.alert(err.message || 'Export thất bại');
    }
  };

  const submitLock = async () => {
    if (!lockModal?._id) return;
    const reason = lockReason.trim();
    if (!reason) {
      window.alert('Vui lòng nhập lý do khóa');
      return;
    }
    setActing(true);
    try {
      await userApi.lock(lockModal._id, {reason});
      setLockModal(null);
      setLockReason('');
      await refresh();
    } catch (err) {
      window.alert(err.message || 'Khóa thất bại');
    } finally {
      setActing(false);
    }
  };

  const submitUnlock = async user => {
    const ok = window.confirm(`Mở khóa tài khoản ${user.fullName || user.email}?`);
    if (!ok) return;
    setActing(true);
    try {
      await userApi.unlock(user._id);
      await refresh();
    } catch (err) {
      window.alert(err.message || 'Mở khóa thất bại');
    } finally {
      setActing(false);
    }
  };

  const openEdit = user => {
    setEditForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      gender: user.gender || '',
      birthDate: user.birthDate ? String(user.birthDate).slice(0, 10) : '',
      role: user.role || 'user',
    });
    setEditModal(user);
  };

  const submitEdit = async () => {
    if (!editModal?._id) return;
    if (!editForm.fullName.trim()) {
      window.alert('Họ tên không được để trống');
      return;
    }
    setActing(true);
    try {
      await userApi.update(editModal._id, {
        fullName: editForm.fullName.trim(),
        phone: editForm.phone.trim(),
        gender: editForm.gender,
        birthDate: editForm.birthDate || null,
        role: editForm.role,
      });
      setEditModal(null);
      await refresh();
    } catch (err) {
      window.alert(err.message || 'Cập nhật thất bại');
    } finally {
      setActing(false);
    }
  };

  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages || 1;
    const current = pagination.page || 1;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    return Array.from({length: end - start + 1}, (_, i) => start + i);
  }, [pagination.page, pagination.totalPages]);

  return (
    <section className={`userManagePage ${selected ? 'has-panel' : ''}`}>
      <div className="userManageMain">
        <header className="userManageHeader">
          <div>
            <h2>Quản lý người dùng</h2>
            <p>Theo dõi tài khoản Email / Google, trạng thái và chi tiêu thực tế từ MongoDB.</p>
          </div>
          <div className="userManageActions">
            <button type="button" className="userBtnGhost" onClick={exportExcel}>
              <FileSpreadsheet size={16} />
              Xuất Excel
            </button>
            <button type="button" className="userBtnGhost" onClick={refresh}>
              <RefreshCw size={16} />
              Làm mới
            </button>
          </div>
        </header>

        <div className="userStatGrid">
          {STAT_CARDS.map(card => {
            const Icon = card.Icon;
            const clickable = Boolean(card.filter);
            const active = isStatActive(card);
            return (
              <button
                key={card.key}
                type="button"
                className={`userStatCard userStatCard--${card.tone}${
                  clickable ? ' is-clickable' : ''
                }${active ? ' is-active' : ''}`}
                onClick={() => applyStatFilter(card)}
                disabled={!clickable}
              >
                <span className={`userStatIcon userStatIcon--${card.tone}`}>
                  <Icon size={18} />
                </span>
                <div className="userStatText">
                  <span>{card.label}</span>
                  <strong>{Number(stats[card.valueKey] || 0).toLocaleString('vi-VN')}</strong>
                </div>
              </button>
            );
          })}
        </div>

        <div className="userFilterBar">
          <label className="userSearch">
            <Search size={16} />
            <input
              value={filters.keyword}
              onChange={event => updateFilters({keyword: event.target.value})}
              placeholder="Tìm tên, email, số điện thoại..."
            />
          </label>
          <select
            value={filters.provider}
            onChange={event => updateFilters({provider: event.target.value})}
          >
            <option value="">Phương thức đăng nhập</option>
            <option value="local">Email</option>
            <option value="google">Google</option>
          </select>
          <select
            value={filters.status}
            onChange={event =>
              updateFilters({status: event.target.value, online: ''})
            }
          >
            <option value="">Trạng thái tài khoản</option>
            <option value="active">Không khóa</option>
            <option value="blocked">Khóa</option>
          </select>
          <select
            value={filters.role}
            onChange={event => updateFilters({role: event.target.value})}
          >
            <option value="">Vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <select
            value={filters.sort}
            onChange={event => updateFilters({sort: event.target.value})}
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {error ? <p className="userError">{error}</p> : null}

        <div className="userTableCard">
          <div className="userTableWrap">
            <table className="userTable">
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Đăng nhập</th>
                  <th>Ngày tạo</th>
                  <th>Tổng vé</th>
                  <th>Tổng chi</th>
                  <th>Trạng thái</th>
                  <th>Vai trò</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="userEmpty">
                      Đang tải...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="userEmpty">
                      Không có người dùng phù hợp
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <tr
                      key={user._id}
                      className={selected?._id === user._id ? 'is-active' : ''}
                      onClick={() => openDetail(user)}
                    >
                      <td>
                        <Avatar user={user} />
                      </td>
                      <td>
                        <strong>{user.fullName || '—'}</strong>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>{user.phone || '—'}</td>
                      <td>
                        <ProviderBadge provider={user.provider || user.authProvider} />
                      </td>
                      <td>{formatDate(user.createdAt) || '—'}</td>
                      <td>{user.totalTickets ?? 0}</td>
                      <td>{formatVnd(user.totalSpent)}</td>
                      <td>
                        <StatusBadge
                          status={user.status}
                          isOnline={user.isOnline}
                          lastSeen={user.lastSeen}
                        />
                      </td>
                      <td>
                        <RoleBadge role={user.role} />
                      </td>
                      <td onClick={event => event.stopPropagation()}>
                        <div className="userRowActions">
                          <button
                            type="button"
                            className="userIconBtn"
                            title="Xem"
                            onClick={() => openDetail(user)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            className="userIconBtn"
                            title="Sửa"
                            onClick={() => openEdit(user)}
                          >
                            <Pencil size={16} />
                          </button>
                          {user.status === 'blocked' ? (
                            <button
                              type="button"
                              className="userIconBtn"
                              title="Mở khóa"
                              disabled={acting}
                              onClick={() => submitUnlock(user)}
                            >
                              <Unlock size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="userIconBtn"
                              title="Khóa"
                              disabled={acting}
                              onClick={() => {
                                setLockReason('');
                                setLockModal(user);
                              }}
                            >
                              <Lock size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <footer className="userPagination">
            <span>
              Hiển thị{' '}
              {users.length
                ? `${(pagination.page - 1) * pagination.limit + 1} đến ${
                    (pagination.page - 1) * pagination.limit + users.length
                  }`
                : 0}{' '}
              của {pagination.total || 0} người dùng
            </span>
            <div>
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination(current => ({...current, page: current.page - 1}))}
              >
                ‹
              </button>
              {pageNumbers.map(page => (
                <button
                  key={page}
                  type="button"
                  className={page === pagination.page ? 'is-active' : ''}
                  onClick={() => setPagination(current => ({...current, page}))}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(current => ({...current, page: current.page + 1}))}
              >
                ›
              </button>
            </div>
          </footer>
        </div>
      </div>

      {selected ? (
        <aside className="userDetailPanel">
          <div className="userDetailHead">
            <div className="userDetailProfile">
              <Avatar user={selected} size={64} />
              <div>
                <strong>{selected.fullName || '—'}</strong>
                <StatusBadge
                  status={selected.status}
                  isOnline={selected.isOnline}
                  lastSeen={selected.lastSeen}
                />
                <p>{selected.email}</p>
              </div>
            </div>
            <button type="button" className="userIconBtn" onClick={() => setSelected(null)}>
              <X size={16} />
            </button>
          </div>

          {detailLoading ? <p className="userMuted">Đang tải chi tiết...</p> : null}

          <h4>Thông tin cá nhân</h4>
          <div className="userDetailGrid">
            <div>
              <span>SĐT</span>
              <strong>{selected.phone || '—'}</strong>
            </div>
            <div>
              <span>Giới tính</span>
              <strong>{selected.gender || '—'}</strong>
            </div>
            <div>
              <span>Ngày sinh</span>
              <strong>{formatDate(selected.birthDate) || '—'}</strong>
            </div>
          </div>

          <h4>Thông tin tài khoản</h4>
          <div className="userDetailGrid">
            <div>
              <span>Provider</span>
              <strong>
                <ProviderBadge provider={selected.provider || selected.authProvider} />
              </strong>
            </div>
            <div>
              <span>Google ID</span>
              <strong>{selected.googleId || '—'}</strong>
            </div>
            <div>
              <span>Ngày tạo</span>
              <strong>{formatDateTime(selected.createdAt) || '—'}</strong>
            </div>
            <div>
              <span>Lần đăng nhập cuối</span>
              <strong>{formatDateTime(selected.lastLogin) || 'Chưa có'}</strong>
            </div>
            {selected.status === 'blocked' ? (
              <div>
                <span>Lý do khóa</span>
                <strong>{selected.lockedReason || '—'}</strong>
              </div>
            ) : null}
          </div>

          <h4>Thống kê</h4>
          <div className="userDetailStats">
            <div>
              <span>Tổng đơn hàng</span>
              <strong>{selected.totalOrders ?? 0}</strong>
            </div>
            <div>
              <span>Tổng vé</span>
              <strong>{selected.totalTickets ?? 0}</strong>
            </div>
            <div>
              <span>Tổng tiền đã chi</span>
              <strong>{formatVnd(selected.totalSpent)}</strong>
            </div>
            <div>
              <span>Điểm thưởng</span>
              <strong>{selected.rewardPoints ?? 0}</strong>
            </div>
            <div>
              <span>Voucher đang có</span>
              <strong>{selected.availableVouchers ?? 0}</strong>
            </div>
          </div>

          <h4>Lịch sử gần đây</h4>
          <div className="userRecentList">
            {(selected.recentOrders || []).length === 0 ? (
              <p className="userMuted">Chưa có đơn hàng</p>
            ) : (
              selected.recentOrders.map(order => (
                <article key={order._id || order.code}>
                  <strong>{order.code || 'Đơn'}</strong>
                  <span>{order.movieTitle}</span>
                  <span>
                    {order.ticketCount || 0} vé · {formatVnd(order.totalPrice)} · {order.status}
                  </span>
                  <small>{formatDateTime(order.createdAt)}</small>
                </article>
              ))
            )}
          </div>

          <div className="userDetailFooter">
            {selected.status === 'blocked' ? (
              <button
                type="button"
                className="userBtnGhost"
                disabled={acting}
                onClick={() => submitUnlock(selected)}
              >
                <Unlock size={16} />
                Mở khóa
              </button>
            ) : (
              <button
                type="button"
                className="userBtnDanger"
                disabled={acting}
                onClick={() => {
                  setLockReason('');
                  setLockModal(selected);
                }}
              >
                <Lock size={16} />
                Khóa tài khoản
              </button>
            )}
            <button type="button" className="userBtnGhost" onClick={() => openEdit(selected)}>
              <Pencil size={16} />
              Chỉnh sửa
            </button>
          </div>
        </aside>
      ) : null}

      {lockModal ? (
        <div className="userModalOverlay" role="dialog" aria-modal="true">
          <div className="userModal">
            <h3>Khóa tài khoản</h3>
            <p>
              Khóa <strong>{lockModal.fullName || lockModal.email}</strong>. Người dùng sẽ không
              đăng nhập được và JWT hiện tại cũng bị từ chối.
            </p>
            <label>
              Lý do khóa
              <textarea
                value={lockReason}
                onChange={event => setLockReason(event.target.value)}
                placeholder="Nhập lý do khóa..."
                rows={4}
              />
            </label>
            <div className="userModalActions">
              <button
                type="button"
                className="userBtnGhost"
                onClick={() => setLockModal(null)}
                disabled={acting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="userBtnDanger"
                onClick={submitLock}
                disabled={acting}
              >
                Xác nhận khóa
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editModal ? (
        <div className="userModalOverlay" role="dialog" aria-modal="true">
          <div className="userModal">
            <h3>Chỉnh sửa người dùng</h3>
            <label>
              Họ tên
              <input
                value={editForm.fullName}
                onChange={event =>
                  setEditForm(current => ({...current, fullName: event.target.value}))
                }
              />
            </label>
            <label>
              Email (không sửa)
              <input value={editModal.email || ''} disabled />
            </label>
            <label>
              SĐT
              <input
                value={editForm.phone}
                onChange={event =>
                  setEditForm(current => ({...current, phone: event.target.value}))
                }
              />
            </label>
            <label>
              Giới tính
              <select
                value={editForm.gender}
                onChange={event =>
                  setEditForm(current => ({...current, gender: event.target.value}))
                }
              >
                <option value="">—</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
                <option value="Khác">Khác</option>
              </select>
            </label>
            <label>
              Ngày sinh
              <input
                type="date"
                value={editForm.birthDate}
                onChange={event =>
                  setEditForm(current => ({...current, birthDate: event.target.value}))
                }
              />
            </label>
            <label>
              Vai trò
              <select
                value={editForm.role}
                onChange={event =>
                  setEditForm(current => ({...current, role: event.target.value}))
                }
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <div className="userModalActions">
              <button
                type="button"
                className="userBtnGhost"
                onClick={() => setEditModal(null)}
                disabled={acting}
              >
                Hủy
              </button>
              <button
                type="button"
                className="userBtnPrimary"
                onClick={submitEdit}
                disabled={acting}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default UserList;

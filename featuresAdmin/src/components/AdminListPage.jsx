import {useEffect, useState} from 'react';
import {Link} from 'react-router-dom';
import Modal from './Modal';
import Table from './Table';

function AdminListPage({
  title,
  api,
  columns,
  addTo,
  addLabel = '+ Thêm mới',
  searchPlaceholder = 'Tìm kiếm...',
  fields = [],
  fieldOptions = {},
  normalizeSubmit,
}) {
  const [items, setItems] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadData = async (nextPage = page, nextKeyword = keyword) => {
    setLoading(true);
    setError('');

    try {
      const response = await api.getAll({
        page: nextPage,
        limit: 10,
        keyword: nextKeyword || undefined,
      });

      if (Array.isArray(response)) {
        setItems(response);
        setPagination(null);
      } else {
        setItems(response?.data || []);
        setPagination(response?.pagination || null);
      }
    } catch (err) {
      setError(err.message || 'Không tải được dữ liệu.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(1, '');
  }, []);

  const handleSearch = event => {
    event.preventDefault();
    setPage(1);
    loadData(1, keyword);
  };

  const handleDelete = async item => {
    const ok = window.confirm('Bạn có chắc muốn xóa dữ liệu này?');
    if (!ok) return;

    try {
      await api.remove(item._id || item.id);
      loadData(page, keyword);
    } catch (err) {
      window.alert(err.message || 'Xóa thất bại.');
    }
  };

  const getInitialForm = item => {
    const nextForm = {};

    fields.forEach(field => {
      let value = item?.[field.name];
      if (field.ref && value && typeof value === 'object') {
        value = value._id || value.id || '';
      }
      if (field.array && Array.isArray(value)) {
        value = value
          .map(entry => (entry && typeof entry === 'object' ? entry._id || entry.id : entry))
          .filter(Boolean);
      }
      if (field.type === 'date' && value) {
        nextForm[field.name] = new Date(value).toISOString().slice(0, 10);
      } else if (field.type === 'datetime-local' && value) {
        nextForm[field.name] = new Date(value).toISOString().slice(0, 16);
      } else if (Array.isArray(value)) {
        nextForm[field.name] = value.join(', ');
      } else {
        nextForm[field.name] = value ?? field.defaultValue ?? '';
      }
    });

    return nextForm;
  };

  const openCreate = () => {
    setEditingItem(null);
    setForm(getInitialForm(null));
    setModalOpen(true);
  };

  const openEdit = item => {
    setEditingItem(item);
    setForm(getInitialForm(item));
    setModalOpen(true);
  };

  const updateForm = (name, value) => {
    setForm(current => ({...current, [name]: value}));
  };

  const buildPayload = () => {
    const payload = {};

    fields.forEach(field => {
      let value = form[field.name];

      if (field.type === 'number') {
        value = value === '' ? undefined : Number(value);
      }

      if (field.array) {
        value = String(value || '')
          .split(',')
          .map(item => item.trim())
          .filter(Boolean);
      }

      if (field.type === 'date' && value) {
        value = new Date(value);
      }

      if (value !== undefined && value !== '') {
        payload[field.name] = value;
      }
    });

    return normalizeSubmit ? normalizeSubmit(payload, editingItem) : payload;
  };

  const handleSave = async event => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = buildPayload();
      if (editingItem) {
        await api.update(editingItem._id || editingItem.id, payload);
      } else {
        await api.create(payload);
      }
      setModalOpen(false);
      loadData(page, keyword);
    } catch (err) {
      window.alert(err.message || 'Lưu dữ liệu thất bại.');
    } finally {
      setSaving(false);
    }
  };

  const tableColumns = [
    ...columns,
    {
      key: 'actions',
      title: 'Hành động',
      render: item => (
        <div className="actionGroup">
          <button type="button" onClick={() => openEdit(item)} disabled={fields.length === 0}>
            Sửa
          </button>
          <button type="button" onClick={() => handleDelete(item)}>
            Xóa
          </button>
        </div>
      ),
    },
  ];

  const totalPages = pagination?.totalPages || 1;

  return (
    <section>
      <div className="pageTitle">
        <h2>{title}</h2>
        {fields.length > 0 ? (
          <button type="button" onClick={openCreate}>{addLabel}</button>
        ) : (
          addTo && <Link to={addTo}>{addLabel}</Link>
        )}
      </div>

      <form className="toolbar" onSubmit={handleSearch}>
        <input
          placeholder={searchPlaceholder}
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
        />
        <button type="submit">Tìm kiếm</button>
        <button className="ghost" type="button" onClick={() => {
          setKeyword('');
          setPage(1);
          loadData(1, '');
        }}>
          Tải lại
        </button>
      </form>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <Table columns={tableColumns} data={items} emptyText="Không có dữ liệu" />
      )}

      {pagination && (
        <div className="formActions">
          <button
            className="ghost"
            type="button"
            disabled={page <= 1}
            onClick={() => {
              const nextPage = Math.max(1, page - 1);
              setPage(nextPage);
              loadData(nextPage, keyword);
            }}
          >
            Trước
          </button>
          <span>{page}/{totalPages}</span>
          <button
            className="ghost"
            type="button"
            disabled={page >= totalPages}
            onClick={() => {
              const nextPage = Math.min(totalPages, page + 1);
              setPage(nextPage);
              loadData(nextPage, keyword);
            }}
          >
            Sau
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingItem ? `Sửa ${title.toLowerCase()}` : addLabel}
        onClose={() => setModalOpen(false)}
      >
        <form className="formGrid" onSubmit={handleSave}>
          {fields.map(field => (
            <label key={field.name}>
              {field.label}
              {field.type === 'multiselect' ? (
                <select
                  multiple
                  value={Array.isArray(form[field.name]) ? form[field.name] : String(form[field.name] || '').split(',').filter(Boolean)}
                  onChange={event => updateForm(
                    field.name,
                    Array.from(event.target.selectedOptions).map(option => option.value),
                  )}
                  required={field.required}
                >
                  {(field.options || fieldOptions[field.name] || []).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'select' ? (
                <select
                  value={form[field.name] ?? ''}
                  onChange={event => updateForm(field.name, event.target.value)}
                  required={field.required}
                >
                  <option value="">Chọn...</option>
                  {(field.options || fieldOptions[field.name] || []).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={form[field.name] ?? ''}
                  onChange={event => updateForm(field.name, event.target.value)}
                  required={field.required}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  value={form[field.name] ?? ''}
                  onChange={event => updateForm(field.name, event.target.value)}
                  required={field.required}
                />
              )}
            </label>
          ))}
          <div className="formActions">
            <button className="ghost" type="button" onClick={() => setModalOpen(false)}>
              Hủy
            </button>
            <button type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}

export default AdminListPage;

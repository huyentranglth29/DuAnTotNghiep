import {useCallback, useEffect, useMemo, useState} from 'react';
import genreApi from '../../api/genreApi';
import {PageTitle} from '../../components/AdminUi';

const emptyForm = {name: '', status: 'active'};

function CategoryList() {
  const [genres, setGenres] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadGenres = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await genreApi.getAll({limit: 500, sort: 'name'});
      setGenres(response?.data || response || []);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách thể loại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGenres();
  }, [loadGenres]);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase('vi');
    if (!query) return genres;
    return genres.filter(item => item.name.toLocaleLowerCase('vi').includes(query));
  }, [genres, keyword]);

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const submit = async event => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editing) await genreApi.update(editing._id, form);
      else await genreApi.create(form);
      resetForm();
      await loadGenres();
    } catch (err) {
      setError(err.message || 'Không lưu được thể loại.');
    } finally {
      setSaving(false);
    }
  };

  const edit = item => {
    setEditing(item);
    setForm({name: item.name, status: item.status});
  };

  const remove = async item => {
    if (!window.confirm(`Xóa thể loại “${item.name}”?`)) return;
    try {
      await genreApi.remove(item._id);
      await loadGenres();
    } catch (err) {
      window.alert(err.message || 'Không thể xóa thể loại.');
    }
  };

  return (
    <section className="genrePage">
      <PageTitle title="Thể loại phim" />
      <div className="genreLayout">
        <form className="genreEditor" onSubmit={submit}>
          <div>
            <p className="genreEyebrow">DANH MỤC PHIM</p>
            <h2>{editing ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}</h2>
            <p>Thể loại sau khi tạo sẽ xuất hiện trong form Thêm/Sửa phim.</p>
          </div>
          <label>
            Tên thể loại
            <input
              autoFocus
              value={form.name}
              onChange={event => setForm(current => ({...current, name: event.target.value}))}
              placeholder="Ví dụ: Phiêu lưu"
              required
            />
          </label>
          <label>
            Trạng thái
            <select
              value={form.status}
              onChange={event => setForm(current => ({...current, status: event.target.value}))}>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm tắt</option>
            </select>
          </label>
          {error && <p className="genreError">{error}</p>}
          <div className="genreFormActions">
            {editing && <button type="button" className="genreCancel" onClick={resetForm}>Hủy</button>}
            <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : editing ? 'Cập nhật' : '+ Thêm thể loại'}</button>
          </div>
        </form>

        <div className="genrePanel">
          <div className="genrePanelHead">
            <div><h2>Danh sách thể loại</h2><p>{genres.length} thể loại trong hệ thống</p></div>
            <input value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Tìm thể loại..." />
          </div>
          <div className="genreTableWrap">
            <table className="genreTable">
              <thead><tr><th>Tên thể loại</th><th>Số phim</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item._id}>
                    <td><strong>{item.name}</strong><small>{item.slug}</small></td>
                    <td>{item.movieCount || 0} phim</td>
                    <td><span className={`genreStatus genreStatus--${item.status}`}>{item.status === 'active' ? 'Đang hoạt động' : 'Tạm tắt'}</span></td>
                    <td><div className="genreActions"><button type="button" onClick={() => edit(item)}>Sửa</button><button type="button" className="danger" onClick={() => remove(item)}>Xóa</button></div></td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && <tr><td colSpan={4} className="genreEmpty">Chưa có thể loại phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
          {loading && <p className="genreLoading">Đang tải thể loại...</p>}
        </div>
      </div>
    </section>
  );
}

export default CategoryList;

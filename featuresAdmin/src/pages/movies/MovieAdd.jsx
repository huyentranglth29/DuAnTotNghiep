import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import movieApi from '../../api/movieApi';
import genreApi from '../../api/genreApi';
import {PageTitle} from '../../components/AdminUi';

const initialForm = {
  title: '',
  genre: [],
  duration: '',
  expectedReleaseDate: '',
  publishedAt: '',
  ticketSaleStartAt: '',
  announceUpcoming: false,
  director: '',
  cast: '',
  synopsis: '',
  posterUrl: '',
  backdropUrl: '',
  price: '',
  status: 'draft',
  ageRating: '',
};

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function MovieAdd() {
  const navigate = useNavigate();
  const {id} = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [genreOptions, setGenreOptions] = useState([]);
  const [genreLoading, setGenreLoading] = useState(true);
  const [newGenreName, setNewGenreName] = useState('');
  const [addingGenre, setAddingGenre] = useState(false);

  const loadGenres = async () => {
    setGenreLoading(true);
    try {
      const response = await genreApi.getAll({limit: 500, sort: 'name'});
      setGenreOptions((response?.data || response || []).filter(item => item.status === 'active'));
    } catch (err) {
      setError(err.message || 'Không tải được danh sách thể loại.');
    } finally {
      setGenreLoading(false);
    }
  };

  useEffect(() => {
    loadGenres();
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await movieApi.getById(id);
        const movie = response?.data || response;
        if (cancelled || !movie) return;
        setForm({
          title: movie.title || '',
          genre: Array.isArray(movie.genre)
            ? movie.genre.filter(Boolean)
            : String(movie.genre || '').split(/[,/|]/).map(item => item.trim()).filter(Boolean),
          duration:
            typeof movie.duration === 'number'
              ? String(movie.duration)
              : String(movie.duration || '').replace(/[^\d]/g, '') || '',
          expectedReleaseDate: toDateInput(movie.expectedReleaseDate || movie.releaseDate),
          publishedAt: toDateTimeInput(movie.publishedAt),
          ticketSaleStartAt: toDateTimeInput(movie.ticketSaleStartAt),
          announceUpcoming: ['coming-soon', 'coming_soon'].includes(movie.status) || Boolean(movie.expectedReleaseDate),
          director: movie.director || '',
          cast: Array.isArray(movie.cast)
            ? movie.cast
                .map(item => (typeof item === 'object' ? item.name || '' : item))
                .filter(Boolean)
                .join(', ')
            : movie.cast || '',
          synopsis: movie.synopsis || movie.description || '',
          posterUrl: movie.posterUrl || movie.poster || '',
          backdropUrl: movie.backdropUrl || '',
          price: movie.price != null ? String(movie.price) : '',
          status: movie.status === 'coming_soon' ? 'coming-soon' : movie.status || 'draft',
          ageRating: movie.ageRating || '',
        });
      } catch (err) {
        if (!cancelled) setError(err.message || 'Không tải được thông tin phim.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const updateForm = (name, value) => {
    setForm(current => ({...current, [name]: value}));
  };

  const toggleGenre = name => {
    setForm(current => ({
      ...current,
      genre: current.genre.includes(name)
        ? current.genre.filter(item => item !== name)
        : [...current.genre, name],
    }));
  };

  const addGenreQuickly = async () => {
    const name = newGenreName.trim();
    if (!name || addingGenre) return;
    setAddingGenre(true);
    setError('');
    try {
      const response = await genreApi.create({name, status: 'active'});
      const created = response?.data || response;
      setGenreOptions(current =>
        [...current.filter(item => item._id !== created._id), created].sort((a, b) =>
          a.name.localeCompare(b.name, 'vi'),
        ),
      );
      setForm(current => ({
        ...current,
        genre: current.genre.includes(created.name)
          ? current.genre
          : [...current.genre, created.name],
      }));
      setNewGenreName('');
    } catch (err) {
      setError(err.message || 'Không thêm được thể loại mới.');
    } finally {
      setAddingGenre(false);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (form.announceUpcoming) {
        const publishAt = new Date(form.publishedAt);
        const saleAt = new Date(form.ticketSaleStartAt);
        const releaseAt = new Date(`${form.expectedReleaseDate}T23:59:59`);
        if (!form.publishedAt || !form.ticketSaleStartAt || !form.expectedReleaseDate) {
          throw new Error('Vui lòng nhập đủ thời điểm công bố, mở bán và dự kiến khởi chiếu.');
        }
        if (publishAt > saleAt || saleAt > releaseAt) {
          throw new Error('Thời gian phải theo thứ tự: Công bố ≤ Mở bán ≤ Khởi chiếu.');
        }
      }
      const {announceUpcoming, ...formData} = form;
      const payload = {
        ...formData,
        genre: form.genre,
        cast: form.cast.split(',').map(item => item.trim()).filter(Boolean),
        duration: Number(form.duration),
        price: Number(form.price || 0),
        expectedReleaseDate: form.expectedReleaseDate
          ? new Date(form.expectedReleaseDate)
          : undefined,
        publishedAt: form.publishedAt ? new Date(form.publishedAt) : undefined,
        ticketSaleStartAt: form.ticketSaleStartAt
          ? new Date(form.ticketSaleStartAt)
          : undefined,
        status: announceUpcoming ? 'coming-soon' : form.status,
      };
      if (isEdit) {
        await movieApi.update(id, payload);
      } else {
        await movieApi.create(payload);
      }
      navigate('/movies');
    } catch (err) {
      setError(err.message || (isEdit ? 'Không thể cập nhật phim.' : 'Không thể thêm phim.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageTitle title={isEdit ? 'Chỉnh sửa phim' : 'Thêm phim'} />
      <div className="panel">
        {error && <p className="loginError">{error}</p>}
        {loading ? (
          <p>Đang tải thông tin phim...</p>
        ) : (
          <form className="formGrid" onSubmit={handleSubmit}>
            <label>
              Tên phim
              <input
                required
                value={form.title}
                onChange={event => updateForm('title', event.target.value)}
              />
            </label>
            <div className="movieGenreField">
              <span className="movieGenreFieldLabel">Thể loại</span>
              <details className="movieGenrePicker">
                <summary>
                  <span className={form.genre.length ? '' : 'movieGenrePlaceholder'}>
                    {form.genre.length ? form.genre.join(', ') : 'Chọn một hoặc nhiều thể loại'}
                  </span>
                  <b>⌄</b>
                </summary>
                <div className="movieGenreDropdown">
                  <div className="movieGenreOptions">
                    {genreLoading && <p>Đang tải thể loại...</p>}
                    {!genreLoading && genreOptions.map(item => (
                      <label key={item._id} className="movieGenreOption">
                        <input
                          type="checkbox"
                          checked={form.genre.includes(item.name)}
                          onChange={() => toggleGenre(item.name)}
                        />
                        <span>{item.name}</span>
                      </label>
                    ))}
                    {!genreLoading && genreOptions.length === 0 && <p>Chưa có thể loại nào.</p>}
                  </div>
                  <div className="movieGenreQuickAdd">
                    <input
                      value={newGenreName}
                      onChange={event => setNewGenreName(event.target.value)}
                      onKeyDown={event => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addGenreQuickly();
                        }
                      }}
                      placeholder="Tên thể loại mới..."
                    />
                    <button type="button" onClick={addGenreQuickly} disabled={addingGenre}>
                      {addingGenre ? 'Đang thêm...' : '+ Thêm'}
                    </button>
                  </div>
                  <button className="movieGenreManageLink" type="button" onClick={() => navigate('/categories')}>
                    Quản lý danh mục thể loại →
                  </button>
                </div>
              </details>
              {form.genre.length > 0 && (
                <div className="movieGenreChips">
                  {form.genre.map(name => (
                    <button key={name} type="button" onClick={() => toggleGenre(name)}>
                      {name} <span>×</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <label>
              Thời lượng phút
              <input
                required
                type="number"
                value={form.duration}
                onChange={event => updateForm('duration', event.target.value)}
              />
            </label>
            {['draft', 'coming-soon', 'coming_soon'].includes(form.status) ? (
              <div className="moviePublishBox">
                <label className="moviePublishToggle">
                  <input
                    type="checkbox"
                    checked={form.announceUpcoming}
                    onChange={event => {
                      updateForm('announceUpcoming', event.target.checked);
                      updateForm('status', event.target.checked ? 'coming-soon' : 'draft');
                      if (event.target.checked && !form.publishedAt) {
                        updateForm('publishedAt', toDateTimeInput(new Date()));
                      }
                      if (!event.target.checked) {
                        updateForm('expectedReleaseDate', '');
                        updateForm('publishedAt', '');
                        updateForm('ticketSaleStartAt', '');
                      }
                    }}
                  />
                  <span>
                    <strong>Hiển thị trong mục Sắp chiếu</strong>
                    <small>Khách hàng có thể xem thông tin phim nhưng chưa thể đặt vé.</small>
                  </span>
                </label>
                {form.announceUpcoming && <div className="moviePublishDates">
                  <label>Thời điểm công bố<input required type="datetime-local" value={form.publishedAt} onChange={event => updateForm('publishedAt', event.target.value)} /></label>
                  <label>Mở bán vé từ<input required type="datetime-local" value={form.ticketSaleStartAt} onChange={event => updateForm('ticketSaleStartAt', event.target.value)} /></label>
                  <label>Dự kiến khởi chiếu<input required type="date" value={form.expectedReleaseDate} onChange={event => updateForm('expectedReleaseDate', event.target.value)} /></label>
                </div>}
              </div>
            ) : (
              <div className="movieScheduleManagedNotice">
                Trạng thái và ngày khởi chiếu đang được hệ thống quản lý theo lịch suất chiếu.
              </div>
            )}
            <label>
              Đạo diễn
              <input
                value={form.director}
                onChange={event => updateForm('director', event.target.value)}
              />
            </label>
            <label>
              Diễn viên
              <textarea
                value={form.cast}
                onChange={event => updateForm('cast', event.target.value)}
                placeholder="Tên 1, Tên 2"
              />
            </label>
            <label>
              Mô tả
              <textarea
                value={form.synopsis}
                onChange={event => updateForm('synopsis', event.target.value)}
              />
            </label>
            <label>
              Poster URL
              <input
                value={form.posterUrl}
                onChange={event => updateForm('posterUrl', event.target.value)}
              />
            </label>
            <label>
              Backdrop URL
              <input
                value={form.backdropUrl}
                onChange={event => updateForm('backdropUrl', event.target.value)}
              />
            </label>
            <label>
              Giá vé
              <input
                type="number"
                value={form.price}
                onChange={event => updateForm('price', event.target.value)}
              />
            </label>
            <label>
              Độ tuổi
              <select
                value={form.ageRating}
                onChange={event => updateForm('ageRating', event.target.value)}>
                <option value="">Chọn độ tuổi</option>
                <option value="P">P</option>
                <option value="T13">T13</option>
                <option value="T16">T16</option>
                <option value="T18">T18</option>
              </select>
            </label>
            <div className="formActions">
              <button className="ghost" type="button" onClick={() => navigate('/movies')}>
                Hủy
              </button>
              <button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Lưu'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default MovieAdd;

import {useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import movieApi from '../../api/movieApi';
import {PageTitle} from '../../components/AdminUi';

const initialForm = {
  title: '',
  genre: '',
  duration: '',
  releaseDate: '',
  director: '',
  cast: '',
  synopsis: '',
  posterUrl: '',
  backdropUrl: '',
  price: '',
  status: 'coming-soon',
  ageRating: '',
};

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function MovieAdd() {
  const navigate = useNavigate();
  const {id} = useParams();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEdit);

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
          genre: Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre || '',
          duration:
            typeof movie.duration === 'number'
              ? String(movie.duration)
              : String(movie.duration || '').replace(/[^\d]/g, '') || '',
          releaseDate: toDateInput(movie.releaseDate),
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
          status: movie.status || 'coming-soon',
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

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        ...form,
        genre: form.genre.split(',').map(item => item.trim()).filter(Boolean),
        cast: form.cast.split(',').map(item => item.trim()).filter(Boolean),
        duration: Number(form.duration),
        price: Number(form.price || 0),
        releaseDate: form.releaseDate ? new Date(form.releaseDate) : undefined,
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
            <label>
              Thể loại
              <input
                value={form.genre}
                onChange={event => updateForm('genre', event.target.value)}
                placeholder="Action, Drama"
              />
            </label>
            <label>
              Thời lượng phút
              <input
                required
                type="number"
                value={form.duration}
                onChange={event => updateForm('duration', event.target.value)}
              />
            </label>
            <label>
              Ngày khởi chiếu
              <input
                type="date"
                value={form.releaseDate}
                onChange={event => updateForm('releaseDate', event.target.value)}
              />
            </label>
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
              Trạng thái
              <select value={form.status} onChange={event => updateForm('status', event.target.value)}>
                <option value="coming-soon">Sắp chiếu</option>
                <option value="now-showing">Đang chiếu</option>
                <option value="featured">Nổi bật (Đang chiếu)</option>
                <option value="ended">Đã chiếu</option>
                <option value="stopped">Ngừng chiếu</option>
              </select>
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

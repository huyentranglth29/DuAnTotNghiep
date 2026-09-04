import {useEffect, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import movieApi from '../../api/movieApi';
import genreApi from '../../api/genreApi';
import {PageTitle} from '../../components/AdminUi';

const initialForm = {
  title: '',
  genre: [],
  duration: '',
  expectedReleaseDate: '',
  director: '',
  cast: '',
  synopsis: '',
  posterUrl: '',
  backdropUrl: '',
  status: 'draft',
  ageRating: '',
};

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
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
  const [genreOpen, setGenreOpen] = useState(false);
  const [genreMessage, setGenreMessage] = useState('');
  const genrePickerRef = useRef(null);
  const newGenreInputRef = useRef(null);

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
    if (!genreOpen) return undefined;

    const closeOnOutside = event => {
      if (!genrePickerRef.current?.contains(event.target)) {
        setGenreOpen(false);
      }
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setGenreOpen(false);
      }
    };

    document.addEventListener('pointerdown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [genreOpen]);

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
    setGenreMessage('');
    setForm(current => ({
      ...current,
      genre: current.genre.includes(name)
        ? current.genre.filter(item => item !== name)
        : [...current.genre, name],
    }));
  };

  const addGenreQuickly = async () => {
    const name = newGenreName.trim();
    if (addingGenre) return;
    if (!name) {
      setGenreMessage('Nhập tên thể loại mới trước khi bấm thêm.');
      newGenreInputRef.current?.focus();
      return;
    }
    setAddingGenre(true);
    setError('');
    setGenreMessage('');
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
      setGenreMessage(`Đã thêm thể loại "${created.name}".`);
    } catch (err) {
      setGenreMessage(err.message || 'Không thêm được thể loại mới.');
    } finally {
      setAddingGenre(false);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (!form.title.trim()) {
        throw new Error('Vui lòng nhập tên phim.');
      }

      const today = new Date().toISOString().slice(0, 10);
      let calculatedStatus = form.status || 'draft';
      if (form.expectedReleaseDate && form.expectedReleaseDate > today) {
        calculatedStatus = 'coming-soon';
      }

      const payload = {
        title: form.title.trim(),
        director: form.director,
        country: form.country,
        language: form.language,
        ageRating: form.ageRating,
        synopsis: form.synopsis,
        trailerUrl: form.trailerUrl,
        posterUrl: form.posterUrl,
        genre: form.genre,
        cast: form.cast.split(',').map(item => item.trim()).filter(Boolean),
        duration: Number(form.duration),
        expectedReleaseDate: form.expectedReleaseDate
          ? new Date(`${form.expectedReleaseDate}T00:00:00+07:00`)
          : null,
        status: calculatedStatus,
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
                placeholder="Ví dụ: Siêu Chó Đạp Gió Đón Lốc"
              />
            </label>

            <div className="movieGenreField">
              <span className="movieGenreFieldLabel">Thể loại</span>
              <div ref={genrePickerRef} className={`movieGenrePicker ${genreOpen ? 'isOpen' : ''}`}>
                <button
                  type="button"
                  className="movieGenreSummary"
                  onClick={() => setGenreOpen(open => !open)}>
                  <span className={form.genre.length ? '' : 'movieGenrePlaceholder'}>
                    {form.genre.length ? form.genre.join(', ') : 'Chọn một hoặc nhiều thể loại'}
                  </span>
                  <b>⌄</b>
                </button>
                {genreOpen && (
                  <div className="movieGenreDropdown">
                    <div className="movieGenreOptions">
                      {genreLoading && <p>Đang tải thể loại...</p>}
                      {!genreLoading &&
                        genreOptions.map(item => (
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
                        ref={newGenreInputRef}
                        value={newGenreName}
                        onChange={event => {
                          setNewGenreName(event.target.value);
                          setGenreMessage('');
                        }}
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
                    {genreMessage && <p className="movieGenreMessage">{genreMessage}</p>}
                    <button
                      className="movieGenreManageLink"
                      type="button"
                      onClick={() => navigate('/categories')}>
                      Quản lý danh mục thể loại →
                    </button>
                  </div>
                )}
              </div>
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
                placeholder="Ví dụ: 120"
              />
            </label>

            <label>
              Ngày dự kiến khởi chiếu
              <input
                type="date"
                value={form.expectedReleaseDate}
                onChange={event => updateForm('expectedReleaseDate', event.target.value)}
              />
            </label>

            <label>
              Đạo diễn
              <input
                value={form.director}
                onChange={event => updateForm('director', event.target.value)}
                placeholder="Ví dụ: Shea Wageman"
              />
            </label>

            <label>
              Diễn viên
              <textarea
                value={form.cast}
                onChange={event => updateForm('cast', event.target.value)}
                placeholder="Tên diễn viên 1, Tên diễn viên 2..."
              />
            </label>

            <label>
              Mô tả nội dung phim
              <textarea
                value={form.synopsis}
                onChange={event => updateForm('synopsis', event.target.value)}
                placeholder="Tóm tắt nội dung cốt truyện của phim..."
              />
            </label>

            <label>
              Poster URL
              <input
                value={form.posterUrl}
                onChange={event => updateForm('posterUrl', event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label>
              Backdrop URL
              <input
                value={form.backdropUrl}
                onChange={event => updateForm('backdropUrl', event.target.value)}
                placeholder="https://..."
              />
            </label>

            <label>
              Độ tuổi
              <select
                value={form.ageRating}
                onChange={event => updateForm('ageRating', event.target.value)}>
                <option value="">Chọn độ tuổi</option>
                <option value="P">P - Phù hợp cho mọi độ tuổi</option>
                <option value="T13">T13 - Khán giả từ 13 tuổi trở lên</option>
                <option value="T16">T16 - Khán giả từ 16 tuổi trở lên</option>
                <option value="T18">T18 - Khán giả từ 18 tuổi trở lên</option>
              </select>
            </label>

            <div className="formActions">
              <button className="ghost" type="button" onClick={() => navigate('/movies')}>
                Hủy
              </button>
              <button type="submit" disabled={saving}>
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật phim' : 'Lưu phim'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

export default MovieAdd;

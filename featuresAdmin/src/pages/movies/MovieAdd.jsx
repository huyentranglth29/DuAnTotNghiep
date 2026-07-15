import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
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

function MovieAdd() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateForm = (name, value) => {
    setForm(current => ({...current, [name]: value}));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      await movieApi.create({
        ...form,
        genre: form.genre.split(',').map(item => item.trim()).filter(Boolean),
        cast: form.cast.split(',').map(item => item.trim()).filter(Boolean),
        duration: Number(form.duration),
        price: Number(form.price || 0),
        releaseDate: form.releaseDate ? new Date(form.releaseDate) : undefined,
      });
      navigate('/movies');
    } catch (err) {
      setError(err.message || 'Không thể thêm phim.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section>
      <PageTitle title="Thêm phim" />
      <div className="panel">
        {error && <p className="loginError">{error}</p>}
        <form className="formGrid" onSubmit={handleSubmit}>
          <label>Tên phim<input required value={form.title} onChange={event => updateForm('title', event.target.value)} /></label>
          <label>Thể loại<input value={form.genre} onChange={event => updateForm('genre', event.target.value)} placeholder="Action, Drama" /></label>
          <label>Thời lượng phút<input required type="number" value={form.duration} onChange={event => updateForm('duration', event.target.value)} /></label>
          <label>Ngày khởi chiếu<input type="date" value={form.releaseDate} onChange={event => updateForm('releaseDate', event.target.value)} /></label>
          <label>Đạo diễn<input value={form.director} onChange={event => updateForm('director', event.target.value)} /></label>
          <label>Diễn viên<textarea value={form.cast} onChange={event => updateForm('cast', event.target.value)} placeholder="Tên 1, Tên 2" /></label>
          <label>Mô tả<textarea value={form.synopsis} onChange={event => updateForm('synopsis', event.target.value)} /></label>
          <label>Poster URL<input value={form.posterUrl} onChange={event => updateForm('posterUrl', event.target.value)} /></label>
          <label>Backdrop URL<input value={form.backdropUrl} onChange={event => updateForm('backdropUrl', event.target.value)} /></label>
          <label>Giá vé<input type="number" value={form.price} onChange={event => updateForm('price', event.target.value)} /></label>
          <label>
            Trạng thái
            <select value={form.status} onChange={event => updateForm('status', event.target.value)}>
              <option value="coming-soon">Sắp chiếu</option>
              <option value="now-showing">Đang chiếu</option>
              <option value="featured">Nổi bật (Đang chiếu)</option>
              <option value="ended">Đã chiếu</option>
            </select>
          </label>
          <label>Độ tuổi<input value={form.ageRating} onChange={event => updateForm('ageRating', event.target.value)} /></label>
          <div className="formActions">
            <button className="ghost" type="button" onClick={() => navigate('/movies')}>Hủy</button>
            <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default MovieAdd;

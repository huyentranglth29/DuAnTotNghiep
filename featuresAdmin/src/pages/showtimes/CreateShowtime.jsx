import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import movieApi from '../../api/movieApi';
import roomApi from '../../api/roomApi';
import showtimeApi from '../../api/showtimeApi';
import SelectDropdown from '../../components/SelectDropdown';
import {
  buildEndTimeIso,
  buildStartTimeIso,
  formatDate,
  formatDuration,
  formatTime,
  formatVnd,
  toDateInputValue,
  toTimeInputValue,
} from '../../utils/showtimeHelpers';

const EMPTY_FORM = {
  movie: '',
  room: '',
  date: '',
  time: '',
  price: '120000',
  status: 'scheduled',
  note: '',
};

function CreateShowtime() {
  const navigate = useNavigate();
  const {id} = useParams();
  const isEdit = Boolean(id);

  const [movies, setMovies] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [movieData, roomData] = await Promise.all([
          movieApi.getAll(),
          roomApi.getAll(),
        ]);

        const nextMovies = Array.isArray(movieData) ? movieData : movieData?.data || [];
        const nextRooms = Array.isArray(roomData) ? roomData : roomData?.data || [];
        setMovies(nextMovies);
        setRooms(nextRooms);

        if (isEdit) {
          const showtimeResponse = await showtimeApi.getById(id);
          const showtime = showtimeResponse?.data || showtimeResponse;
          setForm({
            movie: showtime.movie?._id || showtime.movie || '',
            room: showtime.room?._id || showtime.room || '',
            date: toDateInputValue(showtime.startTime),
            time: toTimeInputValue(showtime.startTime),
            price: String(showtime.price ?? ''),
            status: showtime.status || 'scheduled',
            note: '',
          });
        } else {
          const today = toDateInputValue(new Date());
          setForm(current => ({
            ...current,
            movie: nextMovies[0]?.id || nextMovies[0]?._id || '',
            room: nextRooms[0]?._id || '',
            date: today,
            time: '19:00',
          }));
        }
      } catch (err) {
        setError(err.message || 'Không tải được dữ liệu form');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, isEdit]);

  const selectedMovie = useMemo(
    () =>
      movies.find(item => String(item.id || item._id) === String(form.movie)),
    [movies, form.movie],
  );

  const selectedRoom = useMemo(
    () => rooms.find(item => String(item._id) === String(form.room)),
    [rooms, form.room],
  );

  const updateField = (key, value) => {
    setForm(current => ({...current, [key]: value}));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');

    if (!form.movie || !form.room || !form.date || !form.time || !form.price) {
      setError('Vui lòng nhập đủ phim, phòng, ngày giờ và giá vé');
      return;
    }

    setSaving(true);
    try {
      const startTime = buildStartTimeIso(form.date, form.time);
      const payload = {
        movie: form.movie,
        room: form.room,
        startTime,
        endTime: buildEndTimeIso(startTime, selectedMovie?.duration),
        price: Number(String(form.price).replace(/[^\d]/g, '')),
        status: form.status,
      };

      if (isEdit) {
        await showtimeApi.update(id, payload);
      } else {
        await showtimeApi.create(payload);
      }

      navigate('/showtimes');
    } catch (err) {
      setError(err.message || 'Lưu suất chiếu thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section>
        <p className="mutedText">Đang tải form suất chiếu...</p>
      </section>
    );
  }

  return (
    <section className="showtimeEditPage">
      <div className="pageTitle">
        <div>
          <h2>{isEdit ? 'Sửa suất chiếu' : 'Tạo suất chiếu mới'}</h2>
          <p>Liên kết phim với phòng chiếu, thời gian và giá vé.</p>
        </div>
        <Link className="ghost backListBtn" to="/showtimes">
          Quay lại danh sách
        </Link>
      </div>

      {error && <p className="inlineError">{error}</p>}

      {!movies.length && (
        <p className="inlineError">
          Chưa có phim trong MongoDB. Hãy seed phim (`npm run seed:movies`) trước.
        </p>
      )}
      {!rooms.length && (
        <p className="inlineError">
          Chưa có phòng chiếu. Hãy vào mục Phòng chiếu để tạo phòng trước.
        </p>
      )}

      <div className="showtimeCreate">
        <div className="panel showtimeFormCard">
          <div className="sectionHeader compact">
            <div>
              <h3>Thông tin suất chiếu</h3>
              <p>Chọn phim, phòng chiếu, thời gian và giá vé để mở bán.</p>
            </div>
          </div>
          <form className="showtimeForm" onSubmit={handleSubmit}>
            <SelectDropdown
              label="Phim"
              value={form.movie}
              placeholder="Chọn phim"
              onChange={value => updateField('movie', value)}
              options={[
                {value: '', label: 'Chọn phim'},
                ...movies.map(movie => ({
                  value: movie.id || movie._id,
                  label: movie.title,
                })),
              ]}
            />
            <SelectDropdown
              label="Phòng chiếu"
              value={form.room}
              placeholder="Chọn phòng"
              onChange={value => updateField('room', value)}
              options={[
                {value: '', label: 'Chọn phòng'},
                ...rooms.map(room => ({
                  value: room._id,
                  label: `${room.name} (${room.type})`,
                })),
              ]}
            />
            <label>
              Ngày chiếu
              <input
                type="date"
                value={form.date}
                onChange={event => updateField('date', event.target.value)}
              />
            </label>
            <label>
              Giờ chiếu
              <input
                type="time"
                value={form.time}
                onChange={event => updateField('time', event.target.value)}
              />
            </label>
            <label>
              Giá vé (VND)
              <input
                value={form.price}
                onChange={event => updateField('price', event.target.value)}
                placeholder="120000"
              />
            </label>
            <SelectDropdown
              label="Trạng thái"
              value={form.status}
              placeholder="Chọn trạng thái"
              onChange={value => updateField('status', value)}
              options={[
                {value: 'scheduled', label: 'Lên lịch'},
                {value: 'completed', label: 'Đã chiếu'},
                {value: 'cancelled', label: 'Đã hủy'},
              ]}
            />
            <label className="fullField">
              Ghi chú
              <textarea
                value={form.note}
                onChange={event => updateField('note', event.target.value)}
                placeholder="Ghi chú nội bộ (không bắt buộc)"
              />
            </label>
            <div className="formActions fullField">
              <button
                className="ghost"
                type="button"
                onClick={() => navigate('/showtimes')}>
                Hủy
              </button>
              <button disabled={saving} type="submit">
                {saving ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Lưu suất chiếu'}
              </button>
            </div>
          </form>
        </div>

        <aside className="panel showtimeSummary">
          <h3>Tóm tắt</h3>
          <div className="moviePreview">
            {selectedMovie?.posterUrl ? (
              <img
                className="miniPosterImage"
                src={selectedMovie.posterUrl}
                alt={selectedMovie.title}
              />
            ) : (
              <div className="miniPoster">
                {selectedMovie?.title?.slice(0, 1) || '?'}
              </div>
            )}
            <div>
              <strong>{selectedMovie?.title || 'Chưa chọn phim'}</strong>
              <span>{selectedMovie?.genre || 'Thể loại'}</span>
              <small>
                {formatDuration(selectedMovie?.duration)} •{' '}
                {selectedRoom?.type || '2D'}
              </small>
            </div>
          </div>
          <div className="summaryGrid">
            <p>
              <span>Phòng</span>
              <strong>{selectedRoom?.name || '--'}</strong>
            </p>
            <p>
              <span>Ngày</span>
              <strong>
                {form.date ? formatDate(`${form.date}T00:00:00`) : '--'}
              </strong>
            </p>
            <p>
              <span>Giờ</span>
              <strong>
                {form.time
                  ? formatTime(`${form.date || '2026-01-01'}T${form.time}:00`)
                  : '--'}
              </strong>
            </p>
            <p>
              <span>Giá vé</span>
              <strong>{formatVnd(form.price)}</strong>
            </p>
          </div>
          <div className="occupancy">
            <div>
              <strong>{selectedRoom?.totalSeats || 0}</strong>
              <span>Ghế khả dụng</span>
            </div>
            <div>
              <strong>0</strong>
              <span>Vé đã bán</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateShowtime;

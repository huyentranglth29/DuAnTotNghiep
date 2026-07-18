import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import movieApi from '../../api/movieApi';
import roomApi from '../../api/roomApi';
import showtimeApi from '../../api/showtimeApi';
import SelectDropdown from '../../components/SelectDropdown';
import StartTimePicker from '../../components/StartTimePicker';
import {
  CLEANUP_MINUTES,
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
  const [schedule, setSchedule] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [earliestAvailable, setEarliestAvailable] = useState(null);
  const [conflictMessage, setConflictMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [movieData, roomData] = await Promise.all([
          movieApi.getAll(),
          roomApi.getAll(),
        ]);

        const nextMovies = Array.isArray(movieData)
          ? movieData
          : movieData?.data || [];
        const nextRooms = Array.isArray(roomData)
          ? roomData
          : roomData?.data || [];
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

  const computedEndIso = useMemo(() => {
    if (!form.date || !form.time || !selectedMovie) {
      return '';
    }
    const start = buildStartTimeIso(form.date, form.time);
    return buildEndTimeIso(start, selectedMovie.duration);
  }, [form.date, form.time, selectedMovie]);

  useEffect(() => {
    if (!form.room || !form.date) {
      setSchedule(null);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await showtimeApi.getSuggestion({
          room: form.room,
          date: form.date,
          movie: form.movie || undefined,
          excludeId: isEdit ? id : undefined,
          preferredStart:
            form.date && form.time
              ? buildStartTimeIso(form.date, form.time)
              : undefined,
        });
        if (!cancelled) {
          setSchedule(response?.data || response);
        }
      } catch {
        if (!cancelled) {
          setSchedule(null);
        }
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [form.room, form.date, form.movie, form.time, id, isEdit]);

  useEffect(() => {
    if (
      !form.room ||
      !form.movie ||
      !form.date ||
      !form.time ||
      form.status === 'cancelled'
    ) {
      setConflicts([]);
      setEarliestAvailable(null);
      setConflictMessage('');
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const startTime = buildStartTimeIso(form.date, form.time);
        const response = await showtimeApi.checkConflict({
          room: form.room,
          movie: form.movie,
          startTime,
          excludeId: isEdit ? id : undefined,
        });
        const payload = response?.data || response;
        if (!cancelled) {
          if (payload?.hasConflict) {
            setConflicts(payload.conflicts || []);
            setEarliestAvailable(payload.earliestAvailable || null);
            setConflictMessage(payload.message || '');
          } else {
            setConflicts([]);
            setEarliestAvailable(null);
            setConflictMessage('');
          }
        }
      } catch {
        if (!cancelled) {
          setConflicts([]);
          setEarliestAvailable(null);
          setConflictMessage('');
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    form.room,
    form.movie,
    form.date,
    form.time,
    form.status,
    id,
    isEdit,
  ]);

  const updateField = (key, value) => {
    setForm(current => ({...current, [key]: value}));
  };

  const applySuggestedTime = (iso = schedule?.suggestedStartIso) => {
    if (!iso) {
      return;
    }
    const suggested = new Date(iso);
    updateField('date', toDateInputValue(suggested));
    updateField('time', toTimeInputValue(suggested));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');

    if (!form.movie || !form.room || !form.date || !form.time || !form.price) {
      setError('Vui lòng nhập đủ phim, phòng, ngày giờ và giá vé');
      return;
    }

    if (conflicts.length && form.status !== 'cancelled') {
      setError(
        conflictMessage ||
          'Phòng chiếu đã có suất chiếu hoặc chưa đủ 15 phút nghỉ.',
      );
      return;
    }

    setSaving(true);
    try {
      const startTime = buildStartTimeIso(form.date, form.time);
      const payload = {
        movie: form.movie,
        room: form.room,
        startTime,
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
      setError(
        err.message ||
          'Phòng chiếu đã có suất chiếu hoặc chưa đủ 15 phút nghỉ.',
      );
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

  const existingShowtimes = schedule?.showtimes || [];
  const freeGaps = (schedule?.freeGaps || []).filter(gap => gap.canFit);

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

      {conflicts.length > 0 && form.status !== 'cancelled' && (
        <div className="showtimeConflictBanner" role="alert">
          <strong>⚠ Xung đột lịch chiếu</strong>
          <p>
            {conflictMessage ||
              `Phòng chiếu đã có suất chiếu hoặc chưa đủ ${CLEANUP_MINUTES} phút nghỉ.`}
          </p>
          <ul>
            {conflicts.map(item => (
              <li key={item._id}>
                {item.roomName || selectedRoom?.name || 'Phòng'} ·{' '}
                {formatTime(item.startTime)} - {formatTime(item.endTime)} ·{' '}
                {item.movieTitle}
              </li>
            ))}
          </ul>
          {earliestAvailable ? (
            <button
              className="ghost"
              type="button"
              onClick={() => applySuggestedTime(earliestAvailable)}>
              Dùng giờ sớm nhất ({formatTime(earliestAvailable)})
            </button>
          ) : null}
        </div>
      )}

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
            <StartTimePicker
              label="Giờ bắt đầu"
              value={form.time}
              date={form.date}
              duration={selectedMovie?.duration}
              showtimes={existingShowtimes}
              freeGaps={schedule ? freeGaps : null}
              onChange={value => updateField('time', value)}
            />
            <label>
              Giờ kết thúc (tự động)
              <input
                type="time"
                value={computedEndIso ? toTimeInputValue(computedEndIso) : ''}
                readOnly
                disabled
                title="Tự tính từ thời lượng phim"
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
                {value: 'completed', label: 'Đã kết thúc'},
                {value: 'cancelled', label: 'Đã hủy'},
              ]}
            />

            {form.room && form.date ? (
              <div className="showtimeRoomSchedule fullField">
                <h4>
                  Lịch {selectedRoom?.name || 'phòng'} ·{' '}
                  {formatDate(`${form.date}T12:00:00`)}
                </h4>

                <div className="showtimeScheduleBlock">
                  <strong>Suất chiếu hiện có</strong>
                  {existingShowtimes.length === 0 ? (
                    <p className="mutedText">Chưa có suất nào trong ngày này.</p>
                  ) : (
                    <ul>
                      {existingShowtimes.map(item => (
                        <li key={item._id}>
                          {formatTime(item.startTime)} - {formatTime(item.endTime)}{' '}
                          · {item.movieTitle}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="showtimeScheduleBlock">
                  <strong>Khoảng trống (đã trừ {CLEANUP_MINUTES} phút vệ sinh)</strong>
                  {freeGaps.length === 0 ? (
                    <p className="mutedText">
                      Không còn khoảng trống đủ cho thời lượng phim này.
                    </p>
                  ) : (
                    <ul>
                      {freeGaps.map(gap => (
                        <li key={`${gap.start}-${gap.end}`}>
                          {formatTime(gap.start)} - {formatTime(gap.end)}
                          {gap.latestStart
                            ? ` · bắt đầu muộn nhất ${formatTime(gap.latestStart)}`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {schedule?.suggestedStartIso ? (
                  <div className="showtimeSuggestBox">
                    <p>
                      Gợi ý giờ bắt đầu hợp lệ gần nhất:{' '}
                      <strong>{formatTime(schedule.suggestedStartIso)}</strong>
                    </p>
                    <button
                      className="ghost"
                      type="button"
                      onClick={() => applySuggestedTime(schedule.suggestedStartIso)}>
                      Sử dụng thời gian này
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

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
              <button
                disabled={
                  saving ||
                  (conflicts.length > 0 && form.status !== 'cancelled')
                }
                type="submit">
                {saving
                  ? 'Đang lưu...'
                  : isEdit
                    ? 'Cập nhật'
                    : 'Lưu suất chiếu'}
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
              <span>Bắt đầu</span>
              <strong>
                {form.time
                  ? formatTime(`${form.date || '2026-01-01'}T${form.time}:00`)
                  : '--'}
              </strong>
            </p>
            <p>
              <span>Kết thúc</span>
              <strong>
                {computedEndIso ? formatTime(computedEndIso) : '--'}
              </strong>
            </p>
            <p>
              <span>Giá vé</span>
              <strong>{formatVnd(form.price)}</strong>
            </p>
            <p>
              <span>Vệ sinh</span>
              <strong>{CLEANUP_MINUTES} phút</strong>
            </p>
          </div>
          <div className="occupancy">
            <div>
              <strong>{selectedRoom?.totalSeats || 0}</strong>
              <span>Ghế khả dụng</span>
            </div>
            <div>
              <strong>{formatDuration(selectedMovie?.duration)}</strong>
              <span>Thời lượng</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

export default CreateShowtime;

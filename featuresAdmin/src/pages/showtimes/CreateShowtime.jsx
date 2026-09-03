import {useEffect, useMemo, useState} from 'react';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {Sparkles, Calendar, Clock, AlertCircle} from 'lucide-react';
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
  screeningType: 'regular',
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
            screeningType: showtime.screeningType || 'regular',
            note: '',
          });
        } else {
          const firstMovie = nextMovies[0];
          const today = toDateInputValue(new Date());

          let initialDate = today;
          let initialType = 'regular';

          if (firstMovie) {
            const isUpcoming = ['coming-soon', 'coming_soon'].includes(firstMovie.status);
            const releaseDate = firstMovie.expectedReleaseDate ? toDateInputValue(firstMovie.expectedReleaseDate) : '';

            if (isUpcoming && releaseDate && releaseDate > today) {
              // Phim chưa ra rạp: mặc định ngày chiếu là ngày khởi chiếu
              initialDate = releaseDate;
              initialType = 'regular';
            }
          }

          setForm(current => ({
            ...current,
            movie: firstMovie?.id || firstMovie?._id || '',
            room: nextRooms[0]?._id || '',
            date: initialDate,
            time: '19:00',
            screeningType: initialType,
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

  // Xử lý khi Admin đổi chọn phim khác
  const handleMovieChange = newMovieId => {
    const movie = movies.find(item => String(item.id || item._id) === String(newMovieId));
    setForm(current => {
      let nextDate = current.date;
      let nextType = current.screeningType;

      if (movie) {
        const today = toDateInputValue(new Date());
        const isUpcoming = ['coming-soon', 'coming_soon'].includes(movie.status);
        const releaseDate = movie.expectedReleaseDate ? toDateInputValue(movie.expectedReleaseDate) : '';

        if (isUpcoming && releaseDate && releaseDate > today) {
          // Nếu phim chưa tới ngày ra mắt:
          // Nếu đang là suất thường thì đổi ngày chiếu = ngày khởi chiếu
          if (nextType === 'regular' && (!nextDate || nextDate < releaseDate)) {
            nextDate = releaseDate;
          }
        }
      }

      return {
        ...current,
        movie: newMovieId,
        date: nextDate,
        screeningType: nextType,
      };
    });
  };

  // Xử lý khi đổi loại suất chiếu (Thông thường <-> Chiếu sớm)
  const handleScreeningTypeChange = newType => {
    setForm(current => {
      let nextDate = current.date;
      if (selectedMovie && selectedMovie.expectedReleaseDate) {
        const releaseDate = toDateInputValue(selectedMovie.expectedReleaseDate);
        const today = toDateInputValue(new Date());

        if (newType === 'early') {
          // Suất chiếu sớm: gợi ý ngày trước ngày khởi chiếu (ví dụ: hôm nay hoặc trước ngày khởi chiếu 1 ngày)
          if (!nextDate || nextDate >= releaseDate) {
            const earlyD = new Date(releaseDate);
            earlyD.setDate(earlyD.getDate() - 1);
            const earlyDateStr = toDateInputValue(earlyD);
            nextDate = earlyDateStr >= today ? earlyDateStr : today;
          }
        } else if (newType === 'regular') {
          // Suất thông thường: nếu phim sắp chiếu thì ngày chiếu phải từ ngày khởi chiếu trở đi
          const isUpcoming = ['coming-soon', 'coming_soon'].includes(selectedMovie.status);
          if (isUpcoming && releaseDate && releaseDate > today) {
            if (!nextDate || nextDate < releaseDate) {
              nextDate = releaseDate;
            }
          }
        }
      }

      return {
        ...current,
        screeningType: newType,
        date: nextDate,
      };
    });
  };

  const computedEndIso = useMemo(() => {
    if (!form.date || !form.time || !selectedMovie) {
      return '';
    }
    const start = buildStartTimeIso(form.date, form.time);
    return buildEndTimeIso(start, selectedMovie.duration);
  }, [form.date, form.time, selectedMovie]);

  const earlyScreeningError = useMemo(() => {
    if (form.screeningType !== 'early') return '';
    const releaseValue = selectedMovie?.expectedReleaseDate;
    if (!releaseValue) {
      return 'Phim phải có ngày dự kiến khởi chiếu trước khi tạo suất chiếu sớm.';
    }
    if (!form.date) return '';
    const releaseDate = toDateInputValue(releaseValue);
    if (form.date >= releaseDate) {
      return `Suất chiếu sớm phải nằm trước ngày khởi chiếu ${formatDate(releaseValue)}. Hiện tại bạn đang chọn ngày ${formatDate(`${form.date}T00:00:00`)}.`;
    }
    if (selectedMovie?.ticketSaleStartAt && form.time) {
      const showtimeStart = new Date(buildStartTimeIso(form.date, form.time));
      const ticketSaleStart = new Date(selectedMovie.ticketSaleStartAt);
      if (ticketSaleStart > showtimeStart) {
        return `Phim mở bán vé từ ${ticketSaleStart.toLocaleString('vi-VN')}, muộn hơn thời gian bắt đầu suất chiếu sớm. Hãy sửa thời điểm mở bán trong Quản lý phim.`;
      }
    }
    return '';
  }, [form.date, form.screeningType, form.time, selectedMovie]);

  const regularScreeningNotice = useMemo(() => {
    if (form.screeningType !== 'regular') return '';
    if (!selectedMovie?.expectedReleaseDate || !form.date) return '';
    const isUpcoming = ['coming-soon', 'coming_soon'].includes(selectedMovie.status);
    const releaseDate = toDateInputValue(selectedMovie.expectedReleaseDate);

    if (isUpcoming && form.date < releaseDate) {
      return `Lưu ý: Phim dự kiến khởi chiếu ngày ${formatDate(selectedMovie.expectedReleaseDate)}. Nếu bạn muốn chiếu trước ngày này, hãy chuyển loại suất sang "Suất chiếu sớm".`;
    }
    return '';
  }, [form.screeningType, form.date, selectedMovie]);

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
    if (!form.room || !form.movie || !form.date || !form.time) {
      setConflicts([]);
      setEarliestAvailable(null);
      setConflictMessage('');
      return undefined;
    }

    if (form.status === 'cancelled') {
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

    if (earlyScreeningError) {
      setError(earlyScreeningError);
      return;
    }

    if (conflicts.length > 0 && form.status !== 'cancelled') {
      setError(conflictMessage || 'Suất chiếu bị trùng lịch phòng');
      return;
    }

    setSaving(true);
    try {
      const startTime = buildStartTimeIso(form.date, form.time);
      const payload = {
        movie: form.movie,
        room: form.room,
        startTime,
        price: Number(form.price),
        status: form.status,
        screeningType: form.screeningType,
      };

      if (isEdit) {
        await showtimeApi.update(id, payload);
      } else {
        await showtimeApi.create(payload);
      }
      navigate('/showtimes');
    } catch (err) {
      setError(err.message || 'Không thể lưu suất chiếu');
    } finally {
      setSaving(false);
    }
  };

  const existingShowtimes = schedule?.existingShowtimes || [];
  const freeGaps = schedule?.freeGaps || [];

  return (
    <section className="showtimeCreatePage">
      <div className="pageTitle">
        <div>
          <h2>{isEdit ? 'Chỉnh sửa suất chiếu' : 'Tạo suất chiếu mới'}</h2>
          <p>Liên kết phim với phòng chiếu, thời gian và giá vé.</p>
        </div>
        <Link className="ghost" to="/showtimes">
          Quay lại danh sách
        </Link>
      </div>

      {error ? <p className="loginError">{error}</p> : null}

      {conflicts.length > 0 && form.status !== 'cancelled' && (
        <div className="conflictBanner">
          <div>
            <strong>Trùng lịch phòng chiếu ({conflicts.length} suất)</strong>
            <p>
              {conflictMessage ||
                'Khung giờ bạn chọn đã bị trùng hoặc chưa cách 15 phút dọn dẹp.'}
            </p>
          </div>
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
              onChange={handleMovieChange}
              options={[
                {value: '', label: 'Chọn phim'},
                ...movies.map(movie => {
                  const isUpcoming = ['coming-soon', 'coming_soon'].includes(movie.status);
                  const releaseStr = movie.expectedReleaseDate ? ` (KC: ${formatDate(movie.expectedReleaseDate)})` : '';
                  return {
                    value: movie.id || movie._id,
                    label: `${movie.title}${isUpcoming ? releaseStr : ''}`,
                  };
                }),
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
              label="Loại suất chiếu"
              value={form.screeningType}
              placeholder="Chọn loại suất"
              onChange={handleScreeningTypeChange}
              options={[
                {value: 'regular', label: 'Suất thông thường'},
                {value: 'early', label: 'Suất chiếu sớm'},
              ]}
            />

            {isEdit && (
              <SelectDropdown
                label="Trạng thái"
                value={form.status}
                placeholder="Chọn trạng thái"
                onChange={value => updateField('status', value)}
                options={[
                  {value: 'scheduled', label: 'Lên lịch (Đang mở bán)'},
                  {value: 'completed', label: 'Đã kết thúc'},
                  {value: 'cancelled', label: 'Đã hủy'},
                ]}
              />
            )}

            {/* Thông báo hướng dẫn suất chiếu sớm */}
            {form.screeningType === 'early' && (
              <div
                className={`showtimeEarlyNotice fullField ${
                  earlyScreeningError ? 'is-error' : ''
                }`}>
                <strong>
                  {earlyScreeningError ? '⚠️ Cảnh báo suất chiếu sớm' : '✨ Suất chiếu sớm hợp lệ'}
                </strong>
                <span>
                  {earlyScreeningError ||
                    `Suất này diễn ra vào ngày ${formatDate(`${form.date}T00:00:00`)}, trước ngày khởi chiếu chính thức ${formatDate(
                      selectedMovie?.expectedReleaseDate,
                    )}. Khán giả có thể xem thông tin và mua vé trước trong tab "Suất chiếu sớm" trên App.`}
                </span>
                {earlyScreeningError && (
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => handleScreeningTypeChange('regular')}>
                    Chuyển sang suất thông thường
                  </button>
                )}
              </div>
            )}

            {/* Thông báo nhắc nhở nếu suất thường nhưng chọn ngày trước ngày khởi chiếu */}
            {regularScreeningNotice && (
              <div className="showtimeEarlyNotice fullField" style={{background: '#fffbeb', borderColor: '#fde68a', color: '#92400e'}}>
                <strong>💡 Lưu ý lịch khởi chiếu</strong>
                <span>{regularScreeningNotice}</span>
                <button
                  className="ghost"
                  type="button"
                  style={{marginTop: '6px', background: '#fef3c7', color: '#92400e'}}
                  onClick={() => handleScreeningTypeChange('early')}>
                  Chuyển sang Suất chiếu sớm
                </button>
              </div>
            )}

            {form.room && form.date ? (
              <div className="showtimeRoomSchedule fullField">
                <h4>
                  Lịch {selectedRoom?.name || 'phòng'} ·{' '}
                  {formatDate(`${form.date}T12:00:00`)}
                </h4>
                <div className="showtimeScheduleList">
                  {existingShowtimes.length === 0 ? (
                    <p className="emptyHint">Chưa có suất nào trong ngày này.</p>
                  ) : (
                    existingShowtimes.map(item => (
                      <div className="showtimeScheduleItem" key={item.id}>
                        <span>
                          {formatTime(item.start)} - {formatTime(item.end)}
                        </span>
                        <strong>{item.movieTitle}</strong>
                        <small>{formatDuration(item.duration)}</small>
                      </div>
                    ))
                  )}
                </div>

                <div className="showtimeGaps">
                  <h5>Khoảng trống (đã trừ 15 phút vệ sinh)</h5>
                  {freeGaps.length === 0 ? (
                    <p className="emptyHint">Không còn khoảng trống phù hợp</p>
                  ) : (
                    <ul>
                      {freeGaps.map((gap, index) => (
                        <li key={index}>
                          {gap.label}
                          {gap.latestStart
                            ? ` · bắt đầu muộn nhất ${gap.latestStart}`
                            : ''}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {schedule?.hasConflict ? (
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
                  Boolean(earlyScreeningError) ||
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
            <p>
              <span>Loại suất</span>
              <strong>
                {form.screeningType === 'early'
                  ? 'Suất chiếu sớm'
                  : 'Suất thông thường'}
              </strong>
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

import {useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {Calendar, Info, AlertTriangle, Clock, ShoppingCart, Sparkles} from 'lucide-react';
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
  announceUpcoming: true,
  enableAdvanceBooking: false,
  director: '',
  cast: '',
  synopsis: '',
  posterUrl: '',
  backdropUrl: '',
  price: '',
  status: 'coming-soon',
  ageRating: '',
};

function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function formatDateDisplay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatDateTimeDisplay(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
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

        const isComingSoon = ['coming-soon', 'coming_soon'].includes(movie.status);
        const hasTicketSale = Boolean(movie.ticketSaleStartAt);

        setForm({
          title: movie.title || '',
          genre: Array.isArray(movie.genre)
            ? movie.genre.filter(Boolean)
            : String(movie.genre || '').split(/[,/|]/).map(item => item.trim()).filter(Boolean),
          duration:
            typeof movie.duration === 'number'
              ? String(movie.duration)
              : String(movie.duration || '').replace(/[^\d]/g, '') || '',
          expectedReleaseDate: toDateInput(movie.expectedReleaseDate),
          publishedAt: toDateTimeInput(movie.publishedAt),
          ticketSaleStartAt: toDateTimeInput(movie.ticketSaleStartAt),
          announceUpcoming: isComingSoon,
          enableAdvanceBooking: hasTicketSale,
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

  // Xử lý khi chọn ngày dự kiến khởi chiếu
  const handleReleaseDateChange = newDate => {
    setForm(current => {
      const next = {...current, expectedReleaseDate: newDate};
      // Nếu đang bật mở bán vé mà chưa đặt ngày bán vé, gợi ý trước 3 ngày
      if (next.enableAdvanceBooking && newDate && !next.ticketSaleStartAt) {
        const releaseD = new Date(newDate);
        releaseD.setDate(releaseD.getDate() - 3);
        releaseD.setHours(9, 0, 0, 0);
        next.ticketSaleStartAt = toDateTimeInput(releaseD);
      }
      return next;
    });
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

  // Validation logic
  const validationWarning = useMemo(() => {
    if (!form.expectedReleaseDate) return '';
    const releaseTime = new Date(`${form.expectedReleaseDate}T00:00:00`).getTime();

    if (form.enableAdvanceBooking && form.ticketSaleStartAt) {
      const saleTime = new Date(form.ticketSaleStartAt).getTime();
      if (saleTime > releaseTime + 86400000) {
        return 'Thời điểm mở bán vé không nên muộn hơn ngày khởi chiếu.';
      }
    }

    if (form.publishedAt && form.enableAdvanceBooking && form.ticketSaleStartAt) {
      const pubTime = new Date(form.publishedAt).getTime();
      const saleTime = new Date(form.ticketSaleStartAt).getTime();
      if (pubTime > saleTime) {
        return 'Thời điểm công bố nên trước hoặc cùng lúc với thời điểm mở bán vé.';
      }
    }

    return '';
  }, [form.expectedReleaseDate, form.enableAdvanceBooking, form.ticketSaleStartAt, form.publishedAt]);

  const handleSubmit = async event => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (form.announceUpcoming) {
        if (!form.expectedReleaseDate) {
          throw new Error('Vui lòng chọn ngày dự kiến khởi chiếu.');
        }
        if (form.enableAdvanceBooking && !form.ticketSaleStartAt) {
          throw new Error('Vui lòng chọn thời điểm bắt đầu mở bán vé.');
        }
      }

      const {announceUpcoming, enableAdvanceBooking, ...formData} = form;

      // Tính toán publishedAt và ticketSaleStartAt chuẩn
      let effectivePublishedAt = form.publishedAt;
      if (announceUpcoming && !effectivePublishedAt) {
        // Tự động công bố ngay bây giờ
        effectivePublishedAt = toDateTimeInput(new Date());
      }

      let effectiveTicketSaleStartAt = enableAdvanceBooking ? form.ticketSaleStartAt : null;

      const payload = {
        ...formData,
        genre: form.genre,
        cast: form.cast.split(',').map(item => item.trim()).filter(Boolean),
        duration: Number(form.duration),
        price: Number(form.price || 0),
        expectedReleaseDate: form.expectedReleaseDate
          ? new Date(`${form.expectedReleaseDate}T00:00:00`)
          : null,
        publishedAt: effectivePublishedAt ? new Date(effectivePublishedAt) : undefined,
        ticketSaleStartAt: effectiveTicketSaleStartAt
          ? new Date(effectiveTicketSaleStartAt)
          : null,
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

            {/* CẤU HÌNH NGÀY KHỞI CHIẾU & LỊCH CÔNG BỐ TRÊN APP */}
            <div className="moviePublishCard">
              <div className="moviePublishCardHeader">
                <Calendar size={18} className="moviePublishCardIcon" />
                <div>
                  <strong>Kế hoạch khởi chiếu & Hiển thị trên App</strong>
                  <p>Thiết lập thời gian ra mắt phim và điều kiện mở bán vé cho khán giả.</p>
                </div>
              </div>

              {/* 1. Ngày khởi chiếu chính thức */}
              <div className="moviePublishField">
                <label className="movieFieldLabelRequired">
                  Ngày dự kiến khởi chiếu chính thức
                  <input
                    required
                    type="date"
                    value={form.expectedReleaseDate}
                    onChange={event => handleReleaseDateChange(event.target.value)}
                  />
                </label>
                <span className="movieFieldHelp">
                  Ngày phim ra rạp chính thức. Suất chiếu sớm (nếu có) phải diễn ra trước ngày này.
                </span>
              </div>

              {/* 2. Hiển thị mục Sắp chiếu */}
              {['draft', 'coming-soon', 'coming_soon'].includes(form.status) ? (
                <div className="moviePublishOptions">
                  <label className="movieCheckRow">
                    <input
                      type="checkbox"
                      checked={form.announceUpcoming}
                      onChange={event => {
                        const checked = event.target.checked;
                        updateForm('announceUpcoming', checked);
                        updateForm('status', checked ? 'coming-soon' : 'draft');
                        if (checked && !form.publishedAt) {
                          updateForm('publishedAt', toDateTimeInput(new Date()));
                        }
                      }}
                    />
                    <div>
                      <strong>Công bố trong mục "Sắp chiếu" trên App</strong>
                      <span>Khán giả có thể tìm thấy phim, xem poster, trailer và nội dung giới thiệu.</span>
                    </div>
                  </label>

                  {/* 3. Tùy chọn mở bán vé sớm */}
                  {form.announceUpcoming && (
                    <div className="movieAdvanceBookingBox">
                      <label className="movieCheckRow">
                        <input
                          type="checkbox"
                          checked={form.enableAdvanceBooking}
                          onChange={event => {
                            const checked = event.target.checked;
                            updateForm('enableAdvanceBooking', checked);
                            if (checked && !form.ticketSaleStartAt) {
                              if (form.expectedReleaseDate) {
                                const d = new Date(form.expectedReleaseDate);
                                d.setDate(d.getDate() - 3);
                                d.setHours(9, 0, 0, 0);
                                updateForm('ticketSaleStartAt', toDateTimeInput(d));
                              } else {
                                updateForm('ticketSaleStartAt', toDateTimeInput(new Date()));
                              }
                            }
                          }}
                        />
                        <div>
                          <strong>Mở bán vé trước ngày khởi chiếu (Pre-order / Suất chiếu sớm)</strong>
                          <span>Cho phép khách hàng đặt vé trước khi phim chính thức ra rạp.</span>
                        </div>
                      </label>

                      {form.enableAdvanceBooking && (
                        <div className="movieAdvanceDates">
                          <label>
                            Mở bán vé từ thời điểm
                            <input
                              required
                              type="datetime-local"
                              value={form.ticketSaleStartAt}
                              onChange={event => updateForm('ticketSaleStartAt', event.target.value)}
                            />
                          </label>
                          <small className="movieFieldHelp">
                            Từ giờ này trở đi, khán giả có thể bấm mua vé các suất chiếu sớm trên App.
                          </small>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cảnh báo logic thời gian nếu có */}
                  {validationWarning && (
                    <div className="movieTimelineWarning">
                      <AlertTriangle size={16} />
                      <span>{validationWarning}</span>
                    </div>
                  )}

                  {/* Dòng tóm tắt trực quan Timeline */}
                  {form.announceUpcoming && form.expectedReleaseDate && (
                    <div className="movieTimelineSummary">
                      <div className="timelineItem">
                        <span className="timelineDot active" />
                        <div>
                          <strong>Công bố trên App</strong>
                          <small>Ngay bây giờ</small>
                        </div>
                      </div>

                      <div className="timelineLine" />

                      <div className="timelineItem">
                        <span className={`timelineDot ${form.enableAdvanceBooking ? 'active' : ''}`} />
                        <div>
                          <strong>Mở bán vé sớm</strong>
                          <small>
                            {form.enableAdvanceBooking && form.ticketSaleStartAt
                              ? formatDateTimeDisplay(form.ticketSaleStartAt)
                              : 'Khi có suất chiếu'}
                          </small>
                        </div>
                      </div>

                      <div className="timelineLine" />

                      <div className="timelineItem">
                        <span className="timelineDot" />
                        <div>
                          <strong>Khởi chiếu toàn quốc</strong>
                          <small>{formatDateDisplay(form.expectedReleaseDate)}</small>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="movieScheduleManagedNotice">
                  <Info size={16} />
                  <span>Trạng thái và ngày khởi chiếu đang được hệ thống quản lý tự động theo lịch suất chiếu.</span>
                </div>
              )}
            </div>

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
              Giá vé gốc tham khảo (VNĐ)
              <input
                type="number"
                value={form.price}
                onChange={event => updateForm('price', event.target.value)}
                placeholder="Ví dụ: 85000"
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

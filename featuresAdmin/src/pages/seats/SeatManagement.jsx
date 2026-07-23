import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Lock, RefreshCw, Unlock, X} from 'lucide-react';
import seatMapApi from '../../api/seatMapApi';
import showtimeApi from '../../api/showtimeApi';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';

const REFRESH_MS = 5000;

const SEAT_TYPE_LABEL = {
  normal: 'Thường',
  vip: 'VIP',
  couple: 'Couple',
};

const SEAT_STATUS_LABEL = {
  available: 'Trống',
  held: 'Đang giữ',
  sold: 'Đã bán',
  checked_in: 'Đã check-in',
  maintenance: 'Bảo trì',
};

const LEGEND = [
  {key: 'available', label: 'Trống', className: 'seatDot--available'},
  {key: 'held', label: 'Đang giữ', className: 'seatDot--held'},
  {key: 'sold', label: 'Đã bán', className: 'seatDot--sold'},
  {key: 'checked_in', label: 'Check-in', className: 'seatDot--checkedIn'},
  {key: 'maintenance', label: 'Bảo trì', className: 'seatDot--maintenance'},
  {key: 'vip', label: 'VIP', className: 'seatDot--vip'},
  {key: 'couple', label: 'Couple', className: 'seatDot--couple'},
];

function SeatMapFilter({label, children}) {
  const openSelect = event => {
    const select = event.currentTarget.querySelector('select');
    if (!select || select.disabled || event.target === select) return;
    select.focus();
    if (typeof select.showPicker === 'function') {
      try {
        select.showPicker();
      } catch {
        select.click();
      }
    } else {
      select.click();
    }
  };

  return (
    <label className="seatMapFilter" onClick={openSelect}>
      <span>{label}</span>
      {children}
    </label>
  );
}

const PAYMENT_LABEL = {
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
  zalopay: 'ZaloPay',
  cash: 'Tiền mặt',
  card: 'Thẻ ngân hàng',
};

function formatShowtimeLabel(showtime) {
  const start = showtime?.startTime ? new Date(showtime.startTime) : null;
  if (!start) return 'Chưa rõ giờ chiếu';
  const time = start.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
  const date = start.toLocaleDateString('vi-VN');
  return `${time} - ${date}`;
}

function formatCountdown(expiresAt) {
  if (!expiresAt) return '';
  const remain = new Date(expiresAt).getTime() - Date.now();
  if (remain <= 0) return 'Sắp hết hạn';
  const minutes = Math.floor(remain / 60000);
  const seconds = Math.floor((remain % 60000) / 1000);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function seatClassName(seat, typeFilter, isSelected) {
  const classes = ['seatCell', `seatCell--${seat.status}`, `seatCell--type-${seat.type}`];
  if (typeFilter && typeFilter !== 'all' && seat.type !== typeFilter) {
    classes.push('is-dimmed');
  }
  if (isSelected) {
    classes.push('is-selected');
  }
  return classes.join(' ');
}

function SeatManagement() {
  const navigate = useNavigate();

  const [showtimes, setShowtimes] = useState([]);
  const [movieId, setMovieId] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showtimeId, setShowtimeId] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [acting, setActing] = useState(false);
  const [typeEditing, setTypeEditing] = useState(false);
  const [nextType, setNextType] = useState('normal');
  const [confirmModal, setConfirmModal] = useState(null); // {action: 'release'|'lock', seat}
  const [, setClockTick] = useState(0);

  const showtimeIdRef = useRef('');
  showtimeIdRef.current = showtimeId;

  /** Đồng hồ 1s cho countdown ghế đang giữ */
  useEffect(() => {
    const timer = setInterval(() => setClockTick(tick => tick + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadShowtimes = useCallback(async () => {
    try {
      const response = await showtimeApi.getAll({limit: 500, sort: '-startTime'});
      const rows = Array.isArray(response?.data) ? response.data : [];
      const valid = rows.filter(item => item.movie && item.room);
      setShowtimes(valid);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách suất chiếu');
    }
  }, []);

  useEffect(() => {
    loadShowtimes();
  }, [loadShowtimes]);

  const movies = useMemo(() => {
    const map = new Map();
    showtimes.forEach(item => {
      const id = item.movie?._id;
      if (id && !map.has(id)) {
        map.set(id, item.movie.title || 'Không rõ tên phim');
      }
    });
    return [...map.entries()].map(([id, title]) => ({id, title}));
  }, [showtimes]);

  const rooms = useMemo(() => {
    const map = new Map();
    showtimes
      .filter(item => !movieId || item.movie?._id === movieId)
      .forEach(item => {
        const id = item.room?._id;
        if (id && !map.has(id)) {
          map.set(id, item.room.name || 'Phòng chưa đặt tên');
        }
      });
    return [...map.entries()].map(([id, name]) => ({id, name}));
  }, [showtimes, movieId]);

  const showtimeOptions = useMemo(
    () =>
      showtimes
        .filter(
          item =>
            (!movieId || item.movie?._id === movieId) &&
            (!roomId || item.room?._id === roomId),
        )
        .sort(
          (a, b) =>
            new Date(a.startTime || 0).getTime() -
            new Date(b.startTime || 0).getTime(),
        ),
    [showtimes, movieId, roomId],
  );

  /** Nhóm suất chiếu theo phim để dropdown hiện rõ từng phim */
  const showtimeGroups = useMemo(() => {
    const map = new Map();
    showtimeOptions.forEach(item => {
      const title = item.movie?.title || 'Không rõ tên phim';
      if (!map.has(title)) {
        map.set(title, []);
      }
      map.get(title).push(item);
    });
    return [...map.entries()].map(([title, items]) => ({title, items}));
  }, [showtimeOptions]);

  /** Chỉ hiện suất chiếu sau khi đã chọn phim */
  useEffect(() => {
    if (!movieId || !showtimeOptions.length) {
      setShowtimeId('');
      setSeatMap(null);
      return;
    }
    if (!showtimeOptions.some(item => item._id === showtimeId)) {
      setShowtimeId(showtimeOptions[0]._id);
    }
  }, [movieId, showtimeOptions, showtimeId]);

  const loadSeatMap = useCallback(
    async (id, {silent = false} = {}) => {
      if (!id) return;
      if (!silent) {
        setLoading(true);
      }
      setError('');
      try {
        const response = await seatMapApi.getMap(id);
        if (showtimeIdRef.current !== id) return;
        setSeatMap(response?.data || null);
      } catch (err) {
        if (!silent) {
          setError(err.message || 'Không tải được sơ đồ ghế');
          setSeatMap(null);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    setSelectedLabel('');
    setTypeEditing(false);
    if (!showtimeId) return;
    loadSeatMap(showtimeId);
    const timer = setInterval(() => loadSeatMap(showtimeId, {silent: true}), REFRESH_MS);
    return () => clearInterval(timer);
  }, [showtimeId, loadSeatMap]);

  const seats = seatMap?.seats || [];
  const stats = seatMap?.stats || null;

  const seatRows = useMemo(() => {
    const map = new Map();
    seats.forEach(seat => {
      if (!map.has(seat.row)) {
        map.set(seat.row, []);
      }
      map.get(seat.row).push(seat);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([row, rowSeats]) => ({
        row,
        seats: rowSeats.sort((a, b) => a.number - b.number),
      }));
  }, [seats]);

  const selectedSeat = useMemo(
    () => seats.find(seat => seat.label === selectedLabel) || null,
    [seats, selectedLabel],
  );

  const handleSeatClick = seat => {
    setSelectedLabel(current => (current === seat.label ? '' : seat.label));
    setTypeEditing(false);
    setNextType(seat.type || 'normal');
  };

  const runAction = async action => {
    setActing(true);
    setError('');
    try {
      await action();
      await loadSeatMap(showtimeId, {silent: true});
    } catch (err) {
      setError(err.message || 'Thao tác thất bại');
    } finally {
      setActing(false);
      setConfirmModal(null);
    }
  };

  const releaseSeat = seat =>
    runAction(() => seatMapApi.release(showtimeId, seat.label));

  const lockSeat = seat => runAction(() => seatMapApi.lock(seat.id));

  const unlockSeat = seat => runAction(() => seatMapApi.unlock(seat.id));

  const changeSeatType = seat =>
    runAction(async () => {
      await seatMapApi.changeType(seat.id, nextType);
      setTypeEditing(false);
    });

  const confirmAndRun = () => {
    if (!confirmModal) return;
    if (confirmModal.action === 'release') {
      releaseSeat(confirmModal.seat);
    } else if (confirmModal.action === 'lock') {
      lockSeat(confirmModal.seat);
    }
  };

  const currentShowtime = showtimeOptions.find(item => item._id === showtimeId);

  return (
    <section className="seatMapPage">
      <header className="seatMapHeader">
        <div>
          <h2>Quản lý ghế</h2>
          <p>Quản lý sơ đồ ghế và tình trạng đặt ghế theo suất chiếu</p>
        </div>
        <button
          type="button"
          className="userBtnGhost"
          onClick={() => loadSeatMap(showtimeId)}
          disabled={!showtimeId || loading}
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </header>

      <div className="seatMapFilters">
        <SeatMapFilter label="Chọn phim">
          <select
            value={movieId}
            onChange={event => {
              setMovieId(event.target.value);
              setRoomId('');
            }}
          >
            <option value="">Tất cả phim</option>
            {movies.map(movie => (
              <option key={movie.id} value={movie.id}>
                {movie.title}
              </option>
            ))}
          </select>
        </SeatMapFilter>

        <SeatMapFilter label="Chọn phòng">
          <select value={roomId} onChange={event => setRoomId(event.target.value)}>
            <option value="">Tất cả phòng</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </SeatMapFilter>

        <SeatMapFilter label="Chọn suất chiếu">
          <select
            value={showtimeId}
            disabled={!movieId}
            onChange={event => setShowtimeId(event.target.value)}
          >
            {!movieId ? (
              <option value="">Chọn phim trước</option>
            ) : !showtimeOptions.length ? (
              <option value="">Không có suất chiếu</option>
            ) : null}
            {movieId
              ? showtimeGroups.map(group => (
                  <optgroup key={group.title} label={group.title}>
                    {group.items.map(item => (
                      <option key={item._id} value={item._id}>
                        {formatShowtimeLabel(item)} · {item.movie?.title} · {item.room?.name}
                      </option>
                    ))}
                  </optgroup>
                ))
              : null}
          </select>
        </SeatMapFilter>

        <SeatMapFilter label="Loại ghế">
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">Tất cả</option>
            <option value="normal">Thường</option>
            <option value="vip">VIP</option>
            <option value="couple">Couple</option>
          </select>
        </SeatMapFilter>
      </div>

      <div className="seatMapLegend">
        {LEGEND.map(item => (
          <span key={item.key} className="seatLegendItem">
            <i className={`seatDot ${item.className}`} />
            {item.label}
          </span>
        ))}
      </div>

      {error ? <p className="seatMapError">{error}</p> : null}

      <div className="seatMapBody">
        <section className="seatMapBoard">
          {loading ? (
            <p className="seatMapEmpty">Đang tải sơ đồ ghế...</p>
          ) : !showtimeId || !seatMap ? (
            <p className="seatMapEmpty">
              {!movieId
                ? 'Chọn phim để xem suất chiếu và sơ đồ ghế'
                : 'Chọn suất chiếu để xem sơ đồ ghế'}
            </p>
          ) : (
            <>
              <div className="seatMapScreen">
                <div className="seatMapScreenArc" />
                <span>MÀN HÌNH</span>
              </div>

              <div className="seatMapGrid">
                {seatRows.map(rowItem => (
                  <div className="seatMapRow" key={rowItem.row}>
                    <span className="seatMapRowLabel">{rowItem.row}</span>
                    <div className="seatMapRowSeats">
                      {rowItem.seats.map(seat => (
                        <button
                          type="button"
                          key={seat.id}
                          className={seatClassName(seat, typeFilter, selectedLabel === seat.label)}
                          title={`${seat.label} · ${SEAT_TYPE_LABEL[seat.type]} · ${SEAT_STATUS_LABEL[seat.status]}`}
                          onClick={() => handleSeatClick(seat)}
                        >
                          {seat.label}
                        </button>
                      ))}
                    </div>
                    <span className="seatMapRowLabel">{rowItem.row}</span>
                  </div>
                ))}
              </div>

              {stats ? (
                <footer className="seatMapStats">
                  <span>Tổng số ghế: <strong>{stats.total}</strong></span>
                  <span>Trống: <strong>{stats.available}</strong></span>
                  <span>Đang giữ: <strong>{stats.held}</strong></span>
                  <span>Đã bán: <strong>{stats.sold}</strong></span>
                  <span>Check-in: <strong>{stats.checkedIn}</strong></span>
                  <span>Bảo trì: <strong>{stats.maintenance}</strong></span>
                </footer>
              ) : null}
            </>
          )}
        </section>

        {selectedSeat ? (
          <aside className="seatDetailPanel">
            <header className="seatDetailHead">
              <h3>Thông tin ghế</h3>
              <button
                type="button"
                className="userIconBtn"
                onClick={() => setSelectedLabel('')}
              >
                <X size={15} />
              </button>
            </header>

            <div className="seatDetailTitle">
              <strong>{selectedSeat.label}</strong>
              <span className={`seatStatusBadge seatStatusBadge--${selectedSeat.status}`}>
                {SEAT_STATUS_LABEL[selectedSeat.status]}
              </span>
            </div>

            <dl className="seatDetailGrid">
              <div>
                <dt>Loại ghế</dt>
                <dd className={`seatTypeText seatTypeText--${selectedSeat.type}`}>
                  {SEAT_TYPE_LABEL[selectedSeat.type] || selectedSeat.type}
                </dd>
              </div>
              <div>
                <dt>Giá ghế</dt>
                <dd>{formatVnd(selectedSeat.price)}</dd>
              </div>
              {currentShowtime ? (
                <div>
                  <dt>Suất chiếu</dt>
                  <dd>{formatShowtimeLabel(currentShowtime)}</dd>
                </div>
              ) : null}
            </dl>

            {selectedSeat.status === 'held' && selectedSeat.hold ? (
              <div className="seatDetailSection">
                <h4>Thông tin giữ ghế</h4>
                <dl className="seatDetailGrid">
                  <div>
                    <dt>Giữ bởi</dt>
                    <dd>{selectedSeat.hold.heldBy}</dd>
                  </div>
                  <div>
                    <dt>Thời gian còn lại</dt>
                    <dd className="seatHoldCountdown">
                      {formatCountdown(selectedSeat.hold.expiresAt)}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {(selectedSeat.status === 'sold' || selectedSeat.status === 'checked_in') &&
            selectedSeat.order ? (
              <div className="seatDetailSection">
                <h4>Thông tin đơn hàng</h4>
                <dl className="seatDetailGrid">
                  <div>
                    <dt>Khách hàng</dt>
                    <dd>{selectedSeat.order.customerName}</dd>
                  </div>
                  <div>
                    <dt>Số điện thoại</dt>
                    <dd>{selectedSeat.order.customerPhone || 'Chưa có'}</dd>
                  </div>
                  <div>
                    <dt>Mã đơn hàng</dt>
                    <dd>{selectedSeat.order.code}</dd>
                  </div>
                  <div>
                    <dt>Thời gian đặt</dt>
                    <dd>{formatDateTime(selectedSeat.order.bookedAt) || 'Chưa có'}</dd>
                  </div>
                  <div>
                    <dt>Thanh toán</dt>
                    <dd>
                      {PAYMENT_LABEL[selectedSeat.order.paymentMethod] ||
                        selectedSeat.order.paymentMethod ||
                        'Chưa có'}
                    </dd>
                  </div>
                  {selectedSeat.status === 'checked_in' ? (
                    <div>
                      <dt>Check-in lúc</dt>
                      <dd>{formatDateTime(selectedSeat.order.checkedInAt) || 'Chưa có'}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            ) : null}

            <div className="seatDetailActions">
              {selectedSeat.status === 'held' ? (
                <button
                  type="button"
                  className="seatActionBtn seatActionBtn--danger"
                  disabled={acting}
                  onClick={() => setConfirmModal({action: 'release', seat: selectedSeat})}
                >
                  Thu hồi ghế
                </button>
              ) : null}

              {selectedSeat.status === 'available' ? (
                <>
                  <button
                    type="button"
                    className="seatActionBtn"
                    disabled={acting}
                    onClick={() => setConfirmModal({action: 'lock', seat: selectedSeat})}
                  >
                    <Lock size={14} /> Khóa ghế
                  </button>
                  {typeEditing ? (
                    <div className="seatTypeEditor">
                      <select
                        value={nextType}
                        onChange={event => setNextType(event.target.value)}
                      >
                        <option value="normal">Thường</option>
                        <option value="vip">VIP</option>
                        <option value="couple">Couple</option>
                      </select>
                      <button
                        type="button"
                        className="seatActionBtn seatActionBtn--primary"
                        disabled={acting}
                        onClick={() => changeSeatType(selectedSeat)}
                      >
                        Lưu
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="seatActionBtn"
                      disabled={acting}
                      onClick={() => setTypeEditing(true)}
                    >
                      Đổi loại ghế
                    </button>
                  )}
                </>
              ) : null}

              {selectedSeat.status === 'maintenance' ? (
                <button
                  type="button"
                  className="seatActionBtn seatActionBtn--primary"
                  disabled={acting}
                  onClick={() => unlockSeat(selectedSeat)}
                >
                  <Unlock size={14} /> Mở ghế
                </button>
              ) : null}

              {selectedSeat.status === 'sold' && selectedSeat.order ? (
                <>
                  <button
                    type="button"
                    className="seatActionBtn"
                    onClick={() => navigate(`/bookings/detail?code=${selectedSeat.order.code}`)}
                  >
                    Xem chi tiết vé
                  </button>
                  <button
                    type="button"
                    className="seatActionBtn"
                    onClick={() => navigate(`/bookings?keyword=${selectedSeat.order.code}`)}
                  >
                    Xem thông tin khách hàng
                  </button>
                </>
              ) : null}

              {selectedSeat.status === 'checked_in' ? (
                <p className="seatDetailNote">Ghế đã check-in — không thể chỉnh sửa.</p>
              ) : null}

              <button
                type="button"
                className="seatActionBtn seatActionBtn--ghost"
                onClick={() => setSelectedLabel('')}
              >
                Đóng
              </button>
            </div>
          </aside>
        ) : null}
      </div>

      {confirmModal ? (
        <div className="userModalOverlay" role="dialog" aria-modal="true">
          <div className="userModal">
            <h3>
              {confirmModal.action === 'release'
                ? `Thu hồi ghế ${confirmModal.seat.label}?`
                : `Khóa ghế ${confirmModal.seat.label}?`}
            </h3>
            <p>
              {confirmModal.action === 'release'
                ? 'Ghế sẽ trống lại ngay và khách đang chọn sẽ mất ghế này. Hệ thống sẽ từ chối nếu khách đang ở bước thanh toán.'
                : 'Ghế chuyển sang bảo trì ở TẤT CẢ suất chiếu của phòng này và khách sẽ không đặt được. Hệ thống sẽ từ chối nếu ghế còn vé ở suất chưa diễn ra.'}
            </p>
            <div className="userModalActions">
              <button
                type="button"
                className="userBtnGhost"
                disabled={acting}
                onClick={() => setConfirmModal(null)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="userBtnDanger"
                disabled={acting}
                onClick={confirmAndRun}
              >
                {confirmModal.action === 'release' ? 'Xác nhận thu hồi' : 'Xác nhận khóa'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export default SeatManagement;

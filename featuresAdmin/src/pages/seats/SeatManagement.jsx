import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {Layers, Lock, PlusCircle, RefreshCw, Unlock, X} from 'lucide-react';
import seatMapApi from '../../api/seatMapApi';
import roomApi from '../../api/roomApi';
import showtimeApi from '../../api/showtimeApi';
import {formatDateTime, formatVnd} from '../../utils/adminFormatters';

const REFRESH_MS = 5000;

const SEAT_TYPE_LABEL = {
  normal: 'Thường',
  vip: 'VIP',
  couple: 'Couple',
};

const SEAT_STATUS_LABEL = {
  available: 'Hoạt động / Trống',
  held: 'Đang giữ',
  sold: 'Đã bán',
  checked_in: 'Đã check-in',
  maintenance: 'Bảo trì (Đã khóa)',
};

const LEGEND_ROOM_MODE = [
  {key: 'available', label: 'Hoạt động', className: 'seatDot--available'},
  {key: 'maintenance', label: 'Bảo trì (Khóa)', className: 'seatDot--maintenance'},
  {key: 'vip', label: 'VIP', className: 'seatDot--vip'},
  {key: 'couple', label: 'Couple', className: 'seatDot--couple'},
  {key: 'normal', label: 'Thường', className: 'seatDot--available'},
];

const LEGEND_SHOWTIME_MODE = [
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
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRoomId = searchParams.get('roomId') || '';

  const [rooms, setRooms] = useState([]);
  const [roomId, setRoomId] = useState(initialRoomId);
  const [showtimes, setShowtimes] = useState([]);
  const [showtimeId, setShowtimeId] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const [seatMap, setSeatMap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('');
  const [acting, setActing] = useState(false);
  const [typeEditing, setTypeEditing] = useState(false);
  const [nextType, setNextType] = useState('normal');
  const [confirmModal, setConfirmModal] = useState(null);
  const [, setClockTick] = useState(0);

  const roomIdRef = useRef(roomId);
  roomIdRef.current = roomId;
  const showtimeIdRef = useRef(showtimeId);
  showtimeIdRef.current = showtimeId;

  /** Đồng hồ 1s cho countdown ghế đang giữ */
  useEffect(() => {
    const timer = setInterval(() => setClockTick(tick => tick + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  /** Tải danh sách phòng */
  useEffect(() => {
    let isMounted = true;
    const fetchRooms = async () => {
      try {
        const res = await roomApi.getAll({limit: 100});
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (isMounted) {
          setRooms(rows);
          if (rows.length > 0) {
            setRoomId(curr => {
              if (curr && rows.some(r => (r._id || r.id) === curr)) return curr;
              return rows[0]._id || rows[0].id;
            });
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Không tải được danh sách phòng chiếu');
        }
      }
    };
    fetchRooms();
    return () => {
      isMounted = false;
    };
  }, []);

  /** Khi đổi phòng, tải danh sách suất chiếu của phòng đó */
  useEffect(() => {
    if (!roomId) {
      setShowtimes([]);
      setShowtimeId('');
      return;
    }
    let isMounted = true;
    const fetchShowtimes = async () => {
      try {
        const res = await showtimeApi.getAll({room: roomId, limit: 100, sort: '-startTime'});
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (isMounted) {
          setShowtimes(rows);
          setShowtimeId('');
        }
      } catch (err) {
        if (isMounted) {
          setShowtimes([]);
        }
      }
    };
    fetchShowtimes();
    return () => {
      isMounted = false;
    };
  }, [roomId]);

  /** Tải sơ đồ ghế (theo Suất chiếu nếu có chọn, hoặc theo Phòng chiếu) */
  const loadSeatMap = useCallback(
    async ({silent = false} = {}) => {
      const currentRoom = roomIdRef.current;
      const currentShowtime = showtimeIdRef.current;

      if (!currentRoom && !currentShowtime) return;

      if (!silent) {
        setLoading(true);
      }
      setError('');

      try {
        let response;
        if (currentShowtime) {
          response = await seatMapApi.getMap(currentShowtime);
        } else if (currentRoom) {
          response = await seatMapApi.getRoomMap(currentRoom);
        }

        if (roomIdRef.current === currentRoom && showtimeIdRef.current === currentShowtime) {
          setSeatMap(response?.data || null);
        }
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
    if (!roomId && !showtimeId) return;

    loadSeatMap();
    const timer = setInterval(() => loadSeatMap({silent: true}), REFRESH_MS);
    return () => clearInterval(timer);
  }, [roomId, showtimeId, loadSeatMap]);

  const seats = seatMap?.seats || [];
  const stats = seatMap?.stats || null;
  const currentRoomInfo = seatMap?.room || rooms.find(r => (r._id || r.id) === roomId) || null;

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
      await loadSeatMap({silent: true});
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

  const handleGenerateSeats = () => {
    if (!roomId) return;
    runAction(() => seatMapApi.generateRoomSeats(roomId, true));
  };

  const confirmAndRun = () => {
    if (!confirmModal) return;
    if (confirmModal.action === 'release') {
      releaseSeat(confirmModal.seat);
    } else if (confirmModal.action === 'lock') {
      lockSeat(confirmModal.seat);
    }
  };

  const currentShowtime = showtimes.find(item => item._id === showtimeId);

  return (
    <section className="seatMapPage">
      <header className="seatMapHeader">
        <div>
          <h2>Quản lý ghế theo phòng chiếu</h2>
          <p>
            {showtimeId
              ? `Đang xem tình trạng đặt vé theo suất chiếu của ${currentRoomInfo?.name || 'Phòng'}`
              : `Quản lý sơ đồ ghế, trạng thái bảo trì và loại ghế của ${currentRoomInfo?.name || 'Phòng chiếu'}`}
          </p>
        </div>
        <button
          type="button"
          className="userBtnGhost"
          onClick={() => loadSeatMap()}
          disabled={!roomId || loading}
        >
          <RefreshCw size={15} /> Làm mới
        </button>
      </header>

      <div className="seatMapFilters">
        <SeatMapFilter label="1. Chọn phòng chiếu (Chính)">
          <select
            value={roomId}
            onChange={event => {
              const nextRoomId = event.target.value;
              setRoomId(nextRoomId);
              setSearchParams(nextRoomId ? {roomId: nextRoomId} : {});
            }}
          >
            {rooms.map(room => (
              <option key={room._id || room.id} value={room._id || room.id}>
                {room.name} ({room.type || '2D'}) - {room.totalSeats || 0} ghế
              </option>
            ))}
          </select>
        </SeatMapFilter>

        <SeatMapFilter label="2. Suất chiếu (Tùy chọn xem realtime)">
          <select
            value={showtimeId}
            disabled={!roomId}
            onChange={event => setShowtimeId(event.target.value)}
          >
            <option value="">⚙️ Cấu hình gốc của phòng (Khóa/Mở/Đổi loại ghế)</option>
            {showtimes.map(item => (
              <option key={item._id} value={item._id}>
                🎬 {formatShowtimeLabel(item)} · {item.movie?.title || 'Phim'}
              </option>
            ))}
          </select>
        </SeatMapFilter>

        <SeatMapFilter label="3. Lọc loại ghế">
          <select value={typeFilter} onChange={event => setTypeFilter(event.target.value)}>
            <option value="all">Tất cả loại ghế</option>
            <option value="normal">Ghế Thường</option>
            <option value="vip">Ghế VIP</option>
            <option value="couple">Ghế Couple</option>
          </select>
        </SeatMapFilter>
      </div>

      <div className="seatMapLegend">
        {(showtimeId ? LEGEND_SHOWTIME_MODE : LEGEND_ROOM_MODE).map(item => (
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
          ) : !roomId ? (
            <p className="seatMapEmpty">Vui lòng chọn phòng chiếu để xem sơ đồ ghế</p>
          ) : seats.length === 0 ? (
            <div style={{textAlign: 'center', padding: '40px 20px'}}>
              <p className="seatMapEmpty" style={{marginBottom: '16px'}}>
                Phòng này chưa có dữ liệu sơ đồ ghế.
              </p>
              <button
                type="button"
                className="seatActionBtn seatActionBtn--primary"
                disabled={acting}
                onClick={handleGenerateSeats}
                style={{display: 'inline-flex', alignItems: 'center', gap: '6px'}}
              >
                <PlusCircle size={16} /> Tạo sơ đồ ghế chuẩn cho phòng (115 ghế)
              </button>
            </div>
          ) : (
            <>
              <div className="seatMapScreen">
                <div className="seatMapScreenArc" />
                <span>MÀN HÌNH ({currentRoomInfo?.name || 'PHÒNG CHIẾU'})</span>
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
                          title={`${seat.label} · ${SEAT_TYPE_LABEL[seat.type]} · ${SEAT_STATUS_LABEL[seat.status] || seat.status}`}
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
                  {showtimeId ? (
                    <>
                      <span>Trống: <strong>{stats.available}</strong></span>
                      <span>Đang giữ: <strong>{stats.held}</strong></span>
                      <span>Đã bán: <strong>{stats.sold}</strong></span>
                      <span>Check-in: <strong>{stats.checkedIn}</strong></span>
                      <span>Bảo trì: <strong>{stats.maintenance}</strong></span>
                    </>
                  ) : (
                    <>
                      <span>Hoạt động: <strong>{stats.available}</strong></span>
                      <span>Bảo trì (Khóa): <strong>{stats.maintenance}</strong></span>
                      <span>Thường: <strong>{stats.normal || 0}</strong></span>
                      <span>VIP: <strong>{stats.vip || 0}</strong></span>
                      <span>Couple: <strong>{stats.couple || 0}</strong></span>
                    </>
                  )}
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
                {SEAT_STATUS_LABEL[selectedSeat.status] || selectedSeat.status}
              </span>
            </div>

            <dl className="seatDetailGrid">
              <div>
                <dt>Phòng</dt>
                <dd>{currentRoomInfo?.name || 'Phòng'}</dd>
              </div>
              <div>
                <dt>Loại ghế</dt>
                <dd className={`seatTypeText seatTypeText--${selectedSeat.type}`}>
                  {SEAT_TYPE_LABEL[selectedSeat.type] || selectedSeat.type}
                </dd>
              </div>
              {selectedSeat.price ? (
                <div>
                  <dt>Giá vé</dt>
                  <dd>{formatVnd(selectedSeat.price)}</dd>
                </div>
              ) : null}
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
                    className="seatActionBtn seatActionBtn--danger"
                    disabled={acting}
                    onClick={() => setConfirmModal({action: 'lock', seat: selectedSeat})}
                  >
                    <Lock size={14} /> Khóa ghế (Bảo trì)
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
                  <Unlock size={14} /> Mở ghế (Hết bảo trì)
                </button>
              ) : null}

              {selectedSeat.status === 'sold' && selectedSeat.order ? (
                <button
                  type="button"
                  className="seatActionBtn"
                  onClick={() =>
                    navigate(`/bookings?keyword=${encodeURIComponent(selectedSeat.order.code)}`)
                  }
                >
                  Xem đơn đặt vé
                </button>
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
                : `Khóa ghế ${confirmModal.seat.label} (${currentRoomInfo?.name || 'Phòng'})?`}
            </h3>
            <p>
              {confirmModal.action === 'release'
                ? 'Ghế sẽ trống lại ngay và khách đang chọn sẽ mất ghế này. Hệ thống sẽ từ chối nếu khách đang ở bước thanh toán.'
                : `Ghế sẽ chuyển sang trạng thái bảo trì trong ${currentRoomInfo?.name || 'phòng này'} và khách hàng sẽ không thể đặt ở mọi suất chiếu. Hệ thống sẽ từ chối nếu ghế đang có vé đã thanh toán ở suất chưa diễn ra.`}
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

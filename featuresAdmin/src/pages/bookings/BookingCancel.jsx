import {useEffect, useMemo, useState} from 'react';
import bookingApi from '../../api/bookingApi';
import ticketApi from '../../api/ticketApi';
import Table from '../../components/Table';
import {formatDateTime, formatVnd, getUserName, shortId} from '../../utils/adminFormatters';

const bookingStatusMap = {
  pending: {label: 'Chờ xử lý', tone: 'warning'},
  paid: {label: 'Hoàn tất', tone: 'success'},
  cancelled: {label: 'Đã hủy', tone: 'danger'},
};

function StatusBadge({value}) {
  const status = bookingStatusMap[value] || {label: value || 'Chưa có', tone: 'info'};
  return <span className={`badge ${status.tone}`}>{status.label}</span>;
}

function BookingCancel() {
  const [bookings, setBookings] = useState([]);
  const [keyword, setKeyword] = useState('');
  const [savingId, setSavingId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await bookingApi.getAll({limit: 500, sort: '-createdAt'});
      setBookings(Array.isArray(response) ? response : response?.data || []);
    } catch (err) {
      setError(err.message || 'Không tải được danh sách đơn đặt vé.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBookings = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return bookings.filter(booking => {
      const searchable = [
        `DH-${shortId(booking)}`,
        booking.ticketCode,
        getUserName(booking),
        booking.user?.email,
        booking.movieTitle,
        booking.showtime?.movie?.title,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return !normalizedKeyword || searchable.includes(normalizedKeyword);
    });
  }, [bookings, keyword]);

  const cancelRelatedTickets = async booking => {
    const response = await ticketApi.getAll({limit: 500});
    const tickets = Array.isArray(response) ? response : response?.data || [];
    const bookingId = booking._id || booking.id;
    const relatedTickets = tickets.filter(ticket => {
      const ticketBookingId = ticket.booking?._id || ticket.booking;
      return String(ticketBookingId) === String(bookingId);
    });

    await Promise.all(
      relatedTickets.map(ticket =>
        ticketApi.update(ticket._id, {
          booking: ticket.booking?._id || ticket.booking,
          showtime: ticket.showtime?._id || ticket.showtime,
          seat: ticket.seat?._id || ticket.seat,
          code: ticket.code,
          price: ticket.price,
          status: 'cancelled',
        }),
      ),
    );
  };

  const handleCancel = async booking => {
    const ok = window.confirm(`Hủy đơn DH-${shortId(booking)}? Vé liên quan sẽ được chuyển sang trạng thái đã hủy.`);
    if (!ok) return;

    setSavingId(booking._id);

    try {
      await bookingApi.update(booking._id, {
        user: booking.user?._id || booking.user,
        showtime: booking.showtime?._id || booking.showtime,
        seats: booking.seats?.map(seat => seat._id || seat) || [],
        voucher: booking.voucher?._id || booking.voucher,
        totalPrice: booking.totalPrice,
        status: 'cancelled',
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus === 'paid' ? 'refunded' : booking.paymentStatus,
      });
      await cancelRelatedTickets(booking);
      await loadData();
    } catch (err) {
      window.alert(err.message || 'Hủy đơn thất bại.');
    } finally {
      setSavingId('');
    }
  };

  const columns = [
    {key: 'code', title: 'Mã đơn', render: item => `DH-${shortId(item)}`},
    {key: 'customer', title: 'Khách hàng', render: getUserName},
    {key: 'movie', title: 'Phim', render: item => item.movieTitle || item.showtime?.movie?.title || ''},
    {key: 'totalPrice', title: 'Tổng tiền', render: item => formatVnd(item.totalPrice)},
    {key: 'status', title: 'Trạng thái', render: item => <StatusBadge value={item.status} />},
    {key: 'createdAt', title: 'Ngày đặt', render: item => formatDateTime(item.createdAt)},
    {
      key: 'actions',
      title: 'Thao tác',
      render: item => (
        <button
          className="dangerButton"
          type="button"
          disabled={item.status === 'cancelled' || savingId === item._id}
          onClick={() => handleCancel(item)}
        >
          {item.status === 'cancelled' ? 'Đã hủy' : savingId === item._id ? 'Đang hủy...' : 'Hủy đơn'}
        </button>
      ),
    },
  ];

  return (
    <section className="bookingAdminPage">
      <div className="pageTitle">
        <h2>Hủy đặt vé</h2>
        <button type="button" onClick={loadData}>Tải lại</button>
      </div>

      <div className="panel bookingFilters">
        <input
          value={keyword}
          onChange={event => setKeyword(event.target.value)}
          placeholder="Tìm mã đơn, khách hàng, phim..."
        />
      </div>

      {error && <p className="loginError">{error}</p>}
      {loading ? (
        <p>Đang tải danh sách đơn...</p>
      ) : (
        <Table columns={columns} data={filteredBookings} emptyText="Không có đơn đặt vé phù hợp" />
      )}
    </section>
  );
}

export default BookingCancel;

const STATUS_LABEL = {valid: 'Hợp lệ', used: 'Đã sử dụng', cancelled: 'Đã hủy'};
const PAYMENT_LABEL = {paid: 'Đã thanh toán', unpaid: 'Chưa thanh toán', refunded: 'Đã hoàn tiền'};

export const ticketQrPayload = ({
  code,
  customerName,
  movieTitle,
  cinemaName,
  roomName,
  seatLabel,
  showDate,
  showTime,
  price,
  paymentStatus,
  status,
}) => [
  'FILMGO - VÉ XEM PHIM',
  `Mã vé: ${code || '—'}`,
  `Người đặt: ${customerName || 'Khách FilmGo'}`,
  `Phim: ${movieTitle || '—'}`,
  `Rạp: ${cinemaName || '—'}`,
  `Phòng: ${roomName || '—'}`,
  `Ghế: ${seatLabel || '—'}`,
  `Ngày chiếu: ${showDate || '—'}`,
  `Giờ chiếu: ${showTime || '—'}`,
  `Giá vé: ${Number(price || 0).toLocaleString('vi-VN')}đ`,
  `Thanh toán: ${PAYMENT_LABEL[paymentStatus] || paymentStatus || '—'}`,
  `Trạng thái: ${STATUS_LABEL[status] || status || '—'}`,
].join('\n');

export const ticketCodeFromQr = value => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const embeddedCode = raw.match(/Mã vé:\s*([^\s]+)/i)?.[1];
  if (embeddedCode) return embeddedCode.toUpperCase();
  try {
    const url = new URL(raw);
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '').toUpperCase();
  } catch {
    return raw.toUpperCase();
  }
};

export const formatDate = value => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('vi-VN');
};

export const formatDateTime = value => {
  if (!value) return '';
  return new Date(value).toLocaleString('vi-VN');
};

export const formatVnd = value => {
  const number = Number(value || 0);
  return `${number.toLocaleString('vi-VN')}đ`;
};

export const getId = item => item?._id || item?.id || '';

export const shortId = item => getId(item).slice(-6).toUpperCase();

export const getUserName = item =>
  item?.user?.fullName || item?.fullName || item?.user?.email || '';

export const getSeatLabel = item => {
  if (!item) return '';
  if (item.row && item.number) return `${item.row}${item.number}`;
  if (item.seat?.row && item.seat?.number) return `${item.seat.row}${item.seat.number}`;
  return '';
};

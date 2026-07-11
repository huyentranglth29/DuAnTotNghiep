export const STATUS_LABELS = {
  scheduled: 'Sắp chiếu',
  cancelled: 'Đã hủy',
  completed: 'Đã chiếu',
};

export function formatVnd(value) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function formatDate(value) {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  return date.toLocaleDateString('vi-VN');
}

export function formatTime(value) {
  if (!value) {
    return '--';
  }
  const date = new Date(value);
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatDuration(duration) {
  if (typeof duration === 'number') {
    const hour = Math.floor(duration / 60);
    const minute = duration % 60;
    return hour > 0 ? `${hour}h ${minute}m` : `${minute} phút`;
  }
  return duration || '--';
}

export function getDisplayStatus(showtime) {
  if (!showtime) {
    return {key: 'scheduled', label: 'Sắp chiếu', tone: 'upcoming'};
  }

  if (showtime.status === 'cancelled') {
    return {key: 'cancelled', label: 'Đã hủy', tone: 'cancelled'};
  }

  if (showtime.status === 'completed') {
    return {key: 'completed', label: 'Đã chiếu', tone: 'ended'};
  }

  const now = Date.now();
  const start = new Date(showtime.startTime).getTime();
  const end = new Date(showtime.endTime).getTime();

  if (now < start) {
    return {key: 'scheduled', label: 'Sắp chiếu', tone: 'upcoming'};
  }

  if (now >= start && now <= end) {
    return {key: 'showing', label: 'Đang chiếu', tone: 'showing'};
  }

  return {key: 'completed', label: 'Đã chiếu', tone: 'ended'};
}

export function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toTimeInputValue(value) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function buildStartTimeIso(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

export function shortCode(id = '') {
  const text = String(id);
  return `SC-${text.slice(-4).toUpperCase()}`;
}

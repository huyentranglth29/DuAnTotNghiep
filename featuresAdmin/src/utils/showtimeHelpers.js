export const CLEANUP_MINUTES = 15;

export const STATUS_LABELS = {
  scheduled: 'Sắp chiếu',
  cancelled: 'Đã hủy',
  completed: 'Đã kết thúc',
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
    return {key: 'completed', label: 'Đã kết thúc', tone: 'ended'};
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

  return {key: 'completed', label: 'Đã kết thúc', tone: 'ended'};
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

export function getDurationMinutes(duration) {
  if (typeof duration === 'number' && Number.isFinite(duration)) {
    return duration;
  }

  const text = String(duration || '');
  const hours = Number(text.match(/(\d+)\s*h/i)?.[1] || 0);
  const minutes = Number(text.match(/(\d+)\s*m/i)?.[1] || 0);
  if (hours || minutes) {
    return hours * 60 + minutes;
  }

  const numeric = Number(text);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 120;
}

/** Giờ kết thúc = bắt đầu + thời lượng (không cộng phút vệ sinh). */
export function buildEndTimeIso(startTime, duration) {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + getDurationMinutes(duration));
  return endTime.toISOString();
}

export function addCleanupMinutes(endTime, minutes = CLEANUP_MINUTES) {
  const next = new Date(endTime);
  next.setMinutes(next.getMinutes() + minutes);
  return next;
}

/** Hai suất xung đột nếu khoảng bận (end + 15') chồng lên nhau. */
export function rangesConflict(startA, endA, startB, endB) {
  const busyA = addCleanupMinutes(endA).getTime();
  const busyB = addCleanupMinutes(endB).getTime();
  return (
    new Date(startA).getTime() < busyB && new Date(startB).getTime() < busyA
  );
}

/**
 * Giờ bắt đầu có chọn được không (dựa freeGaps từ API, hoặc tự check chồng lịch).
 * freeGaps === null: chưa có lịch phòng → chưa khóa giờ.
 * freeGaps === []: đã tải lịch nhưng không còn khoảng trống đủ → khóa hết.
 */
export function isStartTimeAvailable({
  date,
  time,
  duration,
  showtimes = [],
  freeGaps = null,
}) {
  if (!date || !time) {
    return true;
  }

  const startIso = buildStartTimeIso(date, time);
  const startMs = new Date(startIso).getTime();

  if (Array.isArray(freeGaps)) {
    return freeGaps.some(gap => {
      if (!gap.canFit || !gap.latestStart) {
        return false;
      }
      const gapStart = new Date(gap.start).getTime();
      const latest = new Date(gap.latestStart).getTime();
      return startMs >= gapStart && startMs <= latest;
    });
  }

  if (!duration || !showtimes.length) {
    return true;
  }

  const endIso = buildEndTimeIso(startIso, duration);
  return !showtimes.some(item =>
    rangesConflict(startIso, endIso, item.startTime, item.endTime),
  );
}

export function padTimePart(value) {
  return `${Number(value)}`.padStart(2, '0');
}

export function buildTimeValue(hour, minute) {
  return `${padTimePart(hour)}:${padTimePart(minute)}`;
}

export function shortCode(id = '') {
  const text = String(id);
  return `SC-${text.slice(-4).toUpperCase()}`;
}

export function groupShowtimesByRoom(showtimes) {
  const map = new Map();
  showtimes.forEach(item => {
    const room = item.room || {};
    const key = String(room._id || room.id || item.room || 'unknown');
    if (!map.has(key)) {
      map.set(key, {
        roomId: key,
        name: room.name || 'Phòng',
        type: room.type || '',
        showtimes: [],
      });
    }
    map.get(key).showtimes.push(item);
  });

  return Array.from(map.values())
    .map(group => ({
      ...group,
      showtimes: [...group.showtimes].sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime),
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
}

const Showtime = require("../models/Showtime");

const CLEANUP_MINUTES = 15;
const DAY_OPEN_HOUR = 8;
const DAY_CLOSE_HOUR = 23;

function parseDurationMinutes(duration) {
  if (typeof duration === "number" && Number.isFinite(duration)) {
    return duration;
  }

  if (typeof duration !== "string") {
    return 120;
  }

  const hourMatch = duration.match(/(\d+)\s*h/i);
  const minuteMatch = duration.match(/(\d+)\s*m/i);
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  if (!hours && !minutes) {
    const asNumber = Number(duration);
    return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : 120;
  }

  return hours * 60 + minutes;
}

/** Giờ kết thúc = bắt đầu + thời lượng phim (không cộng phút vệ sinh). */
function buildEndTime(startTime, duration) {
  const end = new Date(startTime);
  end.setMinutes(end.getMinutes() + parseDurationMinutes(duration));
  return end;
}

function withCleanup(endTime) {
  return new Date(new Date(endTime).getTime() + CLEANUP_MINUTES * 60 * 1000);
}

function getVietnamDayBounds(date) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }
  return {
    dayStart: new Date(`${date}T00:00:00+07:00`),
    dayEnd: new Date(`${date}T23:59:59.999+07:00`),
    openAt: new Date(
      `${date}T${String(DAY_OPEN_HOUR).padStart(2, "0")}:00:00+07:00`,
    ),
    closeAt: new Date(
      `${date}T${String(DAY_CLOSE_HOUR).padStart(2, "0")}:00:00+07:00`,
    ),
  };
}

function formatTimeVN(value) {
  return new Date(value).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function buildConflictMessage(earliestAvailable) {
  if (!earliestAvailable) {
    return "Phòng chiếu đã có suất chiếu hoặc chưa đủ 15 phút nghỉ.";
  }
  return `Phòng chiếu đã có suất chiếu hoặc chưa đủ 15 phút nghỉ. Giờ sớm nhất có thể tạo là ${formatTimeVN(earliestAvailable)}.`;
}

/**
 * Hai suất xung đột nếu khoảng bận (end + 15') chồng lên nhau trên cùng phòng.
 */
function rangesConflict(startA, endA, startB, endB) {
  const busyA = withCleanup(endA).getTime();
  const busyB = withCleanup(endB).getTime();
  return (
    new Date(startA).getTime() < busyB && new Date(startB).getTime() < busyA
  );
}

async function loadRoomDayShowtimes({ room, date, excludeId = null }) {
  const bounds = getVietnamDayBounds(date);
  if (!room || !bounds) {
    return [];
  }

  const filter = {
    room,
    status: { $ne: "cancelled" },
    startTime: { $gte: bounds.dayStart, $lte: bounds.dayEnd },
  };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Showtime.find(filter)
    .populate("movie", "title duration")
    .populate("room", "name type")
    .sort({ startTime: 1 })
    .lean();
}

async function findRoomConflicts({
  room,
  startTime,
  endTime,
  excludeId = null,
}) {
  if (!room || !startTime || !endTime) {
    return [];
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  // Quét rộng hơn 1 ngày để bắt suất kéo qua nửa đêm / gap vệ sinh
  const windowStart = new Date(start.getTime() - 18 * 60 * 60 * 1000);
  const windowEnd = withCleanup(end);
  windowEnd.setHours(windowEnd.getHours() + 18);

  const filter = {
    room,
    status: { $ne: "cancelled" },
    startTime: { $lt: windowEnd },
    endTime: { $gt: windowStart },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const candidates = await Showtime.find(filter)
    .populate("movie", "title duration")
    .populate("room", "name type")
    .sort({ startTime: 1 })
    .lean();

  return candidates.filter((item) =>
    rangesConflict(start, end, item.startTime, item.endTime),
  );
}

function buildBusyBlocks(showtimes) {
  return showtimes
    .map((item) => ({
      start: new Date(item.startTime).getTime(),
      end: withCleanup(item.endTime).getTime(),
      showtime: item,
    }))
    .sort((a, b) => a.start - b.start);
}

function buildFreeGaps({ openAt, closeAt, showtimes, durationMinutes }) {
  const durationMs = Math.max(1, durationMinutes) * 60 * 1000;
  const cleanupMs = CLEANUP_MINUTES * 60 * 1000;
  const openMs = openAt.getTime();
  const closeMs = closeAt.getTime();
  const busy = buildBusyBlocks(showtimes);
  const gaps = [];
  let cursor = openMs;

  for (const block of busy) {
    if (block.start > cursor) {
      const gapStart = cursor;
      const gapEnd = block.start;
      const latestStart = gapEnd - durationMs - cleanupMs;
      if (latestStart >= gapStart) {
        gaps.push({
          start: new Date(gapStart),
          end: new Date(gapEnd),
          latestStart: new Date(latestStart),
          canFit: true,
        });
      } else if (gapEnd > gapStart) {
        gaps.push({
          start: new Date(gapStart),
          end: new Date(gapEnd),
          latestStart: null,
          canFit: false,
        });
      }
    }
    cursor = Math.max(cursor, block.end);
  }

  if (closeMs > cursor) {
    const gapStart = cursor;
    const gapEnd = closeMs;
    const latestStart = gapEnd - durationMs;
    if (latestStart >= gapStart) {
      gaps.push({
        start: new Date(gapStart),
        end: new Date(gapEnd),
        latestStart: new Date(latestStart),
        canFit: true,
      });
    } else {
      gaps.push({
        start: new Date(gapStart),
        end: new Date(gapEnd),
        latestStart: null,
        canFit: false,
      });
    }
  }

  return gaps;
}

function findEarliestStartInGaps(gaps, preferredStart = null) {
  const preferred = preferredStart ? new Date(preferredStart).getTime() : null;

  for (const gap of gaps) {
    if (!gap.canFit || !gap.latestStart) {
      continue;
    }
    const gapStart = gap.start.getTime();
    const latest = gap.latestStart.getTime();
    let candidate = gapStart;
    if (preferred !== null && preferred > candidate) {
      candidate = preferred;
    }
    if (candidate <= latest) {
      return new Date(candidate);
    }
  }

  return null;
}

/**
 * Lịch trong ngày của phòng: suất hiện có, khoảng trống, giờ gợi ý.
 */
async function getRoomDaySchedule({
  room,
  date,
  durationMinutes = 120,
  excludeId = null,
  preferredStart = null,
}) {
  const bounds = getVietnamDayBounds(date);
  if (!room || !bounds) {
    return null;
  }

  const showtimes = await loadRoomDayShowtimes({ room, date, excludeId });
  const freeGaps = buildFreeGaps({
    openAt: bounds.openAt,
    closeAt: bounds.closeAt,
    showtimes,
    durationMinutes: parseDurationMinutes(durationMinutes),
  });

  const suggestedStart = findEarliestStartInGaps(
    freeGaps,
    preferredStart || bounds.openAt,
  );

  return {
    date,
    cleanupMinutes: CLEANUP_MINUTES,
    openAt: bounds.openAt,
    closeAt: bounds.closeAt,
    showtimes: showtimes.map((item) => ({
      _id: item._id,
      movieTitle: item.movie?.title || "Phim",
      startTime: item.startTime,
      endTime: item.endTime,
      roomName: item.room?.name || "",
    })),
    freeGaps: freeGaps.map((gap) => ({
      start: gap.start,
      end: gap.end,
      latestStart: gap.latestStart,
      canFit: gap.canFit,
    })),
    suggestedStart,
    suggestedStartIso: suggestedStart ? suggestedStart.toISOString() : null,
    hasPrevious: showtimes.length > 0,
    previous: showtimes.length
      ? {
          _id: showtimes[showtimes.length - 1]._id,
          movieTitle: showtimes[showtimes.length - 1].movie?.title || "Phim",
          startTime: showtimes[showtimes.length - 1].startTime,
          endTime: showtimes[showtimes.length - 1].endTime,
          roomName: showtimes[showtimes.length - 1].room?.name || "",
        }
      : null,
  };
}

async function getNextSlotSuggestion({
  room,
  date,
  excludeId = null,
  durationMinutes = 120,
  preferredStart = null,
}) {
  if (!date) {
    const fallback = preferredStart ? new Date(preferredStart) : new Date();
    return {
      hasPrevious: false,
      previous: null,
      cleanupMinutes: CLEANUP_MINUTES,
      suggestedStart: fallback,
      suggestedStartIso: fallback.toISOString(),
      showtimes: [],
      freeGaps: [],
    };
  }

  return getRoomDaySchedule({
    room,
    date,
    excludeId,
    durationMinutes,
    preferredStart,
  });
}

async function resolveConflictDetails({
  room,
  startTime,
  endTime,
  excludeId = null,
}) {
  const conflicts = await findRoomConflicts({
    room,
    startTime,
    endTime,
    excludeId,
  });

  if (!conflicts.length) {
    return { conflicts: [], earliestAvailable: null, message: "" };
  }

  const start = new Date(startTime);
  const date = start.toLocaleDateString("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const durationMinutes = Math.max(
    1,
    Math.round((new Date(endTime) - start) / 60000),
  );

  const schedule = await getRoomDaySchedule({
    room,
    date,
    durationMinutes,
    excludeId,
    preferredStart: withCleanup(
      conflicts.reduce(
        (latest, item) =>
          new Date(item.endTime) > latest ? new Date(item.endTime) : latest,
        new Date(0),
      ),
    ),
  });

  let earliestAvailable = schedule?.suggestedStart || null;
  if (!earliestAvailable) {
    // fallback: sau suất xung đột muộn nhất + 15'
    const latestConflictEnd = conflicts.reduce(
      (latest, item) =>
        new Date(item.endTime) > latest ? new Date(item.endTime) : latest,
      new Date(0),
    );
    earliestAvailable = withCleanup(latestConflictEnd);
  }

  return {
    conflicts,
    earliestAvailable,
    message: buildConflictMessage(earliestAvailable),
  };
}

async function assertNoRoomConflict(params) {
  const details = await resolveConflictDetails(params);
  if (!details.conflicts.length) {
    return [];
  }

  const error = new Error(details.message);
  error.statusCode = 409;
  error.code = "SHOWTIME_CONFLICT";
  error.conflicts = details.conflicts;
  error.earliestAvailable = details.earliestAvailable;
  throw error;
}

function formatConflictPayload(conflicts) {
  return conflicts.map((item) => ({
    _id: item._id,
    movieTitle: item.movie?.title || "Phim",
    roomName: item.room?.name || "",
    startTime: item.startTime,
    endTime: item.endTime,
  }));
}

module.exports = {
  CLEANUP_MINUTES,
  parseDurationMinutes,
  buildEndTime,
  withCleanup,
  rangesConflict,
  findRoomConflicts,
  assertNoRoomConflict,
  getNextSlotSuggestion,
  getRoomDaySchedule,
  resolveConflictDetails,
  buildConflictMessage,
  formatConflictPayload,
  formatTimeVN,
};

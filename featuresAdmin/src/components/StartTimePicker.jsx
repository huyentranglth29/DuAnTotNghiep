import {useEffect, useId, useMemo, useRef, useState} from 'react';
import {
  buildTimeValue,
  isStartTimeAvailable,
  padTimePart,
} from '../utils/showtimeHelpers';

const HOURS = Array.from({length: 24}, (_, index) => index);
const MINUTES = Array.from({length: 60}, (_, index) => index);

function parseTimeValue(value) {
  const [hourText = '0', minuteText = '0'] = String(value || '').split(':');
  const hour = Math.min(23, Math.max(0, Number(hourText) || 0));
  const minute = Math.min(59, Math.max(0, Number(minuteText) || 0));
  return {hour, minute};
}

function StartTimePicker({
  label = 'Giờ bắt đầu',
  value,
  onChange,
  date,
  duration,
  showtimes = [],
  freeGaps = null,
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const hourListRef = useRef(null);
  const minuteListRef = useRef(null);
  const listId = useId();
  const {hour: selectedHour, minute: selectedMinute} = parseTimeValue(value);

  const availability = useMemo(() => {
    const byHour = new Map();

    HOURS.forEach(hour => {
      const minutes = MINUTES.map(minute => {
        const time = buildTimeValue(hour, minute);
        const available = isStartTimeAvailable({
          date,
          time,
          duration,
          showtimes,
          freeGaps,
        });
        return {minute, time, available};
      });
      byHour.set(hour, {
        minutes,
        available: minutes.some(item => item.available),
      });
    });

    return byHour;
  }, [date, duration, showtimes, freeGaps]);

  useEffect(() => {
    const handleClickOutside = event => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = event => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const hourButton = hourListRef.current?.querySelector(
      `[data-hour="${selectedHour}"]`,
    );
    const minuteButton = minuteListRef.current?.querySelector(
      `[data-minute="${selectedMinute}"]`,
    );
    hourButton?.scrollIntoView({block: 'center'});
    minuteButton?.scrollIntoView({block: 'center'});
  }, [open, selectedHour, selectedMinute]);

  const hourMeta = availability.get(selectedHour);
  const selectedAvailable = isStartTimeAvailable({
    date,
    time: value,
    duration,
    showtimes,
    freeGaps,
  });

  const pickHour = hour => {
    const meta = availability.get(hour);
    if (!meta?.available) {
      return;
    }

    const keepMinute = meta.minutes.find(
      item => item.minute === selectedMinute && item.available,
    );
    const nextMinute = keepMinute || meta.minutes.find(item => item.available);
    if (!nextMinute) {
      return;
    }
    onChange(nextMinute.time);
  };

  const pickMinute = minute => {
    const time = buildTimeValue(selectedHour, minute);
    const available = isStartTimeAvailable({
      date,
      time,
      duration,
      showtimes,
      freeGaps,
    });
    if (!available) {
      return;
    }
    onChange(time);
    setOpen(false);
  };

  const displayValue = value
    ? `${padTimePart(selectedHour)}:${padTimePart(selectedMinute)}`
    : '--:--';

  return (
    <label className="startTimePicker customSelect" ref={rootRef}>
      {label}
      <button
        type="button"
        className={`customSelectTrigger startTimeTrigger ${open ? 'open' : ''} ${
          value && !selectedAvailable ? 'conflict' : ''
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen(current => !current)}>
        <span>{displayValue}</span>
        <span className="customSelectArrow">▾</span>
      </button>

      {value && !selectedAvailable ? (
        <small className="startTimeHint conflict">
          Khung giờ này đang trùng lịch — hãy chọn giờ sáng hơn
        </small>
      ) : (
        <small className="startTimeHint">
          Giờ mờ = đã trùng / không đủ 15 phút vệ sinh
        </small>
      )}

      {open ? (
        <div className="startTimeMenu" id={listId} role="listbox">
          <div className="startTimeColumn">
            <span className="startTimeColumnLabel">Giờ</span>
            <ul ref={hourListRef}>
              {HOURS.map(hour => {
                const meta = availability.get(hour);
                const available = Boolean(meta?.available);
                const active = hour === selectedHour;
                return (
                  <li key={hour}>
                    <button
                      type="button"
                      data-hour={hour}
                      role="option"
                      aria-selected={active}
                      aria-disabled={!available}
                      disabled={!available}
                      className={`startTimeOption ${active ? 'active' : ''} ${
                        available ? '' : 'muted'
                      }`}
                      onClick={() => pickHour(hour)}>
                      {padTimePart(hour)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="startTimeColumn">
            <span className="startTimeColumnLabel">Phút</span>
            <ul ref={minuteListRef}>
              {(hourMeta?.minutes || []).map(item => {
                const active = item.minute === selectedMinute;
                return (
                  <li key={item.minute}>
                    <button
                      type="button"
                      data-minute={item.minute}
                      role="option"
                      aria-selected={active}
                      aria-disabled={!item.available}
                      disabled={!item.available}
                      className={`startTimeOption ${active ? 'active' : ''} ${
                        item.available ? '' : 'muted'
                      }`}
                      onClick={() => pickMinute(item.minute)}>
                      {padTimePart(item.minute)}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : null}
    </label>
  );
}

export default StartTimePicker;

const HALF_HOUR_MS = 30 * 60 * 1000;
const WEEKDAY_INDEX = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const getTodayToronto = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

const getWeekStartToronto = () => {
  const now = new Date();
  const weekday = now.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Toronto' });
  const day = WEEKDAY_INDEX[weekday];
  const target = new Date(now);
  const diff = day === 0 ? -6 : 1 - day;
  target.setDate(target.getDate() + diff);
  return target.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
};

const roundTimestamp = (value, direction) => {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const exact = date.getMinutes() % 30 === 0 && date.getSeconds() === 0 && date.getMilliseconds() === 0;
  if (exact) return date;

  const rounded = direction === 'up'
    ? Math.ceil(date.getTime() / HALF_HOUR_MS) * HALF_HOUR_MS
    : Math.floor(date.getTime() / HALF_HOUR_MS) * HALF_HOUR_MS;

  return new Date(rounded);
};

const roundClockInTime = (value = new Date()) => roundTimestamp(value, 'up');
const roundClockOutTime = (value = new Date()) => roundTimestamp(value, 'down');

const normalizeBreakMinutes = (value) => {
  const minutes = Number(value);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  if (minutes % 30 !== 0) return null;
  return minutes;
};

const breakMinutesToHours = (minutes) => minutes / 60;

module.exports = {
  breakMinutesToHours,
  getTodayToronto,
  getWeekStartToronto,
  normalizeBreakMinutes,
  roundClockInTime,
  roundClockOutTime,
};

function roundBreakHours(minutes) {
  if (!minutes || minutes <= 0) return 0;
  if (minutes % 30 !== 0) return null;
  return minutes / 60;
}

module.exports = roundBreakHours;

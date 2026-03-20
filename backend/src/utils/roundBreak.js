/**
 * 输入任意分钟数，输出取整到 0.5h 的结果
 * 规则：每30分钟为一档，余数>=15进位，<15舍去
 */
function roundBreakHours(minutes) {
  if (!minutes || minutes <= 0) return 0;
  const slots = Math.floor(minutes / 30);        // 完整的半小时段数
  const remainder = minutes % 30;                // 余数
  const extra = remainder >= 15 ? 0.5 : 0;      // 余数够15分钟才进位
  return slots * 0.5 + extra;
}

module.exports = roundBreakHours;
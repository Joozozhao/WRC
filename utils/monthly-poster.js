const summary = require('./home-month-summary.js')
const levelForDistance = require('./run-heatmap-level.js')

function monthKey(year, month) {
  return year + '-' + summary.pad2(month)
}

function parseMonthKey(value) {
  const match = typeof value === 'string' && value.match(/^(\d{4})-(0[1-9]|1[0-2])$/)
  return match ? { year: Number(match[1]), month: Number(match[2]), key: value } : null
}

function previousMonth(now) {
  const date = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return monthKey(date.getFullYear(), date.getMonth() + 1)
}

// 月末当天与次月前三天对应同一份月报。
function promptMonth(now) {
  if (!(now instanceof Date) || isNaN(now.getTime())) return null
  if (now.getDate() <= 3) return previousMonth(now)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return now.getDate() === lastDay ? monthKey(now.getFullYear(), now.getMonth() + 1) : null
}

function latestReportMonth(now) {
  return promptMonth(now) || previousMonth(now)
}

function seenKey(userId, key) {
  return 'wrc_monthly_poster_seen_v1_' + userId + '_' + key
}

function buildReport(raw, key, now) {
  const target = parseMonthKey(key)
  if (!target) return null
  const parsed = summary.parseMonthRecords(raw, target.year, target.month, now)
  const dayCount = new Date(target.year, target.month, 0).getDate()
  const startWeekday = new Date(target.year, target.month - 1, 1).getDay()
  const days = []
  let bestDay = 0
  for (let i = 0; i < startWeekday; i++) days.push({ day: 0, distance: 0, level: 0 })
  for (let day = 1; day <= dayCount; day++) {
    const dateKey = key + '-' + summary.pad2(day)
    const distance = Number(parsed.dailyMap[dateKey]) || 0
    bestDay = Math.max(bestDay, distance)
    days.push({ day, distance, level: levelForDistance(distance) })
  }
  return {
    year: target.year,
    month: target.month,
    key,
    days,
    runDays: parsed.runDaysCount,
    totalKm: summary.formatKm(parsed.totalDistance),
    bestDayKm: summary.formatKm(bestDay),
    hasRuns: parsed.runDaysCount > 0
  }
}

module.exports = { monthKey, parseMonthKey, previousMonth, promptMonth, latestReportMonth, seenKey, buildReport }

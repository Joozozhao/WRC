const test = require('node:test')
const assert = require('node:assert/strict')
const poster = require('../utils/monthly-poster.js')
const canvas = require('../utils/monthly-poster-canvas.js')

test('月末当天和次月前三天只对应同一份月报，含跨年和闰年', () => {
  assert.equal(poster.promptMonth(new Date(2026, 9, 30)), null)
  assert.equal(poster.promptMonth(new Date(2026, 9, 31)), '2026-10')
  assert.equal(poster.promptMonth(new Date(2026, 10, 1)), '2026-10')
  assert.equal(poster.promptMonth(new Date(2026, 10, 3)), '2026-10')
  assert.equal(poster.promptMonth(new Date(2026, 10, 4)), null)
  assert.equal(poster.promptMonth(new Date(2026, 11, 31)), '2026-12')
  assert.equal(poster.promptMonth(new Date(2027, 0, 2)), '2026-12')
  assert.equal(poster.promptMonth(new Date(2024, 1, 29)), '2024-02')
  assert.equal(poster.latestReportMonth(new Date(2026, 9, 15)), '2026-09')
  assert.equal(poster.seenKey(12, '2026-10'), poster.seenKey(12, '2026-10'))
  assert.notEqual(poster.seenKey(12, '2026-10'), poster.seenKey(13, '2026-10'))
})

test('海报汇总仅取目标月份的合法打卡，同一天累加并标记半马、全马色阶', () => {
  const raw = {
    '2026-10': [
      { sport_day: '2026-10-01', sport_total: 10 },
      { sport_day: '2026-10-01', sport_total: 12 },
      { sport_day: '2026-10-02', sport_total: 43 },
      { sport_day: '2026-10-02', sport_total: -3 },
      { sport_day: '2026-10-03', sport_total: 7 },
      { sport_day: '2026-10-04', sport_total: 8 },
      { sport_day: '2026-10-32', sport_total: 100 }
    ],
    '2026-09': [{ sport_day: '2026-09-30', sport_total: 999 }]
  }
  const report = poster.buildReport(raw, '2026-10', new Date(2026, 9, 3))
  assert.equal(report.runDays, 3)
  assert.equal(report.totalKm, '72')
  assert.equal(report.bestDayKm, '43')
  assert.equal(report.days.find(day => day.day === 1).level, 5)
  assert.equal(report.days.find(day => day.day === 2).level, 6)
  assert.equal(report.days.find(day => day.day === 4).distance, 0)
  assert.equal(report.days.length, new Date(2026, 10, 0).getDate() + new Date(2026, 9, 1).getDay())
  assert.equal(poster.buildReport(raw, '2026-13', new Date()), null)
})

test('两种设计都把真实月份、里程与打卡天数绘制到画布', () => {
  const report = poster.buildReport([
    { sport_day: '2026-09-12', sport_total: 21.6 },
    { sport_day: '2026-09-19', sport_total: 5 }
  ], '2026-09', new Date(2026, 9, 1))
  function makeContext() {
    const words = []
    const images = []
    const ctx = { words, images }
    for (const method of ['setFillStyle', 'setFontSize', 'setTextAlign', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'closePath', 'fill']) ctx[method] = () => {}
    ctx.fillText = word => words.push(String(word))
    ctx.drawImage = path => images.push(path)
    return ctx
  }
  for (const style of ['calendar', 'story']) {
    const ctx = makeContext()
    canvas.drawPoster(ctx, style, report, { calendar: 'calendar.jpg', story: 'story.jpg', logo: 'logo.png' })
    assert.ok(ctx.words.includes('2026年9月') || ctx.words.some(word => word.includes('2026年9月')))
    assert.ok(ctx.words.some(word => word.includes('26.6')))
    assert.ok(ctx.words.includes('2'))
    assert.equal(ctx.images.length, 2)
  }
})

test('月度跑历在跑步日期下方显示当天累计公里数，休息日只显示日期', () => {
  const report = poster.buildReport([
    { sport_day: '2026-08-01', sport_total: 3.25 },
    { sport_day: '2026-08-01', sport_total: 7 },
    { sport_day: '2026-08-31', sport_total: 100.5 }
  ], '2026-08', new Date(2026, 8, 1))
  const words = []
  const ctx = { fillText: (word, x, y) => words.push({ word: String(word), x, y }) }
  for (const method of ['setFillStyle', 'setFontSize', 'setTextAlign', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'closePath', 'fill', 'drawImage']) ctx[method] = () => {}
  canvas.drawPoster(ctx, 'calendar', report, { calendar: 'calendar.jpg', logo: 'logo.png' })
  const distances = words.filter(entry => entry.word.endsWith('km'))
  assert.deepEqual(distances.map(entry => entry.word), ['10.25km', '100.50km'])
  for (const [index, day] of ['1', '31'].entries()) {
    const date = words.find(entry => entry.word === day)
    assert.equal(distances[index].x, date.x)
    assert.equal(distances[index].y - date.y, 20)
  }
  assert.ok(words.some(entry => entry.word === '2'))
  assert.equal(report.days.length, 37) // 六行月份的末日也显示里程
})

test('两种月报都绘制圆形跑者头像，非正方形头像居中裁切且恢复画布状态', () => {
  const report = poster.buildReport([{ sport_day: '2026-10-01', sport_total: 10 }], '2026-10', new Date(2026, 10, 1))
  for (const style of ['calendar', 'story']) {
    const calls = []
    const ctx = {}
    for (const method of ['setFillStyle', 'setFontSize', 'setTextAlign', 'fillText', 'fillRect', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo', 'closePath', 'fill', 'save', 'arc', 'clip', 'drawImage', 'restore']) {
      ctx[method] = (...args) => calls.push([method, ...args])
    }
    canvas.drawPoster(ctx, style, report, {
      calendar: 'calendar.jpg', story: 'story.jpg', logo: 'logo.png',
      avatar: { path: 'runner.jpg', width: 240, height: 120 }
    })
    assert.deepEqual(calls.find(call => call[0] === 'drawImage' && call[1] === 'runner.jpg'), ['drawImage', 'runner.jpg', 60, 0, 120, 120, 624, 884, 80, 80])
    assert.ok(calls.some(call => call[0] === 'arc' && call[3] === 40))
    assert.ok(calls.some(call => call[0] === 'clip'))
    assert.equal(calls.at(-1)[0], 'restore')
  }
})

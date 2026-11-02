const WIDTH = 750
const HEIGHT = 1000
const GREEN = '#0B503B'
const LIME = '#D9FF3F'
const IVORY = '#FBFAF4'
const COLORS = ['#E9EEE7', '#E5F4D6', '#C8F879', '#83C76E', GREEN, '#ff7160', '#5443a4']

function font(ctx, size, color, weight) {
  ctx.setFillStyle(color)
  ctx.setFontSize(size)
  ctx.font = (weight || 'normal') + ' ' + size + 'px sans-serif'
}

function text(ctx, value, x, y, size, color, weight) {
  font(ctx, size, color, weight)
  ctx.fillText(String(value), x, y)
}

function roundRect(ctx, x, y, width, height, radius, fill) {
  const r = Math.min(radius, width / 2, height / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + width - r, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + r)
  ctx.lineTo(x + width, y + height - r)
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  ctx.lineTo(x + r, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
  ctx.setFillStyle(fill)
  ctx.fill()
}

function drawCalendar(ctx, report) {
  const x = 42
  const y = 460
  const cellWidth = 88
  const cellHeight = 48
  const gap = 8
  const headings = ['日', '一', '二', '三', '四', '五', '六']
  const panelHeight = Math.max(352, 65 + Math.ceil(report.days.length / 7) * (cellHeight + gap))
  roundRect(ctx, 30, 427, 690, panelHeight, 24, 'rgba(240,246,235,0.91)')
  ctx.setTextAlign('center')
  headings.forEach((label, col) => text(ctx, label, x + col * (cellWidth + gap) + cellWidth / 2, y - 2, 22, '#6A7A6E', 'bold'))
  report.days.forEach((entry, index) => {
    const row = Math.floor(index / 7)
    const col = index % 7
    if (!entry.day) return
    const px = x + col * (cellWidth + gap)
    const py = y + 12 + row * (cellHeight + gap)
    roundRect(ctx, px, py, cellWidth, cellHeight, 12, COLORS[entry.level])
    const ink = entry.level >= 4 || entry.level === 5 || entry.level === 6 ? '#FFFFFF' : GREEN
    if (entry.distance > 0) {
      const distanceText = Number(entry.distance).toFixed(2) + 'km'
      text(ctx, entry.day, px + cellWidth / 2, py + 20, 20, ink, 'bold')
      text(ctx, distanceText, px + cellWidth / 2, py + 40, distanceText.length > 7 ? 12 : 14, ink)
    } else {
      text(ctx, entry.day, px + cellWidth / 2, py + 32, 25, ink, 'bold')
    }
  })
  ctx.setTextAlign('left')
}

function drawRunnerAvatar(ctx, avatar) {
  if (!avatar || !avatar.path) return
  const x = 624
  const y = 884
  const size = 80
  const width = avatar.width || 1
  const height = avatar.height || 1
  const crop = Math.min(width, height)
  ctx.save()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2 + 4, 0, Math.PI * 2)
  ctx.setFillStyle('#FFFFFF')
  ctx.fill()
  ctx.beginPath()
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  ctx.clip()
  ctx.drawImage(avatar.path, (width - crop) / 2, (height - crop) / 2, crop, crop, x, y, size, size)
  ctx.restore()
}

function drawCalendarPoster(ctx, report, paths) {
  ctx.drawImage(paths.calendar, 0, 0, WIDTH, HEIGHT)
  ctx.drawImage(paths.logo, 35, 34, 68, 68)
  text(ctx, 'WRC · MY RUNNING', 112, 75, 22, '#FFFFFF', 'bold')
  text(ctx, '我的' + report.month + '月跑历', 45, 303, 58, GREEN, 'bold')
  text(ctx, report.year + '年' + report.month + '月', 47, 349, 26, '#637168')
  text(ctx, '本月跑步总里程', 400, 349, 22, '#637168')
  text(ctx, report.totalKm, 400, 408, report.totalKm.length > 5 ? 51 : 62, GREEN, 'bold')
  text(ctx, 'KM', 631, 407, 23, GREEN, 'bold')
  ctx.setFillStyle(LIME)
  ctx.fillRect(400, 417, 260, 6)
  drawCalendar(ctx, report)
  text(ctx, report.runDays, 51, 907, 102, GREEN, 'bold')
  const dayX = 55 + Math.min(155, report.runDays.toString().length * 64)
  text(ctx, '天打卡', dayX, 902, 40, GREEN, 'bold')
  text(ctx, '每一步都算数。', 52, 960, 25, '#52675D')
}

function drawStoryPoster(ctx, report, paths) {
  ctx.drawImage(paths.story, 0, 0, WIDTH, HEIGHT)
  text(ctx, report.year + '年' + report.month + '月  ·  我的运动月报', 44, 82, 22, GREEN, 'bold')
  ctx.setFillStyle(GREEN)
  ctx.fillRect(44, 96, 308, 2)
  text(ctx, report.month + '月的每一步', 42, 212, 66, GREEN, 'bold')
  text(ctx, '都有回响', 42, 293, 66, GREEN, 'bold')
  ctx.setFillStyle(LIME)
  ctx.fillRect(45, 307, 285, 8)
  text(ctx, '每一次出发，都是与自己的对话。', 45, 362, 25, '#64736A')
  text(ctx, '脚下的路，串起这个月的闪光时刻。', 45, 399, 25, '#64736A')
  text(ctx, report.runDays, 41, 567, report.runDays.toString().length > 1 ? 146 : 166, GREEN, 'bold')
  const dayX = report.runDays.toString().length > 1 ? 250 : 155
  text(ctx, '天', dayX, 566, 70, GREEN, 'bold')
  text(ctx, '累计 ' + report.totalKm + ' KM', 48, 626, 30, GREEN, 'bold')
  text(ctx, '单日最高 ' + report.bestDayKm + ' KM', 48, 666, 25, GREEN)
  ctx.drawImage(paths.logo, 44, 890, 72, 72)
  text(ctx, '每一步都算数', 130, 938, 26, IVORY, 'bold')
}

function drawPoster(ctx, style, report, paths) {
  ctx.setTextAlign('left')
  if (style === 'story') drawStoryPoster(ctx, report, paths)
  else drawCalendarPoster(ctx, report, paths)
  drawRunnerAvatar(ctx, paths.avatar)
}

module.exports = { WIDTH, HEIGHT, drawPoster }

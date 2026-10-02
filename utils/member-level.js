const DISPLAY_LABELS = {
  VIP: 'SVip',
  '普通': 'Vip',
  '非会员': 'PVip'
}

function toDisplayMemberLevel(value) {
  if (value === null || value === undefined) return ''
  const level = String(value).trim()
  return DISPLAY_LABELS[level] || level
}

module.exports = { toDisplayMemberLevel }

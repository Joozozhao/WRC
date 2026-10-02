function getGenderLabel(value) {
  if (String(value) === '1') return '男'
  if (String(value) === '2') return '女'
  return ''
}

function getRegionLabel(profile) {
  if (!profile) return ''
  const value = profile.address || profile.region || profile.city || profile.province || ''
  return typeof value === 'string' ? value.trim() : ''
}

function addProfileBadges(profile) {
  return Object.assign({}, profile, {
    genderLabel: getGenderLabel(profile.sex),
    regionLabel: getRegionLabel(profile)
  })
}

module.exports = { getGenderLabel, getRegionLabel, addProfileBadges }

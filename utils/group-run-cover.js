const DEFAULT_GROUP_COVER = '/images/redesign/group-run-default-cover.jpg'
const COVER_SYNC_CONCURRENCY = 3

function imageUrl(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function isUploadedGroupCover(value) {
  const url = imageUrl(value)
  return !!url && !/(?:^|\/)group-run-default-cover\.(?:jpg|png)(?:[?#].*)?$/i.test(url)
}

function normalizeGroupPhotos(photos) {
  return (Array.isArray(photos) ? photos : [])
    .filter(item => item && imageUrl(item.img_url))
    .map(item => Object.assign({}, item, { img_url: imageUrl(item.img_url) }))
}

// 默认图地址可能已经保存在 acty_img 中；它仍然只是占位图。
function resolveGroupCover(cover, photos, failedUrls) {
  const failed = Array.isArray(failedUrls) ? failedUrls : []
  const candidates = isUploadedGroupCover(cover) ? [imageUrl(cover)] : []
  normalizeGroupPhotos(photos).forEach(item => candidates.push(item.img_url))
  return candidates.find(url => failed.indexOf(url) === -1) || DEFAULT_GROUP_COVER
}

function withGroupCover(item) {
  const origin = imageUrl(item.acty_img)
  return Object.assign({}, item, {
    origin_acty_img: origin,
    cover_photos: [],
    acty_img: resolveGroupCover(origin)
  })
}

function resetGroupCoverState(page) {
  page._coverSyncVersion = (page._coverSyncVersion || 0) + 1
  page._coverSyncQueue = []
  page._failedCovers = Object.create(null)
  return page._coverSyncVersion
}

// 两个列表共用相同的回填优先级；保留并发上限及按 ID 回填，忽略刷新前的旧响应。
function syncGroupPhotosForList(page, list, request) {
  if (!Array.isArray(list) || !list.length) return
  if (!page._coverSyncVersion) resetGroupCoverState(page)
  list.forEach(item => {
    if (item && item.id != null) page._coverSyncQueue.push({ id: String(item.id), version: page._coverSyncVersion })
  })
  drainGroupPhotos(page, request)
}

function drainGroupPhotos(page, request) {
  if (typeof page._coverSyncRunning !== 'number') page._coverSyncRunning = 0
  while (page._coverSyncRunning < COVER_SYNC_CONCURRENCY && page._coverSyncQueue.length) {
    const job = page._coverSyncQueue.shift()
    if (job.version !== page._coverSyncVersion) continue
    page._coverSyncRunning += 1
    let finished = false
    const done = () => {
      if (finished) return
      finished = true
      page._coverSyncRunning -= 1
      drainGroupPhotos(page, request)
    }
    request('acty/getactyimgs', 'POST', { actyId: job.id }, '', res => {
      try {
        if (job.version !== page._coverSyncVersion || !res || !res.data || !res.data.success || !Array.isArray(res.data.data)) return
        const index = (page.data.activityList || []).findIndex(item => String(item.id) === job.id)
        if (index < 0) return
        const item = page.data.activityList[index]
        const photos = normalizeGroupPhotos(res.data.data)
        const failed = (page._failedCovers || {})[job.id]
        page.setData({
          ['activityList[' + index + '].cover_photos']: photos,
          ['activityList[' + index + '].acty_img']: resolveGroupCover(item.origin_acty_img, photos, failed)
        })
      } finally {
        done()
      }
    }, done)
  }
}

function onGroupCoverError(page, event) {
  const dataset = event && event.currentTarget && event.currentTarget.dataset || {}
  const id = dataset.id == null ? '' : String(dataset.id)
  const index = (page.data.activityList || []).findIndex(item => String(item.id) === id)
  if (index < 0) return
  const item = page.data.activityList[index]
  if (dataset.src && dataset.src !== item.acty_img) return
  if (!page._failedCovers) page._failedCovers = Object.create(null)
  const failed = page._failedCovers[id] || []
  if (failed.indexOf(item.acty_img) !== -1) return
  page._failedCovers[id] = failed.concat(item.acty_img)
  const next = resolveGroupCover(item.origin_acty_img, item.cover_photos, page._failedCovers[id])
  if (next !== item.acty_img) page.setData({ ['activityList[' + index + '].acty_img']: next })
}

module.exports = {
  DEFAULT_GROUP_COVER, isUploadedGroupCover, normalizeGroupPhotos, resolveGroupCover,
  withGroupCover, resetGroupCoverState, syncGroupPhotosForList, onGroupCoverError
}

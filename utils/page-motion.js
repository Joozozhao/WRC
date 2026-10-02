// Replay a lightweight entrance when a page becomes visible.
module.exports = function playPageMotion(page) {
  if (!page || typeof page.setData !== 'function') return
  if (page._pageMotionTimer) clearTimeout(page._pageMotionTimer)
  if (page._pageMotionStartTimer) clearTimeout(page._pageMotionStartTimer)

  page.setData({ pageMotion: false })
  page._pageMotionStartTimer = setTimeout(function() {
    page.setData({ pageMotion: true })
    page._pageMotionTimer = setTimeout(function() {
      page.setData({ pageMotion: false })
      page._pageMotionTimer = null
    }, 380)
  }, 20)
}

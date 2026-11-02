const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

function createPage({ privacy = true, systemAlbum = 'authorized' } = {}) {
  const filename = path.resolve(__dirname, '../pages/monthlyposter/monthlyposter.js')
  const calls = { saves: [], privacy: [], modals: [], settings: [], toasts: [], errors: [] }
  const wx = {
    saveImageToPhotosAlbum: options => calls.saves.push(options),
    showToast: options => calls.toasts.push(options),
    showModal: options => calls.modals.push(options),
    openSetting: options => calls.settings.push(options),
    getAppAuthorizeSetting: () => ({ albumAuthorized: systemAlbum })
  }
  if (privacy) wx.requirePrivacyAuthorize = options => calls.privacy.push(options)
  let config
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    Page: value => { config = value },
    getApp: () => ({ globalData: {} }),
    require: name => name === '../../utils/util.js' ? {} : require(path.resolve(path.dirname(filename), name)),
    wx, console: { error: (...args) => calls.errors.push(args) }, clearTimeout() {}, setTimeout() {}
  }, { filename })
  const page = Object.assign({}, config, {
    data: Object.assign({}, config.data, { status: 'ready', posterPath: 'wxfile://poster.jpg' }),
    setData(patch) { Object.assign(this.data, patch) }
  })
  return { page, calls }
}

test('保存前等待隐私授权成功，再把已生成的本地图片传给保存接口', () => {
  const { page, calls } = createPage()
  page.savePoster()
  assert.equal(calls.privacy.length, 1)
  assert.equal(calls.saves.length, 0)
  calls.privacy[0].success()
  assert.equal(calls.saves[0].filePath, 'wxfile://poster.jpg')
  calls.saves[0].success()
  assert.equal(calls.toasts.at(-1).title, '已保存到相册')
  assert.equal(page.data.savingPoster, false)
})

test('复现 errno112：未声明相册写入时明确提示管理员配置，不误导用户去改权限', () => {
  const { page, calls } = createPage({ privacy: false })
  page.savePoster()
  const error = { errno: 112, errMsg: 'saveImageToPhotosAlbum:fail api scope is not declared in the privacy agreement' }
  calls.saves[0].fail(error)
  assert.equal(calls.errors.length, 1, '记录原始错误，便于继续定位')
  assert.equal(calls.modals.length, 1)
  assert.match(calls.modals[0].content, /管理员/)
  assert.equal(calls.settings.length, 0)
  assert.equal(page.data.status, 'ready', '保存失败不应销毁已生成的海报')
  assert.equal(page.data.posterPath, 'wxfile://poster.jpg')
  assert.equal(page.data.savingPoster, false)
})

test('auth denied 能正确识别；用户去设置并授权后自动重试保存', () => {
  const { page, calls } = createPage({ privacy: false })
  page.savePoster()
  calls.saves[0].fail({ errMsg: 'saveImageToPhotosAlbum:fail auth denied' })
  assert.equal(calls.modals.length, 1)
  calls.modals[0].success({ confirm: true })
  calls.settings[0].success({ authSetting: { 'scope.writePhotosAlbum': true } })
  assert.equal(calls.saves.length, 2)
  calls.saves[1].success()
  assert.equal(calls.toasts.at(-1).title, '已保存到相册')
})

test('设置页未授权不重试；系统相册被禁用时给出系统设置指引', () => {
  const a = createPage({ privacy: false })
  a.page.savePoster()
  a.calls.saves[0].fail({ errMsg: 'saveImageToPhotosAlbum:fail auth denied' })
  a.calls.modals[0].success({ confirm: true })
  a.calls.settings[0].success({ authSetting: { 'scope.writePhotosAlbum': false } })
  assert.equal(a.calls.saves.length, 1)
  const b = createPage({ privacy: false, systemAlbum: 'denied' })
  b.page.savePoster()
  b.calls.saves[0].fail({ errMsg: 'saveImageToPhotosAlbum:fail system permission denied' })
  assert.match(b.calls.modals[0].content, /系统设置/)
  assert.equal(b.calls.settings.length, 0)
})

test('保存进行中忽略重复点击，失败后可以重新保存', () => {
  const { page, calls } = createPage({ privacy: false })
  page.savePoster()
  page.savePoster()
  assert.equal(calls.saves.length, 1)
  calls.saves[0].fail({ errMsg: 'saveImageToPhotosAlbum:fail unknown error' })
  page.savePoster()
  assert.equal(calls.saves.length, 2)
})

test('隐私授权拒绝不会错误打开相册设置，取消保存不弹失败提示', () => {
  const h = createPage()
  h.page.savePoster()
  h.calls.privacy[0].fail({ errMsg: 'requirePrivacyAuthorize:fail privacy permission is not authorized' })
  assert.equal(h.calls.saves.length, 0)
  assert.equal(h.calls.settings.length, 0)
  assert.equal(h.calls.modals.length, 0)
  assert.equal(h.page.data.savingPoster, false)
  const a = createPage({ privacy: false })
  a.page.savePoster()
  a.calls.saves[0].fail({ errMsg: 'saveImageToPhotosAlbum:fail cancel' })
  assert.equal(a.calls.toasts.length, 0)
  assert.equal(a.calls.modals.length, 0)
})

test('页面退出后不继续保存或弹窗；无可用图片时不调用保存 API', () => {
  const h = createPage()
  h.page.savePoster()
  h.page.onUnload()
  h.calls.privacy[0].success()
  assert.equal(h.calls.saves.length, 0)
  const a = createPage({ privacy: false })
  a.page.setData({ posterPath: '' })
  a.page.savePoster()
  assert.equal(a.calls.saves.length, 0)
})

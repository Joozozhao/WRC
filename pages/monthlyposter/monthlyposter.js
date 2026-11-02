const util = require('../../utils/util.js')
const monthlyPoster = require('../../utils/monthly-poster.js')
const painter = require('../../utils/monthly-poster-canvas.js')
const app = getApp()

const ASSETS = {
  calendar: 'images/posters/calendar-bg.jpg',
  story: 'images/posters/story-bg.jpg',
  logo: 'images/redesign/wrc-logo.png'
}

function copyAssetToLocal(src) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager()
    // 旧版 CanvasContext 会把代码包图片路径按当前页面解析，先转为本地文件。
    const target = wx.env.USER_DATA_PATH + '/wrc-monthly-' + src.split('/').pop()
    fs.readFile({
      filePath: src,
      success: result => fs.writeFile({
        filePath: target,
        data: result.data,
        success: () => wx.getImageInfo({
          src: target,
          success: info => resolve(info.path),
          fail: reject
        }),
        fail: reject
      }),
      fail: reject
    })
  })
}

Page({
  data: {
    monthLabel: '',
    style: 'calendar',
    status: 'loading',
    errorMessage: '',
    posterPath: '',
    savingPoster: false,
    runDays: 0,
    totalKm: '0',
    bestDayKm: '0'
  },

  onLoad(options) {
    const now = new Date()
    const target = monthlyPoster.parseMonthKey(options && options.month) ||
      monthlyPoster.parseMonthKey(monthlyPoster.latestReportMonth(now))
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const requestedMonth = new Date(target.year, target.month - 1, 1)
    this._monthKey = requestedMonth > currentMonth ? monthlyPoster.latestReportMonth(now) : target.key
    this._userId = Number(app.globalData.userId || wx.getStorageSync('userId') || 0)
    this.setData({
      monthLabel: this._monthKey.replace('-', '年') + '月',
      style: options && options.style === 'story' ? 'story' : 'calendar'
    })
    if (!(this._userId > 0)) {
      this.setData({ status: 'guest' })
      return
    }
    this.loadReport()
  },

  onReady() {
    this._canvasReady = true
    if (this._report) this.generatePoster()
  },

  onUnload() {
    this._disposed = true
    this._renderSeq = (this._renderSeq || 0) + 1
    clearTimeout(this._renderTimeout)
  },

  loadReport() {
    const userId = this._userId
    clearTimeout(this._renderTimeout)
    this._renderSeq = (this._renderSeq || 0) + 1
    this.setData({ status: 'loading', posterPath: '', errorMessage: '' })
    util.request('user/getMonthList', 'POST', { user_id: userId }, '', (res) => {
      const currentUserId = Number(app.globalData.userId || wx.getStorageSync('userId') || 0)
      if (this._disposed || userId !== currentUserId) return
      const raw = res && res.data && res.data.success && res.data.data
      if (!raw) {
        this.showGenerationError('data', res && res.data)
        return
      }
      const report = monthlyPoster.buildReport(raw, this._monthKey, new Date())
      if (!report || !report.hasRuns) {
        this.setData({ status: 'empty' })
        return
      }
      this._report = report
      this.setData({
        runDays: report.runDays,
        totalKm: report.totalKm,
        bestDayKm: report.bestDayKm
      }, () => this.generatePoster())
    }, () => {
      if (!this._disposed) this.showGenerationError('network')
    })
  },

  retry() {
    this._assetPaths = null
    this._avatarPromise = null
    this.loadReport()
  },

  loadRunnerAvatar() {
    if (!this._avatarPromise) {
      const fallback = copyAssetToLocal('images/default.png')
        .then(path => ({ path, width: 1, height: 1 }))
      const runner = new Promise(resolve => {
        let settled = false
        const finish = info => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          resolve(info)
        }
        // 头像服务异常时仍能正常生成月报。
        const timer = setTimeout(() => finish(null), 5000)
        util.request('user/getuserinfo', 'POST', { id: this._userId, openId: app.globalData.openId }, '', res => {
          if (settled) return
          const profile = res && res.data && res.data.success && res.data.data
          const src = profile && profile.header_url
          if (!src) { finish(null); return }
          wx.getImageInfo({ src, success: finish, fail: () => finish(null) })
        }, () => finish(null))
      })
      this._avatarPromise = Promise.all([fallback, runner]).then(([fallbackImage, runnerImage]) => runnerImage || fallbackImage)
    }
    return this._avatarPromise
  },

  showGenerationError(stage, error) {
    console.error('[monthlyposter] ' + stage, error)
    const messages = {
      data: '月报数据暂时不可用',
      network: '网络连接失败，请重试',
      assets: '海报素材读取失败',
      draw: '海报绘制失败',
      export: '图片导出失败'
    }
    this.setData({
      status: 'error',
      errorMessage: messages[stage] || '生成失败'
    })
  },

  chooseStyle(event) {
    const style = event.currentTarget.dataset.style
    if (style !== 'calendar' && style !== 'story') return
    if (style === this.data.style) return
    this.setData({ style, status: this._report ? 'rendering' : this.data.status, posterPath: '' }, () => {
      if (this._report) this.generatePoster()
    })
  },

  async generatePoster() {
    if (!this._report || !this._canvasReady || this._disposed) return
    const seq = this._renderSeq = (this._renderSeq || 0) + 1
    clearTimeout(this._renderTimeout)
    this.setData({ status: 'rendering', posterPath: '', errorMessage: '' })
    let stage = 'assets'
    this._renderTimeout = setTimeout(() => {
      if (!this._disposed && seq === this._renderSeq && this.data.status === 'rendering') {
        this._renderSeq++
        this.showGenerationError(stage, new Error(stage + ' 超时'))
      }
    }, 12000)
    try {
      if (this._disposed || seq !== this._renderSeq) return
      if (!this._assetPaths) {
        const [calendar, story, logo, avatar] = await Promise.all([
          copyAssetToLocal(ASSETS.calendar),
          copyAssetToLocal(ASSETS.story),
          copyAssetToLocal(ASSETS.logo),
          this.loadRunnerAvatar()
        ])
        this._assetPaths = { calendar, story, logo, avatar }
      }
      if (this._disposed || seq !== this._renderSeq) return
      stage = 'draw'
      const ctx = wx.createCanvasContext('monthlyPosterCanvas', this)
      painter.drawPoster(ctx, this.data.style, this._report, this._assetPaths)
      ctx.draw(false, () => {
        if (this._disposed || seq !== this._renderSeq) return
        stage = 'export'
        wx.canvasToTempFilePath({
          canvasId: 'monthlyPosterCanvas',
          width: painter.WIDTH,
          height: painter.HEIGHT,
          destWidth: painter.WIDTH,
          destHeight: painter.HEIGHT,
          fileType: 'jpg',
          quality: 0.94,
          success: result => {
            if (!this._disposed && seq === this._renderSeq) {
              clearTimeout(this._renderTimeout)
              this.setData({ status: 'ready', posterPath: result.tempFilePath })
            }
          },
          fail: error => {
            if (!this._disposed && seq === this._renderSeq) {
              clearTimeout(this._renderTimeout)
              this.showGenerationError('export', error)
            }
          }
        }, this)
      })
    } catch (error) {
      if (!this._disposed && seq === this._renderSeq) {
        clearTimeout(this._renderTimeout)
        this.showGenerationError(stage, error)
      }
    }
  },

  previewPoster() {
    if (this.data.status !== 'ready') return
    wx.previewImage({ current: this.data.posterPath, urls: [this.data.posterPath] })
  },

  sharePoster() {
    if (this.data.status !== 'ready') return
    if (typeof wx.showShareImageMenu !== 'function') {
      wx.showModal({ title: '请先保存海报', content: '当前微信版本暂不支持直接分享图片，保存后可以从相册分享到群。', showCancel: false })
      return
    }
    wx.showShareImageMenu({
      path: this.data.posterPath,
      fail: error => {
        if (error && /cancel/i.test(error.errMsg || '')) return
        wx.showToast({ title: '分享未成功，可先保存图片', icon: 'none' })
      }
    })
  },

  savePoster() {
    if (this._disposed || this.data.status !== 'ready' || this._savingPoster) return
    const filePath = this.data.posterPath
    if (!filePath) {
      wx.showToast({ title: '图片尚未生成，请稍后重试', icon: 'none' })
      return
    }
    this._savingPoster = true
    this.setData({ savingPoster: true })
    const finish = () => {
      this._savingPoster = false
      if (!this._disposed) this.setData({ savingPoster: false })
    }
    const fail = error => {
      finish()
      this.handleSaveError(error)
    }
    const save = () => {
      if (this._disposed) { finish(); return }
      try {
        wx.saveImageToPhotosAlbum({
          filePath,
          success: () => {
            finish()
            if (!this._disposed) wx.showToast({ title: '已保存到相册', icon: 'success' })
          },
          fail
        })
      } catch (error) { fail(error) }
    }
    try {
      if (typeof wx.requirePrivacyAuthorize === 'function') {
        wx.requirePrivacyAuthorize({ success: save, fail })
      } else {
        save()
      }
    } catch (error) { fail(error) }
  },

  handleSaveError(error) {
    if (this._disposed) return
    const message = error && error.errMsg || ''
    if (/cancel/i.test(message)) return
    console.error('[monthlyposter] save', error)
    // errno 112 是小程序后台未声明接口用途，不能通过用户授权或重新绘图解除。
    if (Number(error && error.errno) === 112 || /scope.*not declared|not declared.*privacy/i.test(message)) {
      wx.showModal({
        title: '暂时无法保存',
        content: '图片已生成，但小程序尚未开通保存到相册功能，请联系管理员。',
        showCancel: false
      })
      return
    }
    if (/privacy/i.test(message)) {
      wx.showToast({ title: '同意隐私指引后才能保存', icon: 'none' })
      return
    }
    if (/auth\s*den(?:y|ied)|authorize|permission|access\s*denied/i.test(message)) {
      let systemAlbumDenied = false
      try {
        systemAlbumDenied = typeof wx.getAppAuthorizeSetting === 'function' &&
          wx.getAppAuthorizeSetting().albumAuthorized === 'denied'
      } catch (error) { /* 旧版系统不可读取时仍可引导小程序授权。 */ }
      if (systemAlbumDenied) {
        wx.showModal({
          title: '需要系统相册权限',
          content: '请在手机系统设置中允许微信添加照片，再返回保存。',
          showCancel: false
        })
        return
      }
      wx.showModal({
        title: '需要相册权限',
        content: '请开启保存到相册权限，授权后将重新保存图片。',
        confirmText: '去设置',
        success: result => {
          if (!result.confirm || this._disposed) return
          wx.openSetting({
            success: settings => {
              if (!this._disposed && settings.authSetting && settings.authSetting['scope.writePhotosAlbum']) this.savePoster()
            }
          })
        }
      })
      return
    }
    wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
  }
})

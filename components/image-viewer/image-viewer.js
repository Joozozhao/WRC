Component({
  data: {
    visible: false,
    urls: [],
    currentIndex: 0,
    statusBarHeight: 20,
    topbarHeight: 84,
    mode: 'fullscreen',
    title: '',
    bodyMaxPx: 0,
    bodyScale: 1,
    bodyHeightPx: 0,
    bodyHeightStyle: '',
    maxBodyHeightPx: 0,
    imageHeights: {},
    bodyScroll: false
  },
  lifetimes: {
    attached: function () {
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
      const statusBarHeight = system.statusBarHeight || 20
      const windowHeight = system.windowHeight || 800
      const windowWidth = system.windowWidth || 375
      // 72vh 且不超过 1040rpx
      const maxByVh = windowHeight * 0.72
      const maxByRpx = (1040 * windowWidth) / 750
      const maxBodyHeightPx = Math.round(Math.min(maxByVh, maxByRpx))
      this.setData({
        statusBarHeight: statusBarHeight,
        topbarHeight: statusBarHeight + 54,
        maxBodyHeightPx: maxBodyHeightPx
      })
    }
  },
  methods: {
    open: function (urls, current, options) {
      const list = (Array.isArray(urls) ? urls : [urls]).filter(url => typeof url === 'string' && url)
      if (!list.length) return
      let index = list.indexOf(current)
      if (index < 0) index = 0
      const opts = options || {}
      const baseMax = this.data.maxBodyHeightPx || 0
      const scale = typeof opts.heightScale === 'number' && opts.heightScale > 0 && opts.heightScale < 1 ? opts.heightScale : 1
      const bodyMaxPx = baseMax ? Math.round(baseMax * scale) : 0
      this.setData({
        visible: true,
        urls: list,
        currentIndex: index,
        mode: opts.mode === 'card' ? 'card' : 'fullscreen',
        title: typeof opts.title === 'string' ? opts.title : '',
        bodyMaxPx: bodyMaxPx,
        bodyScale: scale,
        bodyHeightPx: bodyMaxPx,
        bodyHeightStyle: scale < 1 && bodyMaxPx ? 'height: ' + bodyMaxPx + 'px;' : '',
        imageHeights: {},
        bodyScroll: scale < 1
      })
    },
    close: function () {
      this.setData({ visible: false })
    },
    onSwiperChange: function (event) {
      const idx = event.detail.current
      this.setData({ currentIndex: idx })
      this.updateBodyHeight(idx)
    },
    onImageLoad: function (e) {
      if (this.data.mode !== 'card') return
      const idx = e.currentTarget.dataset.index !== undefined ? Number(e.currentTarget.dataset.index) : this.data.currentIndex
      const origW = e.detail.width || 1
      const origH = e.detail.height || 1
      // 卡片宽度为 632rpx - 60rpx padding = 572rpx
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
      const windowWidth = system.windowWidth || 375
      const containerWidthPx = (572 * windowWidth) / 750
      const scaledHeightPx = Math.round((origH / origW) * containerWidthPx)
      const heights = Object.assign({}, this.data.imageHeights, { [idx]: scaledHeightPx })
      this.setData({ imageHeights: heights })
      if (idx === this.data.currentIndex) {
        this.updateBodyHeight(idx)
      }
    },
    updateBodyHeight: function (index) {
      const idx = index !== undefined ? index : this.data.currentIndex
      const scaledH = this.data.imageHeights[idx]
      const maxH = this.data.bodyMaxPx || this.data.maxBodyHeightPx || 480
      if (this.data.bodyScroll) {
        // 轨迹/打卡凭证：视窗整体缩至 80%，图片原比例，超出部分上下滑动
        const scale = this.data.bodyScale || 1
        const h = scaledH ? Math.min(Math.round(scaledH * scale), maxH) : maxH
        this.setData({
          bodyHeightPx: h,
          bodyHeightStyle: 'height: ' + h + 'px;'
        })
      } else if (scaledH && scaledH < maxH) {
        this.setData({
          bodyHeightPx: scaledH,
          bodyHeightStyle: 'height: ' + scaledH + 'px;'
        })
      } else {
        this.setData({
          bodyHeightPx: maxH,
          bodyHeightStyle: ''
        })
      }
    },
    preventTouchMove: function () {}
  }
})

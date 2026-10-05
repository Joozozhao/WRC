Component({
  data: {
    visible: false,
    urls: [],
    currentIndex: 0,
    statusBarHeight: 20,
    topbarHeight: 84,
    mode: 'fullscreen',
    title: '',
    bodyHeightPx: 0,
    bodyHeightStyle: '',
    maxBodyHeightPx: 0,
    imageHeights: {}
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
      this.setData({
        visible: true,
        urls: list,
        currentIndex: index,
        mode: opts.mode === 'card' ? 'card' : 'fullscreen',
        title: typeof opts.title === 'string' ? opts.title : '',
        bodyHeightPx: this.data.maxBodyHeightPx || 0,
        bodyHeightStyle: '',
        imageHeights: {}
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
      const maxH = this.data.maxBodyHeightPx || 480
      if (scaledH && scaledH < maxH) {
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


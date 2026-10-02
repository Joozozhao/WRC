Component({
  data: {
    visible: false,
    urls: [],
    currentIndex: 0,
    statusBarHeight: 20,
    topbarHeight: 84,
    mode: 'fullscreen',
    title: ''
  },
  lifetimes: {
    attached: function () {
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
      const statusBarHeight = system.statusBarHeight || 20
      this.setData({
        statusBarHeight: statusBarHeight,
        topbarHeight: statusBarHeight + 54
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
        title: typeof opts.title === 'string' ? opts.title : ''
      })
    },
    close: function () {
      this.setData({ visible: false })
    },
    onSwiperChange: function (event) {
      this.setData({ currentIndex: event.detail.current })
    },
    preventTouchMove: function () {}
  }
})

const util = require('../../utils/util.js')
const app = getApp()

Component({
  properties: {
    avatar: { type: String, value: '' },
    showBack: { type: Boolean, value: false },
    backUrl: { type: String, value: '/pages/index/index' }
  },
  data: {
    menuTop: 30,
    barHeight: 32,
    backMode: false
  },
  lifetimes: {
    attached: function () {
      const system = wx.getSystemInfoSync ? wx.getSystemInfoSync() : {}
      const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
      const statusBarHeight = system.statusBarHeight || 20
      const menuTop = menu && menu.top ? menu.top : statusBarHeight + 6
      const barHeight = menu && menu.height ? menu.height : 32
      // Only the four primary tab pages keep the brand logo + avatar;
      // every other page shows the rounded back button alone.
      const mainPages = ['pages/index/index', 'pages/activity/activity', 'pages/challenge/challenge', 'pages/mydata/mydata']
      const pages = getCurrentPages ? getCurrentPages() : []
      const route = pages && pages.length ? (pages[pages.length - 1].route || '') : ''
      const basicBackMode = !!this.data.showBack
      const backMode = basicBackMode || (!!route && mainPages.indexOf(route) === -1)
      this.setData({ menuTop, barHeight, backMode })
      if (!backMode) this.loadAvatar()
    }
  },
  methods: {
    loadAvatar: function () {
      const userId = Number(app.globalData.userId || wx.getStorageSync('userId') || 0)
      if (!(userId > 0) || this.data.avatar) return
      util.request('/user/getuserinfo', 'POST', { id: userId, openId: app.globalData.openId }, '', (res) => {
        const avatar = res.data && res.data.success && res.data.data && res.data.data.header_url
        if (avatar) this.setData({ avatar })
      })
    },
    handleAvatarTap: function () {
      this.triggerEvent('profiletap')
    },
    handleBack: function () {
      const pages = getCurrentPages()
      if (pages && pages.length > 1) {
        wx.navigateBack({ delta: 1 })
      } else {
        wx.switchTab({ url: this.data.backUrl || '/pages/index/index' })
      }
    }
  }
})

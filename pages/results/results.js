const util = require("../../utils/util.js")
const app = getApp()

Page({
  data: {
    page: 1,
    marathons: [],
    syncDate: "",
    dataTotal: 0,
    wholeTotal: 0,
    halfTotal: 0,
    loading: false,
    loaded: false,
    hasMore: true,
    targetUserId: 0
  },

  onLoad(options) {
    const userId = (options && options.id) ? Number(options.id) : (app.globalData.userId || 0)
    this.setData({ targetUserId: userId })
    this.fetchData(true)
  },

  onPullDownRefresh() {
    this.fetchData(true, () => {
      wx.stopPullDownRefresh()
    })
  },

  fetchData(reset, cb) {
    const userId = this.data.targetUserId || app.globalData.userId || 0
    if (reset) {
      this.getMarathonsTotal(userId)
    }
    this.loadMore(reset, cb)
  },

  getMarathonsTotal(userId) {
    util.request("user/marathonsnum", "POST", { userId: userId }, "", (res) => {
      if (res && res.data && res.data.data) {
        const raw = res.data.data.syncDate || ""
        const syncDate = raw.length >= 10 ? raw.substring(0, 10) : raw
        this.setData({
          syncDate: syncDate,
          dataTotal: Number(res.data.data.total) || 0,
          wholeTotal: Number(res.data.data.wholeTotal) || 0,
          halfTotal: Number(res.data.data.halfTotal) || 0
        })
      }
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMore(false)
    }
  },

  loadMore(reset, cb) {
    if (this.data.loading && !reset) return
    const page = reset ? 1 : this.data.page
    const userId = this.data.targetUserId || app.globalData.userId || 0
    this.setData({ loading: true })

    util.request("user/marathons", "POST", { userId: userId, page: page }, "", (res) => {
      if (res && res.data && res.data.success) {
        const list = Array.isArray(res.data.data) ? res.data.data : []
        const marathons = reset ? list : this.data.marathons.concat(list)
        this.setData({
          marathons: marathons,
          page: page + 1,
          hasMore: list.length >= 10,
          loading: false,
          loaded: true
        })
      } else {
        this.setData({
          loading: false,
          loaded: true,
          hasMore: false
        })
      }
      if (typeof cb === "function") cb()
    }, () => {
      this.setData({
        loading: false,
        loaded: true,
        hasMore: false
      })
      if (typeof cb === "function") cb()
    })
  }
})

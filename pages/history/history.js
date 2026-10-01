// pages/history/history.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    navTab: ['积分兑换', '小花儿兑换'],
    currentTab: 0,
    orderInfo: [],
    userId: 0,
    listState: 'loading',
    page: 1,
    hasMore: true,
    loadingMore: false,
    moreError: false
  },

  onLoad: function () {
    wx.hideShareMenu({})
    const userId = Number(app.globalData.userId) || 0
    this.setData({ userId, listState: userId > 0 ? 'loading' : 'guest' })
    if (userId > 0) this.fetchOrders(true)
  },

  onShow: function () {
    const userId = Number(app.globalData.userId) || 0
    if (userId !== this.data.userId) {
      this.setData({ userId, listState: userId > 0 ? 'loading' : 'guest', orderInfo: [] })
      this._loadedOnce = true
      if (userId > 0) this.fetchOrders(true)
      return
    }
    if (this._loadedOnce) this.fetchOrders(true)
    this._loadedOnce = true
  },

  currentTab: function (e) {
    const tab = Number(e.currentTarget.dataset.idx)
    if (tab === this.data.currentTab) return
    this.setData({ currentTab: tab })
    if (this.data.userId > 0) this.fetchOrders(true)
  },

  toDetail: function (e) {
    const id = e.currentTarget.dataset.id
    const type = e.currentTarget.dataset.type
    wx.navigateTo({ url: '../orderdetail/orderdetail?id=' + id + '&type=' + type })
  },

  formatOrder: function (order) {
    const value = order && order.last_time
    return Object.assign({}, order, {
      last_time: value ? String(value).substring(0, 19).replace('T', ' ') : '时间暂缺'
    })
  },

  fetchOrders: function (reset) {
    if (!this.data.userId || (this.data.loadingMore && !reset)) return
    if (!reset && !this.data.hasMore) return
    const requestedPage = reset ? 1 : this.data.page
    const requestId = (this._requestId || 0) + 1
    this._requestId = requestId
    const requestedType = this.data.currentTab
    this.setData({
      listState: reset ? 'loading' : this.data.listState,
      loadingMore: true,
      moreError: false
    })
    util.request('order/list', 'POST', {
      userId: this.data.userId,
      page: requestedPage,
      type: requestedType
    }, '数据加载中...', (res) => {
      if (requestId !== this._requestId) return
      const response = res && res.data
      if (!response || !response.success || !Array.isArray(response.data)) {
        this.setData({
          listState: reset ? 'error' : 'ready',
          loadingMore: false,
          moreError: !reset
        })
        if (this._refreshing) {
          this._refreshing = false
          wx.stopPullDownRefresh()
        }
        return
      }
      const received = response.data.map(item => this.formatOrder(item))
      const orderInfo = reset ? received : this.data.orderInfo.concat(received)
      this.setData({
        orderInfo,
        listState: 'ready',
        page: requestedPage + 1,
        hasMore: received.length > 0,
        loadingMore: false,
        moreError: false
      })
      if (this._refreshing) {
        this._refreshing = false
        wx.stopPullDownRefresh()
      }
    }, () => {
      if (requestId !== this._requestId) return
      this.setData({
        listState: reset ? 'error' : 'ready',
        loadingMore: false,
        moreError: !reset
      })
      if (this._refreshing) {
        this._refreshing = false
        wx.stopPullDownRefresh()
      }
    })
  },

  retry: function () {
    this.fetchOrders(true)
  },

  retryMore: function () {
    this.fetchOrders(false)
  },

  onPullDownRefresh: function () {
    if (!this.data.userId) {
      wx.stopPullDownRefresh()
      return
    }
    this._refreshing = true
    this.fetchOrders(true)
  },

  onReachBottom: function () {
    if (this.data.listState === 'ready') this.fetchOrders(false)
  }
})

// pages/exchange/exchange.js
const util = require('../../utils/util.js')
const app = getApp()

Page({
  data: {
    navTab: ['积分兑换区', '小花儿兑换区'],
    currentTab: 0,
    score: '--',
    energy: '--',
    level: '',
    userId: 0,
    isLoggedIn: false,
    balanceState: 'loading',
    listData: [],
    listData2: [],
    listState: 'loading',
    page: 1,
    loadingMore: false,
    moreError: false,
    hasMore: true
  },

  onLoad: function () {
    wx.hideShareMenu({})
    const userId = app.globalData.userId || 0
    this.setData({ userId, isLoggedIn: userId > 0 })
    this.getPrize(true)
    if (userId > 0) this.getPoint(userId)
    else this.setData({ balanceState: 'guest' })
  },

  currentTab: function (e) {
    const tab = Number(e.currentTarget.dataset.idx)
    if (tab !== this.data.currentTab) this.setData({ currentTab: tab })
  },

  getPoint: function (userId) {
    util.request('user/get', 'POST', { id: userId }, '', (res) => {
      if (res && res.data && res.data.success && res.data.data) {
        const user = res.data.data
        this.setData({
          score: user.score == null ? '--' : user.score,
          energy: user.energy == null ? '--' : user.energy,
          level: user.level || '',
          userId: user.id || userId,
          balanceState: 'ready'
        })
      } else {
        this.setData({ balanceState: 'error' })
      }
    }, () => this.setData({ balanceState: 'error' }))
  },

  getPrize: function (reset) {
    if (this.data.loadingMore || (!this.data.hasMore && !reset)) return
    const page = reset ? 1 : this.data.page
    this.setData({
      listState: reset ? 'loading' : this.data.listState,
      loadingMore: true,
      moreError: false
    })
    util.request('goods/searchlist', 'POST', { gn: '', page }, '', (res) => {
      const response = res && res.data
      if (!response || !response.success || !Array.isArray(response.data)) {
        this.setData({
          listState: reset ? 'error' : this.data.listState,
          loadingMore: false,
          moreError: !reset
        })
        return
      }

      const available = response.data.filter(item => item && Number(item.total) > 0)
      const pointData = available.filter(item => Number(item.goods_type) === 0 && Number(item.score) > 0)
      const energyData = available.filter(item => Number(item.goods_type) !== 0 && Number(item.energy) > 0)
      const merge = (oldItems, newItems) => {
        const items = reset ? [] : oldItems.slice()
        const seen = new Set(items.map(item => String(item.id)))
        newItems.forEach(item => {
          const id = String(item.id)
          if (!seen.has(id)) {
            items.push(item)
            seen.add(id)
          }
        })
        return items
      }
      const listData = merge(this.data.listData, pointData)
      const listData2 = merge(this.data.listData2, energyData)
      this.setData({
        listData,
        listData2,
        listState: 'ready',
        page: page + 1,
        hasMore: response.data.length > 0,
        loadingMore: false,
        moreError: false
      })
    }, () => {
      this.setData({
        listState: reset ? 'error' : this.data.listState,
        loadingMore: false,
        moreError: !reset
      })
    })
  },

  retryPrize: function () {
    this.getPrize(true)
  },

  retryMore: function () {
    this.getPrize(false)
  },

  toPrize: function (e) {
    wx.navigateTo({ url: '../prizedetails/prizedetails?id=' + e.currentTarget.dataset.id })
  },

  toPrize2: function (e) {
    if (this.data.level === 'VIP') {
      wx.navigateTo({ url: '../prizedetails/prizedetails?id=' + e.currentTarget.dataset.id })
    } else {
      wx.showToast({ title: '仅限超级会员兑换，继续加油', icon: 'none' })
    }
  },

  onReachBottom: function () {
    if (this.data.listState === 'ready' && this.data.hasMore) this.getPrize(false)
  }
})

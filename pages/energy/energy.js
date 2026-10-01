// pages/energy/energy.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userId: 0,
    listState: 'loading', // 'loading' | 'guest' | 'error' | 'ready'
    balanceState: 'loading', // 'loading' | 'guest' | 'error' | 'ready'
    energy: 0,
    actyTimes: 0,
    navTab: ['小花儿增加', '小花儿扣除'],
    currentTab: 0,
    addCon: [],
    reduceCon: [],
    page: 1,
    hasMore: true,
    loadingMore: false,
    moreError: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({})
    const userId = Number(app.globalData.userId) || 0
    this.setData({
      userId: userId,
      listState: userId > 0 ? 'loading' : 'guest',
      balanceState: userId > 0 ? 'loading' : 'guest'
    })
    if (userId > 0) {
      this.fetchBalance()
      this.fetchFlow(true)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   * 登录态变化时重新进入访客 / 加载流程
   */
  onShow: function () {
    const userId = Number(app.globalData.userId) || 0
    if (userId === this.data.userId) return
    this._requestId = (this._requestId || 0) + 1
    this.setData({
      userId: userId,
      listState: userId > 0 ? 'loading' : 'guest',
      balanceState: userId > 0 ? 'loading' : 'guest',
      energy: 0,
      actyTimes: 0,
      addCon: [],
      reduceCon: [],
      page: 1,
      hasMore: true,
      loadingMore: false,
      moreError: false
    })
    if (userId > 0) {
      this.fetchBalance()
      this.fetchFlow(true)
    }
  },

  /**
   * 切换 增加 / 扣除 流水
   * 两类数据由同一份流水按 opt_type 正负拆分，切换无需重新请求
   */
  currentTab: function (e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (idx === this.data.currentTab) return
    this.setData({
      currentTab: idx
    })
  },

  /**
   * 小花儿余额与团跑次数
   * 余额请求失败时保留已有数值，不干扰流水列表状态
   */
  fetchBalance: function () {
    const userId = this.data.userId
    if (!userId) return
    const requestId = (this._balanceRequestId || 0) + 1
    this._balanceRequestId = requestId
    this.setData({ balanceState: 'loading' })
    util.request('user/get', 'POST', { id: userId }, '数据加载中 ...', (res) => {
      if (requestId !== this._balanceRequestId || userId !== this.data.userId) return
      if (res && res.data && res.data.success && res.data.data) {
        this.setData({
          actyTimes: res.data.data.acty_times,
          energy: res.data.data.energy,
          balanceState: 'ready'
        })
      } else {
        this.setData({ balanceState: 'error' })
      }
    }, () => {
      if (requestId !== this._balanceRequestId || userId !== this.data.userId) return
      this.setData({ balanceState: 'error' })
    })
  },

  /**
   * 小花儿流水，type=1 为小花儿
   * reset=true 拉取第一页并重置列表，false 触底追加下一页
   */
  fetchFlow: function (reset) {
    const userId = this.data.userId
    if (!userId) return
    if (!reset && (this.data.loadingMore || !this.data.hasMore)) return

    const requestedPage = reset ? 1 : this.data.page
    const requestId = (this._requestId || 0) + 1
    this._requestId = requestId

    this.setData({
      listState: reset ? 'loading' : this.data.listState,
      loadingMore: true,
      moreError: false
    })

    util.request('user/getscore', 'POST', {
      userId: userId,
      page: requestedPage,
      type: 1
    }, '数据加载中 ...', (res) => {
      if (requestId !== this._requestId || userId !== this.data.userId) return
      const response = res && res.data
      if (!response || !response.success || !Array.isArray(response.data)) {
        this.setData({
          listState: reset ? 'error' : 'ready',
          loadingMore: false,
          moreError: !reset
        })
        return
      }
      const received = response.data.map(function (item) {
        return Object.assign({}, item, {
          create_time: item.create_time ? String(item.create_time).substring(0, 19) : ''
        })
      })
      const addRecv = received.filter(item => item.opt_type > 0)
      const reduceRecv = received.filter(item => item.opt_type < 0)
      this.setData({
        addCon: reset ? addRecv : this.data.addCon.concat(addRecv),
        reduceCon: reset ? reduceRecv : this.data.reduceCon.concat(reduceRecv),
        listState: 'ready',
        page: requestedPage + 1,
        hasMore: received.length > 0,
        loadingMore: false,
        moreError: false
      })
    }, () => {
      if (requestId !== this._requestId || userId !== this.data.userId) return
      this.setData({
        listState: reset ? 'error' : 'ready',
        loadingMore: false,
        moreError: !reset
      })
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.listState === 'ready') {
      this.fetchFlow(false)
    }
  },

  /**
   * 首屏失败重试
   */
  retry: function () {
    if (!this.data.userId) return
    this.fetchBalance()
    this.fetchFlow(true)
  },

  retryBalance: function () {
    if (!this.data.userId) return
    this.fetchBalance()
  },

  /**
   * 触底加载失败重试
   */
  retryMore: function () {
    this.fetchFlow(false)
  },

  /**
   * 前往登录
   */
  goLogin: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  }
})

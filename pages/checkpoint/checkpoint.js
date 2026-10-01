// pages/checkpoint/checkpoint.js
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
    balanceState: 'loading', // 'loading' | 'ready' | 'error' | 'guest'
    point: 0,
    navTab: ['积分增加', '积分扣除'],
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
    const userId = Number(app.globalData.userId) || 0
    this.setData({
      userId: userId,
      listState: userId > 0 ? 'loading' : 'guest',
      balanceState: userId > 0 ? 'loading' : 'guest'
    })
    if (userId > 0) {
      this.fetchPoint()
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
    // 用户变更：失效所有尚未返回的旧请求，避免旧账号数据写回页面
    this._requestId = (this._requestId || 0) + 1
    this.setData({
      userId: userId,
      listState: userId > 0 ? 'loading' : 'guest',
      balanceState: userId > 0 ? 'loading' : 'guest',
      point: 0,
      addCon: [],
      reduceCon: [],
      page: 1,
      hasMore: true,
      loadingMore: false,
      moreError: false
    })
    if (userId > 0) {
      this.fetchPoint()
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
   * 积分余额
   * 余额请求失败时保留已有数值，不干扰流水列表状态
   */
  fetchPoint: function () {
    const userId = this.data.userId
    if (!userId) return
    const requestId = (this._balanceRequestId || 0) + 1
    this._balanceRequestId = requestId
    this.setData({ balanceState: 'loading' })
    util.request('user/get', 'POST', { id: userId }, '数据加载中 ...', (res) => {
      if (requestId !== this._balanceRequestId || userId !== this.data.userId) return
      if (res && res.data && res.data.success && res.data.data) {
        this.setData({
          point: res.data.data.score,
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
   * 积分流水，type=0 为积分
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
      type: 0
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
    this.fetchPoint()
    this.fetchFlow(true)
  },

  /**
   * 余额加载失败重试
   */
  retryBalance: function () {
    if (!this.data.userId) return
    this.fetchPoint()
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
  },

  /**
   * 订阅积分变动通知
   * 模板 ID 需在微信公众平台手动配置获取
   */
  subscribeMessage: function () {
    const tmplIds = [
      '4hynAhhU2ZjQeBkbO1aOdZg1CBxBnim31DVZCq6QAps',
      'z4QjB0RgwLz_rzSwz-Btz4UYFicEmcZFuOPepfUC0uQ',
      'atI2vNoA9gxEHR7iiJ8SXNC5-To5F3nz1GdAiJ9jKT8'
    ]
    wx.getSetting({
      withSubscriptions: true, // 同时获取用户订阅消息的订阅状态
      success: (res) => {
        const settings = res.subscriptionsSetting && res.subscriptionsSetting.itemSettings
        const allRejected = settings && tmplIds.every(id => settings[id] === 'reject')
        if (allRejected) {
          // 全部模板被拒绝时引导去设置页打开
          this.openConfirm('检测到您没打开推送权限，是否去设置打开？')
          return
        }
        wx.requestSubscribeMessage({
          tmplIds: tmplIds,
          success: () => {},
          fail: (err) => {
            console.info(err)
          }
        })
      }
    })
  },

  openConfirm: function (message) {
    wx.showModal({
      content: message,
      confirmText: '确认',
      cancelText: '取消',
      success: (res) => {
        // 点击“确认”时打开设置页面
        if (res.confirm) {
          wx.openSetting({
            success: (settingRes) => {
              console.log(settingRes.authSetting)
            },
            fail: (error) => {
              console.log(error)
            }
          })
        }
      }
    })
  }
})

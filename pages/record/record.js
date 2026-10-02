// pages/record/record.js
const util = require('../../utils/util.js')
const app = getApp()

function formatDisplayTime(timeStr, createTimestamp) {
  if (!timeStr && !createTimestamp) return ''
  let date
  if (createTimestamp && !isNaN(Number(createTimestamp))) {
    date = new Date(Number(createTimestamp))
  } else if (timeStr) {
    date = new Date(String(timeStr).replace(/-/g, '/'))
  }
  if (!date || isNaN(date.getTime())) {
    return timeStr || ''
  }
  const now = new Date()
  const nowYear = now.getFullYear()
  const dYear = date.getFullYear()
  const nowMonth = now.getMonth()
  const dMonth = date.getMonth()
  const nowDate = now.getDate()
  const dDate = date.getDate()

  const pad = n => (n < 10 ? '0' + n : '' + n)
  const timePart = pad(date.getHours()) + ':' + pad(date.getMinutes())

  if (nowYear === dYear && nowMonth === dMonth && nowDate === dDate) {
    return '今天 ' + timePart
  }
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  if (yesterday.getFullYear() === dYear && yesterday.getMonth() === dMonth && yesterday.getDate() === dDate) {
    return '昨天 ' + timePart
  }
  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const monday = new Date(nowYear, nowMonth, nowDate - dayOfWeek + 1, 0, 0, 0)
  const sunday = new Date(nowYear, nowMonth, nowDate + (7 - dayOfWeek), 23, 59, 59)
  if (date >= monday && date <= sunday) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    return '本' + weekDays[date.getDay()] + ' ' + timePart
  }
  if (nowYear === dYear) {
    return pad(dMonth + 1) + '-' + pad(dDate) + ' ' + timePart
  }
  return dYear + '-' + pad(dMonth + 1) + '-' + pad(dDate) + ' ' + timePart
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userId: 0,
    listState: 'loading', // 'loading' | 'guest' | 'error' | 'ready'
    tabs: ['全部', '日常跑', '团跑'],
    currentTab: 0,
    recordList: [],
    page: 1,
    totalCount: 0,
    pageTotal: 1,
    hasMore: true,
    loadingMore: false,
    moreError: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    wx.hideShareMenu({})
    const userId = Number(app.globalData.userId) || 0
    this.setData({
      userId: userId,
      listState: userId > 0 ? 'loading' : 'guest'
    })
    if (userId > 0) {
      this.fetchRecords(true)
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    const userId = Number(app.globalData.userId) || 0
    if (userId !== this.data.userId) {
      this.setData({
        userId: userId,
        listState: userId > 0 ? 'loading' : 'guest',
        recordList: [],
        totalCount: 0
      })
      this._loadedOnce = true
      if (userId > 0) {
        this.fetchRecords(true)
      }
      return
    }
    if (this._loadedOnce && this.data.userId > 0) {
      this.fetchRecords(true)
    }
    this._loadedOnce = true
  },

  /**
   * 切换 Tab
   */
  currentTab: function (e) {
    const idx = Number(e.currentTarget.dataset.idx)
    if (idx === this.data.currentTab) return
    this.setData({
      currentTab: idx,
      recordList: [],
      page: 1,
      totalCount: 0,
      hasMore: true
    })
    if (this.data.userId > 0) {
      this.fetchRecords(true)
    }
  },

  /**
   * 获取打卡记录
   */
  fetchRecords: function (reset) {
    if (!this.data.userId || (this.data.loadingMore && !reset)) return
    if (!reset && !this.data.hasMore) return

    const requestedPage = reset ? 1 : this.data.page
    const requestId = (this._requestId || 0) + 1
    this._requestId = requestId

    // Tab 映射为服务端过滤参数: 0 -> 全部(-1), 1 -> 日常跑(0), 2 -> 团跑(1)
    const tab = this.data.currentTab
    const requestedType = tab === 1 ? 0 : (tab === 2 ? 1 : -1)

    this.setData({
      listState: reset ? 'loading' : this.data.listState,
      loadingMore: true,
      moreError: false
    })

    const params = {
      userId: this.data.userId,
      type: requestedType,
      page: requestedPage
    }

    util.request('user/getsportlist', 'POST', params, '数据加载中 ...', (res) => {
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

      const received = response.data.map((item) => {
        return Object.assign({}, item, {
          display_time: formatDisplayTime(item.create_time_str, item.create_time),
          duration: item.duration && item.duration !== 'undefined' ? item.duration : '',
          energy: item.energy && item.energy !== 'undefined' ? item.energy : ''
        })
      })

      const recordList = reset ? received : this.data.recordList.concat(received)
      const pageTotal = Number(response.page_total) || 1
      const totalCount = Number(response.total) || recordList.length
      const hasMore = requestedPage < pageTotal && received.length > 0

      this.setData({
        recordList: recordList,
        listState: 'ready',
        page: requestedPage + 1,
        pageTotal: pageTotal,
        totalCount: totalCount,
        hasMore: hasMore,
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

  /**
   * 图片预览
   */
  preview: function (e) {
    const url = e.currentTarget.dataset.url
    if (!url) return
    const viewer = this.selectComponent('#imageViewer')
    if (viewer) viewer.open([url], url, { mode: 'card', title: '打卡凭证' })
  },

  /**
   * 删除打卡记录
   */
  delCon: function (e) {
    const that = this
    const id = e.currentTarget.dataset.id
    const idx = e.currentTarget.dataset.index
    wx.showModal({
      title: '删除打卡记录',
      content: '确定要删除这条打卡记录吗？删除后不可恢复。',
      confirmColor: '#cf3a3a',
      cancelColor: '#7a8980',
      success: function (res) {
        if (res.confirm) {
          const data = { id: id }
          util.request('acty/delSport', 'POST', data, '正在删除 ...', (delRes) => {
            if (delRes.data && delRes.data.success) {
              const list = that.data.recordList.slice()
              list.splice(idx, 1)
              that.setData({
                recordList: list,
                totalCount: Math.max(0, that.data.totalCount - 1)
              })
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
              })
            } else {
              wx.showToast({
                title: (delRes.data && delRes.data.error) || '删除失败',
                icon: 'none',
                duration: 1500
              })
            }
          })
        }
      }
    })
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    if (!this.data.userId) {
      wx.stopPullDownRefresh()
      return
    }
    this._refreshing = true
    this.fetchRecords(true)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    if (this.data.listState === 'ready') {
      this.fetchRecords(false)
    }
  },

  /**
   * 重试刷新
   */
  retry: function () {
    this.fetchRecords(true)
  },

  /**
   * 加载更多重试
   */
  retryMore: function () {
    this.fetchRecords(false)
  },

  /**
   * 前往登录
   */
  goLogin: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },

  /**
   * 前往打卡
   */
  goClock: function () {
    wx.navigateTo({ url: '../clockdaily/clockdaily' })
  }
})

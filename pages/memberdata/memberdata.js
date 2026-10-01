const util = require('../../utils/util.js')
const app = getApp()
const PAGE_SIZE = 30

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

function formatDistance(value) {
  if (!hasValue(value)) return '—'
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return (Math.round(number * 100) / 100).toFixed(2)
}

Page({
  data: {
    tabs: [
      { label: '月跑量', sort: 3, field: 'month_count', countField: 'month_times' },
      { label: '年跑量', sort: 4, field: 'year_count', countField: 'year_times' },
      { label: '总跑量', sort: 5, field: 'total', countField: 'sport_times' }
    ],
    activeIndex: 0,
    dataList: [],
    myId: '',
    userId: 0,
    page: 1,
    pageSize: PAGE_SIZE,
    loading: false,
    loadingMore: false,
    error: false,
    hasMore: true,
    loaded: false
  },

  onLoad(options) {
    const userId = app.globalData.userId || 0
    let activeIndex = 0
    if (options && options.type) {
      if (options.type === "year" || options.sort === "4") {
        activeIndex = 1
      } else if (options.type === "total" || options.sort === "5") {
        activeIndex = 2
      } else if (options.type === "month" || options.sort === "3") {
        activeIndex = 0
      }
    } else if (options && options.tab !== undefined) {
      const parsed = parseInt(options.tab, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed < this.data.tabs.length) {
        activeIndex = parsed
      }
    }
    this.setData({ userId: userId, myId: userId, activeIndex: activeIndex })
    this.fetchRanking(true)
  },

  onShow() {
    const userId = app.globalData.userId || 0
    if (String(userId) !== String(this.data.userId)) {
      this.requestId = (this.requestId || 0) + 1
      this.setData({ userId: userId, myId: userId, dataList: [], page: 1, hasMore: true, error: false, loaded: false, loading: false, loadingMore: false })
      this.fetchRanking(true)
    }
  },

  choose(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.activeIndex) return
    this.requestId = (this.requestId || 0) + 1
    this.setData({ activeIndex: index, dataList: [], page: 1, hasMore: true, error: false, loaded: false, loading: false, loadingMore: false })
    this.fetchRanking(true)
  },

  fetchRanking(reset) {
    if (this.data.loading || this.data.loadingMore) return
    const requestId = (this.requestId || 0) + 1
    this.requestId = requestId
    const tab = this.data.tabs[this.data.activeIndex]
    const page = reset ? 1 : this.data.page
    this.setData({ loading: !!reset, loadingMore: !reset, error: false })

    util.request('user/getuserlist', 'POST', {
      nickName: '', mobile: '', openId: '', sort: tab.sort, levelId: '',
      page: page, size: PAGE_SIZE
    }, '', (res) => {
      if (requestId !== this.requestId) return
      const response = res && res.data
      if (!response || !response.success || !Array.isArray(response.data)) {
        this.setData({ loading: false, loadingMore: false, error: true, loaded: true })
        return
      }

      const rows = response.data.map((item, index) => {
        const name = hasValue(item.name) ? item.name : item.nick_name
        return Object.assign({}, item, {
          displayName: hasValue(name) ? name : '跑者',
          displayCount: hasValue(item[tab.countField]) ? item[tab.countField] : '—',
          displayDistance: formatDistance(item[tab.field]),
          rank: (page - 1) * PAGE_SIZE + index + 1,
          isMe: Number(this.data.userId) > 0 && String(item.id) === String(this.data.userId)
        })
      })
      const combined = reset ? rows : this.data.dataList.concat(rows)
      this.setData({
        dataList: combined,
        page: page + 1,
        hasMore: rows.length === PAGE_SIZE,
        loading: false,
        loadingMore: false,
        error: false,
        loaded: true
      })
    }, () => {
      if (requestId !== this.requestId) return
      this.setData({ loading: false, loadingMore: false, error: true, loaded: true })
    })
  },

  retry() {
    this.fetchRanking(true)
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore && !this.data.error) {
      this.fetchRanking(false)
    }
  },

  myData(e) {
    const id = e.currentTarget.dataset.id
    if (!hasValue(id)) return
    if (this.data.userId && String(id) === String(this.data.userId)) {
      wx.switchTab({ url: '../mydata/mydata' })
    } else {
      wx.navigateTo({ url: '../othersdata/othersdata?id=' + id })
    }
  }
})

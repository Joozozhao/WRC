const util = require("../../utils/util.js")
const app = getApp()

function toFixed(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return "0.00"
  return (Math.round(n * 100) / 100).toFixed(2)
}

Page({
  data: {
    actyId: 0,
    dataList: [],
    myRecord: null,
    myId: 0,
    page: 1,
    hasMore: true,
    loading: false,
    loaded: false,
    totalCount: 0
  },

  onLoad(options) {
    const id = options && options.id ? options.id : 0
    const userId = app.globalData.userId || 0
    this.setData({ actyId: id, myId: userId })
    this.fetchData(true)
  },

  onPullDownRefresh() {
    this.fetchData(true, () => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.fetchData(false)
    }
  },

  fetchData(reset, cb) {
    if (this.data.loading && !reset) return
    const page = reset ? 1 : this.data.page
    this.setData({ loading: true })

    const postData = {
      actyId: this.data.actyId,
      page: page
    }

    util.request("acty/getsportlog", "POST", postData, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        const raw = res.data.data
        const processed = raw.map((item, idx) => {
          const rank = (page - 1) * 15 + idx + 1
          const isMe = this.data.myId > 0 && String(item.user_id) === String(this.data.myId)
          return Object.assign({}, item, {
            rankNum: rank,
            displayDistance: toFixed(item.distance),
            isMe: isMe
          })
        })

        const combined = reset ? processed : this.data.dataList.concat(processed)
        let myRecord = this.data.myRecord
        if (reset) {
          myRecord = combined.find(item => item.isMe) || null
        }

        this.setData({
          dataList: combined,
          myRecord: myRecord,
          page: page + 1,
          hasMore: raw.length >= 15,
          loading: false,
          loaded: true,
          totalCount: combined.length
        })
      } else {
        this.setData({
          dataList: reset ? [] : this.data.dataList,
          hasMore: false,
          loading: false,
          loaded: true
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
  },

  myData(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    const userId = app.globalData.userId
    if (userId && String(id) === String(userId)) {
      wx.switchTab({ url: "../mydata/mydata" })
    } else {
      wx.navigateTo({ url: "../othersdata/othersdata?id=" + id })
    }
  }
})

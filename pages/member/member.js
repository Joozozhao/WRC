const util = require("../../utils/util.js")
const app = getApp()

Page({
  data: {
    actyId: 0,
    memberList: [],
    loading: false,
    loaded: false,
    totalCount: 0
  },

  onLoad(options) {
    const id = options && options.id ? options.id : 0
    this.setData({ actyId: id })
    this.initMember(true)
  },

  onPullDownRefresh() {
    this.initMember(true, () => {
      wx.stopPullDownRefresh()
    })
  },

  initMember(reset, cb) {
    this.setData({ loading: true })
    const data = {
      actyId: this.data.actyId,
      level: "",
      distance: 1
    }

    util.request("acty/getactyuser", "POST", data, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        const list = res.data.data.map((item, idx) => {
          return Object.assign({}, item, {
            rankNum: idx + 1
          })
        })
        this.setData({
          memberList: list,
          totalCount: list.length,
          loading: false,
          loaded: true
        })
      } else {
        this.setData({
          memberList: [],
          totalCount: 0,
          loading: false,
          loaded: true
        })
      }
      if (typeof cb === "function") cb()
    }, () => {
      this.setData({
        memberList: [],
        totalCount: 0,
        loading: false,
        loaded: true
      })
      if (typeof cb === "function") cb()
    })
  },

  myData(e) {
    const id = e.currentTarget.dataset.userid
    if (!id) return
    const userId = app.globalData.userId
    if (userId && String(id) === String(userId)) {
      wx.switchTab({ url: "../mydata/mydata" })
    } else {
      wx.navigateTo({ url: "../othersdata/othersdata?id=" + id })
    }
  }
})

const util = require("../../utils/util.js")
const app = getApp()

function toFixed(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return "0.00"
  return (Math.round(n * 100) / 100).toFixed(2)
}

function calcPercent(finish, total) {
  const f = Number(finish) || 0
  const t = Number(total) || 0
  if (t <= 0) return 0
  const p = Math.round((f / t) * 100)
  return Math.min(100, Math.max(0, p))
}

Page({
  data: {
    actyId: 0,
    memberList: [],
    levelList: ["全部", "VIP", "普通", "非会员"],
    activeLevelIndex: 0,
    sortOrder: 1, // 1: 降序, 0: 升序
    loading: false,
    loaded: false,
    totalCount: 0
  },

  onLoad(options) {
    const id = options && options.id ? options.id : 0
    this.setData({ actyId: id })
    this.fetchMembers()
  },

  onPullDownRefresh() {
    this.fetchMembers(() => {
      wx.stopPullDownRefresh()
    })
  },

  chooseLevel(e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.activeLevelIndex) return
    this.setData({ activeLevelIndex: index })
    this.fetchMembers()
  },

  toggleSort() {
    const nextOrder = this.data.sortOrder === 1 ? 0 : 1
    this.setData({ sortOrder: nextOrder })
    this.fetchMembers()
  },

  fetchMembers(cb) {
    this.setData({ loading: true })
    const levelStr = this.data.activeLevelIndex === 0 ? "" : this.data.levelList[this.data.activeLevelIndex]
    const data = {
      actyId: this.data.actyId,
      level: levelStr,
      distance: this.data.sortOrder
    }

    util.request("acty/getactyuser", "POST", data, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        const rawList = res.data.data
        const processed = rawList.map((item, idx) => {
          const finish = Number(item.finish_distance) || 0
          const rawTarget = Number(item.distance) || 0
          const target = Math.round(rawTarget)
          const percent = calcPercent(finish, target)
          return Object.assign({}, item, {
            displayFinish: toFixed(finish),
            displayTarget: String(target),
            percent: percent,
            isCompleted: finish >= target && target > 0,
            rankNum: idx + 1
          })
        })

        this.setData({
          memberList: processed,
          totalCount: processed.length,
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
    const currentUserId = app.globalData.userId
    if (currentUserId && String(id) === String(currentUserId)) {
      wx.switchTab({ url: "../mydata/mydata" })
    } else {
      wx.navigateTo({ url: "../othersdata/othersdata?id=" + id })
    }
  }
})

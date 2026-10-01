const util = require("../../utils/util.js")
const app = getApp()

function toInt(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

Page({
  data: {
    targetUserId: 0,
    headerImg: "/images/default.png",
    userName: "",
    nickName: "",
    sex: 1,
    level: "",
    score: 0,
    energy: 0,
    duty: "",
    monthDistance: 0,
    totalDistance: 0,
    statsLoaded: false,

    // 热力图
    heatmapStatus: "loading",
    myHeatmap: null,
    availableMonths: [],
    currentMonthIndex: 0,
    canPrevMonth: false,
    canNextMonth: false,
    monthlyDailyMap: {},

    // 马拉松
    marathons: [],
    totalMarathons: 0,

    // 参与记录
    activeTab: "challenge", // challenge | activity
    activityList: [],
    totalChallenge: 0,
    activityList2: [],
    totalActy: 0
  },

  onLoad(options) {
    const id = options && (options.id || options.userId) ? Number(options.id || options.userId) : 0
    this.setData({ targetUserId: id })
    this.loadAllData(id)
  },

  onPullDownRefresh() {
    this.loadAllData(this.data.targetUserId, () => {
      wx.stopPullDownRefresh()
    })
  },

  loadAllData(userId, cb) {
    if (!userId || userId <= 0) {
      if (typeof cb === "function") cb()
      return
    }
    this.initInfor(userId)
    this.initHeatmapData(userId)
    this.initMarathon(userId)
    this.initChallenges(userId)
    this.initGroupRuns(userId, cb)
  },

  // 用户资料
  initInfor(id) {
    util.request("user/getsportinfo", "POST", { userId: id }, "", (res) => {
      if (res && res.data && res.data.success && res.data.data) {
        const d = res.data.data
        let dutyStr = d.duty || ""
        if (dutyStr === "团长,管理员" || dutyStr === "管理员,团长") {
          dutyStr = "管理员/团长"
        }
        const displayName = d.userName || d.nickName || "跑者"
        wx.setNavigationBarTitle({
          title: displayName + "的主页"
        })
        this.setData({
          headerImg: d.headerImg || "/images/default.png",
          userName: d.userName || "",
          nickName: d.nickName || "",
          sex: d.sex !== undefined ? d.sex : 1,
          level: d.level || "",
          score: toInt(d.score),
          energy: toInt(d.energy),
          duty: dutyStr,
          monthDistance: toInt(d.monthDistance),
          totalDistance: toInt(d.totalDistance),
          statsLoaded: true
        })
      }
    })
  },

  // 热力图
  initHeatmapData(userId) {
    const that = this
    const now = new Date()
    const curMonthKey = now.getFullYear() + "-" + (now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1))
    that.setData({ heatmapStatus: "loading", myHeatmap: null })

    util.request("user/getMonthList", "POST", { user_id: userId }, "", (res) => {
      const dailyMap = {}
      const monthKeysSet = {}
      const monthLoaded = !!(res && res.data && res.data.success && res.data.data)

      if (monthLoaded) {
        const monthsObj = res.data.data
        Object.keys(monthsObj).forEach((mKey) => {
          monthKeysSet[mKey] = true
          const dayList = monthsObj[mKey] || []
          dayList.forEach((dItem) => {
            if (dItem.sport_day && dItem.sport_total !== undefined) {
              dailyMap[dItem.sport_day] = Number(dItem.sport_total) || 0
            }
          })
        })
      }

      util.request("user/getWeekRuleList", "POST", { user_id: userId }, "", (weekRes) => {
        const weekLoaded = !!(weekRes && weekRes.data && weekRes.data.success && weekRes.data.data)
        if (weekLoaded) {
          const weekList = weekRes.data.data || []
          weekList.forEach((wItem) => {
            if (wItem.sport_day && wItem.sport_total !== undefined) {
              const val = Number(wItem.sport_total) || 0
              if (val > (dailyMap[wItem.sport_day] || 0)) {
                dailyMap[wItem.sport_day] = val
              }
            }
          })
        }

        monthKeysSet[curMonthKey] = true
        const sortedMonths = Object.keys(monthKeysSet).sort()
        let defaultIdx = sortedMonths.indexOf(curMonthKey)
        if (defaultIdx === -1) defaultIdx = sortedMonths.length - 1

        that.setData({
          availableMonths: sortedMonths,
          monthlyDailyMap: dailyMap
        })
        if (monthLoaded || weekLoaded) {
          that.renderSelectedMonth(defaultIdx)
          that.setData({ heatmapStatus: "ready" })
        } else {
          that.setData({ heatmapStatus: "error" })
        }
      }, () => {
        monthKeysSet[curMonthKey] = true
        const sortedMonths = Object.keys(monthKeysSet).sort()
        that.setData({
          availableMonths: sortedMonths,
          monthlyDailyMap: dailyMap
        })
        that.renderSelectedMonth(sortedMonths.length - 1)
        that.setData({ heatmapStatus: "ready" })
      })
    }, () => {
      that.setData({ heatmapStatus: "error" })
    })
  },

  renderSelectedMonth(idx) {
    const sorted = this.data.availableMonths
    if (!sorted || sorted.length === 0) return
    const monthKey = sorted[idx]
    const parts = monthKey.split("-")
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)

    const now = new Date()
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month
    const todayDate = now.getDate()

    const firstDay = new Date(year, month - 1, 1).getDay()
    const leadingEmpty = (firstDay + 6) % 7
    const daysInMonth = new Date(year, month, 0).getDate()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    let totalMonthDistance = 0
    let runDaysCount = 0
    const cells = []

    // 1. 上月补充天数
    const prevMonthLastDay = new Date(year, month - 1, 0)
    const prevTotalDays = prevMonthLastDay.getDate()
    const prevYear = prevMonthLastDay.getFullYear()
    const prevMonth = prevMonthLastDay.getMonth() + 1
    const prevMonthKey = prevYear + "-" + (prevMonth < 10 ? "0" + prevMonth : prevMonth)

    for (let p = leadingEmpty - 1; p >= 0; p--) {
      const pDay = prevTotalDays - p
      const dStr = pDay < 10 ? "0" + pDay : String(pDay)
      const dateKey = prevMonthKey + "-" + dStr
      const distance = this.data.monthlyDailyMap[dateKey] || 0
      const curDate = new Date(prevYear, prevMonth - 1, pDay)
      const isFuture = curDate > todayStart

      let level = 0
      if (distance > 0 && !isFuture) {
        if (distance < 5) level = 1
        else if (distance < 10) level = 2
        else if (distance < 21.0975) level = 3
        else level = 4
      }

      cells.push({
        isEmpty: false,
        isOtherMonth: true,
        isPrevMonth: true,
        isFuture: isFuture,
        isToday: false,
        day: pDay,
        dateKey: dateKey,
        distance: distance,
        displayKm: Math.round(distance),
        level: isFuture ? 0 : level
      })
    }

    // 2. 当月天数
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = d < 10 ? "0" + d : String(d)
      const dateKey = monthKey + "-" + dStr
      const distance = this.data.monthlyDailyMap[dateKey] || 0
      totalMonthDistance += distance

      let level = 0
      if (distance > 0) {
        runDaysCount += 1
        if (distance < 5) level = 1
        else if (distance < 10) level = 2
        else if (distance < 21.0975) level = 3
        else level = 4
      }

      const isFuture = isCurrentMonth && d > todayDate
      const isToday = isCurrentMonth && d === todayDate

      cells.push({
        isEmpty: false,
        isOtherMonth: false,
        isFuture: isFuture,
        isToday: isToday,
        day: d,
        dateKey: dateKey,
        distance: distance,
        displayKm: Math.round(distance),
        level: isFuture ? 0 : level
      })
    }

    // 3. 下月补充天数
    const remainder = cells.length % 7
    const trailingCount = remainder === 0 ? 0 : 7 - remainder
    const nextMonthFirstDay = new Date(year, month, 1)
    const nextYear = nextMonthFirstDay.getFullYear()
    const nextMonth = nextMonthFirstDay.getMonth() + 1
    const nextMonthKey = nextYear + "-" + (nextMonth < 10 ? "0" + nextMonth : nextMonth)

    for (let d = 1; d <= trailingCount; d++) {
      const dStr = d < 10 ? "0" + d : String(d)
      const dateKey = nextMonthKey + "-" + dStr
      const distance = this.data.monthlyDailyMap[dateKey] || 0
      const curDate = new Date(nextYear, nextMonth - 1, d)
      const isFuture = curDate > todayStart

      let level = 0
      if (distance > 0 && !isFuture) {
        if (distance < 5) level = 1
        else if (distance < 10) level = 2
        else if (distance < 21.0975) level = 3
        else level = 4
      }

      cells.push({
        isEmpty: false,
        isOtherMonth: true,
        isNextMonth: true,
        isFuture: isFuture,
        isToday: false,
        day: d,
        dateKey: dateKey,
        distance: distance,
        displayKm: Math.round(distance),
        level: isFuture ? 0 : level
      })
    }

    const monthLabel = year + "年" + month + "月"
    this.setData({
      currentMonthIndex: idx,
      canPrevMonth: idx > 0,
      canNextMonth: idx < sorted.length - 1,
      myHeatmap: {
        monthLabel: monthLabel,
        days: cells,
        runDaysCount: runDaysCount,
        totalDistance: toInt(totalMonthDistance)
      }
    })
  },

  onPrevMonth() {
    if (this.data.canPrevMonth) {
      this.renderSelectedMonth(this.data.currentMonthIndex - 1)
    }
  },

  onNextMonth() {
    if (this.data.canNextMonth) {
      this.renderSelectedMonth(this.data.currentMonthIndex + 1)
    }
  },

  // 马拉松记录
  initMarathon(userId) {
    util.request("user/marathonsnum", "POST", { userId: userId }, "", (res) => {
      if (res && res.data && res.data.data) {
        this.setData({ totalMarathons: res.data.data.total || 0 })
      }
    })
    util.request("user/marathons", "POST", { userId: userId, page: 1 }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        this.setData({ marathons: res.data.data.slice(0, 3) })
      }
    })
  },

  toMarathonAll() {
    wx.navigateTo({ url: "../results/results?id=" + this.data.targetUserId })
  },

  // 参与挑战与团跑
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  initChallenges(userId) {
    util.request("acty/getacty", "POST", { userId: userId, actyType: "挑战", page: 1 }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        this.setData({
          activityList: res.data.data.slice(0, 8),
          totalChallenge: res.data.total || res.data.data.length
        })
      }
    })
  },

  initGroupRuns(userId, cb) {
    util.request("acty/getacty", "POST", { userId: userId, actyType: "团跑", page: 1 }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        this.setData({
          activityList2: res.data.data.slice(0, 8),
          totalActy: res.data.total || res.data.data.length
        })
      }
      if (typeof cb === "function") cb()
    }, () => {
      if (typeof cb === "function") cb()
    })
  },

  toChallengeDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: "../challengedetail/challengedetail?id=" + id })
  },

  toActivityDetail(e) {
    const id = e.currentTarget.dataset.id
    if (id) wx.navigateTo({ url: "../activitydetail/activitydetail?id=" + id })
  }
})

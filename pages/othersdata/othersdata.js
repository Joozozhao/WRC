// pages/othersdata/othersdata.js
const util = require("../../utils/util.js")
const playPageMotion = require("../../utils/page-motion.js")
const { toDisplayMemberLevel } = require('../../utils/member-level.js')
const { getRegionLabel } = require('../../utils/profile-badges.js')
const app = getApp()

function toInt(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return 0
  return Math.round(n)
}

function toDecimal1(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return "0.0"
  return (Math.round(n * 10) / 10).toFixed(1)
}

function toDecimal2(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return "0.00"
  return (Math.round(n * 100) / 100).toFixed(2)
}

Page({
  data: {
    targetUserId: 0,
    headerImg: "/images/default.png",
    userName: "",
    nickName: "",
    sex: "",
    level: "",
    levelLabel: "",
    regionLabel: "",
    score: 0,
    energy: 0,
    duty: "",
    monthDistance: "0.00",
    weekDistance: "0.0",
    yearDistance: "0.0",
    totalDistance: "0",
    statsLoaded: false,
    weekLoaded: false,
    yearLoaded: false,

    // 跑步日历（左右滑动）
    heatmapStatus: "loading", // loading | ready | error
    availableMonths: [],
    currentMonthIndex: 0,
    canPrevMonth: false,
    canNextMonth: false,
    monthPages: [], // 存储每个月的日历网格及数据
    monthlyDailyMap: {},

    // 马拉松成绩
    marathons: [],
    totalMarathons: 0,

    // 参与记录
    activeTab: "challenge", // challenge | activity
    activityList: [],
    totalChallenge: 0,
    activityList2: [],
    totalActy: 0,
    pageMotion: false
  },

  onShow() {
    playPageMotion(this)
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
    this.initWeekDistance(userId)
    this.initYearDistance(userId)
    this.initHeatmapData(userId)
    this.initMarathon(userId)
    this.initChallenges(userId)
    this.initGroupRuns(userId, cb)
  },

  // 1. 用户基本资料与主数据
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
          sex: d.sex !== undefined ? d.sex : "",
          level: d.level || "",
          levelLabel: toDisplayMemberLevel(d.level),
          regionLabel: getRegionLabel(d),
          score: toInt(d.score),
          energy: toInt(d.energy),
          duty: dutyStr,
          monthDistance: toDecimal2(d.monthDistance),
          totalDistance: String(Math.round(Number(d.totalDistance) || 0)),
          statsLoaded: true
        })
      }
    })
  },

  // 2. 本周跑量
  initWeekDistance(userId) {
    util.request("user/getWeekRuleList", "POST", { user_id: userId }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        let total = 0
        res.data.data.forEach((w) => {
          const val = Number(w.sport_total) || 0
          if (val > 0) total += val
        })
        this.setData({
          weekDistance: toDecimal1(total),
          weekLoaded: true
        })
      } else {
        this.setData({ weekDistance: "0.0", weekLoaded: true })
      }
    }, () => {
      this.setData({ weekDistance: "0.0", weekLoaded: true })
    })
  },

  // 3. 本年跑量
  initYearDistance(userId) {
    const postData = {
      nickName: "",
      mobile: "",
      openId: "",
      sort: 4,
      levelId: "",
      page: 1,
      size: 100
    }
    util.request("user/getuserlist", "POST", postData, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        const target = res.data.data.find((item) => String(item.id) === String(userId))
        if (target && target.year_count !== undefined && target.year_count !== null) {
          const yr = Number(target.year_count) || 0
          this.setData({
            yearDistance: toDecimal1(yr),
            yearLoaded: true
          })
          return
        }
      }
      this.setData({ yearDistance: "0.0", yearLoaded: true })
    }, () => {
      this.setData({ yearDistance: "0.0", yearLoaded: true })
    })
  },

  // 4. 跑步日历数据与月历网格（构建所有月份便于滑动）
  initHeatmapData(userId) {
    const that = this
    const now = new Date()
    const curMonthKey = now.getFullYear() + "-" + (now.getMonth() + 1 < 10 ? "0" + (now.getMonth() + 1) : (now.getMonth() + 1))
    that.setData({ heatmapStatus: "loading", monthPages: [] })

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

      // 补充当周记录以确保今日即时打卡数据
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
        // 至少包含最近 6 个月供前后滑动
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const mk = d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : (d.getMonth() + 1))
          monthKeysSet[mk] = true
        }

        const sortedMonths = Object.keys(monthKeysSet).sort()
        let defaultIdx = sortedMonths.indexOf(curMonthKey)
        if (defaultIdx === -1) defaultIdx = sortedMonths.length - 1

        // 构建各月的日历展示页面数组
        const pages = sortedMonths.map((mKey) => that.buildMonthPage(mKey, dailyMap))

        that.setData({
          availableMonths: sortedMonths,
          monthlyDailyMap: dailyMap,
          monthPages: pages,
          currentMonthIndex: defaultIdx,
          canPrevMonth: defaultIdx > 0,
          canNextMonth: defaultIdx < sortedMonths.length - 1,
          heatmapStatus: "ready"
        })
      }, () => {
        monthKeysSet[curMonthKey] = true
        const sortedMonths = Object.keys(monthKeysSet).sort()
        let defaultIdx = sortedMonths.indexOf(curMonthKey)
        if (defaultIdx === -1) defaultIdx = sortedMonths.length - 1
        const pages = sortedMonths.map((mKey) => that.buildMonthPage(mKey, dailyMap))

        that.setData({
          availableMonths: sortedMonths,
          monthlyDailyMap: dailyMap,
          monthPages: pages,
          currentMonthIndex: defaultIdx,
          canPrevMonth: defaultIdx > 0,
          canNextMonth: defaultIdx < sortedMonths.length - 1,
          heatmapStatus: "ready"
        })
      })
    }, () => {
      that.setData({ heatmapStatus: "error" })
    })
  },

  // 生成单月的完整日历天数网格
  buildMonthPage(monthKey, dailyMap) {
    const parts = monthKey.split("-")
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10)

    const now = new Date()
    const isCurrentMonth = now.getFullYear() === year && (now.getMonth() + 1) === month
    const todayDate = now.getDate()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const firstDay = new Date(year, month - 1, 1).getDay()
    const leadingEmpty = (firstDay + 6) % 7 // 周一为 0
    const daysInMonth = new Date(year, month, 0).getDate()

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
      const distance = dailyMap[dateKey] || 0
      const curDate = new Date(prevYear, prevMonth - 1, pDay)
      const isFuture = curDate > todayStart

      let level = 0
      if (distance > 0 && !isFuture) {
        // 与首页日历完全一致的阶梯规则
        if (distance <= 3) level = 1
        else if (distance <= 7) level = 2
        else if (distance <= 12) level = 3
        else level = 4
      }

      cells.push({
        day: pDay,
        dateKey: dateKey,
        distance: distance,
        displayKm: distance > 0 ? Math.round(distance * 10) / 10 : null,
        level: isFuture ? 0 : level,
        isOtherMonth: true,
        isFuture: isFuture,
        isToday: false
      })
    }

    // 2. 当月天数
    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = d < 10 ? "0" + d : String(d)
      const dateKey = monthKey + "-" + dStr
      const distance = dailyMap[dateKey] || 0
      totalMonthDistance += distance

      let level = 0
      if (distance > 0) {
        runDaysCount += 1
        // 与首页日历完全一致的阶梯规则
        if (distance <= 3) level = 1
        else if (distance <= 7) level = 2
        else if (distance <= 12) level = 3
        else level = 4
      }

      const isFuture = isCurrentMonth && d > todayDate
      const isToday = isCurrentMonth && d === todayDate

      cells.push({
        day: d,
        dateKey: dateKey,
        distance: distance,
        displayKm: distance > 0 ? Math.round(distance * 10) / 10 : null,
        level: isFuture ? 0 : level,
        isOtherMonth: false,
        isFuture: isFuture,
        isToday: isToday
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
      const distance = dailyMap[dateKey] || 0
      const curDate = new Date(nextYear, nextMonth - 1, d)
      const isFuture = curDate > todayStart

      let level = 0
      if (distance > 0 && !isFuture) {
        // 与首页日历完全一致的阶梯规则
        if (distance <= 3) level = 1
        else if (distance <= 7) level = 2
        else if (distance <= 12) level = 3
        else level = 4
      }

      cells.push({
        day: d,
        dateKey: dateKey,
        distance: distance,
        displayKm: distance > 0 ? Math.round(distance * 10) / 10 : null,
        level: isFuture ? 0 : level,
        isOtherMonth: true,
        isFuture: isFuture,
        isToday: false
      })
    }

    return {
      monthKey: monthKey,
      monthLabel: year + "年" + month + "月",
      days: cells,
      gridHeight: Math.ceil(cells.length / 7) * 36 + (Math.ceil(cells.length / 7) - 1) * 6,
      runDaysCount: runDaysCount,
      totalDistance: toDecimal1(totalMonthDistance)
    }
  },

  // 左右划动 swiper 切换月份
  onMonthSwiperChange(e) {
    const nextIndex = e.detail.current
    const total = this.data.availableMonths.length
    this.setData({
      currentMonthIndex: nextIndex,
      canPrevMonth: nextIndex > 0,
      canNextMonth: nextIndex < total - 1
    })
  },

  // 按钮点击切换上一月
  onPrevMonth() {
    if (this.data.canPrevMonth) {
      const nextIdx = this.data.currentMonthIndex - 1
      this.setData({
        currentMonthIndex: nextIdx,
        canPrevMonth: nextIdx > 0,
        canNextMonth: true
      })
    }
  },

  // 按钮点击切换下一月
  onNextMonth() {
    if (this.data.canNextMonth) {
      const nextIdx = this.data.currentMonthIndex + 1
      this.setData({
        currentMonthIndex: nextIdx,
        canPrevMonth: true,
        canNextMonth: nextIdx < this.data.availableMonths.length - 1
      })
    }
  },

  // 5. 马拉松记录
  initMarathon(userId) {
    util.request("user/marathonsnum", "POST", { userId: userId }, "", (res) => {
      if (res && res.data && res.data.data) {
        this.setData({ totalMarathons: res.data.data.total || 0 })
      }
    })
    // 与个人主页一致：默认展示 PB 高光成绩，而不是普通赛事列表
    util.request("user/marathonpb", "POST", { userId: userId }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        this.setData({ marathons: res.data.data.slice(0, 3) })
      }
    })
  },

  toMarathonAll() {
    wx.navigateTo({ url: "../results/results?id=" + this.data.targetUserId })
  },

  // 6. 参与挑战与团跑
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

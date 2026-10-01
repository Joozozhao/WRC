const homeSummary = require("../../utils/home-month-summary.js")
const util = require('../../utils/util.js')
// index.js
// 获取应用实例
const app = getApp()
var day = ["今天", "明天", "后天"];

function parseChallengeMonth(entry) {
  if (!entry) return null
  const dateCandidates = [entry.start_time, entry.start_timestr, entry.end_time, entry.end_timestr]
  for (let i = 0; i < dateCandidates.length; i++) {
    const dateVal = dateCandidates[i]
    if (typeof dateVal === 'string') {
      const m = dateVal.match(/(\d{4})[-/](\d{1,2})/)
      if (m) {
        return { year: parseInt(m[1], 10), month: parseInt(m[2], 10) }
      }
    } else if (typeof dateVal === 'number' && dateVal > 1000000000) {
      const d = new Date(dateVal)
      if (!isNaN(d.getTime())) {
        return { year: d.getFullYear(), month: d.getMonth() + 1 }
      }
    }
  }

  const name = entry.acty_name || ''
  const ym = name.match(/(\d{4})年\s*(\d{1,2})月/)
  if (ym) {
    return { year: parseInt(ym[1], 10), month: parseInt(ym[2], 10) }
  }
  const y2m = name.match(/(\d{2})年\s*(\d{1,2})月/)
  if (y2m) {
    return { year: 2000 + parseInt(y2m[1], 10), month: parseInt(y2m[2], 10) }
  }
  const now = new Date()
  const mOnly = name.match(/(\d{1,2})月/)
  if (mOnly) {
    return { year: now.getFullYear(), month: parseInt(mOnly[1], 10) }
  }
  const zhMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12 }
  const mZh = name.match(/([一二三四五六七八九十]+)月/)
  if (mZh && zhMap[mZh[1]]) {
    return { year: now.getFullYear(), month: zhMap[mZh[1]] }
  }
  return null
}

function pickClosestChallenge(list, now) {
  if (!Array.isArray(list) || list.length === 0) return null
  const curDate = now || new Date()
  const curYear = curDate.getFullYear()
  const curMonth = curDate.getMonth() + 1
  const curMonthIdx = curYear * 12 + (curMonth - 1)

  const validList = list.filter(item => item && item.acty_type !== 'V挑战')
  if (validList.length === 0) return null

  const scored = validList.map(item => {
    const ym = parseChallengeMonth(item)
    if (!ym) {
      return { item, absDiff: 9999, diff: 9999, hasJoined: false, days: Number(item.days) || 0 }
    }
    const chMonthIdx = ym.year * 12 + (ym.month - 1)
    const diff = chMonthIdx - curMonthIdx
    const absDiff = Math.abs(diff)
    const hasJoined = Boolean(item.join_time && item.join_time !== '未参加该挑战!')
    return { item, absDiff, diff, hasJoined, ym, days: Number(item.days) || 0 }
  })

  scored.sort((a, b) => {
    // 1. 月份距离最近（absDiff 越小越近，0 表示本月挑战）
    if (a.absDiff !== b.absDiff) return a.absDiff - b.absDiff
    // 2. 距离相同时，优先进行中/未来的月份（diff >= 0 优先于已过去的月份）
    if ((a.diff >= 0) !== (b.diff >= 0)) return a.diff >= 0 ? -1 : 1
    // 3. 同月份内，优先用户已参加的挑战
    if (a.hasJoined !== b.hasJoined) return a.hasJoined ? -1 : 1
    // 4. 优先未结束的活动（days >= 0）
    const daysA = a.days >= 0 ? 1 : 0
    const daysB = b.days >= 0 ? 1 : 0
    if (daysA !== daysB) return daysB - daysA
    // 5. 按 ID 降序（最新创建）
    return (b.item.acty_id || b.item.id || 0) - (a.item.acty_id || a.item.id || 0)
  })

  return scored[0] ? scored[0].item : null
}




function formatFeedDate(value) {
  if (!value) return ''
  const raw = String(value)
  const fullDate = raw.match(/\d{4}[-/](\d{1,2})[-/](\d{1,2})/)
  const chineseDate = raw.match(/(\d{1,2})月(\d{1,2})日/)
  const parts = fullDate || chineseDate
  return parts ? Number(parts[1]) + '月' + Number(parts[2]) + '日' : ''
}

Page({
  data: {
    all: false,
    show: false,
    timer: '',
    day: day,
    tabbar: {},
    imgUrls: [],
    indicatorDots: true,
    vertical: false,
    autoplay: true,
    interval: 2000,
    duration: 500,
    userId: 0,
    avatarUrl: "../../images/default.png", //用户头像
    nickName: "点击头像登录", //用户昵称
    score: 0,
    duty: "",
    level: "",
    number: 0,
    serialDay: null,
    serialDayColor: '#9aa69e',
    energy: 0,
    hasClockOn: 0,
    actyId: 0,
    imgheight: '',
    setHeight: '',
    recordList: [],
    recordLoading: false,
    recordError: false,
    myTip: '',
    systemInfo: {},
    safeTop: 88,
    todayLabel: '',
    statsLoaded: false,
    totalDistance: '0.0',
        challengeItem: null,
    challengePercent: 0,
    challengeProgressAvailable: false,
    challengeProgressWidth: '0%',
    challengeRingAsset: '/images/redesign/challenge-ring-0.svg',
    challengeDistanceLabel: '',
    challengeRemaining: null,
    challengeRemainingLabel: '距离目标',
    homeHeatmap: null,
    homeHeatmapLoaded: false,
    monthDistance: null,
    monthTarget: null,
    monthTargetFormatted: "77",
    monthPercent: null,
    monthProgressWidth: "0%",
    monthRunDays: null,
    weekDistance: null,
    weekTarget: null,
    weekTargetFormatted: "19.25",
    weekPercent: null,
    weekProgressWidth: "0%",
    weekGoalCaption: "折算本周目标 19.25 公里",
    yearDistance: "0.0",
    yearLoaded: false,
    monthSummaryLoaded: false,
    monthSummaryLoading: false,
    monthSummaryError: false,
    monthGoalStatus: "idle",
    monthGoalCaption: "本月默认参考目标 · 77 公里",
    currentMonthNum: (new Date()).getMonth() + 1,
    calendarExpanded: false
  },
  toggleCalendar: function () {
    this.setData({ calendarExpanded: !this.data.calendarExpanded })
  },
  onPageScroll: function (e) {
    if (!this.data.calendarExpanded && e && e.scrollTop > 20) {
      this.setData({ calendarExpanded: true })
    }
  },
  setTodayLabel: function () {
    const now = new Date()
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    this.setData({ todayLabel: `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}` })
  },
  handleProfileTap: function () {
    if (this.data.userId > 0) {
      this.toUserCenter()
    } else {
      this.openLogin()
    }
  },
  toClockIn: function () {
    wx.navigateTo({ url: '../clockdaily/clockdaily' })
  },
  toRunningDetail: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },
  getMonthChallengeCoordinator: function () {
    if (!this._monthChallengeCoordinator) {
      this._monthChallengeCoordinator = homeSummary.createMonthChallengeCoordinator({
        request: util.request,
        now: () => new Date(),
        defaultTarget: 77
      });
    }
    return this._monthChallengeCoordinator;
  },
  retryMonthGoal: function () {
    const userId = app.globalData.userId || this.data.userId;
    this.loadMonthChallengeGoal(userId);
  },
  retryMonthSummary: function () {
    const userId = app.globalData.userId || this.data.userId;
    this.initHomeHeatmap(userId);
    this.loadMonthChallengeGoal(userId);
  },
  loadMonthChallengeGoal: function (userId) {
    const activeUserId = userId > 0 ? userId : 0;
    this.setData({ currentMonthNum: (new Date()).getMonth() + 1 });
    const coordinator = this.getMonthChallengeCoordinator();

    if (!(activeUserId > 0)) {
      coordinator.load(0);
      this.setData({
        monthTarget: 77,
        monthTargetFormatted: "77",
        monthGoalStatus: "guest",
        monthGoalCaption: "登录后同步挑战目标 · 默认参考目标 77 公里",
        monthPercent: "—",
        monthProgressWidth: "0%",
        weekTarget: 19.25,
        weekTargetFormatted: "19.25",
        weekPercent: "—",
        weekProgressWidth: "0%",
        weekGoalCaption: "登录后查看本周跑量 · 折算本周目标 19.25 公里"
      });
      return;
    }

    coordinator.load(activeUserId, {
      onState: (state) => {
        // 两者都必须完全匹配当前活动用户，否则视为过期响应
        if (activeUserId !== app.globalData.userId || activeUserId !== this.data.userId) return;
        const curDist = this.data.monthDistance;
        const prog = homeSummary.calculateProgress(curDist, state.target);
        const wkTarget = Number.isFinite(Number(state.target)) && Number(state.target) > 0 ? (Number(state.target) / 4) : null;
        const wkTargetFmt = Number.isFinite(wkTarget) ? homeSummary.formatKm(wkTarget) : "—";
        const curWkDist = this.data.weekDistance;
        const wkProg = homeSummary.calculateProgress(curWkDist, wkTarget);
        let wkCaption = "折算本周目标 · " + wkTargetFmt + " 公里";
        if (state.status === "error") {
          wkCaption = "目标确认失败，点击重试";
        } else if (state.isDefault) {
          wkCaption = "折算本周默认参考目标 · " + wkTargetFmt + " 公里";
        } else if (state.challenge && state.challenge.acty_name) {
          wkCaption = state.challenge.acty_name + " · 折算本周目标 " + wkTargetFmt + " 公里";
        }

        this.setData({
          monthGoalStatus: state.status,
          monthTarget: state.target,
          monthTargetFormatted: state.targetFormatted,
          monthGoalCaption: state.caption,
          monthPercent: state.status === "ready" ? prog.percent : "—",
          monthProgressWidth: state.status === "ready" ? prog.progressWidth : "0%",
          weekTarget: wkTarget,
          weekTargetFormatted: wkTargetFmt,
          weekPercent: state.status === "ready" ? wkProg.percent : "—",
          weekProgressWidth: state.status === "ready" ? wkProg.progressWidth : "0%",
          weekGoalCaption: wkCaption
        });
      },
      onCandidateDetail: (candidate) => {
        if (activeUserId !== app.globalData.userId || activeUserId !== this.data.userId) return;
        // 同步维护当前挑战卡片展示：必须保持最新最高 ID，避免被低 ID 候选覆盖
        if (candidate && candidate.detail) {
          const newId = Number(candidate.acty_id || candidate.id || 0);
          const curItem = this.data.challengeItem;
          const curId = curItem ? Number(curItem.acty_id || curItem.id || 0) : 0;
          if (newId >= curId) {
            this.applyCandidateDetailToChallengeCard(candidate.item, candidate.detail);
          }
        }
      }
    });
  },
  applyCandidateDetailToChallengeCard: function (item, detail) {
    const hasJoined = Number(detail.has_clickon) === 1;
    const days = detail.days !== undefined && detail.days !== null ? Number(detail.days) : (Number(item.days) || 0);
    const isEnded = days < 0 || Number(detail.acty_state) === 0;
    const target = Number(detail.target) > 0 ? Number(detail.target) : (Number(detail.distance) > 0 ? Number(detail.distance) : NaN);
    const covered = detail.hasDistance !== undefined && detail.hasDistance !== null ? Number(detail.hasDistance) : NaN;
    const resDist = detail.resDistance !== undefined && detail.resDistance !== null ? Number(detail.resDistance) : NaN;

    let percent = 0;
    if (hasJoined && Number.isFinite(covered) && Number.isFinite(target) && target > 0) {
      percent = Math.max(0, Math.min(100, Math.round((covered / target) * 100)));
    }

    let distanceLabel = "";
    let remainingNum = null;
    let remainingLabel = "距离目标";

    if (hasJoined) {
      if (Number.isFinite(covered) && Number.isFinite(target) && target > 0) {
        distanceLabel = "本月累计 " + covered + " / " + homeSummary.formatKm(target) + " 公里";
        const rawRemaining = Number.isFinite(resDist) && resDist >= 0 ? resDist : Math.max(0, target - covered);
        remainingNum = Math.max(0, Math.round(rawRemaining));
      } else {
        distanceLabel = isEnded ? "挑战已结束" : "距离结束还有 " + (Math.floor(days) + 1) + " 天";
      }
    } else {
      remainingLabel = "挑战目标";
      if (Number.isFinite(target) && target > 0) {
        remainingNum = Math.round(target);
        distanceLabel = isEnded ? "未参加 · 挑战已结束" : "未参加 · 目标 " + homeSummary.formatKm(target) + " 公里 (剩余 " + (Math.floor(days) + 1) + " 天)";
      } else {
        distanceLabel = isEnded ? "未参加 · 挑战已结束" : "未参加 · 距离结束还有 " + (Math.floor(days) + 1) + " 天";
      }
    }

    const ringAsset = "/images/redesign/challenge-ring-" + (hasJoined ? Math.round(percent / 5) * 5 : 0) + ".svg";

    this.setData({
      challengeItem: Object.assign({}, item, detail),
      challengePercent: percent,
      challengeProgressAvailable: hasJoined,
      challengeProgressWidth: percent + "%",
      challengeRingAsset: ringAsset,
      challengeDistanceLabel: distanceLabel,
      challengeRemaining: remainingNum,
      challengeRemainingLabel: remainingLabel
    });
  },
  toChallengeList: function () {
    wx.switchTab({ url: '../challenge/challenge' })
  },
  initHomeHeatmap: function (userId) {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    this._heatmapReqSeq = (this._heatmapReqSeq || 0) + 1;
    const reqSeq = this._heatmapReqSeq;

    this.setData({
      homeHeatmap: homeSummary.buildMonthHeatmap(curYear, curMonth, {}, now),
      homeHeatmapLoaded: false,
      monthDistance: userId > 0 ? null : "—",
      monthRunDays: userId > 0 ? null : "—",
      weekDistance: userId > 0 ? null : "—",
      monthSummaryLoaded: false,
      monthSummaryLoading: userId > 0,
      monthSummaryError: false,
      currentMonthNum: curMonth
    });
    if (!(userId > 0)) {
      return;
    }

    util.request("user/getMonthList", "POST", { user_id: userId }, "", (res) => {
      if (reqSeq !== this._heatmapReqSeq) return;
      if (userId !== app.globalData.userId || userId !== this.data.userId) return;

      const monthLoaded = Boolean(res && res.data && res.data.success && res.data.data);
      if (monthLoaded) {
        const parsed = homeSummary.parseMonthRecords(res.data.data, curYear, curMonth, now);
        const parsedWk = homeSummary.parseWeekRecords(res.data.data, now);
        const distFormatted = homeSummary.formatKm(parsed.totalDistance);
        const wkDistFormatted = homeSummary.formatKm(parsedWk.totalDistance);
        const prog = homeSummary.calculateProgress(parsed.totalDistance, this.data.monthTarget);
        const wkTarget = Number.isFinite(Number(this.data.monthTarget)) && Number(this.data.monthTarget) > 0 ? (Number(this.data.monthTarget) / 4) : this.data.weekTarget;
        const wkProg = homeSummary.calculateProgress(parsedWk.totalDistance, wkTarget);

        this.setData({
          homeHeatmap: homeSummary.buildMonthHeatmap(curYear, curMonth, parsed.dailyMap, now),
          homeHeatmapLoaded: true,
          monthDistance: distFormatted,
          monthRunDays: parsed.runDaysCount,
          weekDistance: wkDistFormatted,
          monthSummaryLoaded: true,
          monthSummaryLoading: false,
          monthSummaryError: false,
          monthPercent: this.data.monthGoalStatus === "ready" ? prog.percent : "—",
          monthProgressWidth: this.data.monthGoalStatus === "ready" ? prog.progressWidth : "0%",
          weekPercent: this.data.monthGoalStatus === "ready" ? wkProg.percent : "—",
          weekProgressWidth: this.data.monthGoalStatus === "ready" ? wkProg.progressWidth : "0%"
        });
      } else {
        this.setData({
          homeHeatmap: homeSummary.buildMonthHeatmap(curYear, curMonth, {}, now),
          homeHeatmapLoaded: false,
          monthSummaryLoaded: false,
          monthSummaryLoading: false,
          monthSummaryError: true,
          monthDistance: "—",
          monthRunDays: "—",
          monthPercent: "—",
          monthProgressWidth: "0%",
          weekDistance: "—",
          weekPercent: "—",
          weekProgressWidth: "0%"
        });
      }
    }, () => {
      if (reqSeq !== this._heatmapReqSeq) return;
      if (userId === app.globalData.userId && userId === this.data.userId) {
        this.setData({
          homeHeatmap: homeSummary.buildMonthHeatmap(curYear, curMonth, {}, now),
          homeHeatmapLoaded: false,
          monthSummaryLoaded: false,
          monthSummaryLoading: false,
          monthSummaryError: true,
          monthDistance: "—",
          monthRunDays: "—",
          monthPercent: "—",
          monthProgressWidth: "0%",
          weekDistance: "—",
          weekPercent: "—",
          weekProgressWidth: "0%"
        });
      }
    });
  },
  toChallengeDetail: function () {
    const item = this.data.challengeItem
    if (!item || !(item.acty_id || item.id)) return this.toChallengeList()
    wx.navigateTo({ url: '../challengedetail/challengedetail?id=' + (item.acty_id || item.id) })
  },
  toChallengeCard: function () {
    if (this.data.challengeItem) this.toChallengeDetail()
    else this.toChallengeList()
  },
  resetHomeStats: function () {
    this.setData({
      totalDistance: "0.0",
      statsLoaded: false,
      yearDistance: "0.0",
      yearLoaded: false,
      weekDistance: null,
      weekPercent: "—",
      weekProgressWidth: "0%",
      monthDistance: null,
      monthPercent: "—",
      monthProgressWidth: "0%",
      monthRunDays: null,
      monthSummaryLoaded: false,
      monthSummaryLoading: false,
      monthSummaryError: false
    })
  },
  loadHomeStats: function (userId) {
    if (!(userId > 0)) return this.resetHomeStats()
    this.resetHomeStats()
    util.request('user/getsportinfo', 'POST', { userId }, '', (res) => {
      if (!res.data || !res.data.success || !res.data.data || userId !== app.globalData.userId) return
      const info = res.data.data
      const total = Number(info.totalDistance)
      const month = Number(info.monthDistance)
      const yrFromInfo = info.year_count !== undefined && info.year_count !== null ? Number(info.year_count) : NaN
      const hasYr = Number.isFinite(yrFromInfo)
      this.setData({
        totalDistance: Number.isFinite(total) && info.totalDistance !== null && info.totalDistance !== '' ? total.toFixed(1) : '—',
        yearDistance: hasYr ? (Math.round(yrFromInfo * 10) / 10).toFixed(1) : this.data.yearDistance,
        yearLoaded: hasYr ? true : this.data.yearLoaded,
        statsLoaded: true
      })
    })

    const openId = wx.getStorageSync('openId') || app.globalData.openId || ''
    util.request('user/getuserlist', 'POST', {
      nickName: '',
      mobile: '',
      openId: openId,
      sort: 4,
      levelId: '',
      page: 1,
      size: 100
    }, '', (res) => {
      if (userId !== app.globalData.userId) return
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        const list = res.data.data
        const me = list.find((item) => String(item.id) === String(userId) || (openId && item.open_id === openId))
        if (me && me.year_count !== undefined && me.year_count !== null) {
          const yr = Number(me.year_count) || 0
          this.setData({
            yearDistance: (Math.round(yr * 10) / 10).toFixed(1),
            yearLoaded: true
          })
        }
      }
    })
  },
  loadHomeChallenge: function (userId) {
    const activeUserId = userId > 0 ? userId : 0;
    this._challengeReqSeq = (this._challengeReqSeq || 0) + 1;
    const reqSeq = this._challengeReqSeq;

    util.request("acty/getchallengeacty", "POST", { userId: activeUserId, type: "挑战", page: 1 }, "", (res) => {
      if (reqSeq !== this._challengeReqSeq) return;
      if (activeUserId !== (app.globalData.userId || 0) || activeUserId !== (this.data.userId || 0)) return;

      const list = res.data && res.data.success && Array.isArray(res.data.data) ? res.data.data : [];
      const item = pickClosestChallenge(list);
      if (!item) {
        this.setData({
          challengeItem: null,
          challengePercent: 0,
          challengeProgressAvailable: false,
          challengeProgressWidth: "0%",
          challengeRingAsset: "/images/redesign/challenge-ring-0.svg",
          challengeDistanceLabel: "",
          challengeRemaining: null,
          challengeRemainingLabel: "距离目标"
        });
        return;
      }

      const actyId = item.acty_id || item.id;
      util.request("acty/getdetail", "POST", { actyId: actyId, userId: activeUserId }, "", (detailRes) => {
        if (reqSeq !== this._challengeReqSeq) return;
        if (activeUserId !== (app.globalData.userId || 0) || activeUserId !== (this.data.userId || 0)) return;

        const detail = detailRes.data && detailRes.data.success && detailRes.data.data;
        if (detail) {
          const newId = Number(actyId || 0);
          const curId = this.data.challengeItem ? Number(this.data.challengeItem.acty_id || this.data.challengeItem.id || 0) : 0;
          if (newId >= curId) {
            this.applyCandidateDetailToChallengeCard(item, detail);
          }
        }
      });
    });
  },
  toUserCenter: function () {
    var openId = app.globalData.openId
    if (openId == '' || openId == undefined) {
      wx.showToast({
        title: '请先登录小程序！',
        icon: 'none'
      })
      return
    }
    wx.navigateTo({
      url: '../userinfor/userinfor',
    })
  },
  toActy: function () {
    wx.navigateTo({
      url: '../activitydetail/activitydetail?id=' + this.data.actyId,
    })
  },

  noPage: function () {
    wx.showToast({
      title: '「暂未开放」',
      icon: 'none',
      duration: 1500
    })
  },
  goheight: function (e) {
    var width = wx.getSystemInfoSync().windowWidth
    //获取可使用窗口宽度
    var imgheight = e.detail.height
    //获取图片实际高度
    var imgwidth = e.detail.width
    //获取图片实际宽度
    var height = width * imgheight / imgwidth + "px"
    //计算等比swiper高度
    this.setData({
      height: height
    })
  },
  getTips: function () {
    var that = this
    var userId = app.globalData.userId
    var data = {
      userId: userId
    }
    util.request('user/getTips', 'POST', data, '数据加载中 ...', (res) => {
      that.setData({
        myTip: res.data.tips
      })
    })
  },
  // //获取经纬度方法
  // getLocation: function () {
  //   var that = this
  //   wx.getLocation({
  //     type: 'wgs84',
  //     success: function (res) {
  //       var latitude = res.latitude
  //       var longitude = res.longitude
  //       console.log("lat:" + latitude + " lon:" + longitude);

  //       that.getCity(latitude, longitude);
  //     }
  //   })
  // },

  // //获取城市信息
  // getCity: function (latitude, longitude) {
  //   var that = this
  //   var url = "https://api.map.baidu.com/reverse_geocoding/v3/";
  //   var params = {
  //     ak: "wTFvQT4Z8C8A7vIkblCkE4SNrENGUjiT",
  //     output: "json",
  //     location: latitude + "," + longitude
  //   }
  //   wx.request({
  //     url: url,
  //     data: params,
  //     success: function (res) {
  //       console.log(res)

  //       var city = res.data.result.addressComponent.city;
  //       var district = res.data.result.addressComponent.district;
  //       var street = res.data.result.addressComponent.street;
  //       that.setData({
  //         city: city,
  //         district: district,
  //         street: street,
  //       })

  //       var descCity = city.substring(0, city.length - 1);
  //       that.getWeahter(descCity);
  //     },
  //     fail: function (res) {},
  //     complete: function (res) {},
  //   })
  // },

  //获取天气信息
  // getWeahter: function (city) {
  //   var that = this
  //   var url = "https://free-api.heweather.net/s6/weather"
  //   var params = {
  //     location: city,
  //     key: "97405f8168a04bd2b5c033c6d002f601"
  //   }
  //   wx.request({
  //     url: url,
  //     data: params,
  //     success: function (res) {
  //       console.log(res)
  //       var tmp = res.data.HeWeather6[0].now.tmp;
  //       var txt = res.data.HeWeather6[0].now.cond_txt;
  //       var code = res.data.HeWeather6[0].now.cond_code;
  //       var vis = res.data.HeWeather6[0].now.vis;
  //       var dir = res.data.HeWeather6[0].now.wind_dir;
  //       var sc = res.data.HeWeather6[0].now.wind_sc;
  //       var hum = res.data.HeWeather6[0].now.hum;
  //       var fl = res.data.HeWeather6[0].now.fl;
  //       var daily_forecast = res.data.HeWeather6[0].daily_forecast;
  //       var update_time = res.data.HeWeather6[0].update.loc;
  //       that.setData({
  //         tmp: tmp,
  //         txt: txt,
  //         code: code,
  //         vis: vis,
  //         dir: dir,
  //         sc: sc,
  //         hum: hum,
  //         fl: fl,
  //         daily_forecast: daily_forecast,
  //         update_time: update_time.substring(8, 10) + '日' + ' ' + update_time.substring(10)
  //       })
  //       that.getWeahterAir(city);
  //     },
  //     fail: function (res) {

  //     },
  //     complete: function (res) {},
  //   })
  // },
  // //获取空气质量
  // getWeahterAir: function (city) {
  //   var that = this
  //   var url = "https://free-api.heweather.net/s6/air"
  //   var params = {
  //     location: city,
  //     key: "97405f8168a04bd2b5c033c6d002f601"
  //   }
  //   wx.request({
  //     url: url,
  //     data: params,
  //     success: function (res) {
  //       console.log(res)
  //       var qlty = res.data.HeWeather6[0].air_now_city.qlty;
  //       that.setData({
  //         qlty: qlty,
  //       })
  //     },
  //     fail: function (res) {},
  //     complete: function (res) {},
  //   })
  // },
  timeOut: function () {
    var that = this
    if (that.data.show == true) {
      that.data.timer = setTimeout(function () {
        that.setData({
          show: false
        })
      }, 300000)
    }
  },
  getSerialDayColor: function (day) {
    if (day === null || day === undefined || day <= 0) return '#9aa69e'; // 未打卡/0天
    if (day <= 2) return '#5ec468';  // 1-2天：鲜嫩浅绿
    if (day <= 6) return '#28a745';  // 3-6天：生机绿
    if (day <= 13) return '#128238'; // 7-13天：坚持一周深绿
    if (day <= 29) return '#0a6136'; // 14-29天：连续两周森林深绿
    return '#04361e';               // 30天+：极深松玉墨绿
  },
  initDay: function (userId) {
    var that = this
    var data = {
      userId: userId
    }
    if (userId > 0) {
      util.request('user/getserialday', 'POST', data, '', (res) => {
        if (!res.data || !res.data.success || !res.data.data || userId !== app.globalData.userId) return
        const sDay = Number.isFinite(Number(res.data.data.serialDay)) ? Number(res.data.data.serialDay) : null
        that.setData({
          serialDay: sDay,
          serialDayColor: that.getSerialDayColor(sDay),
          hasClockOn: res.data.data.hasClockOn,
          clockTimes: res.data.data.clockTimes
        })
      })
    }
  },
  initUser: function (userId) {
    var that = this;
    var openId = app.globalData.openId
    if (userId > 0) {
      //已登录
      that.setData({
        userId: userId
      })
      var data = {
        id: userId,
        openId: openId
      }
      wx.showLoading({
        title: '加载中',
        mask: true
      })
      util.request('/user/getuserinfo', 'POST', data, '拼命加载中 ...', (res) => {
        if (res.data.success) {
          that.setData({
            avatarUrl: res.data.data.header_url,
            nickName: res.data.data.nick_name,
            score: res.data.data.score,
            level: res.data.data.level,
            userId: res.data.data.id,
            duty: res.data.data.duty
          })
          if (res.data.data.duty == '团长,管理员' || res.data.data.duty == '管理员,团长') {
            that.setData({
              duty: '管理员/团长',
            })
          }
          wx.hideLoading({
            success: (res) => {},
          })
        } else {
          app.globalData.userId = 0;
          that.setData({
            userId: 0
          })
          wx.clearStorageSync();
          wx.hideLoading({
            success: (res) => {},
          })
        }
      })
    } else {
      app.globalData.userId = 0;
      that.setData({
        userId: 0
      })
      wx.clearStorageSync();
    }
  },
  initRecord: function () {
    this.setData({ recordLoading: true, recordError: false })
    const data = {
      userId: 0,
      actyId: 0,
      address: '',
      actyIds: -1,
      page: 1
    }
    util.request('acty/getsports', 'POST', data, '', (res) => {
      if (res.data && res.data.success && Array.isArray(res.data.data)) {
        const filtered = res.data.data.filter(function (item) {
          if (!item) return false
          if (Number(item.state) === 2) return false
          const dist = Number(item.distance)
          return Number.isFinite(dist) && dist > 0
        })
        const seenUsers = {}
        const records = []
        for (let i = 0; i < filtered.length && records.length < 3; i++) {
          const record = filtered[i]
          const userKey = record.user_id || record.openId || record.name || record.nick_name || ('u_' + i)
          if (seenUsers[userKey]) continue
          seenUsers[userKey] = true
          records.push(Object.assign({}, record, {
            displayAvatar: record.header_url || '/images/default.png',
            displayName: record.name || record.nick_name || '跑友',
            displayDate: formatFeedDate(record.create_time || record.create_time_str),
            displayDistance: Number(record.distance).toFixed(2),
            displaySpeed: record.speed || '—',
            monthCheckInTimes: 1
          }))
        }
        const now = new Date()
        const curMonthKey = now.getFullYear() + '-' + (now.getMonth() + 1 < 10 ? '0' + (now.getMonth() + 1) : (now.getMonth() + 1))
        this.setData({ recordList: records, recordLoading: false, recordError: false })

        // 异步获取每位跑者本月的实际打卡次数
        records.forEach((rec, idx) => {
          if (!rec.user_id) return
          util.request('user/getMonthList', 'POST', { user_id: rec.user_id }, '', (mRes) => {
            if (mRes && mRes.data && mRes.data.success && mRes.data.data) {
              const mData = mRes.data.data[curMonthKey] || []
              const times = mData.reduce((acc, d) => acc + (Number(d.sport_times) || (Number(d.sport_total) > 0 ? 1 : 0)), 0)
              const count = times > 0 ? times : 1
              const currentList = (this.data.recordList || []).slice()
              if (currentList[idx] && currentList[idx].user_id === rec.user_id) {
                currentList[idx] = Object.assign({}, currentList[idx], { monthCheckInTimes: count })
                this.setData({ recordList: currentList })
              }
            }
          })
        })
      } else {
        this.setData({ recordList: [], recordLoading: false, recordError: true })
      }
    }, () => {
      this.setData({ recordList: [], recordLoading: false, recordError: true })
    })
  },
  getLatestActivity: function () {
    var that = this
    var data = {
      type: '团跑'
    }
    util.request('acty/getlastacty', 'POST', data, '拼命加载中 ...', (res) => {
      if (res.data.success) {
        that.setData({
          acty_name: res.data.data.acty_name,
          acty_img: res.data.data.acty_img,
          actyId: res.data.data.id
        })
      }
    })
  },
  openLogin: function () {
    var userId = app.globalData.userId
    if (userId < 1 || userId == undefined) {
      util.showLogin((res) => {
        var data = {
          code: res.code,
          encryptedData: "",
          iv: ""
        }
        //取用户的openid
        util.request('user/wxlogin', 'POST', data, '登录中...', (loginRes) => {
          var regData = {
            openId: loginRes.data.data.openid,
            imgUrl: res.userInfo.avatarUrl,
            nickName: res.userInfo.nickName,
            sex: res.userInfo.gender,
            unionid: loginRes.data.data.unionid
          }
          util.request('user/wxregister', 'POST', regData, '', (regRes) => {
            app.globalData.userId = regRes.data.UserId
            app.globalData.openId = regData.openId
            wx.setStorageSync('userId', regRes.data.UserId)
            wx.setStorageSync('openId', regData.openId)
            this.onShow()
          })
        })
      })
    }
  },
  toList: function () {
    wx.navigateTo({
      url: '../memberdata/memberdata'
    })
  },
  toRankingByType: function (e) {
    const type = (e && e.currentTarget && e.currentTarget.dataset && e.currentTarget.dataset.type) || 'month'
    wx.navigateTo({
      url: '../memberdata/memberdata?type=' + type
    })
  },
  popShow: function (e) {
    const img = e.currentTarget.dataset.img
    if (!img) {
      wx.showToast({ title: '这条记录暂无凭证图片', icon: 'none' })
      return
    }
    wx.previewImage({
      current: img,
      urls: [img],
      fail: () => wx.showToast({ title: '凭证图片暂时无法打开', icon: 'none' })
    })
  },
  onLoad() {
    // 开启转发功能
    wx.showShareMenu({
      withShareTicket: true
    })
    this.getTips()
    this.setTodayLabel()
    const menu = wx.getMenuButtonBoundingClientRect ? wx.getMenuButtonBoundingClientRect() : null
    const system = wx.getSystemInfoSync()
    this.setData({ safeTop: Math.max(30, Math.round((system.statusBarHeight || (menu && menu.top) || 44) / 2) + 6) })
    //this.getLocation()
    //this.setPhoto()
    var that = this;
    //获取系统信息

    wx.getSystemInfo({
      success: (function (res) {
        that.setData({
          systemInfo: res
        });
      })
    })
  },
  onPullDownRefresh: function () {
    this.setData({
      show: true
    })
    var userId = app.globalData.userId
    this.loadHomeStats(userId)
    this.loadMonthChallengeGoal(userId)
    this.loadHomeChallenge(userId)
    this.initHomeHeatmap(userId)
    this.initRecord()
    wx.stopPullDownRefresh()
    this.timeOut()
  },
  onShow: function () {
    wx.hideTabBar();
    app.editTabbar();
    var userId = app.globalData.userId
    this.setData({
      userId: userId,
      serialDay: null
    })
    this.setTodayLabel()
    this.initUser(userId)
    this.initDay(userId)
    this.loadHomeStats(userId)
    this.loadMonthChallengeGoal(userId)
    this.loadHomeChallenge(userId)
    this.initHomeHeatmap(userId)
    this.initRecord()
  },
  myLogin: function() {
    var that = this
    if (userId < 1 || userId == undefined) {
      wx.showModal({
        content: '请先登录小程序！',
        success(res) {
          if (res.confirm) {
            util.showLogin((res) => {
              var data = {
                code: res.code,
                encryptedData: "",
                iv: ""
              }
              //取用户的openid
              util.request('user/wxlogin', 'POST', data, '登录中...', (loginRes) => {
                var regData = {
                  openId: loginRes.data.data.openid,
                  imgUrl: res.userInfo.avatarUrl,
                  nickName: res.userInfo.nickName,
                  sex: res.userInfo.gender,
                  unionid: loginRes.data.data.unionid
                }
                util.request('user/wxregister', 'POST', regData, '', (regRes) => {
                  app.globalData.userId = regRes.data.UserId
                  app.globalData.openId = regData.openId
                  wx.setStorageSync('userId', regRes.data.UserId)
                  wx.setStorageSync('openId', regData.openId)
                  var data = {
                    id: regRes.data.UserId,
                    openId: regData.openId
                  }
                  that.getTips()
                  that.initDay(regRes.data.UserId)
                  wx.showLoading({
                    title: '加载中',
                    mask: true
                  })
                  util.request('/user/getuserinfo', 'POST', data, '拼命加载中 ...', (res) => {
                    if (res.data.success) {
                      that.setData({
                        avatarUrl: res.data.data.header_url,
                        nickName: res.data.data.nick_name,
                        score: res.data.data.score,
                        level: res.data.data.level,
                        userId: res.data.data.id,
                        duty: res.data.data.duty
                      })
                      if (res.data.data.duty == '团长,管理员' || res.data.data.duty == '管理员,团长') {
                        that.setData({
                          duty: '管理员/团长',
                        })
                      }
                      that.loadHomeStats(res.data.data.id)
                      that.loadMonthChallengeGoal(res.data.data.id)
                      that.loadHomeChallenge(res.data.data.id)
                      that.initHomeHeatmap(res.data.data.id)
                      wx.hideLoading({
                        success: (res) => {},
                      })
                    } else {
                      app.globalData.userId = 0;
                      that.setData({
                        userId: 0
                      })
                      wx.clearStorageSync();
                      wx.hideLoading({
                        success: (res) => {},
                      })
                    }
                  })
                })
              })
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
  },
  onHide: function () {},
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: '您的好友' + this.data.nickName + '邀请您加入悦跑团～',
      // path: '/pages/index/index'
    }
  }
})

// pages/challengedetail/challengedetail.js
const util = require('../../utils/util.js')
const { toDisplayMemberLevel } = require('../../utils/member-level.js')
const { addProfileBadges } = require('../../utils/profile-badges.js')
const app = getApp()

function numberOrNull(value) {
  if (value === undefined || value === null || value === '' || typeof value === 'boolean') return null
  const number = Number(value)
  return isFinite(number) ? number : null
}

function shortTime(value) {
  return typeof value === 'string' && value ? value.slice(0, 16) : ''
}

function toFixed(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return '0.00'
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
    actyId: '',
    actyImg: '',
    actyName: '',
    acty_type: '',
    actyState: null,
    statusText: '',
    daysText: '',
    isEnded: false,
    hasClickon: null,
    viewingOther: false,
    userId: 0,
    userid: undefined,
    nickName: '',
    header_url: '',
    has_name: 0,
    has_mobile: 0,
    distance: null,
    minimumDistance: null,
    target: null,
    hasDistance: null,
    finalDis: null,
    per: 0,
    progressAvailable: false,
    isSuccess: false,
    isFailure: false,
    canJoin: false,
    canEditGoal: false,
    joins: null,
    participantCountText: '—',
    actyInList: [],
    memberList: [],
    levelList: [
      { label: '全部', value: '' },
      { label: 'SVip', value: 'VIP' },
      { label: 'Vip', value: '普通' },
      { label: 'PVip', value: '非会员' }
    ],
    activeLevelIndex: 0,
    sortOrder: 1, // 1: 降序, 0: 升序
    totalMemberCount: 0,
    participantsLoading: false,
    participantsError: false,
    ltyList: [],
    lotteryLoading: false,
    lotteryError: false,
    startTime: '',
    endTime: '',
    remark: '',
    score: null,
    rewardUnit: '',
    changeModal: false,
    detailLoading: true,
    detailLoaded: false,
    detailError: ''
  },

  openMyPage: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },

  onLoad: function (options) {
    const userId = app.globalData.userId || 0
    const userid = options.userid
    this.setData({
      actyId: options.id || '',
      userid: userid,
      userId: userId,
      viewingOther: userid !== undefined && userid !== '' && String(userid) !== String(userId),
      has_name: options.has_name || 0,
      has_mobile: options.has_mobile || 0,
      acty_type: options.acty_type || ''
    })
    this.loadViewerProfile()
    if (userid !== undefined && userid !== '' && String(userid) !== String(userId)) {
      util.request('user/get', 'POST', { id: userid }, '', (res) => {
        const profile = res.data && res.data.success && res.data.data
        if (profile) this.setData({ header_url: profile.header_url || '' })
      })
    }
  },

  onShow: function () {
    this.setData({ userId: app.globalData.userId || 0 })
    this.initChallenge(this.data.actyId)
  },

  loadViewerProfile: function () {
    const userId = app.globalData.userId
    if (!(numberOrNull(userId) > 0)) return
    util.request('user/get', 'POST', { id: userId }, '', (res) => {
      const profile = res.data && res.data.success && res.data.data
      if (profile) this.setData({ nickName: profile.nick_name || '' })
    })
  },

  back: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () { wx.switchTab({ url: '/pages/challenge/challenge' }) }
    })
  },

  viewMine: function () {
    if (!this.data.actyId) return
    wx.navigateTo({ url: '../challengedetail/challengedetail?id=' + encodeURIComponent(this.data.actyId) })
  },

  initChallenge: function (id, afterLoaded) {
    if (!id) {
      this.setData({ detailLoading: false, detailLoaded: false, detailError: '缺少挑战编号' })
      return
    }
    const viewedUserId = this.data.userid !== undefined && this.data.userid !== ''
      ? this.data.userid : (app.globalData.userId || 0)
    this.setData({
      detailLoading: true,
      detailLoaded: false,
      detailError: '',
      actyInList: [],
      memberList: [],
      ltyList: [],
      participantsError: false,
      lotteryError: false
    })
    util.request('acty/getdetail', 'POST', { actyId: id, userId: viewedUserId }, '数据加载中 ...', (res) => {
      const detail = res.data && res.data.success && res.data.data
      if (!detail) {
        this.setData({ detailLoading: false, detailError: (res.data && res.data.error) || '挑战详情暂时无法加载' })
        return
      }

      const state = numberOrNull(detail.acty_state)
      const days = numberOrNull(detail.days)
      const joined = numberOrNull(detail.has_clickon)
      const minimum = numberOrNull(detail.distance)
      const target = numberOrNull(detail.target)
      const covered = numberOrNull(detail.hasDistance)
      const remaining = numberOrNull(detail.resDistance)
      const joins = numberOrNull(detail.joins)
      const score = numberOrNull(detail.snum)
      const isEnded = state === 0 || (days !== null && days < 0)
      const isChallenge = typeof detail.acty_type === 'string' && detail.acty_type !== '' && detail.acty_type !== 'V挑战'
      const progressAvailable = joined === 1 && target !== null && target > 0 && covered !== null && covered >= 0
      const per = progressAvailable ? this.GetPercent(covered, target) : 0
      const canJoin = isChallenge && !this.data.viewingOther && !isEnded && state !== null && state > 0 && joined === 0 && minimum !== null && minimum > 0
      const canEditGoal = canJoin && state === 2
      let statusText = '活动状态待确认'
      if (isEnded) statusText = '已结束'
      else if (state === 2) statusText = '进行中'
      else if (state === 1) statusText = '即将开始'
      else if (state !== null && state > 0) statusText = '可参与'

      this.setData({
        actyImg: typeof detail.acty_img === 'string' ? detail.acty_img : '',
        actyName: detail.acty_name || '',
        acty_type: detail.acty_type || '',
        actyState: state,
        statusText: statusText,
        daysText: !isEnded && days !== null && days >= 0 ? String(Math.floor(days) + 1) : '',
        isEnded: isEnded,
        hasClickon: joined,
        minimumDistance: minimum !== null && minimum > 0 ? Math.ceil(minimum) : null,
        distance: minimum !== null && minimum > 0 ? Math.ceil(minimum) : null,
        target: target !== null && target > 0 ? Math.round(target) : null,
        hasDistance: covered !== null && covered >= 0 ? covered : null,
        finalDis: progressAvailable ? Math.max(0, Math.round(remaining !== null ? remaining : target - covered)) : null,
        per: per,
        progressAvailable: progressAvailable,
        isSuccess: progressAvailable && per >= 100,
        isFailure: progressAvailable && isEnded && per < 100,
        canJoin: canJoin,
        canEditGoal: canEditGoal,
        joins: joins !== null && joins >= 0 ? joins : null,
        participantCountText: joins !== null && joins >= 0 ? String(joins) : '—',
        has_name: detail.has_name === undefined || detail.has_name === null ? 0 : detail.has_name,
        has_mobile: detail.has_mobile === undefined || detail.has_mobile === null ? 0 : detail.has_mobile,
        startTime: shortTime(detail.start_timestr),
        endTime: shortTime(detail.end_timestr),
        remark: typeof detail.remark === 'string' ? detail.remark : '',
        score: score !== null && score > 0 ? score : null,
        rewardUnit: Number(detail.stype) === 0 ? '积分' : Number(detail.stype) === 1 ? '小花儿' : '',
        detailLoading: false,
        detailLoaded: true,
        detailError: ''
      }, () => {
        if (detail.acty_name) wx.setNavigationBarTitle({ title: detail.acty_name })
        this.loadParticipants()
        this.loadLottery()
        if (typeof afterLoaded === 'function') afterLoaded(this.data.canJoin)
      })
    }, () => {
      this.setData({ detailLoading: false, detailError: '网络错误，请稍后重试' })
    })
  },

  retryLoad: function () { this.initChallenge(this.data.actyId) },

  chooseLevel: function (e) {
    const index = Number(e.currentTarget.dataset.index)
    if (index === this.data.activeLevelIndex) return
    this.setData({ activeLevelIndex: index })
    this.loadParticipants()
  },

  toggleSort: function () {
    const nextOrder = this.data.sortOrder === 1 ? 0 : 1
    this.setData({ sortOrder: nextOrder })
    this.loadParticipants()
  },

  toUserDetail: function (e) {
    const id = e.currentTarget.dataset.userid
    if (!id) return
    const currentUserId = app.globalData.userId
    if (currentUserId && String(id) === String(currentUserId)) {
      wx.switchTab({ url: '../mydata/mydata' })
    } else {
      wx.navigateTo({ url: '../othersdata/othersdata?id=' + id })
    }
  },

  loadParticipants: function (cb) {
    const viewedUserId = this.data.userid !== undefined && this.data.userid !== ''
      ? this.data.userid : (app.globalData.userId || 0)
    const levelStr = this.data.levelList[this.data.activeLevelIndex].value
    const data = {
      actyId: this.data.actyId,
      userId: viewedUserId,
      userName: '',
      mobile: '',
      level: levelStr,
      distance: this.data.sortOrder
    }
    this.setData({ participantsLoading: true, participantsError: false })
    util.request('acty/getactyuser', 'POST', data, '', (res) => {
      const valid = !!(res.data && res.data.success && Array.isArray(res.data.data))
      const list = valid ? res.data.data : []
      const processed = list.map((item, idx) => {
        const finish = Number(item.finish_distance) || 0
        const rawTarget = Number(item.distance) || 0
        const target = Math.round(rawTarget)
        const percent = calcPercent(finish, target)
        return Object.assign(addProfileBadges(item), {
          levelLabel: toDisplayMemberLevel(item.level),
          displayFinish: toFixed(finish),
          displayTarget: String(target),
          percent: percent,
          isCompleted: finish >= target && target > 0,
          rankNum: idx + 1
        })
      })
      this.setData({
        actyInList: list,
        memberList: processed,
        totalMemberCount: processed.length,
        participantCountText: this.data.joins !== null ? String(this.data.joins) : valid ? String(list.length) : '—',
        participantsLoading: false,
        participantsError: !valid
      })
      if (typeof cb === 'function') cb()
    }, () => {
      this.setData({
        actyInList: [],
        memberList: [],
        totalMemberCount: 0,
        participantsLoading: false,
        participantsError: true
      })
      if (typeof cb === 'function') cb()
    })
  },

  loadLottery: function () {
    this.setData({ lotteryLoading: true, lotteryError: false })
    util.request('acty/getluckdrawlist', 'POST', { actyId: this.data.actyId }, '', (res) => {
      this.setData({
        ltyList: res.data && res.data.success && Array.isArray(res.data.data) ? res.data.data : [],
        lotteryLoading: false,
        lotteryError: !(res.data && res.data.success)
      })
    }, () => this.setData({ lotteryLoading: false, lotteryError: true }))
  },

  toLty: function (e) {
    const id = e.currentTarget.dataset.id
    if (id !== undefined && id !== null && id !== '') {
      wx.navigateTo({ url: '../lotterydetail/lotterydetail?id=' + encodeURIComponent(id) })
    }
  },

  GetPercent: function (num, total) {
    const covered = numberOrNull(num)
    const target = numberOrNull(total)
    if (covered === null || target === null || target <= 0) return 0
    return Math.min(100, Math.max(0, Math.round(covered / target * 10000) / 100))
  },

  changeIpt: function () {
    if (this.data.canEditGoal) this.setData({ changeModal: true })
  },

  onConfirm: function (e) {
    if (!this.data.canEditGoal) return
    const raw = String((e.detail.value && e.detail.value.newDistance) || '').trim()
    const value = /^\d+$/.test(raw) ? numberOrNull(raw) : null
    if (value === null || value <= 0) {
      wx.showToast({ title: '目标需为整数公里数', icon: 'none' })
      return
    }
    if (this.data.distance !== null && value < this.data.distance) {
      wx.showToast({ title: '目标不能低于当前挑战公里数', icon: 'none' })
      return
    }
    this.setData({ distance: value, changeModal: false })
  },

  onCancel: function () { this.setData({ changeModal: false }) },

  openLogin: function (continueToJoin) {
    if (numberOrNull(app.globalData.userId) > 0) return
    util.showLogin((res) => {
      util.request('user/wxlogin', 'POST', { code: res.code, encryptedData: '', iv: '' }, '登录中...', (loginRes) => {
        const loginData = loginRes.data && loginRes.data.data
        if (!loginData || !loginData.openid || !res.userInfo) {
          wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
          return
        }
        const regData = {
          openId: loginData.openid,
          imgUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName,
          sex: res.userInfo.gender,
          unionid: loginData.unionid
        }
        util.request('user/wxregister', 'POST', regData, '', (regRes) => {
          const newUserId = numberOrNull(regRes.data && regRes.data.UserId)
          if (!(newUserId > 0)) {
            wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
            return
          }
          app.globalData.userId = newUserId
          app.globalData.openId = regData.openId
          wx.setStorageSync('userId', newUserId)
          wx.setStorageSync('openId', regData.openId)
          this.setData({ userId: newUserId, nickName: regData.nickName || '' })
          this.initChallenge(this.data.actyId, (canJoin) => {
            if (continueToJoin && canJoin) this.goSignIn()
          })
        })
      })
    })
  },

  goSignIn: function () {
    if (!this.data.canJoin || !(numberOrNull(app.globalData.userId) > 0)) return
    const data = this.data
    wx.navigateTo({
      url: '../signin/signin?id=' + encodeURIComponent(data.actyId) +
        '&has_name=' + encodeURIComponent(data.has_name) +
        '&has_mobile=' + encodeURIComponent(data.has_mobile) +
        '&target=' + encodeURIComponent(data.distance) +
        '&acty_type=' + encodeURIComponent(data.acty_type)
    })
  },

  actyIn: function () {
    if (!this.data.canJoin) return
    if (!(numberOrNull(app.globalData.userId) > 0)) {
      this.openLogin(true)
      return
    }
    this.goSignIn()
  },

  onShareAppMessage: function () {
    const title = (this.data.nickName ? this.data.nickName + '邀请你参加' : '微跑团邀请你参加') +
      '挑战#' + (this.data.actyName || '跑步挑战') + '#，喊你快来挑战～'
    const share = {
      title: title,
      path: '/pages/challengedetail/challengedetail?id=' + encodeURIComponent(this.data.actyId)
    }
    if (this.data.actyImg) share.imageUrl = this.data.actyImg
    return share
  }
})

// pages/activitydetail/activitydetail.js
const util = require('../../utils/util.js')
const { toDisplayMemberLevel } = require('../../utils/member-level.js')
const { addProfileBadges } = require('../../utils/profile-badges.js')
// 获取应用实例
const app = getApp()
const DEFAULT_GROUP_COVER = '/images/redesign/group-run-default-cover.jpg'

function toFixed2(num) {
  const n = Number(num)
  if (!Number.isFinite(n)) return '0.00'
  return (Math.round(n * 100) / 100).toFixed(2)
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    contentTop: 96,
    activityList: [],
    avastars: [],
    memberList: [],
    actyId: 0,
    actyIn: 0,
    allDistance: 0,
    allNum: 0,
    clocked: '打卡',
    signed: '报名',
    clickOn: 0,
    signIn: 0,
    has_clickon: 0,
    has_sign: 0,
    has_name: '',
    has_mobile: '',
    signOpacity: 1,
    clockOpacity: 1,
    ltyList: [],
    distance: 0,
    acty_name: '',
    nickName: '',
    page: 1,
    actyImg: [],
    showBtn: false,
    myAddress: '',
    showSign: false,
    signTrue: true,
    loading: true,
    loadError: false,
    dataPanel: 'results',
    statsLoading: false,
    statsError: false,
    statsLoaded: false,
    memberLoading: false,
    memberError: false,
    memberLoaded: false,
    dataList: [],
    actyMember: [],
    actyMemberLoading: false,
    actyMemberLoaded: false,
    actyMemberError: false,
    logList: [],
    myRecord: null,
    myId: 0,
    logPage: 1,
    logHasMore: true,
    logLoading: false,
    logLoaded: false,
    logError: false
  },
  switchDataPanel: function (event) {
    var panel = event && event.currentTarget && event.currentTarget.dataset && event.currentTarget.dataset.panel
    if (panel !== 'results' && panel !== 'members') return
    if (panel !== this.data.dataPanel) this.setData({ dataPanel: panel })
  },
  openMyPage: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },
  initLimit: function(){
    var userId = app.globalData.userId
    if (!userId || userId <= 0) return
    var data = { 
      id : userId
    }
    util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        this.setData({
          myAddress: (res.data.data && res.data.data.address) || ''
        })
      }
    })
  },
  //去报名
  signIn: function(){
    if (this.data.loading || this.data.loadError || this.data.state === '已结束' || !this.data.signTrue) return
    var userId = app.globalData.userId
    if (!userId || userId <= 0) {
      this.openLogin()
      return
    }
    var adrr = this.data.region || ''
    var myadrr = (this.data.myAddress || '').trim()
    if (!adrr || !myadrr || adrr.indexOf(myadrr) > -1) {
      wx.navigateTo({
        url: '../signin/signin?id=' + this.data.actyId + '&has_name=' + this.data.has_name + '&has_mobile=' + this.data.has_mobile + '&target=0&acty_type=' + encodeURIComponent(this.data.acty_type || '团跑')
      })
    } else {
      wx.showToast({
        title: myadrr ? '地区暂不支持' : '请先完善所在地区',
        icon: 'none'
      })
    }
  },
  //取消报名
  cancelSign: function(){
    var that = this
    if (this.data.loading || this.data.loadError || this.data.state === '已结束' || this.data.signTrue) return
    var userId = app.globalData.userId
    if (!userId || userId <= 0) {
      this.openLogin()
      return
    }
    wx.showModal({
      title: '是否确定取消报名？',
      success: function (res) {
        if (!res.confirm) return
        util.request('acty/cancelacty', 'POST', {
          actyId: that.data.actyId,
          userId: userId
        }, '数据加载中 ...', (resp) => {
          if (resp && resp.data && resp.data.success) {
            wx.showToast({ title: '已取消报名', icon: 'none', duration: 1500 })
            that.setData({ signTrue: true, has_clickon: 0 })
            that.initActyDetail(that.data.actyId)
          } else {
            wx.showToast({
              title: (resp && resp.data && resp.data.error) || '取消失败，请稍后再试',
              icon: 'none',
              duration: 1500
            })
          }
        })
      }
    })
  },
  openLogin: function () {
    util.showLogin((profile) => {
      if (!profile || !profile.code || !profile.userInfo) return
      util.request('user/wxlogin', 'POST', { code: profile.code, encryptedData: '', iv: '' }, '登录中...', (loginRes) => {
        var loginData = loginRes.data && loginRes.data.data
        if (!loginData || !loginData.openid) {
          wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
          return
        }
        var regData = {
          openId: loginData.openid,
          imgUrl: profile.userInfo.avatarUrl,
          nickName: profile.userInfo.nickName,
          sex: profile.userInfo.gender,
          unionid: loginData.unionid
        }
        util.request('user/wxregister', 'POST', regData, '', (regRes) => {
          var newUserId = Number(regRes.data && regRes.data.UserId)
          if (!(newUserId > 0)) {
            wx.showToast({ title: '登录失败，请稍后重试', icon: 'none' })
            return
          }
          app.globalData.userId = newUserId
          app.globalData.openId = regData.openId
          wx.setStorageSync('userId', newUserId)
          wx.setStorageSync('openId', regData.openId)
          this.setData({ userId: newUserId, nickName: regData.nickName || '' })
          this.initLimit()
          this.initActyDetail(this.data.actyId)
          wx.showToast({ title: '登录成功，请继续报名', icon: 'none' })
        })
      })
    })
  },
  retryLoad: function () {
    this.initActyDetail(this.data.actyId)
    this.getactyimgs()
    this.initActyIn()
    this.initLimit()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var contentTop = this.data.contentTop
    try {
      if (typeof wx.getSystemInfoSync === 'function') {
        var systemInfo = wx.getSystemInfoSync()
        var statusBarHeight = systemInfo && systemInfo.statusBarHeight
        if (Number.isFinite(statusBarHeight) && statusBarHeight >= 0) {
          contentTop = statusBarHeight + 6 + 32 + 20
        }
      }
    } catch (error) { /* 保留默认安全间距，避免设备 API 异常阻断数据加载。 */ }
    try {
      if (typeof wx.getMenuButtonBoundingClientRect === 'function') {
        var menu = wx.getMenuButtonBoundingClientRect()
        var menuBottom = menu && menu.bottom
        if ((!Number.isFinite(menuBottom) || menuBottom <= 0) && menu &&
            Number.isFinite(menu.top) && menu.top >= 0 && Number.isFinite(menu.height) && menu.height > 0) {
          menuBottom = menu.top + menu.height
        }
        if (Number.isFinite(menuBottom) && menuBottom > 0) contentTop = menuBottom + 20
      }
    } catch (error) { /* 胶囊位置不可用时采用状态栏回退值。 */ }
    var id = options.id
    var userid = options.userid
    var userId = app.globalData.userId
    this.setData({
      contentTop: Number.isFinite(contentTop) ? contentTop : 96,
      actyId: id,
      userId: userId,
      userid: userid,
      myId: userId || 0
    })
    if (userId && userId > 0) {
      util.request('user/get', 'POST', { id: userId }, '数据加载中 ...', (res)=>{
        if(res.data && res.data.success && res.data.data){
          this.setData({ nickName: res.data.data.nick_name || '' })
        }
      })
    }
    this.initActyIn()
    this.getactyimgs()
    this.initLimit()
    this.initActyDetail(id)
    this.fetchSportLog(true)
  },
  // 活动成绩榜：分页拉取实跑打卡记录
  fetchSportLog: function (reset, cb) {
    if (this.data.logLoading && !reset) return
    if (!reset && !this.data.logHasMore) return
    var page = reset ? 1 : this.data.logPage
    var requestId = (this._logRequestId || 0) + 1
    this._logRequestId = requestId
    this.setData({ logLoading: true, logError: false })
    if (reset) this.setData({ myRecord: null })
    var fail = () => {
      if (requestId !== this._logRequestId) return
      // 保留已加载的成绩及失败页码，重试继续请求同一页。
      this._logRetryReset = reset
      this.setData({ logLoading: false, logLoaded: true, logError: true })
      if (typeof cb === 'function') cb()
    }
    util.request('acty/getsportlog', 'POST', { actyId: this.data.actyId, page: page }, '', (res) => {
      if (requestId !== this._logRequestId) return
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        var raw = res.data.data
        var myId = this.data.myId
        var processed = raw.map(function (item, idx) {
          return Object.assign(addProfileBadges(item), {
            rankNum: (page - 1) * 15 + idx + 1,
            levelLabel: toDisplayMemberLevel(item.level),
            displayDistance: toFixed2(item.distance),
            isMe: myId > 0 && String(item.user_id) === String(myId)
          })
        })
        var combined = reset ? processed : this.data.logList.concat(processed)
        var myRecord = null
        for (var i = 0; i < combined.length; i++) {
          if (combined[i].isMe) { myRecord = combined[i]; break }
        }
        this._logRetryReset = false
        this.setData({
          logList: combined,
          myRecord: myRecord,
          logPage: page + 1,
          logHasMore: raw.length >= 15,
          logLoading: false,
          logLoaded: true,
          logError: false
        })
      } else {
        const responseData = res && res.data
        const responseText = responseData
          ? [responseData.error, responseData.msg, responseData.message].filter(Boolean).join(' ')
          : ''
        const hasExplicitEmptyText = /暂无.*(?:打卡|成绩|记录|数据)|(?:没有|无)(?:人)?(?:打卡(?:记录)?|跑步成绩|成绩数据|记录)/.test(responseText)
        const noRecords = Boolean(responseData && responseData.success && (Array.isArray(responseData.data) && responseData.data.length === 0)) || hasExplicitEmptyText
        if (noRecords) {
          // 接口明确返回无记录时按空列表展示，避免误显示为加载失败
          this._logRetryReset = false
          this.setData({
            logList: reset ? [] : this.data.logList,
            myRecord: null,
            logHasMore: false,
            logLoading: false,
            logLoaded: true,
            logError: false
          })
          if (typeof cb === 'function') cb()
          return
        }
        fail()
        return
      }
      if (typeof cb === 'function') cb()
    }, fail)
  },
  loadMoreLogs: function () {
    if (this.data.dataPanel === 'results' && this.data.logHasMore && !this.data.logLoading && !this.data.logError) {
      this.fetchSportLog(false)
    }
  },
  retryLogs: function () {
    if (this.data.logLoading) return
    this.fetchSportLog(this._logRetryReset || !this.data.logLoaded || this.data.logPage === 1)
  },
  onReachBottom: function () {
    this.loadMoreLogs()
  },
  onPullDownRefresh: function () {
    this.retryLoad()
    this.fetchSportLog(true, function () {
      wx.stopPullDownRefresh()
    })
  },
  getactyimgs: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        const list = Array.isArray(res.data.data) ? res.data.data : []
        that.setData({
          actyImg: list
        })
        // 如果活动后上传了合照，则优先调用第一张合照作为封面展示
        if (list.length > 0 && list[0].img_url) {
          that.setData({
            acty_img: list[0].img_url
          })
        }
      }
    })
  },
  
  initActyDetail: function(id){
    if (!id) {
      this.setData({ loading: false, loadError: true })
      return
    }
    var that = this
    var userId = app.globalData.userId
    // 获取活动详情
    if(that.data.userid==undefined){
      var data = {
        actyId: id,
        userId: userId
      }
    } else {
      var data = {
        actyId: id,
        userId: that.data.userid
      }
    }
    this.setData({ loading: true, loadError: false })
    this.setData({
      statsLoaded: false, statsLoading: true, statsError: false,
      memberLoaded: false, memberLoading: true, memberError: false
    })
    util.request('acty/getdetail', 'POST', data, '数据加载中 ...', (res)=>{
      if(res && res.data && res.data.success && res.data.data){
        var allData = res.data.data
        var createTime = (allData.start_timestr || '').substring(0, 16)
        var endTime = (allData.end_timestr || '').substring(11, 16)
        var state = allData.acty_state
        var createTime1 = createTime ? util.dislodgeZero(createTime) : ''
        var endTime1 = endTime ? util.dislodgeZero(endTime) : ''
        // 封面图降级：如果有合照已先载入则优先保留合照封面，否则使用活动封面或默认4:3团跑封面
        var currentCover = this.data.acty_img
        if (!currentCover || currentCover === DEFAULT_GROUP_COVER) {
          currentCover = allData.acty_img || DEFAULT_GROUP_COVER
        }
        this.setData({
          acty_img: currentCover,
          state: state == 0 ? '已结束' : state,
          acty_name: allData.acty_name || '',
          region: allData.region || '',
          acty_type: allData.acty_type || '团跑',
          start_time: createTime1,
          end_time: endTime1,
          address: allData.address || '',
          total_num: allData.serial_num,
          distance: allData.distance == null ? '—' : allData.distance,
          has_clickon: allData.has_clickon,
          has_sign: allData.has_sign,
          has_name: allData.has_name,
          has_mobile: allData.has_mobile,
          acty_level: allData.level, //level=0 非聚跑，level=1 聚跑
          signTrue: allData.has_clickon != 1,
          loading: false
        })
        if (this.data.acty_name) wx.setNavigationBarTitle({ title: this.data.acty_name })
        if(allData.has_sign == 1){
          that.setData({
            signIn: 1,
            clocked: '已打卡',
            clockOpacity: .7        
          })
        }
        if(allData.level == 0){
          that.setData({
            showBtn: false       
          })
        }
      }else{
        this.setData({ loading: false, loadError: true })
        wx.showToast({
          title: (res && res.data && res.data.error) || '活动加载失败',
          icon: 'none',
          duration: 1500
        })
      }
    }, () => this.setData({ loading: false, loadError: true }))
    // 获取活动数据
    var data = {
      id: id
    }
    util.request('acty/getsport', 'POST', data, '数据加载中 ...', (res)=>{
      if(res && res.data && res.data.success && res.data.data && res.data.data.total != null && res.data.data.number != null){
        that.setData({
          allDistance: res.data.data.total == null ? 0 : res.data.data.total,
          allNum: res.data.data.number == null ? 0 : res.data.data.number,
          dataList: Array.isArray(res.data.data.user_list) ? res.data.data.user_list : [],
          statsLoaded: true,
          statsLoading: false,
          statsError: false
        })
      }else{
        if(res && res.data && res.data.error && res.data.error.indexOf('无打卡') > -1){
          // 后端用 success:false 表示暂无打卡数据，按零值展示而不是加载失败
          that.setData({
            allDistance: 0,
            allNum: 0,
            dataList: [],
            statsLoaded: true,
            statsLoading: false,
            statsError: false
          })
        }else{
          that.setData({ statsLoaded: false, statsLoading: false, statsError: true })
        }
      }
    }, () => that.setData({ statsLoaded: false, statsLoading: false, statsError: true }))
    // 获取报名人数
    if(that.data.userid==undefined){
      var data = {
        actyId: id,
        userId: userId,
        level: '',
        distance: 1,
        userName: '',
        mobile: ''
      } 
    } else {
      var data = {
        actyId: id,
        userId: that.data.userid,
        level: '',
        distance: 1,
        userName: '',
        mobile: ''
      } 
    }
    util.request('acty/getactyuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res && res.data && res.data.success && Array.isArray(res.data.data)){
        var dataAll = res.data.data.map(function (item) {
          return Object.assign(addProfileBadges(item), { levelLabel: toDisplayMemberLevel(item.level) })
        })
        this.setData({
          avastars: dataAll, 
          actyIn: dataAll.length,
          memberLoaded: true,
          memberLoading: false,
          memberError: false
        })
      }else{
        if(res && res.data && res.data.error && res.data.error.indexOf('暂无参与者') > -1){
          // 后端用 success:false 表示暂无报名成员，按空列表展示而不是加载失败
          this.setData({
            avastars: [],
            actyIn: 0,
            memberLoaded: true,
            memberLoading: false,
            memberError: false
          })
        }else{
          this.setData({ memberLoaded: false, memberLoading: false, memberError: true })
        }
      }
    }, () => this.setData({ memberLoaded: false, memberLoading: false, memberError: true }))
    //获取关联抽奖
    var data = {
      actyId : id
    }
    util.request('acty/getluckdrawlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        this.setData({
          ltyList: Array.isArray(res.data.data) ? res.data.data : []
        })
      }else{
      
      }
    })
  },
  // 图片预览
  preview: function(e){
    var url = e.currentTarget.dataset.url
    var previewImgArr = (this.data.actyImg || []).map(item => item.img_url).filter(Boolean)
    if (!url || !previewImgArr.length) return
    const viewer = this.selectComponent('#imageViewer')
    if (viewer) viewer.open(previewImgArr, url, { mode: 'card', title: '活动相册' })
  },
  toLty: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../lotterydetail/lotterydetail?id='+id
    })    
  },
  toList2: function(){
    wx.navigateTo({
      url: '../together/together?id='+this.data.actyId
    })    
  },
  toUserDetail: function(e){
    const id = e.currentTarget.dataset.userid
    if (!id) return
    const userId = app.globalData.userId
    if (userId && String(id) === String(userId)) {
      wx.switchTab({ url: '../mydata/mydata' })
    } else {
      wx.navigateTo({ url: '../othersdata/othersdata?id=' + id })
    }
  },
  //选中人数
  initActyIn: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    this.setData({ actyMemberLoading: true, actyMemberLoaded: false, actyMemberError: false })
    var fail = () => this.setData({
      actyMemberLoading: false, actyMemberLoaded: false, actyMemberError: true,
      picShow: '', runCon: false
    })
    util.request('acty/getclickuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res && res.data && res.data.success && Array.isArray(res.data.data)){
        var allDta = res.data.data
        this.setData({
          actyMember: allDta,
          actyMemberLoading: false,
          actyMemberLoaded: true,
          actyMemberError: false,
          picShow: true,
          runCon: true
        })
        for(var i=0;i<allDta.length;i++){
          var userId = app.globalData.userId
          var id = allDta[i].id
          if(userId==id){
            that.setData({
              showBtn: true
            })
          }
        }
        
      }else{
        if(res && res.data && res.data.error && res.data.error.indexOf('暂无') > -1){
          // 后端用 success:false 表示暂无聚跑成员，按空列表展示而不是加载失败
          this.setData({
            actyMember: [],
            actyMemberLoading: false,
            actyMemberLoaded: true,
            actyMemberError: false
          })
        }else{
          fail()
        }
      }
    }, fail)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var id = this.data.actyId;
    this.initActyDetail(id)
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
        title: (this.data.nickName ? this.data.nickName + '邀请你参加' : '一起参加') + '#' + (this.data.acty_name || '团跑') + '#',
        path: '/pages/activitydetail/activitydetail?id=' + this.data.actyId
    }
  }
})

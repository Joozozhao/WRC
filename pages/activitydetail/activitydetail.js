// pages/activitydetail/activitydetail.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
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
    indicatorDots: true,
    vertical: false,
    autoplay: true,
    interval: 2000,
    duration: 500,
    showBtn: false,
    myAddress: '',
    showSign: false,
    signTrue: true,
    loading: true,
    loadError: false,
    statsLoaded: false,
    memberLoaded: false,
    dataList: [],
    actyMember: []
  },
  openMyPage: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },
  toactyData: function(){
    wx.navigateTo({
      url: '../activitydata/activitydata?id=' + this.data.actyId
    })
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
    var myadrr = this.data.myAddress || ''
    if (myadrr && adrr.indexOf(myadrr) > -1) {
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
    var id = options.id
    var userid = options.userid
    var userId = app.globalData.userId
    this.setData({
      actyId: id,
      userId: userId,
      userid: userid
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
  },
  getactyimgs: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        that.setData({
          actyImg: Array.isArray(res.data.data) ? res.data.data : []
        })
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
    this.setData({ statsLoaded: false, memberLoaded: false })
    util.request('acty/getdetail', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success && res.data.data){
        var allData = res.data.data
        var createTime = (allData.start_timestr || '').substring(0, 16)
        var endTime = (allData.end_timestr || '').substring(11, 16)
        var state = allData.acty_state
        var createTime1 = createTime ? util.dislodgeZero(createTime) : ''
        var endTime1 = endTime ? util.dislodgeZero(endTime) : ''
        this.setData({
          acty_img: allData.acty_img || '',
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
          title: (res.data && res.data.error) || '活动加载失败',
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
      if(res.data && res.data.success && res.data.data){
        that.setData({
          allDistance: res.data.data.total == null ? 0 : res.data.data.total,
          allNum: res.data.data.number == null ? 0 : res.data.data.number,
          dataList: Array.isArray(res.data.data.user_list) ? res.data.data.user_list : [],
          statsLoaded: res.data.data.total != null && res.data.data.number != null
        })
      }else{
      }
    })
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
      if(res.data && res.data.success){
        var dataAll = Array.isArray(res.data.data) ? res.data.data : []
        this.setData({
          avastars: dataAll, 
          actyIn: dataAll.length,
          memberLoaded: Array.isArray(res.data.data)
        })
      }else{
        
      }
    })
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
    wx.previewImage({
    current: url,
    urls: previewImgArr
    })
  },
  toLty: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../lotterydetail/lotterydetail?id='+id
    })    
  },
  toList: function(){
    wx.navigateTo({
      url: '../member/member?id='+this.data.actyId
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
    util.request('acty/getclickuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        var allDta = Array.isArray(res.data.data) ? res.data.data : []
        this.setData({
          actyMember: allDta,
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
        this.setData({
          picShow: '',
          runCon: false
        })
      }
    })
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

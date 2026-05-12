const util = require('../../utils/util.js')
// index.js
// 获取应用实例
const app = getApp()
var day = ["今天", "明天", "后天"];
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
    serialDay: 0,
    energy: 0,
    hasClockOn: 0,
    pageId: 0,
    actyId: 0,
    imgheight: '',
    setHeight: '',
    title: '',
    userList: [],
    recordList: [],
    page: 1,
    personalInfor: false,
    myTip: '',
    logoSrc: '',
    systemInfo: {},
  },
  toUserCenter: function () {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '../userinfor/userinfor',
    })
  },
  toActy: function () {
    wx.navigateTo({
      url: '../activitydetail/activitydetail?id=' + this.data.actyId,
    })
  },

  toHistory: function () {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '../history/history'
    })
  },
  toNews: function () {
    wx.navigateTo({
      url: '../newsdetail/newsdetail?id=' + this.data.pageId,
    })
    wx.setNavigationBarTitle({
      title: this.data.title
    })
  },
  toManage: function () {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '../manage/manage',
    })
  },
  toRecord: function () {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '../record/record',
    })
  },
  toPrize: function () {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '../prize/prize',
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
  getLogo: function () {
    var data = {}
    util.request('news/sys/get', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        var allData = res.data.data
        this.setData({
          logoSrc: allData.logo
        })
      }
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
  initDay: function (userId) {
    var that = this
    var data = {
      userId: userId
    }
    if(userId !=''){
      util.request('user/getserialday', 'POST', data, '拼命加载中 ...', (res) => {
        that.setData({
          serialDay: res.data.data.serialDay,
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
  initList: function () {
    var that = this
    that.setData({
      page: 1
    })
    var data = {
      nickName: '',
      mobile: '',
      openId: '',
      sort: 0,
      levelId: '',
      page: that.data.page++,
      size: 15
    }
    util.request('user/getuserlist', 'POST', data, '拼命加载中 ...', (res) => {
      if (res.data.success) {
        that.setData({
          userList: res.data.data,
          actyIn: res.data.total
        })
      }
    })
  },
  initRecord: function () {
    var that = this
    var data = {
      userId: 0,
      actyId: 0,
      address: '',
      actyIds: -1,
      page: 1
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('acty/getsports', 'POST', data, '拼命加载中 ...', (res) => {
      if (res.data.success) {
        var recordData = res.data.data
        that.setData({
          recordList: recordData
        })
        wx.hideLoading({
          success: (res) => {},
        })
      } else {
        wx.hideLoading({
          success: (res) => {},
        })
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })
  },
  getNews: function () {
    var that = this
    var data = {}
    util.request('news/getlastnews', 'POST', data, '拼命加载中 ...', (res) => {
      if (res.data.success) {
        that.setData({
          title: res.data.data.title,
          img_url: res.data.data.img_url,
          pageId: res.data.data.id
        })

      }
    })
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
  getChallenge: function () {
    var that = this
    var data = {}
    util.request('acty/rankListActy', 'POST', data, '拼命加载中 ...', (res) => {
      if (res.data.success) {
        that.setData({
          challenge: res.data.data
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
  popShow: function (e) {
    var that = this
    var img = e.currentTarget.dataset.img
    var distance = e.currentTarget.dataset.distance
    var speed = e.currentTarget.dataset.speed
    that.setData({
      personalInfor: true,
      personalImg: img,
      personalDis: distance,
      personalSpeed: speed
    })
  },
  popHide: function () {
    var that = this
    that.setData({
      personalInfor: false,
    })
  },
  onLoad() {
    // 开启转发功能
    wx.showShareMenu({
      withShareTicket: true
    })
    this.getLogo()
    this.getTips()
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
    wx.stopPullDownRefresh()
    this.timeOut()
  },
  onShow: function () {
    wx.hideTabBar();
    app.editTabbar();
    var userId = app.globalData.userId
    this.setData({
      userId: userId
    })
    this.popHide()
    this.initUser(userId)
    this.getNews()
    this.getChallenge()
    this.initDay(userId)
    this.initList()
    this.initRecord()
  },
  myLogin: function() {
    var that = this
    var userId = app.globalData.userId
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
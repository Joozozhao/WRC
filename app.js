// app.js

// 若使用 Lottie 动画，可以在此处引入 JSON（需要包装为 module.exports 的 JS 文件）
// const homeLottie = require('./lotties/home.js');

App({
  onLaunch() {
    //隐藏系统tabbar
    // wx.hideTabBar();
    //获取设备信息
    this.getSystemInfo();
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
    var userId = wx.getStorageSync('userId')
    var openId = wx.getStorageSync('openId')
    if(userId > 0){
      this.globalData.userId = userId
      this.globalData.openId = openId
    }
    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
  },
  onShow: function () {
    //隐藏系统tabbar
    // wx.hideTabBar();
  },
  getSystemInfo: function () {
    let t = this;
    wx.getSystemInfo({
      success: function (res) {
        t.globalData.systemInfo = res;
      }
    });
  },
  editTabbar: function () {
    let tabbar = this.globalData.tabBar;
    let currentPages = getCurrentPages();
    let _this = currentPages[currentPages.length - 1];
    let pagePath = _this.route;
    (pagePath.indexOf('/') != 0) && (pagePath = '/' + pagePath);
    for (let i in tabbar.list) {
      tabbar.list[i].selected = false;
      (tabbar.list[i].pagePath == pagePath) && (tabbar.list[i].selected = true);
    }
    _this.setData({
      tabbar: tabbar
    });
  },
  globalData: {
    userId : 0,
    openId : '',
    systemInfo: null,//客户端设备信息
    userInfo: null,
    tabBar: {
      "backgroundColor": "#fbfcf9",
      "color": "#87928c",
      "selectedColor": "#0b503b",
      "list": [
        {
          "pagePath": "/pages/index/index",
          "iconPath": "/images/redesign/home.svg",
          "selectedIconPath": "/images/redesign/home-active.svg",
          // "lottieData": homeLottie,
          "text": "首页"
        },{
          "pagePath": "/pages/activity/activity",
          "iconPath": "/images/redesign/groups.svg",
          "selectedIconPath": "/images/redesign/groups-active.svg",
          // "lottieData": require('./lotties/groups.js'),
          "text": "团跑"
        },{
          "pagePath": "/pages/challenge/challenge",
          "iconPath": "/images/redesign/trophy.svg",
          "selectedIconPath": "/images/redesign/trophy-active.svg",
          // "lottieData": require('./lotties/trophy.js'),
          "text": "挑战"
        },{
          "pagePath": "/pages/mydata/mydata",
          "iconPath": "/images/redesign/person.svg",
          "selectedIconPath": "/images/redesign/person-active.svg",
          // "lottieData": require('./lotties/person.js'),
          "text": "我的"
        }
      ]
    }
  }
})

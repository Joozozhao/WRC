// app.js
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
      "backgroundColor": "#fff",
      "color": "#000",
      "selectedColor": "#ffb6b9",
      "list": [
        {
          "pagePath": "/pages/index/index",
          "iconPath": "/components/tabbarComponent/icon/Homepage.png",
          "selectedIconPath": "/components/tabbarComponent/icon/Homepage-current.png",
          "text": "首页"
        },{
          "pagePath": "/pages/activity/activity",
          "iconPath": "/components/tabbarComponent/icon/Group-run.png",
          "selectedIconPath": "/components/tabbarComponent/icon/Group-run-current.png",
          "text": "团跑"
        },{
          "pagePath": "/pages/clockdaily/clockdaily",
          "iconPath": "/components/tabbarComponent/icon/add.png",
          "isSpecial": true,
          // "text": "打卡"
        },{
          "pagePath": "/pages/challenge/challenge",
          "iconPath": "/components/tabbarComponent/icon/challenge.png",
          "selectedIconPath": "/components/tabbarComponent/icon/Challenge-current.png",
          "text": "挑战"
        },{
          "pagePath": "/pages/mydata/mydata",
          "iconPath": "/components/tabbarComponent/icon/user.png",
          "selectedIconPath": "/components/tabbarComponent/icon/User-current.png",
          "text": "我的"
        }
      ]
    }
  }
})

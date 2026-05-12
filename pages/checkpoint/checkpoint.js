// pages/checkpoint/checkpoint.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    point: 0,
    navTab: ['积分增加', '积分扣除'],
    currentTab: 0,
    tab1: 'tabshow',
    tab2: 'tabhide',
    noRec: 'tabshow',
    addCon: [],
    reduceCon: [],
    page: 1
  },
  versionCompare: function (tp) {
    return true;
  },
  subscribeMessage: function () {
    //需要订阅的消息模板，在微信公众平台手动配置获取模板ID
    let message = [
      'atI2vNoA9gxEHR7iiJ8SXNC5-To5F3nz1GdAiJ9jKT8',
      '4hynAhhU2ZjQeBkbO1aOdZg1CBxBnim31DVZCq6QAps',
      'z4QjB0RgwLz_rzSwz-Btz4UYFicEmcZFuOPepfUC0uQ',
      'WFf_l_J8AUitCUTw6x0dztYEz5P_zB5CN6MKUtARrVA',
      'z4QjB0RgwLz_rzSwz-Btz4UYFicEmcZFuOPepfUC0uQ'
    ]
    //如果总是拒绝（subscriptionsSetting，2.10.1库才支持）
    if (this.versionCompare('2.2.113')) {
       
      wx.getSetting({
        withSubscriptions: true, //是否同时获取用户订阅消息的订阅状态，默认不获取
        success: (res) => {
          if (res.subscriptionsSetting && res.subscriptionsSetting.itemSettings &&
            res.subscriptionsSetting.itemSettings[message] == "reject") {
            //打开设置去设置
            this.openConfirm('检测到您没打开推送权限，是否去设置打开？')
          } else {
             
            wx.requestSubscribeMessage({
              tmplIds: [
              '4hynAhhU2ZjQeBkbO1aOdZg1CBxBnim31DVZCq6QAps',
              'z4QjB0RgwLz_rzSwz-Btz4UYFicEmcZFuOPepfUC0uQ',
              'atI2vNoA9gxEHR7iiJ8SXNC5-To5F3nz1GdAiJ9jKT8'
            ],
              success: (res) => {
                if (res[message] == 'accept') {
                  //用户允许
                }
              },
              fail: (res) => {
                console.info(res)
              },
            })
          }
        }
      })
    } else if (this.versionCompare('2.2.114')) {
      wx.requestSubscribeMessage({
        tmplIds: [message],
        success: (res) => {
          if (res[message] == 'accept') {
            //用户允许
          }
        },
        fail: (res) => {
          console.info(res)
        },
      })
    }
  },
  openConfirm(message) {
    wx.showModal({
      content: message,
      confirmText: "确认",
      cancelText: "取消",
      success: (res) => {
        //点击“确认”时打开设置页面
        if (res.confirm) {
          wx.openSetting({
            success: (res) => {
            },
            fail: (error) => {
              console.log(error)
            }
          })
        } else {
        }
      }
    });
  },
  //基础库版本比较
  versionCompare: function (v) {
    const version = wx.getSystemInfoSync().SDKVersion
    //if (this.compareVersion(version, v) >= 0) {
    return true
    //} else {
    //  return false
  },
  getPoint: function () {
    var userId = app.globalData.userId
    if (userId == 0) {
      return
    }
    var data = {
      id: userId
    }
    util.request('user/get', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        var that = this
        that.setData({
          point: res.data.data.score
        })
      }
    })
    var data = {
      userId: userId,
      page: this.data.page++,
      type: 0
    }
    if (userId == 0) {
      return
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('user/getscore', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        var that = this
        var allData = res.data.data
        var addCon = allData.filter(item => item.opt_type > 0)
        var reduceCon = allData.filter(item => item.opt_type < 0)
        for (var i = 0; i < allData.length; i++) {
          var createTime = allData[i].create_time.substring(0, 19)
          allData[i].create_time = createTime
        }
        that.setData({
          addCon: addCon,
          reduceCon: reduceCon,
          create_time: createTime
        })
        wx.hideLoading({
          success: (res) => {},
        })
      } else {
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  },
  currentTab: function (e) {
    if (this.data.currentTab == e.currentTarget.dataset.idx) {
      return
    }
    this.setData({
      currentTab: e.currentTarget.dataset.idx
    })
    if (e.currentTarget.dataset.idx == 0) {
      this.setData({
        tab1: "tabshow"
      });
      this.setData({
        tab2: "tabhide"
      });
    } else if (e.currentTarget.dataset.idx == 1) {
      this.setData({
        tab1: "tabhide"
      });
      this.setData({
        tab2: "tabshow"
      });
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getPoint()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function () {
    var userId = app.globalData.userId
    var data = {
      userId: userId,
      page: this.data.page++,
      type: 0
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/getscore', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        var that = this
        var allData = res.data.data
        var addCon = allData.filter(item => item.opt_type > 0)
        var reduceCon = allData.filter(item => item.opt_type < 0)
        var content = that.data.addCon.concat(addCon)
        var content2 = that.data.reduceCon.concat(reduceCon)
        for (var i = 0; i < allData.length; i++) {
          var createTime = allData[i].create_time.substring(0, 19)
          allData[i].create_time = createTime
        }
        that.setData({
          addCon: content,
          reduceCon: content2,
          create_time: createTime
        })
        wx.hideLoading({
          success: (res) => {},
        })
      } else {
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  }
})
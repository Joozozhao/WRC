// pages/together/together.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    actyMember: [],
    actyId: 0,
    loading: false,
    loaded: false,
    totalCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options && options.id ? options.id : 0
    this.setData({
      actyId: id
    })
    this.initActyIn(id)
  },

  onPullDownRefresh: function () {
    this.initActyIn(this.data.actyId, function () {
      wx.stopPullDownRefresh()
    })
  },

  initActyIn: function (id, cb) {
    var that = this
    var data = {
      actyId: id
    }
    that.setData({ loading: true })
    util.request('acty/getclickuser', 'POST', data, '数据加载中 ...', (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        var allDta = res.data.data
        that.setData({
          actyMember: allDta,
          totalCount: allDta.length,
          loading: false,
          loaded: true
        })
      } else {
        that.setData({
          actyMember: [],
          totalCount: 0,
          loading: false,
          loaded: true
        })
      }
      if (typeof cb === 'function') cb()
    }, () => {
      that.setData({
        actyMember: [],
        totalCount: 0,
        loading: false,
        loaded: true
      })
      if (typeof cb === 'function') cb()
    })
  },

  myData: function (e) {
    var userid = e.currentTarget.dataset.userid
    if (!userid) return
    wx.navigateTo({
      url: '../othersdata/othersdata?id=' + userid
    })
  }
})

// pages/energy/energy.js
// pages/checkpoint/checkpoint.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    point:0,
    navTab:['小花儿增加','小花儿扣除'],
    currentTab: 0,
    tab1:'tabshow',
    tab2:'tabhide',
    noRec:'tabshow',
    addCon: [],
    reduceCon: [],
    page: 1,
    marathons: [],
    syncDate: '',
    dataTotal: 0,
    wholeTotal: 0,
    halfTotal: 0,
  },
  currentTab: function(e){
    if (this.data.currentTab == e.currentTarget.dataset.idx) {
      return
    }
    this.setData({
      currentTab: e.currentTarget.dataset.idx
    })
    if (e.currentTarget.dataset.idx==0)
    {
      this.setData({ tab1: "tabshow" });
      this.setData({ tab2: "tabhide" });
    } else if (e.currentTarget.dataset.idx == 1)
    {
      this.setData({ tab1: "tabhide" });
      this.setData({ tab2: "tabshow" });
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    //wx.hideShareMenu({})
    this.getMarathonsTotal()
    this.loadMore()
  },
  getMarathonsTotal: function() {
    var userId = app.globalData.userId
    var data = {
      userId : userId
    }
    var that = this
    util.request('user/marathonsnum', 'POST', data, '数据加载中 ...', (res)=>{
      var tm = res.data.data.syncDate.substring(0, 19)
      that.setData({
        syncDate: tm,
        dataTotal: res.data.data.total,
        wholeTotal: res.data.data.wholeTotal,
        halfTotal: res.data.data.halfTotal,
      })
    });
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function(){
    var userId = app.globalData.userId
    var data = {
      userId : userId,
      page: this.data.page++
    }
    var that = this
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/marathons', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        const newList = res.data.data
        that.setData({
          marathons: [...this.data.marathons, ...newList],
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
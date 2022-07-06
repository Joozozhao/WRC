// pages/exchange/exchange.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    navTab: ['积分兑换区','能量兑换区'],
    currentTab: 0,
    tab1:'tabshow',
    tab2:'tabhide',
    noRec:'tabshow',
    listData: [],
    listData2: [],
    prizeId: '',
    energy: 0,
    score: 0,
    userId: 0,
    page: 1
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
    wx.hideShareMenu({})
    this.getPrize()
    this.getPoint()
  },
  getPoint: function (){
    var userId = app.globalData.userId
    var data = { 
      id : userId
    }
    util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      console.log(res)
      if(res.data.success){
        that.setData({
          score: res.data.data.score,
          energy: res.data.data.energy,
          level: res.data.data.level,
          userId: res.data.data.id
        })
      }
    })
  },
  getPrize: function(){
    var that = this
    var data = { 
      gn : '',
      page: that.data.page++
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('goods/searchlist', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)
      var allData = res.data.data
      var pointData = allData.filter(item=>item.goods_type==0)
      var energyData = allData.filter(item=>item.goods_type!==0)
      if(res.data.success){
        that.setData({
          listData: pointData,
          listData2: energyData
        })
        wx.hideLoading({
          success: (res) => {},
        })
      } else {
        wx.hideLoading({
          success: (res) => {},
        })
        wx.showToast({
          title: '加载失败',
          mask: true
        })
      }
    })
  },
  toPrize: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../prizedetails/prizedetails?id=' + id
    })
  },
  toPrize2: function(e){
    var id = e.currentTarget.dataset.id
    if(this.data.level=='VIP'){
      wx.navigateTo({
        url: '../prizedetails/prizedetails?id=' + id
      })
    } else {
      wx.showToast({
        title: '仅限 VIP 成员兑换，继续加油',
        icon: 'none'
      })
    }
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function(){
    var that = this
    var data = { 
      gn : '',
      page: that.data.page++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('goods/searchlist', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)
      var prizeData = res.data.data
      var content = that.data.listData.concat(prizeData)
      var content2 = that.data.listData2.concat(prizeData)
      if(res.data.success){
        that.setData({
          listData: content,
          listData2: content2
        })
        wx.hideLoading({
          success: (res) => {},
        })
      }else {
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  }
})
// pages/history/history.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // haveOrder: true,
    orderInfo: [],
    state: '',
    navTab: ['积分奖品','小花儿兑换奖品'],
    currentTab: 0,
    total: 0,
    tab1:'tabshow',
    tab2:'tabhide',
    noRec:'tabshow',
    page: 1,
    type: 0
  },
  currentTab: function(e){
    if (this.data.currentTab == e.currentTarget.dataset.idx) {
      return
    }
    this.setData({
      currentTab: e.currentTarget.dataset.idx,
      page: 1,
      orderInfo: []
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
    this.initOrder()
  },
  toDetail: function(e){
    var id = e.currentTarget.dataset.id
    var type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: '../orderdetail/orderdetail?id=' + id +'&type=' + type,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({})
    // this.initOrder()
  },
  initOrder: function(){
    var that = this
    var userId = app.globalData.userId
    var data = {
      userId: userId,
      page: that.data.page++,
      type: that.data.currentTab
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('order/list', 'POST', data, '数据加载中...', (res)=>{
      if(res.data.success){
        var orderData = res.data.data
        for(var i=0; i<orderData.length;i++){
          var createTime = orderData[i].last_time.substring(0, 19)
          orderData[i].last_time = createTime
        }
        that.setData({
          total: orderData.length,
          orderInfo: orderData,
          last_time: createTime,
          noHistory: false
        })
        wx.hideLoading({
          success: (res) => {},
        })
      }else{
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
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.setData({
      page: 1
    })
    this.initOrder()
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadMore()
  },
  loadMore: function(){
    var that = this
    var userId = app.globalData.userId
    that.setData({
      page: 1
    })
    var data = {
      userId: userId,
      page: that.data.page++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('order/list', 'POST', data, '数据加载中...', (res)=>{
      if(res.data.success){
        var orderData = res.data.data
        var content = that.data.orderInfo.concat(orderData)
        for(var i=0; i<orderData.length;i++){
          var createTime = orderData[i].last_time.substring(0, 19)
          orderData[i].last_time = createTime
        }
        that.setData({
          total: orderData.length,
          orderInfo: content,
          last_time: createTime,
          noHistory: false
        })
        wx.hideLoading({
          success: (res) => {},
        })
      }else{
        wx.hideLoading({
          success: (res) => {},
        })
        // wx.showToast({
        //   title: res.data.error,
        //   icon: 'none',
        //   duration: 1500
        // })
      }
      
    })
  }
})
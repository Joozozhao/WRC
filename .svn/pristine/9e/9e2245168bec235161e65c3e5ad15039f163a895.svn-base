// pages/lotterylist/lotterylist.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orderList: [],
    page: 1,
    noHistory: true
  },
  toLott: function(){
    wx.navigateTo({
      url: '../lottery/lottery?actyId=0&actyName=&goodsId=0&goodsName=&total=0&addr=',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.initOrder()
  },
  initOrder: function(){
    // var userId = app.globalData.userId
    var that = this
    var data = {
      page: that.data.page++
    }
    console.log(data)
    util.request('user/luckdraw', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        var orderData = res.data.data
        console.log(orderData)
        for(var i=0; i<orderData.length;i++){
          var endTime = orderData[i].start_time.substring(0, 16)
          orderData[i].start_time = endTime
        }
        that.setData({
          orderList: orderData,
          start_time: endTime,
          noHistory: false
        })
      }
    })
  },
  toLty: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../lotterydetail/lotterydetail?id='+id
    })    
  },
  delIt: function(e){
    var that = this
    wx.showModal({   
      title: '是否确定删除内容？',
      success: function (res) {
        if (res.confirm) {             //点击确定后
          var id = e.currentTarget.dataset.id
          var data = {
            id: id
          }
          util.request('user/delluckdraw', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              that.setData({
                page: 1
              })
              that.onLoad()
              console.log(res)
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
              })        
            }else{
              that.setData({
                orderList: []
              })
              wx.showToast({
                title: res.data.error,
                icon: 'none',
                duration: 1500
              })  
            }
          })
         } else {
           console.log('用户取消')
         }
       }
    })
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function () {
    var that = this
    console.log(that.data)
    var data = {
      page: that.data.page ++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/luckdraw', 'POST', data, '数据加载中...', (res)=>{
      if(res.data.success){
        var orderData = res.data.data
        var content = this.data.orderList.concat(orderData)
        for(var i=0; i<orderData.length;i++){
          var endTime = orderData[i].start_time.substring(0, 16)
          orderData[i].start_time = endTime
          console.log(orderData)
        }
        that.setData({
          orderList: content,
          start_time: endTime,
          noHistory: false
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
// pages/activitydata/activitydata.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    dataList: [],
    dataListOwn: [],
    actyId: 0,
    myId: '',
    imgIcon: ['../../images/one.svg','../../images/two.svg','../../images/three.svg'],
    page: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.setData({
      actyId: id
    })
    this.initData(id)
  },
  initData: function(id){
    var that = this
    var data = {
      actyId : that.data.actyId,
      page: that.data.page++
    }
    var userId = app.globalData.userId
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('acty/getsportlog', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        // var ownData = res.data.data.filter(item=>item.user_id=userId)
        that.setData({
          dataList: res.data.data,
          myId: userId
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
  myData: function(e){
    var id = e.currentTarget.dataset.id
    var userId = app.globalData.userId
    if(id==userId){
      wx.switchTab({
        url: '../mydata/mydata'
      })
    }else{
      wx.navigateTo({
        url: '../othersdata/othersdata?id=' + id
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
      actyId : that.data.actyId,
      page: that.data.page++
    }
    var userId = app.globalData.userId
    wx.showLoading({
      title: '加载中',
      icon: 'none'
    })
    util.request('acty/getsportlog', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var allData = res.data.data
        var content = that.data.dataList.concat(allData)
        that.setData({
          dataList: content
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
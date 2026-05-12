// pages/prizelist/prizelist.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    activityList: [],
    actyId: '',
    actyName: '',
    goodsId:0,
    goodsName:'',
    total:0,
    addr: '',
    page: 1
  },
  radioChange: function(e){
    var goodsId = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    var total = e.currentTarget.dataset.total
    var that = this
    that.setData({
      goodsId: goodsId,
      goodsName: name,
      total: total
    })
  },
  submit: function () {
    var that = this
    wx.reLaunch({
      url: '../lottery/lottery?actyId='+that.data.actyId+"&actyName="+that.data.actyName+"&goodsId="+that.data.goodsId+"&goodsName="+that.data.goodsName+"&total="+that.data.total+"&addr="+that.data.addr,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var actyId = options.actyId;
    var actyName = options.actyName;
    var goodsId = options.goodsId;
    var goodsName = options.goodsName;
    var total = options.total;
    var addr = options.addr;
    
    this.setData({
      actyId: actyId,
      actyName: actyName,
      goodsId: goodsId,
      goodsName: goodsName,
      total: total,
      addr: addr
    })
    this.getPrize() 
  },
  getPrize: function(){
    var that = this
    var data = { 
      gn : '',
      page: that.data.page++
    }
    util.request('goods/searchlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          listData: res.data.data
        })
      } else {
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })  
      }
    })
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
      if(res.data.success){
        var allData = res.data.data
        var content = that.data.listData.concat(allData)
        that.setData({
          listData: content
        })
        wx.hideLoading({
          success: (res) => {},
        })
      } else {
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
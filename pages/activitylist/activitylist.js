// pages/activity/activity.js
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
    actyType: '',
    region: '',
    page: 1
  },
  radioChange: function(e){
    var actyId = e.currentTarget.dataset.id
    var actyName = e.currentTarget.dataset.name
    var type = e.currentTarget.dataset.type
    var region = e.currentTarget.dataset.region
    var addr = this.data.addr
    var that = this
    that.setData({
      actyId: actyId,
      actyName: actyName,
      addr: addr,
      actyType: type,
      region: region
    })
  },
  submit: function (e) {
    var that = this;
    if(that.data.actyType == '团跑'){
      wx.redirectTo({
        url: '../lottery/lottery?actyId='+that.data.actyId+"&actyName="+that.data.actyName+"&goodsId="+that.data.goodsId+"&goodsName="+that.data.goodsName+"&total="+that.data.total+"&addr="+that.data.region,
      })
    } else {
      wx.redirectTo({
        url: '../lottery/lottery?actyId='+that.data.actyId+"&actyName="+that.data.actyName+"&goodsId="+that.data.goodsId+"&goodsName="+that.data.goodsName+"&total="+that.data.total+"&addr="+that.data.addr,
      })
    }
    
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
    var addr = options.addr
    var actyType = options.actyType
    
    this.setData({
      actyId:actyId,
      actyName:actyName,
      goodsId:goodsId,
      goodsName:goodsName,
      total:total,
      addr: addr,
      actyType: actyType
    })
    this.initActy()
  },
  initActy: function(){
    var that = this
    var data = {
      page: that.data.page++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    util.request('acty/getactylist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var allData = res.data.data
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].start_timestr.substring(0, 16)
          var endTime = allData[i].end_timestr.substring(10, 16)
          var createTime1 = util.dislodgeZero(createTime)
          var endTime1 = util.dislodgeZero(endTime)
          allData[i].start_timestr = createTime1 
          allData[i].end_timestr = endTime1
        }
        that.setData({
          activityList: allData,
          start_timestr: createTime1,
          end_timestr: endTime1
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
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.loadMore()
  },
  loadMore: function(){
    var that = this
    var data = {
      page: that.data.page++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'none'
    })
    util.request('acty/getactylist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var allData = res.data.data
        var content = that.data.activityList.concat(allData)
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].start_timestr.substring(0, 16)
          var endTime = allData[i].end_timestr.substring(10, 16)
          var createTime1 = util.dislodgeZero(createTime)
          var endTime1 = util.dislodgeZero(endTime)
          allData[i].start_timestr = createTime1 
          allData[i].end_timestr = endTime1
        }
        that.setData({
          activityList: content,
          start_timestr: createTime1,
          end_timestr: endTime1
        })
        wx.hideLoading({
          success: (res) => {},
        })
    }else{
      wx.hideLoading({
        success: (res) => {},
      })
      }
    })
  }
})
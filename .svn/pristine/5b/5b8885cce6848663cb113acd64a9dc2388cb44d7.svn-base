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
    navTab:['能量增加','能量扣除'],
    currentTab: 0,
    tab1:'tabshow',
    tab2:'tabhide',
    noRec:'tabshow',
    addCon: [],
    reduceCon: [],
    page: 1
  },
  getEnergy: function (){
    var userId = app.globalData.userId
    var data = { 
      id : userId
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res)
        var that = this
        that.setData({
          actyTimes: res.data.data.acty_times,
          energy: res.data.data.energy
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
    var data = {
      userId : userId,
      page: this.data.page++,
      type: 1
    }
    util.request('user/getscore', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data.data)
      if(res.data.success){
      var that = this
      var allData = res.data.data
      var addCon = allData.filter(item=>item.opt_type>0)
      var reduceCon = allData.filter(item=>item.opt_type<0)
      for(var i=0; i<allData.length;i++){
        var createTime = allData[i].create_time.substring(0, 19)
        allData[i].create_time = createTime 
      }
      that.setData({
        addCon: addCon,
        reduceCon: reduceCon,
        create_time: createTime
      })
    }
    })    
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
    this.getEnergy()
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
      page: this.data.page++,
      type: 1
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/getscore', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data.data)
      if(res.data.success){
      var that = this
      var allData = res.data.data
      var addCon = allData.filter(item=>item.opt_type>0)
      var reduceCon = allData.filter(item=>item.opt_type<0)
      var content = that.data.addCon.concat(addCon)
      var content2 = that.data.reduceCon.concat(reduceCon)
      for(var i=0; i<allData.length;i++){
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
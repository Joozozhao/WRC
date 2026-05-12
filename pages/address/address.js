// pages/address/address.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    addressList: [],
    page: 1,
    addrId: 0,
    id: 0
  },
  chooseAdd:function (e){
    var addrId = e.currentTarget.dataset.id
    var pages = getCurrentPages() // 当前页面
    var prevPage= pages[pages.length - 2] // 前一个页面
    wx.navigateBack({
      success: function() {
      prevPage.haveAdd(addrId) // 执行前一个页面的onLoad方法
      }
    })
  },
  setdefAdd: function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var userId = app.globalData.userId
    var data ={
      id: id,
      def: 1,
      userId: userId
    }
    util.request('user/setdefaddress', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          id: id
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
  editIt: function (e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../editaddress/editaddress?id='+id,
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
          util.request('user/deladdr', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              that.initList()
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
              })              
            }else{
              that.setData({
                addressList: []
              })
              wx.showToast({
                title: res.data.error,
                icon: 'none',
                duration: 1500
              })
            }
          })
         } else {
         }
       }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    var addrId = options.addrId
    this.setData({
      id: id,
      addrId: addrId
    })
  },
  initList: function (){
    var that= this
    var userId = app.globalData.userId
    var data = {
      userId : userId
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    util.request('user/getaddrlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
      that.setData({
        addressList: res.data.data
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
  initdefAdd: function(){
    var that = this
    var userId = app.globalData.userId
    var data ={
      userId: userId
    }
    util.request('user/getdefaddr', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          id: res.data.data.id
        })
      } else {
        
      }
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.initList()
    this.initdefAdd()
  }
})
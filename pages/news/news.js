// pages/news/news.js
const util = require('../../utils/util.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    newsList: null,
    vipList: ''
  },
  newsDetails(){
    wx.navigateTo({
      url: '../newsDetails/newsDetails'
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // this.getData(1);
    this.vipData()
  },
  vipData: function(){
    var that = this
    var data = {}
    util.request('user/getvip', 'POST', data, '数据请求中...', (res)=>{
    if(res.data.success){
      that.setData({
        vipList : res.data.data
      })
    }else{
      // wx.showToast({
      //   title: res.data.error,
      //   icon: 'none',
      //   duration: 1500
      // }) 
    }
    })
  },
  newsDetails: function(event){
    var id = event.currentTarget.dataset.nid;
    wx.navigateTo({
      url: '../newsdetail/newsdetail?id=' + id,
    })
  }
})
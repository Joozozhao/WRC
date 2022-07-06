// pages/member/member.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    actyMember: [],
    actyId: 0,
    // page: 1
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.setData({
      actyId: id
    })
    this.initActyIn(id)
  },
  initActyIn: function(id){
    var that = this
    var data = {
      actyId: id
    }
    console.log(data)
    util.request('acty/getclickuser', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        var allDta = res.data.data
        this.setData({
          actyMember: allDta
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
  myData: function(e){
    var userid = e.currentTarget.dataset.userid
    wx.navigateTo({
      url: '../othersdata/othersdata?id=' + userid
    })
  }
})
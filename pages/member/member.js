// pages/member/member.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    memberList: [],
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
    this.initMember(id)
  },
  initMember: function(id){
    var that = this
    var data = {
      actyId : that.data.actyId,
      level: '',
      distance: 1
    }
    util.request('acty/getactyuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          memberList: res.data.data
        })
      }else{
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500
          })  
        }
    })
  },
  myData: function(e){
    var id = e.currentTarget.dataset.userid
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
})
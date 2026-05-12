// pages/memberdata/memberdata.js
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
    btnTab: ['月跑量','年跑量','总跑量'],
    id: 0,
    page: 1,
    select: 0,
    defaultSort: 3
  },
  choose: function(e){
    var sel = e.currentTarget.dataset.id
    this.setData({
      id: sel,
      select: sel,
      defaultSort: sel
    })
    if(sel==0){
      this.setData({
        defaultSort: 3,
        page: 1
      })
      this.initUser()
    } else if(sel==1){
      this.setData({
        defaultSort: 4,
        page: 1
      })
      this.initUser()
    }else if(sel==2){
      this.setData({
        defaultSort: 5,
        page: 1
      })
      this.initUser()
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.initUser()
  },
  initUser: function(){
    var that = this
    var data = {
      nickName : '', 
      mobile : '', 
      openId : '', 
      sort: that.data.defaultSort,
      levelId: '',
      page : that.data.page++,
      size: 30 //总取人数
    }
    var userId = app.globalData.userId
    console.log(data)
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('user/getuserlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res)
        that.setData({
          dataList: res.data.data,
          myId: userId
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
    // this.loadMore()
  },
  loadMore: function(){
    var that = this
    var data = {
      nickName : '', 
      mobile : '', 
      openId : '', 
      sort: 0,
      levelId: '',
      page : that.data.page++,
      size: 15
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/getuserlist', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
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
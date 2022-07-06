// pages/actyin/actyin.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    memberList: [],
    selList: ['全部','VIP','普通','非会员'],
    selLevel: '',
    sortState: 1,
    iconState: true,
    iconState2: true,
    selAll: false,
    phoneH: '',
    actyId: 0,
    per: 0,
    id: 0,
    state1: true,
    state2: false,
    noList: false
  },
  getH: function(){
    //获取机型可用高度
    var that = this
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          phoneH: res.windowHeight - (res.windowWidth / 750) * 94 + "px"
        })
      }
    })
  },
  clickLevel: function(){
    var that = this
    that.setData({
      selAll: !that.data.selAll,
      iconState: !that.data.iconState
    })
    if(that.data.getH==''){
      that.setData({
        getH: that.data.phoneH
      })
    } else {
      that.setData({
        getH: ''
      })
    }
  },
  choose: function(e){
    var id = e.currentTarget.dataset.id
    var txt = e.currentTarget.dataset.txt
    var that = this
    if(txt == '全部'){
      that.setData({
        id: id,
        selLevel: ''
      })
    } else {
      that.setData({
        id: id,
        selLevel: txt
      })
    }
  },
  selBtn: function(){
    var that = this
    that.initMember()
    that.setData({
      selAll: false,
      iconState: true,
      getH: ''
    })
  },
  clickSort: function(){
    var that = this
    that.setData({
      sortState: 0,
      state1: false,
      state2: true,
      selAll: false
    })
    that.initMember()
  },
  clickSort2: function(){
    var that = this
    that.setData({
      sortState: 1,
      state1: true,
      state2: false,
      selAll: false
    })
    that.initMember()
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.setData({
      actyId: id
    })
    this.getH()
    this.initMember(id)
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
  initMember: function(id){
    var that = this
    var data = {
      actyId : that.data.actyId,
      level: that.data.selLevel,
      distance: that.data.sortState
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('acty/getactyuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res.data.data)
        var mbData = res.data.data
        that.setData({
          memberList: mbData
        })
        wx.hideLoading({
          success: (res) => {},
        })
      }else{
        that.setData({
          memberList: [],
          noList: true
        })
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  },
  dedupe: function (array){
    return Array.from(new Set(array));
    //这里的 Array.from（）方法是将两类对象转为真正的数组：类似数组的对象和可遍历的对象（包括es6新增的数据结构Set和Map）
  }
})
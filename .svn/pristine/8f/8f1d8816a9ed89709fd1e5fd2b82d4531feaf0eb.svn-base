// pages/userlist/userlist.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    userList: [],
    selList: [
      {text: '全部'},
      {text:'VIP'},
      {text:'普通'},
      {text:'非会员'}
    ],
    sortList:[
      {text: '积分'},
      {text:'能量'},
      {text:'连续打卡'}
    ],
    tab: 0,
    changeModal: false,
    page: 1,
    getH: '',
    iconState: true,
    iconState2: true,
    selAll: false,
    sortAll: false,
    phoneH: '',
    showIt: false,
    userId: 0,
    id: 0,
    level: '',
    selLevel: '',
    userid: '',
    showOr: false
  },
  setInfor: function(e){
    var duty = e.currentTarget.dataset.duty
    var level = e.currentTarget.dataset.level
    var userid = e.currentTarget.dataset.userid
    this.setData({
      changeModal: true,
      duty: duty,
      level: level,
      userId: userid
    })
  },
  onCancel:function(){
    this.setData({
      changeModal: false
    })
  },
  setLevel: function(e){
    var lev = e.detail.value
    this.setData({
      level: lev
    })
  },
  setDuty: function(e){
    var duty = e.detail.value
    this.setData({
      duty: duty.toString()
    })
    console.log(this.data.duty)
  },
  onConfirm: function(){
    var that = this
    var userId = that.data.userId
    var data = {
      userId: userId,
      level: that.data.level
    }
    console.log(data)
    util.request('user/setlevel', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res)
        that.setData({
          page:1
        })
        that.onLoad()
      }else{
        // wx.showToast({
        //   title: res.data.error,
        //   icon: 'none',
        //   duration: 1500
        // })  
      }
    })
    var data = {
      userId: userId,
      duty: that.data.duty
    }
    console.log(data)
    util.request('user/setduty', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res)
        that.setData({
          page: 1
        })
        that.onLoad()
        wx.showToast({
          title: '设置成功',
          icon: 'none',
          duration: 1500
        })
      }else{
        // wx.showToast({
        //   title: res.data.error,
        //   icon: 'none',
        //   duration: 1500
        // })  
      }
    })
    this.setData({
      changeModal: false
    })
  },
  details:function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var toggleBtnVal = that.data.userid;
    
    if (toggleBtnVal == id) {
      that.setData({
        userid: 0
      })
    } else {
      that.setData({
        userid: id
      })
    } 

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({})
    this.initUser()
    this.getH()
  },
  initUser: function(){
    var that = this
    var data = {
      nickName : '', 
      mobile : '', 
      openId : '', 
      sort: that.data.id,
      levelId: that.data.selLevel,
      page : 1,
      size: 10000
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('user/getuserlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res)
        that.setData({
          userList: res.data.data
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
      iconState: !that.data.iconState,
      sortAll: false,
      iconState2: true
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
  clickSort: function(){
    var that = this
    that.setData({
      sortAll: !that.data.sortAll,
      iconState2: !that.data.iconState2,
      selAll: false,
      iconState: true
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
    that.setData({
      selAll: false,
      sortAll: false,
      iconState: true,
      iconState2: true,
      getH: ''
    })
    that.initUser()
  },
  choose2: function(e){
    var id= e.currentTarget.dataset.id
    var that = this
    that.setData({
      id: id,
      selAll: false,
      sortAll: false,
      iconState: true,
      iconState2: true,
      getH: ''
    })
    that.initUser()
  },
  close: function(){
    this.setData({
      selAll: false,
      sortAll: false,
      iconState: true,
      iconState2: true,
    })
  },
  loadMore: function(){
    var that = this
    var data = {
      nickName : '', 
      mobile : '', 
      openId : '', 
      sort: that.data.id,
      levelId: that.data.selLevel,
      page : that.data.page++,
      size: 15
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/getuserlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        console.log(res)
        var allData = res.data.data
        var content = that.data.userList.concat(allData)
        that.setData({
          userList: content
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
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    // this.loadMore()
  }
})
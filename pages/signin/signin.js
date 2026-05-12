// pages/signin/signin.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    actyId: 0,
    hasName: 0,
    hasMobile: 0,
    has_name: 0,
    has_mobile: 0,
    hasDistance: 0,
    target: 0,
    distance: 0,
    id: 0,
    acty_type: '',
    disable: ''
  },
  openLogin : function(){
    var userId = app.globalData.userId
    if(userId < 1 || userId == undefined){
    util.showLogin((res)=>{
      var data = {
        code: res.code,
        encryptedData: "",
        iv: ""
      }
      //取用户的openid
      util.request('user/wxlogin', 'POST', data, '登录中...', (loginRes)=>{
        var regData = {
          openId: loginRes.data.data.openid,
          unionid: loginRes.data.data.unionid
        }
        util.request('user/wxregister', 'POST', regData, '', (regRes)=>{
          app.globalData.userId = regRes.data.UserId
          app.globalData.openId = regData.openId
          wx.setStorageSync('userId', regRes.data.UserId)
          wx.setStorageSync('openId', regData.openId)
          wx.switchTab({
            url: '../index/index',
          })
        })
      })
    })
    // wx.showToast({
    //   title: 'error',
    //   icon: 'none',
    //   duration: 1500
    // })  
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    var has_name = options.has_name
    var has_mobile = options.has_mobile
    var acty_type = options.acty_type
    var target = options.target
    var userId = app.globalData.userId
    this.setData({
      actyId: id,
      hasName: has_name,
      hasMobile: has_mobile,
      acty_type: acty_type,
      target: target,
      distance: target,
      userId: userId
    })
    this.initInfor()
  },
  initInfor:function(){
    var that = this
    var userId = app.globalData.userId
    var data = {
      id: userId
    }
    util.request('user/get', 'POST', data, '数据加载中...', (res)=>{
      if(res.data.success){
        that.setData({
          mobile: res.data.data.mobile,
          userName: res.data.data.name,
          sex: res.data.data.sex
        })
      }
    })
  },
  submit: function(e){
    var that = this
    var userId = app.globalData.userId
    var formatDate = e.detail.value
    if(formatDate.userName == ''){
      wx.showToast({
        title: '姓名不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(that.data.hasMobile == 1 && formatDate.moblie == '') {
      wx.showToast({
        title: '电话号码不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // if(that.data.hasMobile == 1 && !util.isPhone(formatDate.mobile)){
    //   wx.showToast({
    //     title: '请输入正确手机号!',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    if(that.data.acty_type=='团跑'){
      var data = {
        actyId : that.data.actyId,
        userId : userId,
        distance: that.data.target,
        hasDistance: 0,
        userName: formatDate.userName,
        mobile: formatDate.mobile
      }
      util.request('acty/joinacty', 'POST', data, '数据加载中 ...', (res)=>{
        if(res.data.success){
        that.setData({
          disable: true
        })
          wx.showToast({
            title: '报名成功',
            duration: 1000
          })
          // wx.navigateBack({
          //   delta: 0,
          // })
          wx.redirectTo({
            url: '../activitydetail/activitydetail?id='+that.data.actyId + '&has_name='+that.data.hasName+'&has_mobile='+that.data.hasMobile+'&target='+that.data.target+'&acty_type='+that.data.acty_type
          })
        }else{
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500
          })  
        }
      })
    } else {
      if(formatDate.target == ''){
        wx.showToast({
          title: '挑战公里数不能为空!',
          icon: 'none',
          duration: 1500
        })
        return false
      }
      if(parseInt(formatDate.target)>0 && parseInt(formatDate.target) < parseInt(that.data.distance)){
        wx.showToast({
          title: '挑战公里数不能小于原目标!',
          icon: 'none',
          duration: 1500
        })
        return false
      }
      var data = {
        actyId : that.data.actyId,
        userId : userId,
        distance: formatDate.target,
        hasDistance: 0,
        userName: formatDate.userName,
        mobile: formatDate.mobile
      }
      util.request('acty/joinacty', 'POST', data, '数据加载中 ...', (res)=>{
        if(res.data.success){
          wx.showToast({
            title: '报名成功',
            duration: 1000
          })
          wx.reLaunch({
            url: '../challengedetail/challengedetail?id='+that.data.actyId + '&has_name='+that.data.hasName+'&has_mobile='+that.data.hasMobile+'&target='+that.data.target+'&acty_type='+that.data.acty_type
          })
        }else{
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500
          })  
        }
      })
    } 
  }
})
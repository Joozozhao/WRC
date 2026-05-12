// pages/userinfor/userinfor.js
var util = require('../../utils/util.js');
var now_date = util.formatDate(new Date());
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: "../../images/default.png", //用户头像
    formatDate: '',
    birthday: '',
    address: '',
    jacket: '',
    trousers: '',
    shoes: '',
    sex: 1,
    addressArray: ['北京', '日照', '其他地区'],
    jacketArray: ['S', 'M', 'L', 'XL', '2XL'],
    trousersArray: ['S', 'M', 'L', 'XL', '2XL'],
    shoesArray: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
    headArray: ['50cm', '51cm', '52cm', '53cm', '54cm', '55cm', '56cm', '57cm', '58cm'],
    handArray: ['15cm', '16cm', '17cm', '18cm', '19cm', '20cm', '21cm'],
    index: 0,
    endDate: now_date,
    accountInfo: ''
  },
  radiocon1: function () {
    this.setData({
      sex: 1
    })
  },
  onShow: function(){
    this.initUser();
  },
  radiocon2: function () {
    this.setData({
      sex: 2
    })
  },
  //日期
  // dateChange: function (e) {
  //   var that = this
  //   that.setData({
  //     clas: '',
  //     birthday: e.detail.value
  //   })
  // },
  //地区选择
  pickerSelected: function (e) {
    var that = this
    //为了让选择框有个默认值，    
    that.setData({
      clas: '',
      //拼的字符串传后台
      address: that.data.addressArray[e.detail.value]
    })
  },
  pickerJacket: function (e) {
    var that = this
    //为了让选择框有个默认值，    
    that.setData({
      clas: '',
      //拼的字符串传后台
      jacket: that.data.jacketArray[e.detail.value]
    })
  },
  pickerTrousers: function (e) {
    var that = this
    //为了让选择框有个默认值，    
    that.setData({
      clas: '',
      //拼的字符串传后台
      trousers: that.data.trousersArray[e.detail.value]
    })
  },
  pickerHead: function (e) {
    var that = this
    //为了让选择框有个默认值，    
    that.setData({
      clas: '',
      //拼的字符串传后台
      headSize: that.data.headArray[e.detail.value]
    })
  },
  pickerHand: function (e) {
    var that = this
    //为了让选择框有个默认值，    
    that.setData({
      clas: '',
      //拼的字符串传后台
      handSize: that.data.handArray[e.detail.value]
    })
  },
  pickerShoes: function (e) {
    var that = this
    //为了让选择框有个默认值  
    that.setData({
      clas: '',
      //拼的字符串传后台
      shoes: that.data.shoesArray[e.detail.value]
    })
  },
  loginout() {
    wx.showModal({
      title: '提示',
      content: '您确定要退出登录吗',
      success: function (res) {
        if (res.confirm) { //这里是点击了确定以后
          wx.setStorageSync('userId', ''); //userId
          wx.setStorageSync('openId', ''); //openId  
          app.globalData.userId='';
          app.globalData.openId='';
          var pages = getCurrentPages(); //获取页面栈
          if (pages.length > 1) {
            //上一个页面实例对象
            var prePage = pages[pages.length - 2];
            //调用上一个页面的onShow方法
            prePage.onLoad()
          }
          wx.reLaunch({
            url: '/pages/index/index', //跳去登录页
          })
        } else { //这里是点击了取消以后
        }
      }
    })
  },
  onSubmit: function (e) {
    var formatDate = e.detail.value
    var userId = app.globalData.userId
    var data = {
      userId: userId,
      mobile: formatDate.mobile,
      name: formatDate.name,
      sex: this.data.sex,
      birth: formatDate.birthday,
      address: this.data.address,
      shoes: this.data.shoes,
      trousers: formatDate.trousers,
      jacket: formatDate.jacket,
      head_size: formatDate.headSize,
      hand_size: formatDate.handSize
    }
    util.request('user/updateuser', 'POST', data, '数据加载中...', (res) => {
      if (res.data.success) {
        if (formatDate.name == '') {
          wx.showToast({
            title: '姓名不能为空!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        if (this.data.sex == '') {
          wx.showToast({
            title: '请选择性别!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        if (this.data.address == '') {
          wx.showToast({
            title: '地区不能为空!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1000
        })
        setTimeout(function () {
          wx.switchTab({
            url: '../index/index'
          })
        }, 1500)
      } else {
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })
  },
  cancle: function () {
    wx.navigateBack({
      delta: 1
    })
  },
 
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({}) //此页面禁止转发
    this.initUser()
    this.initInfor()
    //获取当前小程序版本号
    const accountInfo = wx.getAccountInfoSync();
    const versionNumber=accountInfo.miniProgram.version;
    this.setData({
     versionNumber:versionNumber
    })
  },
  initUser: function () {
    var that = this;
    var userId = app.globalData.userId
    if (userId > 0) {
      //已登录
      that.setData({
        userId: userId
      })
      var data = {
        id: userId
      }
      util.request('user/get', 'POST', data, '数据加载中 ...', (res) => {
        if (res.data.success) {
          that.setData({
            avatarUrl: res.data.data.header_url,
            nickName: res.data.data.nick_name,
            score: res.data.data.score,
            duty: res.data.data.duty,
            level: res.data.data.level,
            userId: res.data.data.id
          })
        }
      })
    } else {
      that.setData({
        userId: 0
      })
    }
  },
  editUrl: function(){
    wx.navigateTo({
      url: '../edituser/edituser?avatarurl='+this.data.avatarUrl
    })
  },
  initInfor: function (e) {
    var that = this
    var userId = app.globalData.userId
    var data = {
      id: userId
    }
    util.request('user/get', 'POST', data, '数据加载中...', (res) => {
      if (res.data.success) {
        that.setData({
          nickName: res.data.data.nick_name,
          mobile: res.data.data.mobile,
          name: res.data.data.name,
          sex: res.data.data.sex,
          birthday: res.data.data.birthday,
          address: res.data.data.address,
          trousers: res.data.data.trousers,
          jacket: res.data.data.jacket,
          headSize: res.data.data.head_size,
          handSize: res.data.data.hand_size,
          shoes: res.data.data.shoe_size
        })
      }
    })
  }
})
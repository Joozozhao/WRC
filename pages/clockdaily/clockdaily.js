// pages/clockin/clockin.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showView: false,
    addView: true, 
    formatDate: '',
    date: '',
    tempFilePaths: '',
    actyId: 0,
    isShow_03: false,
    speed:'',
    steps: 0,
    steps_frequency: 0,
    stride: 0,
    timeArray: [
      ['3分钟','4分钟','5分钟','6分钟','7分钟','8分钟','9分钟','10分钟'],
      ['0秒','1秒','2秒','3秒','4秒','5秒','6秒','7秒','8秒','9秒','10秒','11秒','12秒','13秒','14秒','15秒','16秒','17秒','18秒','19秒','20秒','21秒','22秒','23秒','24秒','25秒','26秒','27秒','28秒','29秒','30秒','31秒','32秒','33秒','34秒','35秒','36秒','37秒','38秒','39秒','40秒','41秒','42秒','43秒','44秒','45秒','46秒','47秒','48秒','49秒','50秒','51秒','52秒','53秒','54秒','55秒','56秒','57秒','58秒','59秒']
    ],
    clockTimes: 0,
    disable: '',
    focus: false,
    subscribe: false
  },
  back: function(){
    wx.navigateBack({
      delta: 0,
    })
  },
  uploadAction:function(){ 
    var that = this
    var openId = app.globalData.openId
    if(openId==''||openId== undefined){
      wx.showToast({
        title: '请先登录小程序！',
        icon: 'none'
      })
      setTimeout(function(){
        wx.switchTab({
          url: '../index/index',
        })
      },1000)
      return
    }
    wx.chooseImage({
      count: 1,
      sizeType: ['original','compressed'],
      sourceType: ['album','camera'],
      success:function(res) {
        var tempFilePaths = res.tempFilePaths
        var userId = app.globalData.userId
        console.log(tempFilePaths)
        wx.showToast({
         icon: "loading",
         title: "正在上传"
        }),
        wx.uploadFile({
           filePath: res.tempFilePaths[0],
          name: 'file',
          url: 'https://applet.51welink.com/sport/user/uploadimg',
          formData: { userId:  userId, fileId:'file' },
          success: function(ret){
            console.log(ret);
            var obj = JSON.parse(ret.data)
            console.log(obj)
            var speedData = obj.data.speed
            console.log(speedData)
            if(speedData!=undefined){
              var speed = speedData;//.replace(/[^0-9]/ig,"")
              if(speed.substring(0, 1)==0){
                speed = speed.substring(1,2) + speed.substring(2).replace("'","′").replace("\"","″");
                that.setData({
                  speed: speed
                })
              }else{
                speed = speed.replace("'","′").replace("\"","″");
                that.setData({
                  speed: speed,
                })
              }
              that.setData({
                distance: obj.data.distance,
                time: obj.data.time,
                energy: obj.data.energy,
                steps: obj.data.steps,
                steps_frequency: obj.data.steps_frequency,
                stride: obj.data.stride
              })
              if(obj.data.date!=undefined){
                that.setData({
                  date: obj.data.date
                })
              }
              console.log(obj.data.date)
            }
            that.setData({
              tempFilePaths: obj.data.img,
              addView: false,
              showView: true
            })
          },
          fail: function(ret){
            console.log(ret)
          }
        })
      }
    })
  },
  delete: function(){
    this.setData({
      showView: false,
      addView: true,
      tempFilePaths: ''
    })
  },
  pickerSpeed: function () {
    this.setData({
      clas: '',
      isShow_03: true,
      focus: false
    })
  },
  sureCallBack_03 (e) {
    this.setData({
      isShow_03: false,
      speed: parseFloat(e.detail.choosedData[0]) + '′' + parseFloat(e.detail.choosedData[1]) + '″'
    })
    console.log(e.detail)
  },
  cancleCallBack_03 () {
    this.setData({
      isShow_03: false,
    })
  },
  initDay: function(){
    var that = this
    var userId = app.globalData.userId
    if(userId == 0){
      return
    }
    var data = {
      userId : userId
    }
    console.log(data)
    util.request('user/getserialday', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      that.setData({
        clockTimes: res.data.data.clockTimes
      })
    })
  },
  submit: function(e){
    //if(app.globalData.)
    wx.requestSubscribeMessage({
      tmplIds: ['atI2vNoA9gxEHR7iiJ8SXNC5-To5F3nz1GdAiJ9jKT8','WFf_l_J8AUitCUTw6x0dztYEz5P_zB5CN6MKUtARrVA','qxTeZfuzyqFwoPYMJ-C8wIfRJaladzRyVDA4CRr2b7c','DidkgePsPJU2N2xnJMEVEhmGu7jwQuXeHnW5T3c3J5E'],
      success (res) { 
        console.log(res)
        var data={
          userId:res.data.data.id
        }
        util.request('user/setSubscribe', 'POST', data, '数据加载中 ...', (res)=>{
          console.log(res);
        })
      }
    })
    var that = this
    var formatDate = e.detail.value
    var userId = app.globalData.userId
    if(userId == 0){
      return
    }
    var data = {
      userId : userId,
      actyId: 0,
      img: that.data.tempFilePaths,
      distance: formatDate.distance,
      speed: that.data.speed,
      remark: '',
      sportTime: that.data.date,
      duration: that.data.time,
      energy: that.data.energy,
      steps: that.data.steps,
      stepRate: that.data.steps_frequency,
      stride: that.data.stride
    }
    console.log(data)
    if(that.data.tempFilePaths == ''){
      wx.showToast({
        title: '请上传图片!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(formatDate.distance == ''){
      wx.showToast({
        title: '距离不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(that.data.speed == ''){
      wx.showToast({
        title: '配速不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    util.request('user/uploadsport', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        console.log(formatDate.distance)
        console.log(that.data.clockTimes)
        that.setData({
          disable: true
        })
        // if(formatDate.distance>=5&&that.data.clockTimes==0){
        //   wx.showToast({
        //     title: '恭喜您，获得2积分',
        //     icon: 'none',
        //     duration: 2000
        //   })
        // } else {
        //   wx.showToast({
        //     title: '打卡成功',
        //     duration: 2000
        //   })
        // }  
        wx.showToast({
          title: '打卡成功',
          icon: 'none',
          duration: 1500
        })  
        setTimeout(function(){
          wx.switchTab({
            url: '../index/index',
          })
        }, 1500)
        
      }else{
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })  
      }
    })
  },
  myLogin: function(userId) {
    var that = this
    console.log("----"+userId)
    if (userId < 1 || userId == undefined) {
      wx.showModal({
        content: '请先登录小程序！',
        success(res) {
          if (res.confirm) {
            util.showLogin((res) => {
              var data = {
                code: res.code,
                encryptedData: "",
                iv: ""
              }
              //取用户的openid
              util.request('user/wxlogin', 'POST', data, '登录中...', (loginRes) => {
                var regData = {
                  openId: loginRes.data.data.openid,
                  unionid: loginRes.data.data.unionid
                }
                util.request('user/wxregister', 'POST', regData, '', (regRes) => {
                  app.globalData.userId = regRes.data.UserId
                  app.globalData.openId = regData.openId
                  wx.setStorageSync('userId', regRes.data.UserId)
                  wx.setStorageSync('openId', regData.openId)
                  var data = {
                    id: regRes.data.UserId,
                    openId: regData.openId
                  }
                  wx.showLoading({
                    title: '加载中',
                    mask: true
                  })
                  util.request('/user/getuserinfo', 'POST', data, '拼命加载中 ...', (res) => {
                    if (res.data.success) {
                      that.setData({
                        avatarUrl: res.data.data.header_url,
                        nickName: res.data.data.nick_name,
                        score: res.data.data.score,
                        level: res.data.data.level,
                        userId: res.data.data.id,
                        duty: res.data.data.duty
                      })
                      if (res.data.data.duty == '团长,管理员' || res.data.data.duty == '管理员,团长') {
                        that.setData({
                          duty: '管理员/团长',
                        })
                      }
                      wx.hideLoading({
                        success: (res) => {},
                      })
                    } else {
                      app.globalData.userId = 0;
                      that.setData({
                        userId: 0
                      })
                      wx.clearStorageSync();
                      wx.hideLoading({
                        success: (res) => {},
                      })
                    }
                  })
                })
              })
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
      })
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({}) //此页面禁止转发
    var userId = app.globalData.userId
    this.myLogin(userId)
    this.setData({
      userId: userId
    })
    var data = {
      id: userId
    }
    var that = this
    util.request('user/get', 'POST', data, '数据加载中...', (res)=>{
      if(res.data.success){
        that.setData({
          subscribe: res.data.data.subscribe
        })
        
      }
    })
    this.initDay()
  }
})
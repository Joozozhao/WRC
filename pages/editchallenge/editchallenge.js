// pages/editchallenge/editchallenge.js
// pages/creat/creat.js
const util = require('../../utils/util.js')
var now_time = util.formatTime(new Date())
let endDate = util.formatTime(new Date(new Date().getTime() + 24 * 60 * 60 * 1000))
//明天的时间
var day1 = new Date()
day1.setTime(day1.getTime()+24*60*60*1000)
var s1 = day1.getFullYear()+"-"+(day1.getMonth()+1) + "-" +day1.getDate()
var s2 = (day1.getFullYear()+10)+"-"+(day1.getMonth()+1) + "-" +day1.getDate()
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showView: false,
    addView: true,
    startTime: now_time.substring(0,10),
    // startTime: s1 +' '+ '00:00:00',
    endTime: endDate.substring(0,10),
    isPickerRender: false,
    isPickerShow: false,
    focus: false,
    pickerConfig: {
      endDate: true,
      column: "first",
      dateLimit: false,
      // initStartTime: s1 +' '+ '00:00:00',
      initStartTime: now_time.substring(0,10),
      initEndTime: '',
      // limitStartTime: s1 +' '+ '00:00:00',
      limitStartTime: now_time.substring(0,10),
      limitEndTime: s2 
    },
    actyType: '挑战',
    formatDate: '',
    tempFilePaths: '',
    actyId: '',
    checkOr: '',
    hasMobile: 0,
    sealType: '',
    showModal: false,
    remark:'',
    type: 1,
    stype: 0,
    score: 0,
    runCon: true,
    avastars: [],
    actyMember: [],
    defaultSort: 0,
    totalMan: 0,
    totalIn: 0
  },
  pickerShow: function(){
    this.setData({
      isPickerShow: true,
      isPickerRender: true,
      chartHide: true,
      focus: false
    })
  },
  pickerHide: function() {
    this.setData({
      isPickerShow: false,
      chartHide: false
    });
  },
  setPickerTime: function(val) {
    console.log(val);
    let data = val.detail;
    // var startTime = util.dislodgeZero(data.startTime)
    // var endTime = util.dislodgeZero(data.endTime)
    this.setData({
      startTime: data.startTime.substring(0,10),
      endTime: data.endTime.substring(0,10)
    })
  },
  uploadAction: function(){
    var that =this;
    wx.chooseImage({
      count: 1,
      sizeType: ['original','compressed'],
      sourceType: ['album','camera'],
      success:function(res) {
        var tempFilePaths = res.tempFilePaths[0]
        var userId = app.globalData.userId
        console.log(tempFilePaths)
        wx.navigateTo({
          url: `../cropper2/cropper?src=${tempFilePaths}`,
        })
//         wx.showToast({
//          icon: "loading",
//          title: "正在上传"
//          }),
//          wx.uploadFile({
//            filePath: res.tempFilePaths[0],
//           name: 'file',
//           url: 'https://applet.51welink.com/sport/acty/uploadimg',
//           formData: { userId:  userId, fileId:'file' },
//           success: function(ret){
//             console.log(ret);
//             var obj = JSON.parse(ret.data)
//             that.setData({
//               tempFilePaths: obj.data.img,
//               addView: false,
//               showView: true
//             })
//           },
//           fail: function(ret){
//             console.log(ret)
//           }
//         })
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
  checkOr: function(){
    if(this.data.hasMobile == 0){
      this.setData({
        checkOr: true,
        hasMobile: 1
      })
    } else {
      this.setData({
        checkOr: '',
        hasMobile: 0
      })
    }
  },
  choose: function(e){
    // var stype = e.detail.value
    this.setData({
      stype: 0
    })
  },
  choose2: function(e){
    // var stype = e.detail.value
    this.setData({
      stype: 1
    })
  },
  toList: function(){
    this.setData({
      runModal: true
    })
  },
  checkboxChange2: function(e){
    var that = this
    var avastars = that.data.avastars
    var indexes = e.detail.value
    for (var i = 0, lenI = avastars.length; i < lenI; ++i) {
      avastars[i].checked = false
      for (var j = 0, lenJ = indexes.length; j < lenJ; ++j) {
        if (avastars[i].value === indexes[j]) {
          avastars[i].checked = true
          break
        }
      }
    } 
    console.log(indexes)
    that.setData({
      avastars,
      userid: indexes,
      totalMan: indexes.length
    })
  },
  onConfirm2: function () {
    var that = this 
      that.setState()
      that.setData({
        runModal: false
      })
  },
  onCancel2: function(){
    this.setData({
      runModal: false
    })
  },
  // signIn: function(){
  //   var that = this
  //   var allId = that.data.userid
  //   console.log(allId)
  //   var userCount = allId.toString()
  //   var data = {
  //     actyId : that.data.actyId,
  //     userId : userCount,
  //     distance: that.data.target,
  //     hasDistance: 0,
  //     userName: formatDate.userName,
  //     mobile: formatDate.mobile
  //   }
  //   console.log(data)
  //   util.request('acty/joinacty', 'POST', data, '数据加载中 ...', (res)=>{
  //     if(res.data.success){
  //     console.log(res)
  //     that.setData({
  //       disable: true
  //     })
      
  //       wx.showToast({
  //         title: '报名成功',
  //         duration: 1000
  //       })
  //       // wx.navigateBack({
  //       //   delta: 0,
  //       // })
  //       wx.redirectTo({
  //         url: '../activitydetail/activitydetail?id='+that.data.actyId + '&has_name='+that.data.hasName+'&has_mobile='+that.data.hasMobile+'&target='+that.data.target+'&acty_type='+that.data.acty_type
  //       })
  //     }else{
  //       wx.showToast({
  //         title: res.data.error,
  //         icon: 'none',
  //         duration: 1500
  //       })  
  //     }
  //   })
  // },
  //人员名单
  initActyIn: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    console.log(data)
    util.request('acty/chooseuser', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          actyMember: res.data.data,
          avastars: res.data.data,
          runCon: true,
        })
        var IDs = []
        for(var i=0;i<res.data.total;i++){
          var idArr = {}
          if(res.data.data[i].state==1){
            idArr = res.data.data[i].id
            IDs.push(idArr)    
            that.setData({
              totalIn: IDs.length
            })    
            console.log(that.data.totalIn)  
          }
        }
        that.setData({
          userid: IDs.toString()
        })
      }else{
        this.setData({
          runCon: false
        })
        // wx.showToast({
        //   title: res.data.error,
        //   icon: 'none',
        //   duration: 1500
        // })  
      }
    })
  },
  //提交参加活动人员
  setState: function(){
    var that = this
    var allId = that.data.userid
    var userCount = allId.toString()
    var data = {
      userId: userCount,
      actyId: that.data.actyId
    }
    console.log(data)
    util.request('acty/choosejoinacty', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        this.initActyIn()
        wx.showToast({
          title: '报名成功',
          duration: 1000
        })
      }
    })
  },
  // getActyRule(){
  //   var that = this
  //   var userId = app.globalData.userId
  //   var data = {
  //     acty_id: that.data.actyId,
  //     user_id: 4
  //   }
  //   util.request('acty/listRule', 'POST', data, '数据加载中 ...', (res)=>{
  //     console.log(res)
  //     if(res.data.success){

  //     }
  //   })
  // },
  submit: function(e){
    var that = this
    var formatDate = e.detail.value
    var userId = app.globalData.userId    
    var data = {
      userId: userId,
      actyId: that.data.actyId,
      actyName: formatDate.actyName,
      actyType: that.data.actyType,
      startTime: that.data.startTime +' '+'00:00:00',
      endTime: that.data.endTime +' '+'23:59:59',
      address: '',
      region: '',
      remark: formatDate.remark,
      distance: formatDate.distance,
      actyImg: that.data.tempFilePaths,
      hasMobile: that.data.hasMobile,
      hasName: 1,
      stype: that.data.stype,
      score: formatDate.score,
      level: 0
    }
    console.log(data)
    if(formatDate.actyName == ''){
      wx.showToast({
        title: '名称不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(that.data.startTime == ''){
      wx.showToast({
        title: '请选择开始时间!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(that.data.startTime == ''){
      wx.showToast({
        title: '请选择结束时间!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (formatDate.distance == ''){
      wx.showToast({
        title: '挑战距离不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(that.data.tempFilePaths == ''){
      wx.showToast({
        title: '请上传封面!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    util.request('acty/save', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        wx.showToast({
          title: '编辑成功',
          duration: 1000
        })
        setTimeout(function(){
          wx.switchTab({
            url: '../challenge/challenge',
          })
        }, 1000)
      }else{
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })  
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    wx.hideShareMenu({})
    this.setData({
      actyId: id
    })
    this.initActivity(id)
    this.initActyIn()
    // this.getActyRule(id)
  },
  initActivity: function(id){
    var that = this
    var data = {
      actyId: id
    }
    console.log(data)
    util.request('acty/getdetail', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        var startStr = "pickerConfig.initStartTime"
        var endStr = "pickerConfig.initEndTime"
        that.setData({
          sealType: res.data.data.region,
          actyType: res.data.data.acty_type,
          actyName: res.data.data.acty_name,
          startTime: res.data.data.start_timestr.substring(0,10),
          [startStr]: res.data.data.start_timestr.substring(0,10),
          endTime: res.data.data.end_timestr.substring(0,10),
          [endStr]: res.data.data.end_timestr.substring(0,10),
          distance: res.data.data.distance,
          tempFilePaths: res.data.data.acty_img,
          remark: res.data.data.remark,
          score: res.data.data.snum,
          stype: res.data.data.stype,
          addView: false,
          showView: true,
          hasMobile: res.data.data.has_mobile,
          hasName: res.data.data.has_name
        })
        if(that.data.hasMobile == 1){
          that.setData({
            checkOr: true
          })
        } else {
          that.setData({
            checkOr: ''
          })
        }
      }else{
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })  
      }
    })
  }
})
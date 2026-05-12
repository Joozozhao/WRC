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
    // endTime: s1 +' '+ '23:59:59',
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
      initEndTime: s1,
      // limitStartTime: s1 +' '+ '00:00:00',
      limitStartTime: now_time.substring(0,10),
      limitEndTime: s2
    },
    actyType: '挑战',
    formatDate: '',
    tempFilePaths: '',
    checkOr: '',
    special: false,
    hasMobile: 0,
    sealType: '',
    showModal: false,
    remark:'',
    type: 1,
    stype: 0,
    score: 0,
    disable: ''
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
        // wx.showToast({
        //  icon: "loading",
        //  title: "正在上传"
        // }),
//         wx.uploadFile({
//           filePath: res.tempFilePaths[0],
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
  special: function(){
    if(this.data.special == false){
      this.setData({
        special: true,
        actyType: 'V挑战'
      })
    } else {
      this.setData({
        special: false,
        actyType: '挑战'
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
  submit: function(e){
    var that = this
    var formatDate = e.detail.value
    var userId = app.globalData.userId    
    var data = {
      userId: userId,
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
        that.setData({
          disable: true
        })
        wx.showToast({
          title: '创建成功',
          duration: 1000
        })
        wx.switchTab({
          url: '../challenge/challenge',
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    wx.hideShareMenu({})
  }
})
// pages/creat/creat.js
const util = require('../../utils/util.js')
var now_time = util.formatTime(new Date())
//明天的时间
var day1 = new Date()
day1.setTime(day1.getTime()+24*60*60*1000)
var s1 = day1.getFullYear()+"-" + 0 +(day1.getMonth()+1) + "-" + 0 +day1.getDate()
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    showView: false,
    addView: true,
    startTime: '',
    endTime: '',
    isPickerRender: false,
    isPickerShow: false,
    focus: false,
    pickerConfig: {
      endDate: true,
      column: "second",
      dateLimit: false,
      // initStartTime: s1 +' '+ '00:00:00',
      // initEndTime: s1 +' '+ '23:59:59',
      initStartTime: '',
      initEndTime: '',
      limitStartTime: s1 +' '+ '00:00:00',
      limitEndTime: s1 +' '+ '23:59:59'
    },
    formatDate: '',
    tempFilePaths: '',
    actyId: 0,
    hasMobile: 0,
    sealType: '',
    showModal: false,
    sealTypeList: [
      {
        gzkind: '北京',
        id: 1,
        checked: ''
      },
      {
        gzkind: '日照',
        id: 2,
        checked: ''
      },
      {
        gzkind: '其他地区',
        id: 3,
        checked: ''
      }
    ],
    stype: 0,
    score: 0,
    avastars: [],
    actyMember: [],
    listData: [],
    runModal: false,
    defaultShow: true,
    picShow: '',
    runCon: false,
    hasRun: 0,
    actyIn: 0,
    userid: 0,
    actyid: 0,
    listSel: false,
    checked: false,
    hasPart: 0,
    totalMan: 0
  },
  //地区选择
  pickArea: function(){
    this.setData({
      showModal: true
    })
  },
  checkboxChange: function (e) {
    let that = this;
    let sealTypeList = this.data.sealTypeList;
    // 若之前已选择公章，将其回显打勾
    
    for (let i = 0; i < sealTypeList.length; i++) {
      sealTypeList[i].checked = false;
    }
    let indexes = e.detail.value;
    for (let i = 0; i < indexes.length; i++) {
      indexes[i] = parseInt(indexes[i]);
      // 多选框从1开始，数组下标从0开始，所以需要减1
      sealTypeList[indexes[i] - 1].checked = true;
    }
    // 直接将整个list赋值回去
    this.setData({
      sealTypeList: sealTypeList
    })
  },
  // 用户点击确定
  onConfirm: function () {
    let that = this;
    let seals = [];
    let sealTypeList = this.data.sealTypeList;
    sealTypeList.forEach(function (e) {
      if (e.checked) {
        // gzkind是对象的一个属性，表示具体公章类型名的字符串
        seals.push(e.gzkind);
      }
    });
    // 显示到wxml上
    this.setData({
      sealType: seals.join(","),
      showModal: false
    })
  },
  // 用户点击取消
  onCancel: function () {
    let that = this;
    let sealTypeList = this.data.sealTypeList;
    // 获取上一次选择的用印类型字符串（规定用，隔开）
    let gzkind = this.data.sealType || "";
    // 放弃当前的勾选，原来谁checked，谁就checked
    sealTypeList.forEach(function (e) {
      e.checked = false;
    });
    if (gzkind !== "") {
      gzkind = gzkind.split(",");
      for (let i = 0; i < gzkind.length; i++) {
        for (let j = 0; j < sealTypeList.length; j++) {
          let e = sealTypeList[j];
          if (e.gzkind == gzkind[i]) {
            e.checked = true;
          }
        }
      }
    }
    this.setData({
      sealTypeList: sealTypeList,
      showModal: false
    })
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
    let data = val.detail;
    this.setData({
      startTime: data.startTime,
      endTime: data.endTime
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
        wx.navigateTo({
          url: `../cropper/cropper?src=${tempFilePaths}`,
        })
//         wx.showToast({
//          icon: "loading",
//          title: "正在上传"
//          }),
//          wx.uploadFile({
//           filePath: res.tempFilePaths[0],
//           name: 'file',
//           url: 'https://applet.51welink.com/sport/acty/uploadimg',
//           formData: { userId:  userId, fileId:'file' },
//           success: function(ret){
//             var obj = JSON.parse(ret.data)
//             that.setData({
//               tempFilePaths: obj.data.img,
//               addView: false,
//               showView: true
//             })
//           },
//           fail: function(ret){
//           }
//         })
      }
    })
  },
  uploadAction2: function(){
    var that =this
    var actyId = that.data.actyId
    wx.chooseImage({
      count: 1,
      sizeType: ['original','compressed'],
      sourceType: ['album','camera'],
      success:function(res) {
        var tempFilePaths = res.tempFilePaths
        for (var i = 0; i < tempFilePaths.length; i++) {
          // tempFilePaths.push(tempFilePaths[i])
        wx.showToast({
         icon: "loading",
         title: "正在上传"
         }),
         wx.uploadFile({
          filePath: res.tempFilePaths[i],
          name: 'file',
          url: 'https://applet.51welink.com/sport/acty/uploadactyimg',
          formData: { actyId: actyId, fileId:'file' },
          success: function(ret){
            var obj = JSON.parse(ret.data)
            that.getUrl()
          },
          fail: function(ret){
          }
        })
      }
      }
    })
  },
   /**长按删除 */
   bindlongpressimg(e){
    let that = this
    var deleID = e.currentTarget.dataset.id    //获取点击项目的内容
    var detailPics = that.data.detailPics;
    wx.showModal({
      title: '提示',
      content: '确定要删除此图片吗？',
      success: function (res) {
       if (res.confirm) {
        var data = {
          id: deleID
        }
        util.request('acty/delactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
          if(res.data.success){
            detailPics.splice(deleID,1)
            var data = {
              actyId: that.data.actyId
            }
            util.request('acty/getactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
              if(res.data.success){
                that.setData({
                  detailPics: res.data.data
                })
                wx.showToast({
                  title: '已删除',
                  icon: 'none',
                  duration: 1500
                })
              } else {
                that.setData({
                  detailPics: []
                })
              }
            })
          }
        })
       } else if (res.cancel) {
         return false;   
        }
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
  picShow: function(){
    if(this.data.hasPart==0){
      this.setData({
        picShow: true,
        hasPart: 1,
        runCon: true
      })
    } else {
      this.setData({
        picShow: '',
        hasPart: 0,
        runCon: false
      })
    }
  },
  getUrl:function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          detailPics: res.data.data
        })
      }
    })
  },
  toList: function(){
    this.initList()
    this.setData({
      runModal: true
    })
  },
  //选中人数
  initActyIn: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getclickuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        this.setData({
          actyMember: res.data.data,
          runCon: true,
          totalMan: res.data.total
        })
        if(that.data.actyMember.length>0){
          that.setData({
            picShow: true,
            hasPart: 1
          })
        }
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
  //更新状态
  setState: function(){
    var that = this
    var allId = that.data.userid
    var userCount = allId.toString()
    var data = {
      userIds: userCount,
      actyId: that.data.actyId
    }
    util.request('acty/updatejoinstate', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.initActyIn()
      }
    })
  },
  //加载合影
  loadPic: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          showImgUrl: res.data.data
        })
      }
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
    that.setData({
      avastars,
      userid: indexes,
      totalMan: indexes.length
    })
  },
  // 用户点击确定
  onConfirm2: function () {
    var that = this 
      that.setState()
      that.initActyIn()
      that.setData({
        runModal: false
      })
  },
  onCancel2: function(){
    this.setData({
      runModal: false
    })
  },
  submit: function(e){
    var that = this
    var formatDate = e.detail.value
    var userId = app.globalData.userId
    var data = {
      userId: userId,
      actyId: that.data.actyId,
      actyName: formatDate.actyName,
      actyType: that.data.actyType,
      startTime: that.data.startTime,
      endTime: that.data.endTime,
      address: formatDate.address,
      region: that.data.sealType,
      remark: '',
      distance: formatDate.distance,
      actyImg: that.data.tempFilePaths,
      hasMobile: that.data.hasMobile,
      hasName: 1,
      stype: that.data.stype,
      level: that.data.hasPart,
      score: 0
    }
    if(that.data.sealType == ''){
      wx.showToast({
        title: '请选择活动地区!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(formatDate.actyName == ''){
      wx.showToast({
        title: '名称不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(formatDate.address == ''){
      wx.showToast({
        title: '地点不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
     if (formatDate.distance == ''){
      wx.showToast({
        title: '距离不能为空!',
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
      if(res.data.success){
        wx.showToast({
          title: '修改成功',
          duration: 1000
        })
        wx.switchTab({
          url: '../activity/activity',
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
  initList: function(id){
    var that = this
    var userId = app.globalData.userId
    // 获取报名人数
    var data = {
      actyId: that.data.actyId,
      userId: userId,
      level: '',
      distance: 1,
      userName: '',
      mobile: ''
    } 
    util.request('acty/getactyuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var dataAll = res.data.data
        this.setData({
          avastars: dataAll
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    wx.hideShareMenu({})
    this.setData({
      actyId: id
    })
    this.initActivity()
    // this.initList(id)
    this.initActyIn()
    this.loadPic()
    this.getUrl()
  },
  initActivity: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getdetail', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var startStr = "pickerConfig.initStartTime"
        var endStr = "pickerConfig.initEndTime"
        that.setData({
          sealType: res.data.data.region,
          actyType: res.data.data.acty_type,
          actyName: res.data.data.acty_name,
          startTime: res.data.data.start_timestr,
          [startStr]: res.data.data.start_timestr,
          endTime: res.data.data.end_timestr,
          [endStr]: res.data.data.end_timestr,
          address: res.data.data.address,
          distance: res.data.data.distance,
          tempFilePaths: res.data.data.acty_img,
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
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // this.initActivity()
    // // this.initList(id)
    // this.initActyIn()
    // this.loadPic()
    // this.getUrl()
  }
})
// pages/addtype/addtype.js
var util = require('../../utils/util.js')
var now_time = util.formatTime(new Date())
var endDate = util.formatTime(new Date(new Date().getTime() + 24 * 60 * 60 * 1000))
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
    stype: 0,
    sextype: 1,
    actype: 1,
    type: true,
    actyId: '',
    weekDay: 0,
    monthDay: 0,
    score: 0,
    focus: false,
    startTime: now_time.substring(0,10),
    endTime: endDate.substring(0,10),
    isPickerRender: false,
    isPickerShow: false,
    pickerConfig: {
      endDate: true,
      column: "first",
      dateLimit: false,
      initStartTime: now_time.substring(0,10),
      initEndTime: s1,
      limitStartTime: now_time.substring(0,10),
      limitEndTime: s2
    },
  },
  initTime: function(){
    if(day1.getMonth()+1<10||day1.getDate()<10){
      var s1 = day1.getFullYear()+"-"+0+(day1.getMonth()+1) + "-" +0+day1.getDate()
      var s2 = (day1.getFullYear()+10)+"-"+0+(day1.getMonth()+1) + "-" +0+day1.getDate()
    }else{
      var s1 = day1.getFullYear()+"-"+(day1.getMonth()+1) + "-" +day1.getDate()
      var s2 = (day1.getFullYear()+10)+"-"+(day1.getMonth()+1) + "-" +day1.getDate()
    }
    let  initEndTime = 'pickerConfig.initEndTime'
    let  limitEndTime = 'pickerConfig.limitEndTime'
    this.setData({
      endTime: s1,
      [initEndTime]: s1,
      [limitEndTime]: s2
    })
  },
  choose:function(e){
    var that = this
    that.setData({
      actype:e.target.dataset.type
    })
    this.initRules()
  },
  chooseSex: function(){
    this.setData({
      sextype: 1
    })
    this.initRules()
  },
  chooseSex2: function(){
    this.setData({
      sextype: 2
    })
    this.initRules()
  },
  chooseScore:function(){
    this.setData({
      stype: 0
    })
  },
  chooseScore2:function(){
    this.setData({
      stype: 1
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
    // var startTime = util.dislodgeZero(data.startTime)
    // var endTime = util.dislodgeZero(data.endTime)
    this.setData({
      startTime: data.startTime.substring(0,10),
      endTime: data.endTime.substring(0,10)
    })
  },
  submit:function(e){
    var that = this
    var formData = e.detail.value
    var data = {
      id: 0,
      acty_id: that.data.actyId,
      rule_type: that.data.actype,
      sex: that.data.sextype,
      target: formData.distance,
      start: that.data.startTime +' '+'00:00:00',
      end: that.data.endTime +' '+'23:59:59',
      week: formData.weekDay,
      month: formData.monthDay,
      score_type: that.data.stype,
      score: formData.score,
      remark: formData.remark
    }
    if(formData.distance == ''){
      wx.showToast({
        title: '请输入月跑公里!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    util.request('acty/saveRule', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        wx.showToast({
          title: '添加成功',
          icon: 'none',
          duration: 1500
        })
      }
    })
  },
  initRules: function(){
    var that = this
    var data ={
      acty_id: that.data.actyId,
      acty_type: that.data.actype,
      sex: that.data.sextype
    }
    util.request('acty/getActyRuleByType', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var allData = res.data.data
        var start = allData.start_time
        var end = allData.end_time
        var startStr = "pickerConfig.initStartTime"
        var endStr = "pickerConfig.initEndTime"
        that.setData({
          sextype: allData.sex,
          actype: allData.acty_type,
          startTime: start.substring(0,10),
          endTime: end.substring(0,10),
          [startStr]: start.substring(0,10),
          [endStr]: end.substring(0,10),
          stype: allData.score_type,
          score: allData.score,
          weekDay: allData.week,
          monthDay: allData.month,
          distance: allData.distance,
          remark: allData.remark
        })
      }else{
        that.setData({
          sextype: that.data.sextype,
          actype: that.data.actype,
          startTime: now_time.substring(0,10),
          endTime: endDate.substring(0,10),
          stype: 0,
          score: 0,
          weekDay: '',
          monthDay: '',
          distance: '',
          remark: ''
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.setData({
      actyId: id
    })
    this.initRules(id)
    this.initTime()
  }
})
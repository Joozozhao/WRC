// pages/othersdata/othersdata.js
const util = require('../../utils/util.js')
const option = require('../../utils/options.js')
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth()
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    weekChoosed: true,
    monthChoosed: false,
    yearChoosed: false,
    weekShow: true,
    monthShow: false,
    yearShow: false,
    tabbar: {},
    actyId: '',
    rule_id1: '',
    rule_id2: '',
    sex:1,
    score: 0,
    energy: 0,
    starTime: '',
    endTime: '',
    activityList: [],
    totalChallenge: 0,
    activityList2: [],
    totalActy: 0,
    page: 1,
    page2: 1,
    haveSuperActy: false,
    echartShow: false,
    echartShow2: false,
    monthWeekCount: '',
    ecBar: {
      layzLoad: true,
      disableTouch: true
    }, 
    ecPie0:{
      layzLoad: true,
      disableTouch: true
    },
    ecPie00:{
      layzLoad: true,
      disableTouch: true
    },
    //周数据
    ecPie1:{
      layzLoad: true,
      disableTouch: true
    },
    ecPie2:{
      layzLoad: true,
      disableTouch: true
    },
    passDistance: '',
    passMonth: '',
    pasStartDate: '',
    passEndDate: '',
    passWeek: '',
    passDistance2: '',
    passMonth2: '',
    pasStartDate2: '',
    passEndDate2: '',
    passWeek2: '',
    monthTotal: '',
    monthTotal2: '',
    swiper: {
      autoplay: false,
      interval: 2000,
      duration: 500,
      current: 0,
      circular: false,
      qualifications: []
    },
    swiper2: {
      autoplay: false,
      interval: 2000,
      duration: 500,
      current: 0,
      circular: false,
      qualifications: []
    }
  },
  //初始化用户信息
  initInfor: function(id){
    var that = this
    var data = { 
      userId : id
    }
    util.request('user/getsportinfo', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        var myData = res.data.data
        that.setData({
          headerImg: myData.headerImg,
          userName: myData.userName,
          nickName: myData.nickName,
          sex: myData.sex,
          level: myData.level,
          score: myData.score,
          energy: myData.energy,
          duty: res.data.data.duty,
          monthDistance: myData.monthDistance,
          totalDistance: myData.totalDistance          
        })
        if(this.data.userName!=''){
          wx.setNavigationBarTitle({
            title: this.data.userName+'的主页'
          })
        } else{
          wx.setNavigationBarTitle({
            title: this.data.nickName+'的主页'
          })
        }
        if(res.data.data.duty=='团长,管理员'||res.data.data.duty=='管理员,团长'){
          that.setData({
            duty : '管理员/团长'
          })
        }
      }
    })
  },
  weekClick: function(){
    this.setData({
      weekShow: true,
      weekChoosed: true,
      monthChoosed: false,
      monthShow: false,
      yearChoosed: false,
      yearShow: false
    })
  },
  monthClick: function(){
    this.setData({
      monthShow: true,
      monthChoosed: true,
      weekChoosed: false,
      weekShow: false,
      yearChoosed: false,
      yearShow: false
    })
  },
  yearClick: function(){
    this.setData({
      yearChoosed: true,
      yearShow: true,
      monthShow: false,
      monthChoosed: false,
      weekChoosed: false,
      weekShow: false
    })
  },
  //获取超级V挑战活动ID
  getChallengeId:function(id){
    var that = this
    var data = {
      user_id: id
    }
    console.log(data)
    util.request('user/getUserJoinActy', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          actyId: res.data.data[`V挑战`],
        })
        if(that.data.actyId!=undefined){
          that.initData()
          that.initData2()
          that.setData({
            haveSuperActy: true
          })
        }else{
          that.setData({
            haveSuperActy: false
          })
        }
      }
    })
  },
  initData: function(){
    var that = this
    var data = {
      acty_id: that.data.actyId,
      acty_type: 1,
      sex: that.data.sex
    }
    console.log(data)
    util.request('acty/getActyRuleByType', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          rule_id1: res.data.data.id,
          passWeek: res.data.data.week,
        })
        that.getRule1()
      } else {
        
      }
    })
  },
  initData2: function(){
    var that = this
    var data = {
      acty_id: that.data.actyId,
      acty_type: 2,
      sex: that.data.sex
    }
    console.log(data)
    util.request('acty/getActyRuleByType', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          rule_id2: res.data.data.id,
          passWeek2: res.data.data.week
        })
        console.log(that.data.passWeek2)
        that.getRule2()
      } else {
        
      }
    })
  },
  getRule1: function(){
    var that = this
    var data={
      acty_id: that.data.actyId,
      rule_id: that.data.rule_id1,
      user_id: parseInt(that.data.userid)
    }
    console.log(data)
    util.request('user/getRuleResult', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)      
      if(res.data.success){
        var list = 'swiper.qualifications'
        that.setData({
          passDistance: res.data.data.distance,
          passMonth: res.data.data.month,
          passEndDate: res.data.data.end_time.substring(0,7),
          pasStartDate: res.data.data.start_time.substring(0,7),
          monthTotal: res.data.data.month,
          [list]: res.data.data.finish_month,
          echartShow: true
        })
        console.log(that.data.passWeek)
        console.log(that.data.swiper)
        var nowDate
        var nowMonth = currentMonth+1
        if(currentMonth<10){
          nowDate = currentYear +'-'+'0'+ nowMonth
        }else{
          nowDate = currentYear +'-'+ nowMonth
        }
        var obj = that.data.swiper.qualifications
        var data = Object.keys(obj)
        console.log(data)
        for(var i=0;i<data.length;i++){
          if(data[i]==nowDate){
            console.log(i)
            var cur = 'swiper.current'
            that.setData({
              [cur]: i
            })
          }
        }
      } else {
        
      }
    })
  },
  getRule2: function(){
    var that = this
    var data={
      acty_id: that.data.actyId,
      rule_id: that.data.rule_id2,
      user_id: parseInt(that.data.userid)
    }
    console.log(data)
    util.request('user/getRuleResult', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)      
      if(res.data.success){
        var list = 'swiper2.qualifications'
        that.setData({
          passDistance2: res.data.data.distance,
          passMonth2: res.data.data.month,
          passEndDate2: res.data.data.end_time.substring(0,7),
          pasStartDate2: res.data.data.start_time.substring(0,7),
          monthTotal2: res.data.data.month,
          [list]: res.data.data.finish_month,
          echartShow2: true
        })
        console.log(that.data.swiper2)
        var nowDate
        var nowMonth = currentMonth+1
        if(nowMonth<10){
          nowDate = currentYear +'-'+'0'+ nowMonth
        }else{
          nowDate = currentYear +'-'+ nowMonth
        }
        var obj = that.data.swiper2.qualifications
        var data = Object.keys(obj)
        console.log(data)
        for(var i=0;i<data.length;i++){
          if(data[i]==nowDate){
            console.log(i)
            var cur = 'swiper2.current'
            that.setData({
              [cur]: i
            })
          }
        }
      } else {
      }
    })
  },
  prev: function(){
    var swiper = this.data.swiper;
    var current = swiper.current;
    var arr = Object.keys(swiper.qualifications)
    console.log(arr)
    swiper.current = current > 0 ? current - 1 : arr.length - 1;
    this.setData({
      swiper: swiper
    })
  },
  next: function(){
    var swiper = this.data.swiper;
    var current = swiper.current;
    var arr = Object.keys(swiper.qualifications)
    console.log(arr)
    swiper.current = current < (arr.length - 1) ? current + 1 : 0;
    this.setData({
      swiper: swiper
    })
  },
  prev2: function(){
    var swiper = this.data.swiper2;
    var current = swiper.current;
    var arr = Object.keys(swiper.qualifications)
    console.log(arr)
    swiper.current = current > 0 ? current - 1 : arr.length - 1;
    this.setData({
      swiper2: swiper
    })
  },
  next2: function(){
    var swiper = this.data.swiper2;
    var current = swiper.current;
    var arr = Object.keys(swiper.qualifications)
    console.log(arr)
    swiper.current = current < (arr.length - 1) ? current + 1 : 0;
    this.setData({
      swiper2: swiper
    })
  },
  //挑战
  initActy: function(id){
    var that = this
    var data = {
      userId: id,
      type: '挑战',
      page: that.data.page++
    }
    console.log(data)
    util.request('acty/getacty', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)      
      if(res.data.success){
        var allData = res.data.data
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].start_timestr.substring(0, 16)
          var endTime = allData[i].end_timestr.substring(11, 16)
          allData[i].start_timestr = createTime 
          allData[i].end_timestr = endTime 
        }
        that.setData({
          activityList: allData,
          start_timestr: createTime,
          end_timestr: endTime,
          totalChallenge: res.data.total
        })
      }else{
        that.setData({
          activityList: []
        })
      }
    })
  },
  //团跑
  initActy2: function(id){
    var that = this
    var data = {
      userId: id,
      type: '团跑',
      page: that.data.page2++
    }
    console.log(data)
    util.request('acty/getacty', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)      
      if(res.data.success){
        var allData = res.data.data
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].start_timestr.substring(0, 16)
          var endTime = allData[i].end_timestr.substring(11, 16)
          allData[i].start_timestr = createTime 
          allData[i].end_timestr = endTime 
        } 
        that.setData({
          activityList2: allData,
          start_timestr: createTime,
          end_timestr: endTime,
          totalActy: res.data.total
        })
      }else{
        that.setData({
          activityList2: []
        })
      }
    })
  },
   //初始化周跑数据
  initBarData: function(e){
    var that = this
    var weekArr = []
    var data = {
      user_id: that.data.userid
    }
    util.request('user/getWeekRuleList', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          starTime: res.data.data[0].sport_day.substring(5,10),
          endTime: res.data.data[6].sport_day.substring(5,10),
        })
        var allData = res.data.data
        var max =0;
        for(var i=0; i<allData.length;i++){
          var distance = allData[i].sport_total
          console.log(distance)
          weekArr.push(distance)
        }
        max = Math.max.apply(null, weekArr)
        if(Math.floor(max/5)!=max/5){
          max= Math.ceil(max/5)*5
        }
        var weekObj = { ...weekArr }
        //load bar 
        option.initBar(e.detail.canvas, e.detail.width, e.detail.height,e.detail.dpr,weekObj,max)
      }
    })
  },
  //初始化月跑数据
  initMonthData: function (e) {
    var that = this
    var monthArr = []
    if (that.data.userid == undefined) {
      return
    }
    var data = {
      user_id: that.data.userid
    }
    util.request('user/getMonthList', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        var nowDate
        var nowMonth = currentMonth + 1
        if (nowMonth < 10) {
          nowDate = currentYear + '-' + '0' + nowMonth
        } else {
          nowDate = currentYear + '-' + nowMonth
        }
        var monthData = res.data.data[nowDate]
        var max = 0;
        for (var i = 0; i < monthData.length; i++) {
          var distance = monthData[i].sport_total
          monthArr.push(distance)
        }
        max = Math.max.apply(null, monthArr)
        if (Math.floor(max / 5) != max / 5) {
          max = Math.ceil(max / 5) * 5
        }
        //load bar 
        option.initBar2(e.detail.canvas, e.detail.width, e.detail.height, e.detail.dpr, monthArr, max)
      }
    })
  },
  initYearData: function (e) {
    var that = this
    var monthArr = []
    if (that.data.userid == undefined) {
      return
    }
    var data = {
      user_id: that.data.userid
    }
    util.request('user/getYearMonthList', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        var max = 0;
        for (var i = 0; i < res.data.data.length; i++) {
          var distance = res.data.data[i].sport_total
          if(i == 0) {
            max = distance
          }
          if(max < distance) {
            max = distance
          }
          monthArr.push(distance)
        }
        //load bar 
        option.initBar3(e.detail.canvas, e.detail.width, e.detail.height, e.detail.dpr, monthArr, max)
      }
    })
  },
  //初始化*资格/*挑战数据
  initPie0: function(e){
    var days = e.target.dataset.days
    var list = e.target.dataset.list
    option.initCirle0(e.detail.canvas, e.detail.width, e.detail.height,e.detail.dpr,list,this.data.monthTotal,days)
  },
  initPie00: function(e){
    var days = e.target.dataset.days
    var list = e.target.dataset.list
    option.initCirle0(e.detail.canvas, e.detail.width, e.detail.height,e.detail.dpr,list,this.data.monthTotal2,days)
  },
  initPie1: function(e){
    var times = e.target.dataset.times
    option.initCirle(e.detail.canvas, e.detail.width, e.detail.height,e.detail.dpr,times,this.data.passWeek)
  },
  initPie2: function(e){
    var times = e.target.dataset.times
    option.initCirle(e.detail.canvas, e.detail.width, e.detail.height,e.detail.dpr,times,this.data.passWeek2)
  },
  toDet: function(e){
    console.log(e)
    let id = e.detail.id
    let type = e.detail.type
    if(type == '挑战'){
      wx.navigateTo({
        url: '../challengedetail/challengedetail?id='+id + '&userid=' + this.data.userid
      })
    } else {
      wx.navigateTo({
        url: '../activitydetail/activitydetail?id='+id + '&userid=' + this.data.userid
      })
    }
  },
  loadMore: function(){
    var that = this
    var data = {
      userId: that.data.userid,
      type: '挑战',
      page: that.data.page++
    }
    console.log(data)
    // wx.showLoading({
    //   title: '加载中',
    //   icon: 'loading'
    // })
    util.request('acty/getacty', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)      
      if(res.data.success){
        var allData = res.data.data
        var content = that.data.activityList.concat(allData)
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].start_timestr.substring(0, 16)
          var endTime = allData[i].end_timestr.substring(11, 16)
          allData[i].start_timestr = createTime 
          allData[i].end_timestr = endTime 
        }
        that.setData({
          activityList: content,
          start_timestr: createTime,
          end_timestr: endTime
        })
    }else{
      
    }
    })
  },
  loadMore2: function(){
    var that = this
    var data = {
      userId: that.data.userid,
      type: '团跑',
      page: that.data.page2++
    }
    console.log(data)
    util.request('acty/getacty', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data)      
      if(res.data.success){
        var allData = res.data.data
        var content = that.data.activityList2.concat(allData)
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].start_timestr.substring(0, 16)
          var endTime = allData[i].end_timestr.substring(11, 16)
          allData[i].start_timestr = createTime 
          allData[i].end_timestr = endTime 
        }
        that.setData({
          activityList2: content,
          start_timestr: createTime,
          end_timestr: endTime
        })
      }else{
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.initInfor(id)
    this.initActy(id)
    this.initActy2(id)
    this.getChallengeId(id)
    this.setData({
      userid: id //TA的id
    })
  }
})

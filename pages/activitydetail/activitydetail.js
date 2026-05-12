// pages/activitydetail/activitydetail.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    activityList: [],
    avastars: '',
    memberList: [],
    actyId: 0,
    actyIn: 0,
    allDistance: 0,
    allNum: 0,
    clocked: '打卡',
    signed: '报名',
    clickOn: 0,
    signIn: 0,
    has_clickon: 0,
    has_sign: 0,
    has_name: '',
    has_mobile: '',
    signOpacity: 1,
    clockOpacity: 1,
    ltyList: '',
    distance: 0,
    acty_name: '',
    nickName: '',
    page: 1,
    actyImg: [],
    indicatorDots: true,
    vertical: false,
    autoplay: true,
    interval: 2000,
    duration: 500,
    showBtn: false,
    myAddress: '',
    showSign: false,
    signTrue: true
  },
  toactyData: function(){
    wx.navigateTo({
      url: '../activitydata/activitydata?id=' + this.data.actyId
    })
  },
  initLimit: function(){
    var userId = app.globalData.userId
    var data = { 
      id : userId
    }
    util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        that.setData({
          myAddress: res.data.data.address
        })
      }
    })
  },
  //去报名
  signIn: function(){
    var adrr = this.data.region
    var myadrr = this.data.myAddress
    if(myadrr!=''&&adrr.indexOf(myadrr) > -1){
      wx.navigateTo({
        url: '../signin/signin?id='+this.data.actyId + '&has_name='+this.data.has_name+'&has_mobile='+this.data.has_mobile+'&target=0'+'&acty_type=' + this.data.acty_type
      })
    } else {
      wx.showToast({
        title: '地区暂不支持',
        icon: 'none'
      })
    }
  },
  dateDiff:function (date1, date2){
		date1 = date1.replace("年","-").replace("月","-").replace("日",""); 
		date2 = date2.replace("年","-").replace("月","-").replace("日","");  
	    date1 = new Date(date1.replace(/-/g, "/"));
   		date2 = new Date(date2.replace(/-/g, "/"));  
   		if(Date.parse(date2) - Date.parse(date1) >= 0){
   			return true;
   		}
   		return false;
	},
  goheight:function (e) {
    var width = wx.getSystemInfoSync().windowWidth
    //获取可使用窗口宽度
    var imgheight = e.detail.height
    //获取图片实际高度
    var imgwidth = e.detail.width
    //获取图片实际宽度
    var height = width * imgheight / imgwidth +"px"
    //计算等比swiper高度
    this.setData({
      height: height
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    var userid = options.userid
    var userId = app.globalData.userId
    this.setData({
      actyId: id,
      userId: userId,
      userid: userid
    })
    var data = { id : userId }
    util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        this.setData({
          nickName : res.data.data.nick_name
        })
      }
    })
    this.initActyIn()
    this.getactyimgs()
    this.initLimit()
  },
  getactyimgs: function(){
    var that = this
    var data = {
      actyId: that.data.actyId
    }
    util.request('acty/getactyimgs', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          actyImg:res.data.data
        })
      }
    })
  },
  
  initActyDetail: function(id){
    var that = this
    var userId = app.globalData.userId
    // 获取活动详情
    if(that.data.userid==undefined){
      var data = {
        actyId: id,
        userId: userId
      }
    } else {
      var data = {
        actyId: id,
        userId: that.data.userid
      }
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('acty/getdetail', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var allData = res.data.data
        var createTime = allData.start_timestr.substring(0, 16)
        var endTime = allData.end_timestr.substring(11, 16)
        var state = allData.acty_state
        var createTime1 = util.dislodgeZero(createTime)
        var endTime1 = util.dislodgeZero(endTime)
        allData.start_timestr = createTime1 
        allData.end_timestr = endTime1 
        this.setData({
          acty_img: allData.acty_img,
          state: state,
          acty_name: allData.acty_name,
          region: allData.region,
          acty_type: allData.acty_type,
          start_time: createTime1,
          end_time: endTime1,
          address: allData.address,
          total_num: allData.serial_num,
          distance: allData.distance,
          has_clickon: allData.has_clickon,
          has_sign: allData.has_sign,
          has_name: allData.has_name,
          has_mobile: allData.has_mobile,
          acty_level: allData.level //level=0  非聚跑，level=1 聚跑
        })
        var now_time = util.formatTime(new Date()).substring(0, 16)
        var timeRange=this.dateDiff(that.data.start_time,now_time)
        if(!timeRange){
          this.setData({
            showSign: false
          })
        } else {
          this.setData({
            showSign: true
          })
        }
        wx.setNavigationBarTitle({
          title: this.data.acty_name
        })
        if( this.data.state == 0){
          this.setData({
            state: '已结束'
          })
        }
        if(allData.has_clickon == 1){
          that.setData({
            signTrue: false,
            clickOn: 1
          })
        }
        if(allData.has_sign == 1){
          that.setData({
            signIn: 1,
            clocked: '已打卡',
            clockOpacity: .7        
          })
        }
        if(allData.level == 0){
          that.setData({
            showBtn: false       
          })
        }
        wx.hideLoading({
          success: (res) => {},
        })
      }else{
        wx.hideLoading({
          success: (res) => {},
        })
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })
    // 获取活动数据
    var data = {
      id: id
    }
    util.request('acty/getsport', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        that.setData({
          allDistance: res.data.data.total,
          allNum: res.data.data.number,
          dataList: res.data.data.user_list
        })
      }else{
      }
    })
    // 获取报名人数
    if(that.data.userid==undefined){
      var data = {
        actyId: id,
        userId: userId,
        level: '',
        distance: 1,
        userName: '',
        mobile: ''
      } 
    } else {
      var data = {
        actyId: id,
        userId: that.data.userid,
        level: '',
        distance: 1,
        userName: '',
        mobile: ''
      } 
    }
    util.request('acty/getactyuser', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        var dataAll = res.data.data
        this.setData({
          avastars: dataAll, 
          actyIn: dataAll.length
        })
      }else{
        
      }
    })
    //获取关联抽奖
    var data = {
      actyId : id
    }
    util.request('acty/getluckdrawlist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        this.setData({
          ltyList: res.data.data
        })
      }else{
      
      }
    })
  },
  // 图片预览
  preview: function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var url = e.currentTarget.dataset.url
    var previewImgArr = []
    //通过循环在数据链里面找到和这个id相同的这一组数据，然后再取出这一组数据当中的图片
    var data = that.data.actyImg
    for (var i in data) {
      if (id == data[i].id) {
      previewImgArr = data[i].img_url;
      }
    }
    wx.previewImage({
    current: url, // 当前显示图片的http链接
    urls: [previewImgArr] // 需要预览的图片http链接列表
    })
  },
  toLty: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../lotterydetail/lotterydetail?id='+id
    })    
  },
  toList: function(){
    wx.navigateTo({
      url: '../member/member?id='+this.data.actyId
    })    
  },
  toList2: function(){
    wx.navigateTo({
      url: '../together/together?id='+this.data.actyId
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
        var allDta = res.data.data
        this.setData({
          actyMember: allDta,
          picShow: true,
          runCon: true
        })
        for(var i=0;i<allDta.length;i++){
          var userId = app.globalData.userId
          var id = allDta[i].id
          if(userId==id){
            that.setData({
              showBtn: true
            })
          }
        }
        
      }else{
        this.setData({
          picShow: '',
          runCon: false
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    var id = this.data.actyId;
    this.initActyDetail(id)
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
    }
    return {
        title: this.data.nickName + '邀请你参加#' + this.data.acty_name + '#，快来参加攒积分了～',
        // path: '/pages/activitydetail/activitydetail' + this.data.actyId
    }
  }
})
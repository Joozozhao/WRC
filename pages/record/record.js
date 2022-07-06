// pages/activity/activity.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
    data: {
      recordList: [],
      recordType: '',
      noHistory: true,
      page: 1,
      randomArr: [
        '你很有跑步天赋～',
        '为你点赞～',
        '挺你～',
        '优秀～',
        '真棒～',
        '自律～',
        '点赞～',
        '厉害～',
        '哇，大神～'
      ],
      state: 0,
    },
    preview: function(e){
      var that = this
      var id = e.currentTarget.dataset.id
      var url = e.currentTarget.dataset.url
      var previewImgArr = []
      //通过循环在数据链里面找到和这个id相同的这一组数据，然后再取出这一组数据当中的图片
      var data = that.data.recordList
      for (var i in data) {
        if (id == data[i].id) {
        previewImgArr = data[i].sport_img;
        }
      }
      wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [previewImgArr] // 需要预览的图片http链接列表
      })
    },
    /**
   * 显示删除按钮
   */
  showDeleteButton: function (e) {
    let productIndex = e.currentTarget.dataset.productindex
    this.setXmove(productIndex, -60)
  },

  /**
   * 隐藏删除按钮
   */
  hideDeleteButton: function (e) {
    let productIndex = e.currentTarget.dataset.productindex
    this.setXmove(productIndex, 0)
  },

  /**
   * 设置movable-view位移
   */
  setXmove: function (productIndex, xmove) {
    let productList = this.data.recordList
    productList[productIndex].xmove = xmove
    this.setData({
      recordList: productList
    })
  },

  /**
   * 处理movable-view移动事件
   */
  handleMovableChange: function (e) {
    if (e.detail.source === 'friction') {
      if (e.detail.x < -30) {
        this.showDeleteButton(e)
      } else {
        this.hideDeleteButton(e)
      }
    } else if (e.detail.source === 'out-of-bounds' && e.detail.x === 0) {
      this.hideDeleteButton(e)
    }
  },

  /**
   * 处理touchstart事件
   */
  handleTouchStart(e) {
    this.startX = e.touches[0].pageX
    if(this.data.state==1){
      let productList = this.data.recordList
      for(var i=0;i<productList.length;i++){
        this.setXmove(i,0)
      }
    }
  },
  handleTouchMove(e) {
    if(e.changedTouches[0].pageX < this.startX && e.changedTouches[0].pageX - this.startX <= -10) {
      this.showDeleteButton(e)
    } else if(e.changedTouches[0].pageX > this.startX && e.changedTouches[0].pageX - this.startX < 10) {
      this.showDeleteButton(e)
    } else {
      this.hideDeleteButton(e)
    }
  },
  /**
   * 处理touchend事件
   */
  handleTouchEnd(e) {
    if(e.changedTouches[0].pageX < this.startX && e.changedTouches[0].pageX - this.startX <= -10) {
      this.showDeleteButton(e)
    } else if(e.changedTouches[0].pageX > this.startX && e.changedTouches[0].pageX - this.startX < 10) {
      this.showDeleteButton(e)
    } else {
      this.hideDeleteButton(e)
    }
    this.setData({
      state: 1
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.initRecord()
  },
  dedupe: function (array){
    return Array.from(new Set(array));
    //这里的 Array.from（）方法是将两类对象转为真正的数组：类似数组的对象和可遍历的对象（包括es6新增的数据结构Set和Map）
  },
  initRecord: function(){
    var userId = app.globalData.userId
    if(userId == 0){
      return
    }
    var data = { 
      userId : userId,
      type: -1,
      page: this.data.page++
    }
    util.request('user/getsportlist', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this 
      if(res.data.success){
        var recordData = res.data.data
        console.log(recordData)
        for(var i=0;i<recordData.length;i++){
          var now = new Date(); //当前日期 
          var nowDayOfWeek = now.getDay(); //今天本周的第几天 
          var nowDay = now.getDate(); //当前日 
          var nowMonth = now.getMonth(); //当前月 
          var nowYear = now.getYear(); //当前年 
          nowYear += (nowYear < 2000) ? 1900 : 0; //
          var weekStartDate = new Date(nowYear, nowMonth, nowDay - (nowDayOfWeek-1)); 
          var weekEndDate = new Date(nowYear, nowMonth, nowDay + (7 - nowDayOfWeek));
          var createTime = recordData[i].create_time_str
          if(new Date(createTime)>weekStartDate&&new Date(createTime)<weekEndDate){
            var createTime1 = this.getMyDay(new Date(createTime))
            var createTimeNew = createTime1 + createTime.substring(10)
            recordData[i].create_time_str = createTimeNew
          }
          that.setData({
            recordList: recordData,
            noHistory: false
          })
          that.randomTxt() 
        }
      }
    })
  },
  //随机展示文字
  randomTxt: function(){
    var randomArr = this.data.randomArr
    var recordList = this.data.recordList
    var randomTxtArr = []
    for(var i=0;i<recordList.length;i++){
      randomTxtArr.push(randomArr[Math.floor((Math.random()*recordList.length))])
      if(randomTxtArr[i] == undefined) {
        randomTxtArr.splice(i,1);
        i = i - 1; // i - 1 ,因为空元素在数组下标 2 位置，删除空之后，后面的元素要向前补位
      }
    }
    // console.log(randomTxtArr)
    this.setData({
      randomTxt: randomTxtArr
    })
  },
  //本周判断
  getMyDay : function (date){
    var week;
    if(date.getDay()==0) week="本周日"
    if(date.getDay()==1) week="本周一"
    if(date.getDay()==2) week="本周二"
    if(date.getDay()==3) week="本周三"
    if(date.getDay()==4) week="本周四"
    if(date.getDay()==5) week="本周五"
    if(date.getDay()==6) week="本周六"
    return week;
    },
  delCon: function(e){
    var that = this
    wx.showModal({   
      title: '是否确定删除内容？',
      success: function (res) {
        if (res.confirm) {             //点击确定后
          var id = e.currentTarget.dataset.id
          var idx = e.currentTarget.dataset.index
          var data = {
            id: id
          }
          util.request('acty/delSport', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              var recordList = that.data.recordList
              recordList.splice(idx, 1)
              that.setData({
                recordList
              })
              console.log(res)
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
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
           console.log('用户取消')
         }
       }
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function(){
    var userId = app.globalData.userId
    var data = { 
      userId : userId,
      type: -1, 
      page: this.data.page++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('user/getsportlist', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        var recordData = res.data.data
        var content = that.data.recordList.concat(recordData)
        that.setData({
          recordList: content,
          noHistory: false
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
  }
})
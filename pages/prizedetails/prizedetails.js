// pages/prizedetails/prizedetails.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    indicatorDots: true,
    vertical: false,
    autoplay: false,
    interval: 2000,
    duration: 500,
    imgSrc: [],
    points: 0,
    goodName: '',
    type: '',
    itemId: '',
    goodsRemark: '',
    goods_type: '',
    energy: 0,
    chooseOne: false,
    id: 0,
    typeOne: '',
    typeTwo: '',
    totalNum: 0,
    detailSrc: '',
    otherTit:false,
    codeModal: false,
    code: ''
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    var code = options.code
    this.initDetail(id)
    this.setData({
      itemId: id,
      code: code
    })
    this.getUrl()
    this.getUrl2()
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
  getUrl:function(){
    var that = this
    var data = {
      gId: that.data.itemId,
      type: 0
    }
    console.log(data)
    util.request('goods/getlistimgs', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res.data.data)
      if(res.data.success){
        that.setData({
          goods_pic: res.data.data[0].goods_pic
        })
      }
    })
  },
  getUrl2:function(){
    var that = this
    var data = {
      gId: that.data.itemId,
      type: 1
    }
    console.log(data)
    util.request('goods/getlistimgs', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          detailSrc: res.data.data
        })
      }
    })
  },
  // 图片加载失败
  findError: function (e) {
    console.log(e)
    var index = e.currentTarget.dataset.index;   // html中必须有data-index属性
    this.setData({
      [`roomList[${index}].imgSrc`]: "https://ww1.sinaimg.cn/large/007rAy9hgy1g24by9t530j30i20i2glm.jpg",
// roomList 即 映射数组；imgSrc数组中的key值；其他原样copy即可
    })
  },
  initDetail : function(id){
    var that = this
    var data = {
      id: id
    }
    wx.showLoading({
      title: '加载中',
      mask: true
    })
    util.request('goods/get', 'POST', data, '数据加载中...', (res)=>{
      console.log(res.data)
      if(res.data.success){
        var allData = res.data.data
        that.setData({
          imgSrc: allData.goods_pic,
          points: allData.score,
          energy: allData.energy,
          goodName: allData.goods_name,
          goodsRemark: allData.goods_remark,
          goods_type: allData.goods_type,
          allType: allData.goodsStorageList
        })
        // var allType = that.data.allType
        // var myLength = allType.length
        // var con = allType[0]
        // that.setData({
        //   myLength: myLength,
        //   con: con
        // })
        // console.log(con)
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
    var data = {
      goodsId: id,
      page: 1
    }
    util.request('goods/getusers', 'POST', data, '数据加载中...', (res)=>{
      console.log(res.data)
      if(res.data.success){
        var allData = res.data.data
        
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].create_time.substring(0, 19)
          allData[i].create_time = createTime 
        }
        that.setData({
          imgList: allData,
          total: res.data.total
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
  exchange: function(){
    var that = this
    that.setData({
      typePop: true
    })
    
  },
  chooseOne: function(e){
    var id = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    var tag = e.currentTarget.dataset.tag
    var stock = e.currentTarget.dataset.stock
    this.setData({
      id: id,
      typeOne: index,
      typeTwo: tag,
      totalNum: stock,
      otherTit: true
    })
  },
  close: function(){
    this.setData({
      typePop: false
    })
  },
  sure: function(e){
    var that = this    
    if(that.data.id==0){
      wx.showToast({
        title: '选一下类型呀～',
        icon: 'none',
        duration: 1500
      })
      return false
    } 
    if(that.data.totalNum==0){
      wx.showToast({
        title: '库存没了～',
        icon: 'none',
        duration: 1500
      })
      return false
    } 
    if(that.data.code==undefined){
      wx.navigateTo({
        url: '../confirmorder/confirmorder?id='+this.data.itemId + '&storageId=' + this.data.id + '&typeOne=' + this.data.typeOne + '&typeTwo=' + this.data.typeTwo
      })
    } else {
      wx.navigateTo({
        url: '../confirmorder/confirmorder?id='+this.data.itemId + '&storageId=' + this.data.id + '&typeOne=' + this.data.typeOne + '&typeTwo=' + this.data.typeTwo + '&code=' + this.data.code
      })
    }
    
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
        title: '快来兑换超级会员福利#' + this.data.goodName + '#限时兑换，过期视为放弃',
        // path: '/pages/activitydetail/activitydetail' + this.data.actyId
    }
  }
})
// pages/exchangeDetails/exchangeDetails.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    goodId: '',
    state: '',
    goodType: 0,
    hiddenName: false,
    order_num: '',
    tag_desc: '',
    goods_tag: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    var type = options.type
    this.setData({
      goodId: id,
      goodType: type
    })
    this.initOrderDet(id)
  },
  initOrderDet: function(id){
    var that = this
    var data = {
      id: that.data.goodId
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    util.request('order/get', 'POST', data, '数据加载中...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          address: res.data.data.address,
          create_time: res.data.data.create_time.substring(0, 19),
          goods_tag: res.data.data.goods_tag,
          goods_name: res.data.data.goods_name,
          goods_num: res.data.data.goods_num,
          goods_pic: res.data.data.goods_pic,
          tag_desc: res.data.data.tag_desc,
          last_time: res.data.data.last_time.substring(0, 19),
          mobile: res.data.data.mobile,
          name: res.data.data.name,
          order_num: res.data.data.order_num,
          score: res.data.data.score,
          energy: res.data.data.energy,
          state: res.data.data.state
        })
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
  },
  conformOrder: function(e){
    var that = this
    wx.showModal({   
      title: '是否已收到货？',
      success: function (res) {
        if (res.confirm) {          //点击确定后
          var id = that.data.goodId
          var userId = app.globalData.userId
          var data = {
            id: id,
            state: 2,
            score: 0,
            energy: 0,
            userId: userId,
            orderNum: that.data.order_num
          }
          util.request('order/updatestate', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              console.log(res)
              that.setData({
                state: 2,
                // hiddenName: true
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
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.initOrderDet()
  }
})
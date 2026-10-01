// pages/orderlist/orderlist.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
    data: {
      orderList: [],
      changeModal: false,
      listState: 'loading',
      orderId: 0,
      orstate: 0,
      energy: 0,
      score: 0,
      userId: 0,
      orderNum: '',
      radioItem: [
        {
          name: '待发货',
          value: 0,
          checked: ''
        },
        {
          name: '已发货',
          value: 1,
          checked: ''
        },
        {
          name: '已签收',
          value: 2,
          checked: ''
        },
        {
          name: '已退单',
          value: 3,
          checked: ''
        }  
      ],
      page: 1,
      hasMore: true,
      loadingMore: false,
      sortList:[
        {text: '全部'},
        {text: '待发货'},
        {text:'已发货'},
        {text:'已签收'},
        {text:'已退单'}
      ],
      tab: 0,
      stateId: -1
    },
    choose2: function(e){
      var id= e.currentTarget.dataset.id
      var that = this
      that.setData({
        stateId: id,
      })
      that.initOrder()
    },
    toDetail:function(e){
      var id = e.currentTarget.dataset.id
      var type = e.currentTarget.dataset.type
      wx.navigateTo({
        url: '../orderdetail/orderdetail?id=' + id +'&type=' + type,
      })
    },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.initOrder()
  },
  initOrder: function(){
    var that = this
    this.setData({
      page: 1,
      listState: 'loading',
      hasMore: true,
      loadingMore: false
    })
    var data = {
      name : "", 
      mobile : "", 
      state : -2,
      page: 1
    }
    console.log(data)
    util.request('order/getlist', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        var orderData = Array.isArray(res.data.data) ? res.data.data : []
        console.log(orderData)
        that.setData({
          orderList: orderData,
          listState: 'ready',
          page: 2,
          hasMore: orderData.length > 0
        })
      } else {
        that.setData({
          orderList: [],
          listState: 'error'
        })
      }
    }, () => {
      that.setData({
        listState: 'error'
      })
    })
  },
  resetCon: function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var state = e.currentTarget.dataset.state
    var energy = e.currentTarget.dataset.energy
    var score = e.currentTarget.dataset.score
    var userId = e.currentTarget.dataset.userid
    var orderNum = e.currentTarget.dataset.num
    that.setData({
      changeModal: true,
      stateId: state,
      orderId: id,
      energy: energy,
      score: score,
      userId: userId,
      orderNum: orderNum
    })
    // var idx = id
    // that.data.radioItem[idx].checked = "true"
    // that.setData({
    //   radioItem: that.data.radioItem 
    // })
    console.log(that.data)
  },
  delCon: function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var idx = e.currentTarget.dataset.index
    wx.showModal({   
      title: '是否确定删除内容？',
      success: function (res) {
        if (res.confirm) {             //点击确定后
          var id = e.currentTarget.dataset.id
          var data = {
            id: id
          }
          util.request('order/del', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              var orderList = that.data.orderList
              orderList.splice(idx,1)
              that.setData({
                orderList: orderList
              })
              console.log(res)
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
              })      
            }else{
              // that.setData({
              //   orderList: []
              // })
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
  setState: function(e){
    var that = this
    var id = e.detail.value
    that.setData({
      stateId: id
    })
  },
  onCancel: function(e){
    this.setData({
      changeModal: false
    })
  },
  onConfirm: function(){
    var that = this
    if (!this.data.orderId || Number(this.data.stateId) < 0) {
      wx.showToast({ title: '请选择订单状态', icon: 'none' })
      return
    }
    var data = {
      id: that.data.orderId,
      state: that.data.stateId,
      score: that.data.score,
      energy: that.data.energy,
      userId: that.data.userId,
      orderNum: that.data.orderNum
    }
    console.log(data)
    util.request('order/updatestate', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data.success){
        wx.showToast({
          title: '设置成功',
          icon: 'none',
          duration: 1500
        })
        that.setData({ changeModal: false, page: 1 })
        that.initOrder()
      }else{
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })  
      }
    }, () => {
      wx.showToast({ title: '设置失败，请重试', icon: 'none' })
    })
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function(){
    if (this.data.listState !== 'ready' || this.data.loadingMore || !this.data.hasMore) return
    this.setData({ loadingMore: true })
    var data = { 
      name : "", 
      mobile : "", 
      state : -2,
      page: this.data.page
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('order/getlist', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        var orderData = Array.isArray(res.data.data) ? res.data.data : []
        var content = that.data.orderList.concat(orderData)
        console.log(res.data)
        that.setData({
          orderList: content,
          page: that.data.page + 1,
          hasMore: orderData.length > 0,
          loadingMore: false
        })
        wx.hideLoading({
          success: (res) => {},
        })
      }else{
        that.setData({ loadingMore: false })
        wx.hideLoading({
          success: (res) => {},
        })
      }
    }, () => {
      this.setData({ loadingMore: false })
      wx.hideLoading()
    })
  }
})

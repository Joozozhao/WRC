// pages/activity/activity.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
const DEFAULT_GROUP_COVER = '/images/redesign/group-run-default-cover.jpg'
const playPageMotion = require('../../utils/page-motion.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabbar: {},
    activityList: [],
    duty: '',
    page: 1,
    loading: true,
    hasMore: true,
    loadError: false,
    pageMotion: false
  },
  openMyPage: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },
  creatNew: function () {
    wx.navigateTo({
      url: '../creat/creat'
    })
  },
  toDet: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../activitydetail/activitydetail?id='+id
    })
  },
  editCon: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../editactivity/editactivity?id='+id
    })
  },
  delCon: function(e){
    var that = this
    var idx = e.currentTarget.dataset.index
    wx.showModal({   
      title: '是否确定删除团跑？',
      success: function (res) {
        if (res.confirm) {             //点击确定后
          var id = e.currentTarget.dataset.id
          var data = {
            id: id
          }
          util.request('acty/del', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              var activityList = that.data.activityList
              activityList.splice(idx,1)
              that.setData({
                activityList: activityList
              })
              console.log(res)
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
              })      
            }else{
              that.setData({
                activityList: []
              })
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.editTabbar();
    this.initLimit()
  },
  onReady: function () {
    wx.hideTabBar({ fail: () => {} })
  },
  initLimit: function(){
    var userId = app.globalData.userId
    if (!userId || userId <= 0) {
      this.setData({ duty: '' })
      return
    }
    var data = { 
      id : userId
    }
    util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      console.log(res)
      if(res.data.success){
        if(res.data.data.duty=='团长,管理员'||res.data.data.duty=='管理员,团长'){
          that.setData({
            duty : '管理员/团长',
          })
        }else{
          that.setData({
            duty: res.data.data.duty
          })
        }
      }
    })
  },
  initActy: function(){
    var that = this
    var data = {
      page: 1,
      type: '团跑'
    }
    this.setData({ page: 1, loading: true, loadError: false })
    util.request('acty/getactylist', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        var allData = that.formatActivity(res.data.data || [])
        that.setData({
          activityList: allData,
          page: 2,
          loading: false,
          hasMore: allData.length > 0,
          loadError: false
        })
        // 尝试查询各活动的合照，若已有合照则以第一张合照作为活动封面展示
        that.syncGroupPhotosForList(allData)
      } else {
        that.setData({ activityList: [], loading: false, hasMore: false, loadError: true })
      }
    })
  },
  formatActivity: function(list) {
    return list.map(function(item) {
      var start = item.start_timestr || ''
      var end = item.end_timestr || ''
      return Object.assign({}, item, {
        acty_img: item.acty_img || DEFAULT_GROUP_COVER,
        start_timestr: start ? util.dislodgeZero(start.substring(0, 16)) : '时间待公布',
        end_timestr: end ? util.dislodgeZero(end.substring(11, 16)) : ''
      })
    })
  },
  syncGroupPhotosForList: function(list) {
    if (!Array.isArray(list) || !list.length) return
    const that = this
    list.forEach(function(item) {
      if (!item.id) return
      const activityId = String(item.id)
      util.request('acty/getactyimgs', 'POST', { actyId: item.id }, '', (res) => {
        if (res && res.data && res.data.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const firstPhoto = res.data.data[0].img_url
          if (firstPhoto) {
            const currentIndex = (that.data.activityList || []).findIndex(current => String(current.id) === activityId)
            if (currentIndex < 0) return
            const key = 'activityList[' + currentIndex + '].acty_img'
            that.setData({
              [key]: firstPhoto
            })
          }
        }
      })
    })
  },
  retryLoad: function() {
    this.initActy()
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    playPageMotion(this)
    wx.hideTabBar({ fail: () => {} })
    app.editTabbar();
    this.initLimit()
    this.initActy()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function () {
    if (this.data.loading || !this.data.hasMore) return
    var that = this
    var data = {
      page: that.data.page,
      type: '团跑'
    }
    this.setData({ loading: true })
    util.request('acty/getactylist', 'POST', data, '数据加载中...', (res)=>{
      if(res.data && res.data.success){
        var allData = that.formatActivity(res.data.data || []).map(function(item) {
          return Object.assign({}, item, { _entering: true })
        })
        that.setData({
          activityList: that.data.activityList.concat(allData),
          page: that.data.page + 1,
          hasMore: allData.length > 0,
          loading: false
        })
        that.syncGroupPhotosForList(allData)
        setTimeout(function() {
          that.setData({
            activityList: that.data.activityList.map(function(item) {
              if (!item._entering) return item
              var next = Object.assign({}, item)
              delete next._entering
              return next
            })
          })
        }, 420)
      }else{
        that.setData({ loading: false })
      }
    })
  }
})

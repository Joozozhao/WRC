// pages/challenge/challenge.js
const util = require('../../utils/util.js')
const playPageMotion = require('../../utils/page-motion.js')
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tabbar: {},
    challengeList: [],
    actyName: '',
    page: 1,
    actyState: 0,
    loading: true,
    hasMore: true,
    loadError: false,
    pageMotion: false
  },
  openMyPage: function () {
    wx.switchTab({ url: '../mydata/mydata' })
  },
  toDetail:function (e){
    var id = e.currentTarget.dataset.id
    var name = e.currentTarget.dataset.name
    wx.navigateTo({
      url: '../challengedetail/challengedetail?id=' + id
    })
    wx.setNavigationBarTitle({
      title: name
    })
  },
  createChallenge: function () {
    const duty = this.data.duty || ''
    const canCreate = duty === '团长' || duty === '管理员' || duty === '管理员/团长'
    if (!canCreate) return
    wx.navigateTo({ url: '../creatchallenge/creatchallenge' })
  },
  editCon: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../editchallenge/editchallenge?id='+id
    })
  },
  delCon: function(e){
    var acty_id = e.currentTarget.dataset.id
    var idx = e.currentTarget.dataset.index
    var that = this
    wx.showModal({   
      title: '是否确定删除挑战？',
      success: function (res) {
        if (res.confirm) {             //点击确定后
          var data ={
            id : acty_id
          }
          util.request('acty/del', 'POST', data, '数据加载中 ...', (res)=>{
            console.log(res)
            if(res.data.success){
              var challengeList = that.data.challengeList
              challengeList.splice(idx,1);
              that.setData({
                challengeList: challengeList
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
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    app.editTabbar();
    this.initLimit()
  },
  onShow: function(){
    playPageMotion(this)
    wx.hideTabBar();
    this.initLimit()
    this.initChallenge()
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
        var duty = res.data.data.duty || ''
        if (duty === '团长,管理员' || duty === '管理员,团长') duty = '管理员/团长'
        that.setData({
          duty: duty
        })
      } else {
        that.setData({ duty: '' })
      }
    }, () => this.setData({ duty: '' }))
  },
  initChallenge:function(){
    var that = this
    var userId = app.globalData.userId
    var data = {
      userId: userId,
      type: '挑战',
      page: 1
    }
    this.setData({ page: 1, loading: true, loadError: false })
    util.request('acty/getchallengeacty', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        var challengeData = res.data.data || []
        that.setData({
          challengeList: challengeData,
          page: 2,
          loading: false,
          hasMore: challengeData.length > 0,
          loadError: false
        })
      }else{
        that.setData({ challengeList: [], loading: false, hasMore: false, loadError: true })
      }
    })
  },
  retryLoad: function() {
    this.initChallenge()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function(){
    if (this.data.loading || !this.data.hasMore) return
    var that = this
    var userId = app.globalData.userId
    var data = {
      userId: userId,
      type: '挑战',
      page: that.data.page
    }
    this.setData({ loading: true })
    util.request('acty/getchallengeacty', 'POST', data, '数据加载中 ...', (res)=>{
      if(res.data && res.data.success){
        var challengeData = (res.data.data || []).map(function(item) {
          return Object.assign({}, item, { _entering: true })
        })
        that.setData({
          challengeList: that.data.challengeList.concat(challengeData),
          page: that.data.page + 1,
          hasMore: challengeData.length > 0,
          loading: false
        })
        setTimeout(function() {
          that.setData({
            challengeList: that.data.challengeList.map(function(item) {
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

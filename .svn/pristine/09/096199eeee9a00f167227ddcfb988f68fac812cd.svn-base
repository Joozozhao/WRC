// pages/toNews/toNews.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    newsList:[],
    page: 1
  },
  toAdd: function(){
    wx.navigateTo({
      url: '../newsadd/newsadd',
    })
  },
  initList: function(){
    var that = this
    var data = {
      t: '', 
      page : that.data.page++
    }
    util.request('news/searchlist', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        var allData = res.data.data
        for(var i=0; i<allData.length;i++){
          var createTime = allData[i].create_time.substring(0, 19)
          allData[i].create_time = createTime 
        }
        that.setData({
          newsList: allData,
          create_time: createTime
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
  editIt: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../editnews/editnews?id=' + id,
    })
  },
  delCon: function(e){
    var that = this
    wx.showModal({   
      title: '是否确定删除内容？',
      success: function (res) {
        if (res.confirm) {             //点击确定后
          var id = e.currentTarget.dataset.id
          var data = {
            nId: id
          }
          console.log(data)
          util.request('news/delete', 'POST', data, '数据加载中 ...', (res)=>{
            if(res.data.success){
              that.setData({
                page: 1
              })
              that.onLoad()
              console.log(res)
              wx.showToast({
                title: '已删除',
                icon: 'none',
                duration: 1500
              })    
              // wx.navigateBack({
              //   delta: -1,
              // })
              // wx.navigateTo({
              //   url: '../activity/activity',
              // })          
            }else{
              that.setData({
                newsList: []
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
    this.initList()
  }
})
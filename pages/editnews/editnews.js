// pages/editnews/editnews.js
var util = require('../../utils/util.js');
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showView: true,
    addView: false,
    newsId: 0
  },
  initNews: function(id){
    var that = this
    var data = {
      id: id
    }
    util.request('news/get', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        var allData = res.data.data
        that.setData({
          title: allData.title,
          author: allData.author,
          tempFilePaths: allData.img_url,
          content: allData.content
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
  uploadAction:function(){
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original','compressed'],
      sourceType: ['album','camera'],
      success:function(res) {
        var tempFilePaths = res.tempFilePaths
        var userId = app.globalData.userId
        console.log(tempFilePaths)
        wx.showToast({
         icon: "loading",
         title: "正在上传"
         }),
         wx.uploadFile({
           filePath: res.tempFilePaths[0],
          name: 'file',
          url: 'https://www.mlhb.com.cn/sport/user/uploadimg',
          formData: { userId:  userId, fileId:'file' },
          success: function(ret){
            console.log(ret);
            var obj = JSON.parse(ret.data)
            that.setData({
              tempFilePaths: obj.data.img,
              addView: false,
              showView: true
            })
          },
          fail: function(ret){
            console.log(ret)
          }
        })
      }
    })
  },
  submit: function(e){
    var that = this
    var formatDate = e.detail.value
    var userId = app.globalData.userId
    var data = { 
      id : that.data.newsId, 
      t : formatDate.title, 
      a : formatDate.author, 
      c : formatDate.textarea, 
      img : that.data.tempFilePaths, 
      r : '' 
    }
    console.log(data)
    if(that.data.tempFilePaths == ''){
      wx.showToast({
        title: '请上传图片!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(formatDate.title == ''){
      wx.showToast({
        title: '请输入标题!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if(formatDate.textarea == ''){
      wx.showToast({
        title: '请输入内容!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    util.request('news/save', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        wx.showToast({
          title: '提交成功',
          duration: 1000
        })
        wx.reLaunch({
          url: '../newscon/newscon',
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
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    wx.hideShareMenu({})
    this.setData({
      newsId: id
    })
    this.initNews(id)
  }
})
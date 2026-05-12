// pages/newsDetails/newsDetails.js
const util = require('../../utils/util.js')
var WxParse = require('../../wxParse/wxParse.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    title: "",
    author: "",
    pubdate: "",
    content: "",
    imgUrl: ""
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.initNews(id);
  },

  initNews: function (id) {
    var that = this
    var data = {
      id: id
    }
    util.request('news/get', 'POST', data, '数据请求中...', (res) => {
      if (res.data.success) {
        that.setData({
          title: res.data.data.title,
          author: res.data.data.author,
          pubdate: res.data.data.create_time.substring(0, 19),
          imgUrl: res.data.data.img_url
        })
        WxParse.wxParse('article', 'html', res.data.data.content, that, 5);
      } else {
        wx.showToast({
          title: '系统错误！',
          icon: 'none',
          duration: 1500
        })
      }
    });
  },
  copywxtap: function (e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success: function (res) {
        wx.getClipboardData({
          success: function (res) {
            wx.showToast({
              title: '已复制',
              duration: 2000, //显示时长
              mask: true, //是否显示透明蒙层，防止触摸穿透，默认：false  
              icon: 'none', //图标，支持"success"、"loading"
            })
          }
        })
      }
    })
  }
})
// pages/edituser/edituser.js
const util = require('../../utils/util.js')
const app = getApp()
const defaultAvatarUrl = 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    avatarUrl: defaultAvatarUrl,
    theme: wx.getSystemInfoSync().theme
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail 
    this.setData({
      avatarUrl,
    })
  },
  formSubmit(e) {
    var that = this
    //上传本地图片
    wx.uploadFile({
      filePath: this.data.avatarUrl,
      name: 'file',
      url: 'https://applet.51welink.com/sport/user/uploadimg',
      formData: {
        userId: app.globalData.userId,
        fileId: 'file'
      },
      success: function (ret) {
        var obj = JSON.parse(ret.data)
        var data = {
          userId: app.globalData.userId,
          header: obj.data.img,
          name: e.detail.value.nickname
        }
        util.request('user/updatewxuser', 'POST', data, '数据加载中 ...', (res) => {
          if (res.data.success) {
            wx.navigateBack({
              delta: 1
            });
          }
        })
      }
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      avatarUrl: options.avatarurl
    })
    wx.onThemeChange((result) => {
      this.setData({
        theme: result.theme
      })
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})
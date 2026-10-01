// pages/admin/admin.js
var util = require('../../utils/util.js');
var now_date = util.formatDate(new Date());
// 获取应用实例
const app = getApp()
Page({

    /**
     * 页面的初始数据
     */
    data: {
        logoSrc: '../../images/logo.png',
        group_run: 0,
        daily_run: 0,
        luck_rule: 1,
        rule_id: ''
    },
    init: function () {
        var data = {}
        util.request('news/sys/get', 'POST', data, '数据加载中 ...', (res) => {
            console.log(res)
            if (res.data.success) {
                var allData = res.data.data
                this.setData({
                    rule_id: allData.id,
                    logoSrc: allData.logo,
                    group_run: allData.group_run,
                    daily_run: allData.daily_run,
                    luck_rule: allData.luck_rule,
                })
            }
        })
    },
    uploadAction: function () {
        var that = this
        wx.chooseImage({
            count: 1,
            sizeType: ['original', 'compressed'],
            sourceType: ['album', 'camera'],
            success: function (res) {
                var tempFilePaths = res.tempFilePaths
                var userId = app.globalData.userId
                console.log(tempFilePaths)
                wx.showToast({
                    icon: "loading",
                    title: "正在上传"
                }),
                    wx.uploadFile({
                        filePath: res.tempFilePaths[0],
                        name: 'file',
                        url: 'https://applet.51welink.com/sport/news/sys/upload',
                        formData: { userId: userId, fileId: 'file' },
                        success: function (ret) {
                            console.log(ret);
                            var obj = JSON.parse(ret.data)
                            console.log(obj)                
                            that.setData({
                                logoSrc: obj.location
                            })
                        },
                        fail: function (ret) {
                            console.log(ret)
                        }
                    })
            }
        })
    },
    radiocon1: function () {
        this.setData({
            luck_rule: 1
        })
    },
    radiocon2: function () {
        this.setData({
            luck_rule: 2
        })
    },
    submit: function (e) {
        var that = this
        var formData = e.detail.value
        console.log(e)
        var data = {
            id: that.data.rule_id,
            logo: that.data.logoSrc,
            group: parseFloat(formData.group_run),
            daily: parseFloat(formData.daily_run),
            luck_rule: that.data.luck_rule
        }
        console.log(data)
        util.request('news/sys/set', 'POST', data, '数据加载中 ...', (res) => {
            console.log(res)
            if (res.data.success) {
                wx.showToast({
                  title: '保存成功！',
                })
                setTimeout(function(){
                    wx.navigateBack({
                        delta: 1
                    })
                },1000)
            }
        })
    },
    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.init()
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
})
// pages/uploadprize/uploadprize.js
var util = require('../../utils/util.js');
var pics = []
var pics2 = []
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    countPic: 9,//上传图片最大数量
    stype: 0,
    disable: '',
    priceImg: '',
    prizeDetail: '',
    detailPics: [],
    detailPics2: [],
    cWidth: '',
    cHeight: ''
  },
  uploadAction: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths
        console.log(tempFilePaths)
        wx.showToast({
          icon: "loading",
          title: "正在上传"
        }),
          wx.uploadFile({
            filePath: res.tempFilePaths[0],
            name: 'file',
            url: 'https://www.mlhb.com.cn/sport/goods/upload',
            formData: { gId: 0, fileId: 'file' },
            success: function (ret) {
              console.log(ret);
              var obj = JSON.parse(ret.data)
              console.log(obj)
              that.setData({
                detailPics: obj.data.goods_pic,
              })
              console.log(that.data.detailPics)

            },
            fail: function (ret) {
              console.log(ret)
            }
          })
      }
    })
  },
  uploadAction2: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var tempFilePaths = res.tempFilePaths
        for (var i = 0; i < tempFilePaths.length; i++) {
          console.log(res.tempFilePath)//最终图片路径
          var src = res.tempFilePaths[i]
          console.log(src)
          wx.uploadFile({
            filePath: src,
            name: 'file',
            url: 'https://www.mlhb.com.cn/sport/goods/upload',
            formData: { gId: 0, fileId: 'file' },
            success: function (ret) {
              console.log(ret);
              var obj = JSON.parse(ret.data)
              pics2.push(obj.data)
              console.log(pics2)
              that.setData({
                detailPics2: pics2
              })
            },
            fail: function (ret) {
              console.log(ret)
            }
          })
        }
      }
    })
  },
  /**长按删除 */
  bindlongpressimg2(e) {
    let that = this
    var deleID = e.currentTarget.dataset.id    //获取点击项目的内容
    var detailPics2 = that.data.detailPics2;
    console.log(detailPics2)
    wx.showModal({
      title: '提示',
      content: '确定要删除此图片吗？',
      success: function (res) {
        if (res.confirm) {
          console.log('点击确定了')
          detailPics2.splice(deleID, 1)
          console.log(deleID)
          that.setData({
            detailPics2: that.data.detailPics2
          })
          if (detailPics2.length == 0) {
            that.setData({
              detailPics2: []
            })
          }
          wx.showToast({
            title: '已删除',
            icon: 'none',
            duration: 1500
          })

        } else if (res.cancel) {
          console.log('点击取消了');
          return false;
        }
      }
    })
  },
  choose: function () {
    this.setData({
      stype: 0
    })
  },
  choose2: function () {
    this.setData({
      stype: 1
    })
  },
  submit: function (e) {
    var that = this
    var formatDate = e.detail.value
    // var goodPic = that.data.detailPics.map(t => t.goods_pic).join(',')
    var goodImgs = that.data.detailPics2.map(t => t.goods_pic).join(',')
    var data = {
      id: -1,
      gn: formatDate.gn, //名称
      gp: formatDate.gp, //价格
      gty: that.data.stype, //类型
      sc: formatDate.score, //积分能量
      gk: formatDate.remark, //备注
      pic: that.data.detailPics,
      imgs: goodImgs,
    }
    console.log(data)

    if (formatDate.gn == '') {
      wx.showToast({
        title: '请输入奖品名称!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (formatDate.gp == '') {
      wx.showToast({
        title: '请输入奖品价格!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (formatDate.score == '') {
      wx.showToast({
        title: '消耗值不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (that.data.detailPics == '') {
      wx.showToast({
        title: '请上传奖品图片!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    util.request('goods/save', 'POST', data, '数据加载中 ...', (res) => {
      console.log(res)
      if (res.data.success) {
        that.setData({
          disable: true
        })
        wx.showToast({
          title: '上传成功',
          duration: 1000
        })
        wx.redirectTo({
          url: '../prizemanage/prizemanage',
        })
      } else {
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    pics = []
    pics2 = []
    wx.hideShareMenu({})
  }
})
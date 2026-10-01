// pages/uploadprize/uploadprize.js
var util = require('../../utils/util.js');
var UPLOAD_URL = 'https://applet.51welink.com/sport/goods/upload'

// 解析图片上传返回：非 2xx、非 JSON、缺 data/goods_pic 一律视为失败，避免把 undefined 写进图片字段
// 兼容 data 为图片对象（{ goods_pic }）或图片地址字符串两种返回
function parseUploadResult(ret) {
  if (ret && typeof ret.statusCode === 'number' && (ret.statusCode < 200 || ret.statusCode > 299)) {
    return null
  }
  var body = ret && ret.data
  var envelope = null
  if (typeof body === 'string') {
    if (!body) {
      return null
    }
    try {
      envelope = JSON.parse(body)
    } catch (err) {
      return null
    }
  } else if (body && typeof body === 'object') {
    envelope = body
  } else {
    return null
  }
  if (!envelope || typeof envelope !== 'object' || envelope.success === false) {
    return null
  }
  var data = envelope.data
  if (typeof data === 'string') {
    return data ? { goods_pic: data } : null
  }
  if (data && typeof data === 'object' && typeof data.goods_pic === 'string' && data.goods_pic) {
    return data
  }
  return null
}

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
    goodId: '',
    submitting: false
  },
  uploadAction: function () {
    var that = this
    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        var files = res.tempFilePaths || []
        if (!files.length) {
          return
        }
        wx.showLoading({
          title: '上传中',
          mask: true
        })
        wx.uploadFile({
          filePath: files[0],
          name: 'file',
          url: UPLOAD_URL,
          formData: { gId: 0, fileId: 'file' },
          success: function (ret) {
            console.log(ret)
            wx.hideLoading()
            var pic = parseUploadResult(ret)
            if (!pic) {
              wx.showToast({
                title: '图片上传失败，请重试',
                icon: 'none',
                duration: 1500
              })
              return
            }
            that.setData({
              detailPics: pic.goods_pic
            })
          },
          fail: function (ret) {
            console.log(ret)
            wx.hideLoading()
            wx.showToast({
              title: '图片上传失败，请重试',
              icon: 'none',
              duration: 1500
            })
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
        var files = res.tempFilePaths || []
        if (!files.length) {
          return
        }
        wx.showLoading({
          title: '上传中',
          mask: true
        })
        // 整批上传结束后才收起弹层（完成计数）；乱序回调按选择顺序落位，避免半批就能保存
        var total = files.length
        var settled = 0
        var failed = 0
        var results = []
        var finishOne = function () {
          settled++
          if (settled < total) {
            return
          }
          wx.hideLoading()
          var added = []
          var i
          for (i = 0; i < results.length; i++) {
            if (results[i]) {
              added.push(results[i])
            }
          }
          if (added.length) {
            var current = Array.isArray(that.data.detailPics2) ? that.data.detailPics2 : []
            that.setData({
              detailPics2: current.concat(added)
            })
          }
          if (failed === total) {
            wx.showToast({
              title: '图片上传失败，请重试',
              icon: 'none',
              duration: 1500
            })
          } else if (failed > 0) {
            wx.showToast({
              title: '部分图片上传失败，请重试',
              icon: 'none',
              duration: 1500
            })
          }
        }
        var uploadOne = function (src, index) {
          var handled = false
          var settle = function () {
            if (handled) {
              return
            }
            handled = true
            finishOne()
          }
          wx.uploadFile({
            filePath: src,
            name: 'file',
            url: UPLOAD_URL,
            formData: { gId: 0, fileId: 'file' },
            success: function (ret) {
              console.log(ret)
              var pic = parseUploadResult(ret)
              if (pic) {
                results[index] = pic
              } else {
                failed++
              }
              settle()
            },
            fail: function (ret) {
              console.log(ret)
              failed++
              settle()
            }
          })
        }
        var i
        for (i = 0; i < total; i++) {
          uploadOne(files[i], i)
        }
      }
    })
  },
  /**长按删除 */
  bindlongpressimg2(e) {
    let that = this
    var deleID = e.currentTarget.dataset.id    //获取点击项目的内容
    var gdId = e.currentTarget.dataset.gd    //获取点击项目的内容
    var detailPics2 = that.data.detailPics2;
    console.log(detailPics2)
    wx.showModal({
      title: '提示',
      content: '确定要删除此图片吗？',
      success: function (res) {
        if (res.confirm) {
          console.log('点击确定了')
          if (gdId !== undefined) {
            var data = {
              id: gdId
            }
            console.log(data)
            util.request('goods/delimgs', 'POST', data, '数据加载中 ...', (res) => {
              console.log(res)
              if (res.data.success) {
                detailPics2.splice(deleID, 1)
                console.log(deleID)
                that.getUrl2()
                that.setData({
                  detailPics2: that.data.detailPics2
                })
                wx.showToast({
                  title: '已删除',
                  icon: 'none',
                  duration: 1500
                })
              } else {
                that.setData({
                  detailPics2: []
                })
              }
            })
          } else {
            detailPics2.splice(deleID, 1)
            console.log(deleID)
            that.setData({
              detailPics2: that.data.detailPics2
            })
            wx.showToast({
              title: '已删除',
              icon: 'none',
              duration: 1500
            })
          }

        } else if (res.cancel) {
          console.log('点击取消了');
          return false;
        }
      }
    })
  },
  //初始化奖品信息
  initDetail: function () {
    var that = this
    var data = {
      id: that.data.goodId
    }
    util.request('goods/get', 'POST', data, '数据加载中...', (res) => {
      console.log(res)
      // data 缺失时按空对象处理，避免读取 goods_name 时直接抛错
      var detail = res.data.data || {}
      that.setData({
        gn: detail.goods_name,
        gp: detail.price,
        stype: detail.goods_type,
        score: detail.score,
        energy: detail.energy,
        remark: detail.goods_remark,
        detailPics: detail.goods_pic || ''
      })
    })
  },
  //获取奖品详情图
  getUrl2: function () {
    var that = this
    var data = {
      gId: that.data.goodId,
      type: 1
    }
    console.log(data)
    util.request('goods/getlistimgs', 'POST', data, '数据加载中 ...', (res) => {
      console.log(res)
      if (res.data.success) {
        that.setData({
          detailPics2: Array.isArray(res.data.data) ? res.data.data : []
        })
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
    if (that.data.submitting) {
      return false
    }
    var formatDate = e.detail.value
    // var goodPic = that.data.detailPics.map(t=>t.goods_pic).join(',')
    var detailPics2 = Array.isArray(that.data.detailPics2) ? that.data.detailPics2 : []
    var goodImgs = detailPics2.map(function (item) {
      if (typeof item === 'string') {
        return item
      }
      return item && item.goods_pic ? item.goods_pic : ''
    }).filter(function (img) {
      return !!img
    }).join(',')
    var data = {
      id: that.data.goodId,
      gn: formatDate.gn, //名称
      gp: formatDate.gp, //价格
      sc: formatDate.score, //积分小花儿
      gk: formatDate.remark, //备注
      pic: that.data.detailPics,
      imgs: goodImgs,
      gty: that.data.stype, //类型
      ge: 0
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
    that.setData({
      submitting: true
    })
    wx.showLoading({
      title: '提交中',
      mask: true
    })
    util.request('goods/save', 'POST', data, '数据加载中 ...', (res) => {
      wx.hideLoading()
      console.log(res)
      if (res.data.success) {
        that.setData({
          disable: true
        })
        wx.showToast({
          title: '上传成功',
          duration: 1000
        })
        wx.navigateBack({
          delta: 1,
          fail: function () {
            wx.redirectTo({
              url: '../prizemanage/prizemanage'
            })
          }
        })
      } else {
        that.setData({
          submitting: false
        })
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    }, () => {
      wx.hideLoading()
      that.setData({
        submitting: false
      })
      wx.showToast({
        title: '网络错误，请稍后再试...',
        icon: 'none',
        duration: 1500
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    wx.hideShareMenu({})
    this.setData({
      goodId: id
    })
    this.initDetail()
    this.getUrl2()
  }
})
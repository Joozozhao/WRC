// pages/cropper/cropper.js
import WeCropper from './we-cropper.js'
const app = getApp()
const util = require('../../utils/util.js')
const device = wx.getSystemInfoSync()
const width = device.windowWidth
const height = device.windowHeight + 50

Page({
  data: {
    cropperOpt: {
      id: 'cropper',
      targetId: 'targetCropper',
      pixelRatio: device.pixelRatio,
      width,
      height,
      scale: 2.5,
      zoom: 8,
      cut: {
        x: (width - 300) / 2,
        y: (height - 300) / 2,
        width: 300,
        height: 200
      },
      boundStyle: {
        color: "#d9ff3f",
        mask: 'rgba(0,0,0,0.8)',
        lineWidth: 1
      }
    },
    isReduction: false,
    click: true,
    src: ''
  },

  onLoad(options) {
    if (options && options.src) {
      let src = options.src
      try {
        src = decodeURIComponent(src)
      } catch (e) {
        // ignore decode error
      }
      this.setData({ src: src })
      this.data.src = src
    }
    this.init()
  },

  touchStart(e) {
    const isReduction = this.data.isReduction
    if (this.cropper && e.touches) {
      this.cropper.touchStart({
        touches: e.touches.filter(i => i.x !== undefined)
      })
    }
    if (!isReduction) {
      this.setData({ isReduction: true })
    }
  },

  touchMove(e) {
    if (this.cropper && e.touches) {
      this.cropper.touchMove({
        touches: e.touches.filter(i => i.x !== undefined)
      })
    }
  },

  touchEnd(e) {
    if (this.cropper) {
      this.cropper.touchEnd(e)
    }
  },

  upload: function () {
    if (!this.data.click) return
    this.setData({ click: false })
    this.getCropperImage()
  },

  getCropperImage() {
    const that = this
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 0
    wx.showLoading({
      title: '上传中',
      mask: true
    })

    const doUploadFile = function (targetFilePath) {
      wx.uploadFile({
        url: 'https://applet.51welink.com/sport/acty/uploadimg',
        filePath: targetFilePath,
        name: "file",
        formData: { userId: userId, fileId: 'file' },
        success: function (res) {
          wx.hideLoading()
          try {
            const obj = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            if (obj && obj.success && obj.data && obj.data.img) {
              const filePath = obj.data.img
              const pages = getCurrentPages()
              if (pages.length >= 2) {
                const prevPage = pages[pages.length - 2]
                prevPage.setData({
                  tempFilePaths: filePath,
                  addView: false,
                  showView: true
                })
              }
              wx.showToast({
                title: '上传成功',
                icon: 'success',
                mask: true,
                duration: 1000
              })
              setTimeout(function () {
                wx.navigateBack({ delta: 1 })
              }, 900)
              return
            }
          } catch (e) {
            console.error('Parse upload result error', e)
          }
          that.setData({ click: true })
          wx.showToast({
            title: '上传失败，请重试',
            icon: 'none',
            duration: 1500
          })
        },
        fail: function (err) {
          console.error('Upload failed', err)
          wx.hideLoading()
          that.setData({ click: true })
          wx.showToast({
            title: '网络错误，请重试',
            icon: 'none',
            duration: 1500
          })
        }
      })
    }

    if (this.cropper && typeof this.cropper.getCropperImage === 'function') {
      this.cropper.getCropperImage()
        .then((src) => {
          if (src) {
            doUploadFile(src)
          } else {
            // 降级使用原图上传
            doUploadFile(that.data.src)
          }
        })
        .catch((err) => {
          console.warn('获取裁剪图片失败，降级使用原图上传', err)
          if (that.data.src) {
            doUploadFile(that.data.src)
          } else {
            wx.hideLoading()
            that.setData({ click: true })
            wx.showToast({
              title: '图片处理失败，请重试',
              icon: 'none'
            })
          }
        })
    } else if (this.data.src) {
      doUploadFile(this.data.src)
    } else {
      wx.hideLoading()
      this.setData({ click: true })
    }
  },

  /** 初始化画布 */
  init() {
    const { cropperOpt } = this.data
    const src = this.data.src

    cropperOpt.boundStyle.color = "#d9ff3f"
    this.setData({ cropperOpt })

    this.cropper = new WeCropper(cropperOpt)
      .on('ready', (ctx) => {
        if (src) {
          ctx.pushOrign(src)
        }
      })
      .on('beforeImageLoad', () => {
        wx.showToast({
          title: '加载中...',
          icon: 'loading',
          mask: true,
          duration: 3000
        })
      })
      .on('imageLoad', () => {
        wx.hideToast()
      })
  },

  /** 还原画布 */
  reduction() {
    const isReduction = this.data.isReduction
    if (!isReduction || !this.cropper) return
    this.cropper.reduction().then(() => {
      this.setData({ isReduction: false })
    })
  },

  /** 旋转画布 */
  rotate() {
    if (!this.cropper) return
    this.cropper.rotateAngle = this.cropper.rotateAngle + 1
    this.cropper.rotate()
  },

  /** 取消编辑 */
  cancel() {
    wx.navigateBack({ delta: 1 })
  }
})


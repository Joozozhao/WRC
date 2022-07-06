// components/cropper/cropper.js
import WeCropper from './we-cropper.js'
const app = getApp()
const util = require('../../utils/util.js')
const device = wx.getSystemInfoSync()
console.log(device);
const width = device.windowWidth
const height = device.windowHeight+50
Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
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
        color: "#04b00f",
        mask: 'rgba(0,0,0,0.8)',
        lineWidth: 1
      }
    },
    /**是否还原 */
    isReduction: false,
    click: true
  },
  /**
   * 组件的方法列表
   */
  methods: {
    onLoad(options) {
      if (options.src) {
        this.data.src = options.src;
      }

      this.init();
    },
    touchStart(e) {
      // this.cropper.touchStart(e)
      const isReduction = this.data.isReduction;
      this.cropper.touchStart({
        touches: e.touches.filter(i => i.x !== undefined)
      });
      if (!isReduction) {
        this.setData({
          isReduction: true
        })
      }
    },
    touchMove(e) {
      // this.cropper.touchMove(e)
      this.cropper.touchMove({
        touches: e.touches.filter(i => i.x !== undefined)
      })
    },
    touchEnd(e) {
      this.cropper.touchEnd(e)
    },
    upload:function(){
      this.getCropperImage()
      this.setData({
        click:false
      })
    },
    getCropperImage(){
      if(this.data.click){
        var userId = app.globalData.userId
        wx.showLoading({
          title: '上传中',
          icon: 'loading',
          mask: true
        })
        this.cropper.getCropperImage()
          .then((src) => {
            wx.uploadFile({
              url: 'https://www.mlhb.com.cn/sport/acty/uploadimg', //这里是上传的服务器地址
              filePath: src,
              name: "file",
              formData: {userId: userId,fileId:'file'},
              success: function (res) {
                console.log(res);
                console.log("uploadOK");
                var obj = JSON.parse(res.data)
                var filePath = obj.data.img
                console.log(obj)
                let pages = getCurrentPages();  // 当前页的数据，可以输出来看看有什么东西
                let prevPage = pages[pages.length - 2];  // 上一页的数据，也可以输出来看看有什么东西
                console.log(prevPage)
                /** 设置数据 这里面的 value 是上一页你想被携带过去的数据， */
                prevPage.setData({
                  tempFilePaths: filePath,
                  addView: false,
                  showView: true
                })
                wx.hideLoading({})
                wx.showToast({
                  title: '上传成功',
                  icon: 'success',
                  mask: true,
                  duration: 1000
                })
                setTimeout(function(){
                  /** 返回上一页 这个时候数据就传回去了 可以在上一页的onShow方法里把 value 输出来查看是否已经携带完成 */
                  wx.navigateBack({
                    delta: 1
                  })
                }, 1000)
              },
              fail(){
                console.log('ss')
              }
            })
          }).catch(() => {
            console.log('获取图片地址失败，请稍后重试')
          })
        }
    },
    /**初始化画布 */
    init() {
      const {
        cropperOpt
      } = this.data,
        self = this,
        src = this.data.src;

      cropperOpt.boundStyle.color = "#04b00f";

      this.setData({
        cropperOpt
      })

      this.cropper = new WeCropper(cropperOpt)
        .on('ready', (ctx) => {
          if (src) {
            ctx.pushOrign(src);
          }
          console.log(`wecropper is ready for work!`)
        })
        .on('beforeImageLoad', (ctx) => {
          wx.showToast({
            title: '上传中',
            icon: 'loading',
            mask: true,
            duration: 20000
          })
        })
        .on('imageLoad', (ctx) => {
          wx.hideToast()
        })
    },
    /**还原画布 */
    reduction() {
      const isReduction = this.data.isReduction,
        self = this;
      if (!isReduction) return;
      this.cropper.reduction().then(() => {
        self.setData({
          isReduction: !isReduction
        })
      });
    },
    /**旋转画布 */
    rotate() {
      this.cropper.rotateAngle = this.cropper.rotateAngle + 1;
      this.cropper.rotate();
    },
    /**取消编辑 */
    cancel() {
      wx.navigateBack();
    }
  }
})

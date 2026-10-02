// pages/creat/creat.js — 创建团跑
const util = require('../../utils/util.js')

const app = getApp()
const DEFAULT_GROUP_COVER = '/images/redesign/group-run-default-cover.jpg'

// 默认活动时间：明天 00:00:00 至 23:59:59，可选期限为未来 10 年
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const tomorrow = new Date(Date.now() + ONE_DAY_MS)
const DEFAULT_DAY = tomorrow.getFullYear() + '-' + (tomorrow.getMonth() + 1) + '-' + tomorrow.getDate()
const LIMIT_DAY = (tomorrow.getFullYear() + 10) + '-' + (tomorrow.getMonth() + 1) + '-' + tomorrow.getDate()
const DEFAULT_START = DEFAULT_DAY + ' 00:00:00'
const DEFAULT_END = DEFAULT_DAY + ' 23:59:59'

// 活动地区选项（弹窗内可多选，提交时用英文逗号拼接）
const SEAL_TYPE_LIST = [
  { gzkind: '北京', id: 1 },
  { gzkind: '日照', id: 2 },
  { gzkind: '其他地区', id: 3 }
]

Page({
  data: {
    showView: false,       // 是否展示封面预览（裁剪页上传成功后回写）
    addView: true,         // 是否展示封面上传入口（裁剪页上传成功后回写）
    startTime: DEFAULT_START,
    endTime: DEFAULT_END,
    startDateDisplay: DEFAULT_DAY,
    startClockDisplay: '00:00',
    endDateDisplay: DEFAULT_DAY,
    endClockDisplay: '23:59',
    isPickerRender: false,
    isPickerShow: false,
    focus: false,
    pickerConfig: {
      endDate: true,
      column: 'second',
      dateLimit: true,
      initStartTime: DEFAULT_START,
      initEndTime: DEFAULT_END,
      limitStartTime: DEFAULT_START,
      limitEndTime: LIMIT_DAY + ' 23:59:59'
    },
    actyType: '团跑',
    tempFilePaths: '',     // 封面图地址（裁剪页上传成功后回写）
    checkOr: '',
    hasMobile: 0,
    sealType: '',
    showModal: false,
    sealTypeList: SEAL_TYPE_LIST.map(function (item) {
      return { gzkind: item.gzkind, id: item.id, checked: '' }
    }),
    stype: 0,
    score: 0,
    disable: false,
    errorMsg: ''
  },

  // 打开地区选择弹窗
  pickArea: function () {
    this.setData({ showModal: true, errorMsg: '' })
  },

  // 地区勾选变化：先清空全部勾选，再按当前选中项回显打勾
  checkboxChange: function (e) {
    const sealTypeList = this.data.sealTypeList
    sealTypeList.forEach(function (item) { item.checked = false })
    const indexes = e.detail.value
    indexes.forEach(function (val) {
      // 多选框 value 从 1 开始，数组下标从 0 开始，需要减 1
      const index = parseInt(val, 10) - 1
      if (sealTypeList[index]) sealTypeList[index].checked = true
    })
    this.setData({ sealTypeList: sealTypeList })
  },

  // 地区弹窗-确定：把勾选的地区用逗号拼接后回显到表单
  onConfirm: function () {
    const seals = this.data.sealTypeList
      .filter(function (item) { return item.checked })
      .map(function (item) { return item.gzkind })
    this.setData({
      sealType: seals.join(','),
      showModal: false,
      errorMsg: ''
    })
  },

  // 地区弹窗-取消：放弃本次勾选，恢复上一次已保存的选择
  onCancel: function () {
    const sealTypeList = this.data.sealTypeList
    const selected = (this.data.sealType || '').split(',')
    sealTypeList.forEach(function (item) {
      item.checked = selected.indexOf(item.gzkind) !== -1
    })
    this.setData({
      sealTypeList: sealTypeList,
      showModal: false
    })
  },

  // 打开时间选择器
  pickerShow: function () {
    this.setData({
      isPickerShow: true,
      isPickerRender: true,
      focus: false,
      errorMsg: ''
    })
  },

  pickerHide: function () {
    this.setData({ isPickerShow: false })
  },

  // 时间选择器确认回调
  setPickerTime: function (val) {
    const detail = val.detail
    const startTime = util.dislodgeZero(detail.startTime)
    const endTime = util.dislodgeZero(detail.endTime)
    this.setData({
      startTime: startTime,
      endTime: endTime,
      startDateDisplay: startTime.split(' ')[0],
      startClockDisplay: (startTime.split(' ')[1] || '').substring(0, 5),
      endDateDisplay: endTime.split(' ')[0],
      endClockDisplay: (endTime.split(' ')[1] || '').substring(0, 5)
    })
  },

  // 选择封面图：支持裁剪后上传与直接上传双通道，确保照片 100% 成功上传
  uploadAction: function () {
    const that = this
    const chooseFn = wx.chooseMedia || wx.chooseImage
    const isMedia = Boolean(wx.chooseMedia)
    
    chooseFn({
      count: 1,
      mediaType: ['image'],
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: function (res) {
        let tempFilePath = ''
        if (isMedia && res.tempFiles && res.tempFiles[0]) {
          tempFilePath = res.tempFiles[0].tempFilePath
        } else if (res.tempFilePaths && res.tempFilePaths[0]) {
          tempFilePath = res.tempFilePaths[0]
        }
        if (!tempFilePath) return

        wx.showActionSheet({
          itemList: ['裁剪后上传（建议横版）', '直接原图上传'],
          success: function (tapRes) {
            if (tapRes.tapIndex === 0) {
              wx.navigateTo({
                url: '../cropper/cropper?src=' + encodeURIComponent(tempFilePath)
              })
            } else {
              that.directUploadCover(tempFilePath)
            }
          },
          fail: function (err) {
            // 用户点击取消则默认进入裁剪页
            if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) {
              return
            }
            wx.navigateTo({
              url: '../cropper/cropper?src=' + encodeURIComponent(tempFilePath)
            })
          }
        })
      }
    })
  },

  directUploadCover: function (filePath) {
    const that = this
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 0
    wx.showLoading({ title: '上传中...', mask: true })
    wx.uploadFile({
      url: 'https://applet.51welink.com/sport/acty/uploadimg',
      filePath: filePath,
      name: 'file',
      formData: { userId: userId, fileId: 'file' },
      success: function (ret) {
        wx.hideLoading()
        try {
          const obj = typeof ret.data === 'string' ? JSON.parse(ret.data) : ret.data
          if (obj && obj.success && obj.data && obj.data.img) {
            that.setData({
              tempFilePaths: obj.data.img,
              addView: false,
              showView: true,
              errorMsg: ''
            })
            wx.showToast({ title: '上传成功', icon: 'success' })
            return
          }
        } catch (e) {
          console.error('Direct upload parse error', e)
        }
        wx.showToast({ title: '上传失败，请重试', icon: 'none' })
      },
      fail: function (err) {
        wx.hideLoading()
        console.error('Direct upload failed', err)
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      }
    })
  },

  // 删除封面
  delete: function () {
    this.setData({
      showView: false,
      addView: true,
      tempFilePaths: '',
      errorMsg: ''
    })
  },

  // 切换“报名时填写手机号”
  checkOr: function () {
    if (this.data.hasMobile === 0) {
      this.setData({ checkOr: true, hasMobile: 1 })
    } else {
      this.setData({ checkOr: '', hasMobile: 0 })
    }
  },

  // 提交创建
  submit: function (e) {
    const values = e.detail.value
    const data = {
      userId: app.globalData.userId,
      actyName: values.actyName,
      actyType: this.data.actyType,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      address: values.address,
      region: this.data.sealType,
      remark: '',
      distance: values.distance,
      actyImg: this.data.tempFilePaths || DEFAULT_GROUP_COVER,
      hasMobile: this.data.hasMobile,
      hasName: 1,
      stype: this.data.stype,
      score: this.data.score,
      level: 0
    }

    // 校验顺序与提示文案；如果没有添加封面，自动使用默认封面
    const rules = [
      { pass: this.data.sealType !== '', message: '请选择活动地区!' },
      { pass: values.actyName !== '', message: '名称不能为空!' },
      { pass: this.data.startTime !== '', message: '请选择开始时间!' },
      { pass: this.data.endTime !== '', message: '请选择结束时间!' },
      { pass: values.address !== '', message: '地点不能为空!' },
      { pass: values.distance !== '', message: '距离不能为空!' }
    ]
    const failed = rules.find(function (rule) { return !rule.pass })
    if (failed) {
      this.setData({ errorMsg: failed.message })
      wx.showToast({
        title: failed.message,
        icon: 'none',
        duration: 1500
      })
      return false
    }
    this.setData({ errorMsg: '' })

    util.request('acty/save', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        this.setData({ disable: true })
        wx.showToast({
          title: '创建成功',
          duration: 1000
        })
        wx.switchTab({
          url: '../activity/activity'
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

  onLoad: function () {
    wx.hideShareMenu({})
  }
})

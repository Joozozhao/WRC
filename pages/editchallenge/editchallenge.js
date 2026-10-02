const util = require("../../utils/util.js")
const app = getApp()

Page({
  data: {
    actyId: 0,
    actyName: "",
    actyType: "挑战",
    startTime: "",
    endTime: "",
    distance: "",
    stype: 0, // 0: 积分, 1: 小花儿
    score: 0,
    remark: "",
    tempFilePaths: "",
    hasMobile: 0,
    isPickerShow: false,
    isPickerRender: false,
    pickerConfig: {
      endDate: true,
      column: "first",
      dateLimit: false,
      initStartTime: "",
      initEndTime: ""
    }
  },

  onLoad(options) {
    const id = options && options.id ? options.id : 0
    this.setData({ actyId: id })
    this.initChallenge(id)
  },

  initChallenge(actyId) {
    util.request("acty/getdetail", "POST", { actyId: actyId }, "加载中...", (res) => {
      if (res && res.data && res.data.success && res.data.data) {
        const d = res.data.data
        const startStr = d.start_timestr ? d.start_timestr.substring(0, 10) : ""
        const endStr = d.end_timestr ? d.end_timestr.substring(0, 10) : ""
        const hasMobile = Number(d.has_mobile) === 1 ? 1 : 0
        const stype = Number(d.stype) === 1 ? 1 : 0

        this.setData({
          actyName: d.acty_name || "",
          actyType: d.acty_type || "挑战",
          startTime: startStr,
          endTime: endStr,
          distance: d.distance !== undefined ? d.distance : "",
          stype: stype,
          score: d.score !== undefined ? d.score : 0,
          remark: d.remark || "",
          tempFilePaths: d.acty_img || "",
          hasMobile: hasMobile,
          "pickerConfig.initStartTime": startStr,
          "pickerConfig.initEndTime": endStr
        })
      } else {
        wx.showToast({ title: (res && res.data && res.data.error) || "获取挑战失败", icon: "none" })
      }
    })
  },

  // 奖励类型切换
  chooseRewardType(e) {
    const type = Number(e.currentTarget.dataset.type)
    this.setData({ stype: type })
  },

  // 时间选择器
  pickerShow() {
    this.setData({
      isPickerShow: true,
      isPickerRender: true
    })
  },

  pickerHide() {
    this.setData({ isPickerShow: false })
  },

  setPickerTime(e) {
    const data = e.detail
    this.setData({
      startTime: data.startTime ? data.startTime.substring(0, 10) : "",
      endTime: data.endTime ? data.endTime.substring(0, 10) : ""
    })
  },

  // 封面选择与裁剪
  uploadAction() {
    wx.chooseImage({
      count: 1,
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const path = res.tempFilePaths[0]
        wx.navigateTo({
          url: "../cropper2/cropper?src=" + encodeURIComponent(path)
        })
      }
    })
  },

  deleteCover() {
    this.setData({ tempFilePaths: "" })
  },

  toggleMobile(e) {
    const checked = e.detail.value
    this.setData({ hasMobile: checked ? 1 : 0 })
  },

  submit(e) {
    const f = e.detail.value
    const userId = app.globalData.userId || 0

    if (!f.actyName || !f.actyName.trim()) {
      wx.showToast({ title: "挑战名称不能为空", icon: "none" })
      return
    }
    if (!this.data.startTime || !this.data.endTime) {
      wx.showToast({ title: "请设置挑战起止日期", icon: "none" })
      return
    }
    if (!f.distance || isNaN(Number(f.distance))) {
      wx.showToast({ title: "请填写正确的挑战距离", icon: "none" })
      return
    }
    if (!this.data.tempFilePaths) {
      wx.showToast({ title: "请上传挑战封面", icon: "none" })
      return
    }

    const postData = {
      userId: userId,
      actyId: this.data.actyId,
      actyName: f.actyName.trim(),
      actyType: this.data.actyType,
      startTime: this.data.startTime + " 00:00:00",
      endTime: this.data.endTime + " 23:59:59",
      distance: f.distance,
      stype: this.data.stype,
      score: f.score !== undefined ? f.score : this.data.score,
      remark: f.remark ? f.remark.trim() : "",
      actyImg: this.data.tempFilePaths,
      hasMobile: this.data.hasMobile,
      hasName: 1,
      region: "",
      level: 0,
      address: ""
    }

    util.request("acty/save", "POST", postData, "正在保存...", (res) => {
      if (res && res.data && res.data.success) {
        wx.showToast({ title: "修改成功", icon: "success", duration: 1500 })
        setTimeout(() => {
          wx.switchTab({ url: "../challenge/challenge" })
        }, 1200)
      } else {
        wx.showToast({ title: (res && res.data && res.data.error) || "保存失败", icon: "none" })
      }
    })
  }
})

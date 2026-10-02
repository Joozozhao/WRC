const util = require("../../utils/util.js")
const app = getApp()
const DEFAULT_GROUP_COVER = '/images/redesign/group-run-default-cover.jpg'

Page({
  data: {
    actyId: 0,
    actyName: "",
    actyType: "团跑",
    startTime: "",
    endTime: "",
    address: "",
    distance: "",
    region: "",
    regionOptions: ["北京", "日照", "其他地区"],
    tempFilePaths: "",
    hasMobile: 0,
    hasPart: 0,
    runCon: false,
    actyMember: [],
    detailPics: [],
    avastars: [],
    runModal: false,
    totalMan: 0,
    selectedUserIds: [],
    isPickerShow: false,
    isPickerRender: false,
    pickerConfig: {
      endDate: true,
      column: "second",
      dateLimit: false,
      initStartTime: "",
      initEndTime: ""
    }
  },

  onLoad(options) {
    const id = options && options.id ? options.id : 0
    this.setData({ actyId: id })
    this.initActivity(id)
    this.initActyIn(id)
    this.loadGroupPhotos(id)
  },

  initActivity(actyId) {
    util.request("acty/getdetail", "POST", { actyId: actyId }, "加载中...", (res) => {
      if (res && res.data && res.data.success && res.data.data) {
        const d = res.data.data
        const hasMobile = Number(d.has_mobile) === 1 ? 1 : 0
        const hasPart = Number(d.level) === 1 ? 1 : 0
        this.setData({
          region: d.region || "北京",
          actyType: d.acty_type || "团跑",
          actyName: d.acty_name || "",
          startTime: d.start_timestr || "",
          endTime: d.end_timestr || "",
          address: d.address || "",
          distance: d.distance !== undefined ? d.distance : "",
          tempFilePaths: d.acty_img || "",
          hasMobile: hasMobile,
          hasPart: hasPart,
          runCon: hasPart === 1,
          "pickerConfig.initStartTime": d.start_timestr || "",
          "pickerConfig.initEndTime": d.end_timestr || ""
        })
      } else {
        wx.showToast({ title: (res && res.data && res.data.error) || "获取活动失败", icon: "none" })
      }
    })
  },

  selectRegion(e) {
    const r = e.currentTarget.dataset.region
    this.setData({ region: r })
  },

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
    const startTime = util.dislodgeZero(data.startTime)
    const endTime = util.dislodgeZero(data.endTime)
    this.setData({
      startTime: startTime,
      endTime: endTime
    })
  },

  uploadAction() {
    const that = this
    const chooseFn = wx.chooseMedia || wx.chooseImage
    const isMedia = Boolean(wx.chooseMedia)
    chooseFn({
      count: 1,
      mediaType: ['image'],
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        let path = ''
        if (isMedia && res.tempFiles && res.tempFiles[0]) {
          path = res.tempFiles[0].tempFilePath
        } else if (res.tempFilePaths && res.tempFilePaths[0]) {
          path = res.tempFilePaths[0]
        }
        if (!path) return

        wx.showActionSheet({
          itemList: ['裁剪后上传（建议横版）', '直接原图上传'],
          success: (tapRes) => {
            if (tapRes.tapIndex === 0) {
              wx.navigateTo({
                url: "../cropper/cropper?src=" + encodeURIComponent(path)
              })
            } else {
              that.directUploadCover(path)
            }
          },
          fail: (err) => {
            if (err && err.errMsg && err.errMsg.indexOf('cancel') !== -1) return
            wx.navigateTo({
              url: "../cropper/cropper?src=" + encodeURIComponent(path)
            })
          }
        })
      }
    })
  },

  directUploadCover(filePath) {
    const userId = app.globalData.userId || wx.getStorageSync('userId') || 0
    wx.showLoading({ title: "正在上传封面...", mask: true })
    wx.uploadFile({
      url: "https://applet.51welink.com/sport/acty/uploadimg",
      filePath: filePath,
      name: "file",
      formData: { userId: userId, fileId: "file" },
      success: (ret) => {
        wx.hideLoading()
        try {
          const obj = typeof ret.data === "string" ? JSON.parse(ret.data) : ret.data
          if (obj && obj.success && obj.data && obj.data.img) {
            this.setData({ tempFilePaths: obj.data.img })
            wx.showToast({ title: "封面上传成功", icon: "success" })
            return
          }
        } catch (e) {
          console.error("Direct upload cover parse error", e)
        }
        wx.showToast({ title: "上传失败，请重试", icon: "none" })
      },
      fail: (err) => {
        wx.hideLoading()
        console.error("Direct upload cover failed", err)
        wx.showToast({ title: "网络错误，请重试", icon: "none" })
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

  toggleGroupRun(e) {
    const checked = e.detail.value
    this.setData({
      hasPart: checked ? 1 : 0,
      runCon: checked
    })
  },

  openMemberModal() {
    util.request("acty/getactyuser", "POST", {
      actyId: this.data.actyId,
      userId: app.globalData.userId || 0,
      level: "",
      distance: 1,
      userName: "",
      mobile: ""
    }, "读取成员中...", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        const raw = res.data.data
        const selected = this.data.actyMember.map(m => String(m.id))
        const list = raw.map(item => {
          return Object.assign({}, item, {
            checked: selected.includes(String(item.id))
          })
        })
        this.setData({
          avastars: list,
          runModal: true,
          totalMan: selected.length,
          selectedUserIds: selected
        })
      } else {
        wx.showToast({ title: "暂无报名成员", icon: "none" })
      }
    })
  },

  closeMemberModal() {
    this.setData({ runModal: false })
  },

  checkboxChangeMember(e) {
    const values = e.detail.value
    this.setData({
      selectedUserIds: values,
      totalMan: values.length
    })
  },

  confirmMembers() {
    const userIdsStr = this.data.selectedUserIds.join(",")
    util.request("acty/updatejoinstate", "POST", {
      userIds: userIdsStr,
      actyId: this.data.actyId
    }, "保存中...", () => {
      this.initActyIn(this.data.actyId)
      this.setData({ runModal: false })
      wx.showToast({ title: "已更新聚跑成员", icon: "none" })
    })
  },

  initActyIn(actyId) {
    util.request("acty/getclickuser", "POST", { actyId: actyId }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        this.setData({
          actyMember: res.data.data,
          totalMan: res.data.data.length
        })
      }
    })
  },

  loadGroupPhotos(actyId) {
    util.request("acty/getactyimgs", "POST", { actyId: actyId }, "", (res) => {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        this.setData({ detailPics: res.data.data })
      }
    })
  },

  uploadGroupPhoto() {
    const actyId = this.data.actyId
    const chooseFn = wx.chooseMedia || wx.chooseImage
    const isMedia = Boolean(wx.chooseMedia)
    chooseFn({
      count: 1,
      mediaType: ['image'],
      sizeType: ["original", "compressed"],
      sourceType: ["album", "camera"],
      success: (res) => {
        let filePath = ''
        if (isMedia && res.tempFiles && res.tempFiles[0]) {
          filePath = res.tempFiles[0].tempFilePath
        } else if (res.tempFilePaths && res.tempFilePaths[0]) {
          filePath = res.tempFilePaths[0]
        }
        if (!filePath) return

        wx.showLoading({ title: "正在上传照片...", mask: true })
        wx.uploadFile({
          url: "https://applet.51welink.com/sport/acty/uploadactyimg",
          filePath: filePath,
          name: "file",
          formData: { actyId: actyId, fileId: "file" },
          success: (uploadRes) => {
            wx.hideLoading()
            try {
              const obj = typeof uploadRes.data === 'string' ? JSON.parse(uploadRes.data) : uploadRes.data
              if (obj && (obj.success || (obj.data && obj.data.img))) {
                this.loadGroupPhotos(actyId)
                wx.showToast({ title: "上传成功", icon: "success" })
                return
              }
            } catch (e) {
              console.error("Upload photo parse error", e)
            }
            wx.showToast({ title: "上传失败，请重试", icon: "none" })
          },
          fail: (err) => {
            wx.hideLoading()
            console.error("Upload photo failed", err)
            wx.showToast({ title: "上传失败，请重试", icon: "none" })
          }
        })
      }
    })
  },

  deleteGroupPhoto(e) {
    const deleID = e.currentTarget.dataset.id
    wx.showModal({
      title: "删除合影",
      content: "确定要删除此张活动照片吗？",
      confirmColor: "#d9534f",
      success: (res) => {
        if (res.confirm) {
          util.request("acty/delactyimgs", "POST", { id: deleID }, "删除中...", () => {
            this.loadGroupPhotos(this.data.actyId)
            wx.showToast({ title: "已删除", icon: "none" })
          })
        }
      }
    })
  },

  submit(e) {
    const f = e.detail.value
    const userId = app.globalData.userId || 0

    if (!this.data.region) {
      wx.showToast({ title: "请选择活动地区", icon: "none" })
      return
    }
    if (!f.actyName || !f.actyName.trim()) {
      wx.showToast({ title: "活动名称不能为空", icon: "none" })
      return
    }
    if (!this.data.startTime || !this.data.endTime) {
      wx.showToast({ title: "请设置开始与结束时间", icon: "none" })
      return
    }
    if (!f.address || !f.address.trim()) {
      wx.showToast({ title: "活动地点不能为空", icon: "none" })
      return
    }
    if (!f.distance || isNaN(Number(f.distance))) {
      wx.showToast({ title: "请填写正确的活动距离", icon: "none" })
      return
    }
    const postData = {
      userId: userId,
      actyId: this.data.actyId,
      actyName: f.actyName.trim(),
      actyType: this.data.actyType,
      startTime: this.data.startTime,
      endTime: this.data.endTime,
      address: f.address.trim(),
      region: this.data.region,
      remark: "",
      distance: f.distance,
      actyImg: this.data.tempFilePaths || DEFAULT_GROUP_COVER,
      hasMobile: this.data.hasMobile,
      hasName: 1,
      stype: 0,
      level: this.data.hasPart,
      score: 0
    }

    util.request("acty/save", "POST", postData, "正在保存...", (res) => {
      if (res && res.data && res.data.success) {
        wx.showToast({ title: "修改成功", icon: "success", duration: 1500 })
        setTimeout(() => {
          wx.switchTab({ url: "../activity/activity" })
        }, 1200)
      } else {
        wx.showToast({ title: (res && res.data && res.data.error) || "保存失败", icon: "none" })
      }
    })
  }
})

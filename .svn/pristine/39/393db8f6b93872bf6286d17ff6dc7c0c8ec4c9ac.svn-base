// pages/recordlist/recordlist.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    btnTab: ['全部', '北京', '日照', '其他地区'],
    btnTab2: ['日常跑', '团跑'],
    // currentTab: 0,
    recordList: [],
    stateIcon: true,
    changeModal: false,
    recordType: '',
    noHistory: true,
    page: 1,
    rcdId: 0,
    score: '',
    reason: '',
    getH: '',
    iconState: true,
    iconState2: true,
    selAll: false,
    sortAll: false,
    selArea: '',
    phoneH: '',
    id: 0,
    area: '',
    actType: -1
  },

  clickArea: function () {
    var that = this
    that.setData({
      selAll: !that.data.selAll,
      iconState: !that.data.iconState,
      sortAll: false,
      iconState2: true
    })
    if (that.data.getH == '') {
      that.setData({
        getH: that.data.phoneH
      })
    } else {
      that.setData({
        getH: ''
      })
    }
  },
  clickType: function () {
    var that = this
    that.setData({
      sortAll: !that.data.sortAll,
      iconState2: !that.data.iconState2,
      selAll: false,
      iconState: true
    })
    if (that.data.getH == '') {
      that.setData({
        getH: that.data.phoneH
      })
    } else {
      that.setData({
        getH: ''
      })
    }
  },
  choose: function (e) {
    var id = e.currentTarget.dataset.id
    var txt = e.currentTarget.dataset.txt
    var that = this
    if (txt == '全部') {
      that.setData({
        id: id,
        area: ''
      })
    } else {
      that.setData({
        id: id,
        area: txt
      })
    }
    that.setData({
      selAll: false,
      sortAll: false,
      iconState: true,
      iconState2: true,
      getH: ''
    })
    that.initRecord()
  },
  choose2: function (e) {
    var id = e.currentTarget.dataset.id
    var that = this
    that.setData({
      id2: id,
      actType: id,
      selAll: false,
      sortAll: false,
      iconState: true,
      iconState2: true,
      getH: ''
    })
    that.initRecord()
  },
  close: function(){
    this.setData({
      selAll: false,
      sortAll: false,
      iconState: true,
      iconState2: true,
    })
  },
  getH: function () {
    //获取机型可用高度
    var that = this
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          phoneH: res.windowHeight - (res.windowWidth / 750) * 94 + "px"
        })
      }
    })
  },
  // 图片预览
  preview: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var url = e.currentTarget.dataset.url
    var previewImgArr = []
    //通过循环在数据链里面找到和这个id相同的这一组数据，然后再取出这一组数据当中的图片
    var data = that.data.recordList
    for (var i in data) {
      if (id == data[i].id) {
        previewImgArr = data[i].sport_img;
      }
    }
    wx.previewImage({
      current: url, // 当前显示图片的http链接
      urls: [previewImgArr] // 需要预览的图片http链接列表
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this.initRecord()
    this.getH()
  },
  initRecord: function () {
    // var userId = app.globalData.userId
    var that = this
    that.setData({
      page: 1
    })
    var data = {
      userId: 0,
      actyId: 0,
      address: that.data.area,
      actyIds: that.data.actType,
      page: that.data.page++
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    util.request('acty/getsports', 'POST', data, '数据加载中 ...', (res) => {
      var that = this
      if (res.data.success) {
        var recordData = res.data.data
        console.log(recordData)
        that.setData({
          recordList: recordData,
          noHistory: false
        })
        wx.hideLoading({
          success: (res) => { },
        })

      } else {
        wx.hideLoading({
          success: (res) => { },
        })
        that.setData({
          recordList: []
        })
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })

  },
  pass: function (e) {
    var id = e.currentTarget.dataset.id
    var Index = e.currentTarget.dataset.index
    var that = this
    var userId = app.globalData.userId
    var recordList = that.data.recordList;
    console.log(Index)
    var data = {
      id: id,
      userId: userId,
      state: 1,
      deductFraction: 0
    }
    console.log(data)
    util.request('acty/setsportstate', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        console.log(res)
        for (let i in recordList) {
          //遍历列表数据      
          if (i == Index) {
            //根据下标找到目标,改变状态  
            if (recordList[i].state == 0) {
              recordList[i].state = parseInt(recordList[i].state) + 1
            }
          }
        }
        //数组重新赋值
        this.setData({
          recordList: recordList
        })
        wx.showToast({
          title: '审核通过',
          icon: 'none',
          duration: 1500
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
  allPass: function () {
    var that = this
    var userId = app.globalData.userId
    var recordList = that.data.recordList;
    var ids = []
    for (var i = 0; i < recordList.length; i++) {
      var state = recordList[i].state
      ids.push(recordList[i].id)
      var data = {
        id: ids.toString(),
        userId: userId,
        state: 1,
        deductFraction: 0
      }
      util.request('acty/setsportstate', 'POST', data, '数据加载中 ...', (res) => {
        if (res.data.success) {
          console.log(res)
          console.log(state)
          if (state == 0) {
            state = 1
            //数组重新赋值
            this.setData({
              recordList: recordList
            })
          }
          wx.showToast({
            title: '一键审核完成',
            icon: 'none',
            duration: 1500
          })
        } else {
          wx.showToast({
            title: res.data.error,
            icon: 'none',
            duration: 1500
          })
        }
      })
    }
    console.log(ids)
  },
  refuseCon: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id
    that.setData({
      changeModal: true,
      rcdId: id
    })
  },
  onCancel: function (e) {
    this.setData({
      changeModal: false
    })
  },
  onConfirm: function (e) {
    var that = this
    var userId = app.globalData.userId
    var formatDate = e.detail.value
    if (formatDate.reason == '') {
      wx.showToast({
        title: '请输入驳回原因',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    if (formatDate.score == '') {
      wx.showToast({
        title: '分数不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    var data = {
      id: that.data.rcdId,
      userId: userId,
      state: 2,
      deductFraction: formatDate.score,
      desc: formatDate.reason
    }
    console.log(data)
    util.request('acty/setsportstate', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        wx.showToast({
          title: '已驳回',
          icon: 'none',
          duration: 1500
        })
      } else {
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })
    this.setData({
      changeModal: false,
      page: 1
    })
    this.onLoad()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function () {
    var data = {
      userId: 0,
      actyId: 0,
      address: this.data.area,
      actyIds: this.data.actType,
      page: this.data.page++
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('acty/getsports', 'POST', data, '数据加载中 ...', (res) => {
      var that = this
      if (res.data.success) {
        var recordData = res.data.data
        var content = that.data.recordList.concat(recordData)
        console.log(res.data)
        that.setData({
          recordList: content,
          noHistory: false
        })
        wx.hideLoading({
          success: (res) => { },
        })
      } else {
        wx.hideLoading({
          success: (res) => { },
        })
      }
    })
  }
})
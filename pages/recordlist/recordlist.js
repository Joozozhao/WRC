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
    listState: 'loading',
    pendingCount: 0,
    stateIcon: true,
    changeModal: false,
    rejectTarget: {},
    recordType: '',
    noHistory: true,
    page: 1,
    hasMore: true,
    loadingMore: false,
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

  // 列表请求版本号：每次 initRecord（首屏/切换筛选）自增，旧请求返回时版本不匹配则丢弃
  _reqSeq: 0,
  // 上拉加载进行中标记（并发 guard）
  _loadingMore: false,
  // 是否还有下一页（终页 guard）
  _hasMore: true,

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
    const urls = Array.isArray(previewImgArr) ? previewImgArr : [previewImgArr]
    const viewer = this.selectComponent('#imageViewer')
    if (viewer) viewer.open(urls, url, { mode: 'card', title: '打卡凭证' })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function () {
    this._reqSeq = 0
    this._loadingMore = false
    this._hasMore = true
    this.initRecord()
    this.getH()
  },
  initRecord: function () {
    // var userId = app.globalData.userId
    var that = this
    // 新一次首屏/筛选请求：版本号自增，之前所有在途请求作废
    var seq = (that._reqSeq || 0) + 1
    that._reqSeq = seq
    that._loadingMore = false
    that._hasMore = true
    that.setData({
      page: 1,
      hasMore: true,
      loadingMore: false,
      listState: 'loading'
    })
    var data = {
      userId: 0,
      actyId: 0,
      address: that.data.area,
      actyIds: that.data.actType,
      page: 1
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    util.request('acty/getsports', 'POST', data, '数据加载中 ...', (res) => {
      // 版本不匹配说明已切换筛选，丢弃旧结果
      if (seq !== that._reqSeq) return
      if (res.data.success) {
        var recordData = Array.isArray(res.data.data) ? res.data.data : []
        console.log(recordData)
        // 首屏返回空页即视为没有更多，避免无意义上拉
        that._hasMore = recordData.length > 0
        that.setData({
          recordList: recordData,
          noHistory: false,
          listState: 'ready',
          hasMore: that._hasMore,
          // 请求成功后才推进页码
          page: 2,
          pendingCount: recordData.filter(item => Number(item.state) === 0).length
        })
        wx.hideLoading({
          success: (res) => { },
        })

      } else {
        wx.hideLoading({
          success: (res) => { },
        })
        that.setData({
          recordList: [],
          listState: 'error',
          pendingCount: 0
        })
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    }, () => {
      if (seq !== that._reqSeq) return
      wx.hideLoading()
      that.setData({ listState: 'error', pendingCount: 0 })
    })

  },
  pass: function (e) {
    var id = e.currentTarget.dataset.id
    var that = this
    var userId = app.globalData.userId
    var seq = that._reqSeq
    var data = {
      id: id,
      userId: userId,
      state: 1,
      deductFraction: 0
    }
    console.log(data)
    util.request('acty/setsportstate', 'POST', data, '数据加载中 ...', (res) => {
      // 筛选已切换则丢弃，避免污染新列表
      if (seq !== that._reqSeq) return
      if (res.data.success) {
        console.log(res)
        // 按 id 定位，避免并发分页后下标错位
        var recordList = that.data.recordList.map(function (item) {
          if (String(item.id) === String(id) && Number(item.state) === 0) {
            return Object.assign({}, item, { state: 1 })
          }
          return item
        })
        that.setData({
          recordList: recordList,
          pendingCount: recordList.filter(item => Number(item.state) === 0).length
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
    // 仅针对本次请求发出的待审核 id
    var ids = that.data.recordList.filter(item => Number(item.state) === 0).map(item => item.id)
    if (!ids.length) return
    var seq = that._reqSeq
    var idSet = {}
    ids.forEach(function (id) { idSet[String(id)] = true })
    util.request('acty/setsportstate', 'POST', {
      id: ids.join(','),
      userId: userId,
      state: 1,
      deductFraction: 0
    }, '数据加载中 ...', (res) => {
      // 筛选已切换：新页面与本批无关，直接丢弃
      if (seq !== that._reqSeq) return
      if (res.data.success) {
        // 只把本次发出的 id 置为已通过，期间分页新加载的待审核记录仍保持 pending
        var recordList = that.data.recordList.map(function (item) {
          if (Number(item.state) === 0 && idSet[String(item.id)]) {
            return Object.assign({}, item, { state: 1 })
          }
          return item
        })
        that.setData({
          recordList: recordList,
          pendingCount: recordList.filter(item => Number(item.state) === 0).length
        })
        wx.showToast({ title: '待审核记录已通过', icon: 'none' })
      } else {
        wx.showToast({ title: res.data.error, icon: 'none' })
      }
    })
  },
  refuseCon: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var target = {}
    var list = that.data.recordList || []
    for (var i = 0; i < list.length; i++) {
      if (list[i].id == id) {
        target = {
          name: list[i].name || list[i].nick_name || '微马跑者',
          avatar: list[i].header_url || '',
          distance: list[i].distance != null ? list[i].distance : '—'
        }
        break
      }
    }
    that.setData({
      changeModal: true,
      rcdId: id,
      rejectTarget: target
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
        that.setData({ changeModal: false, page: 1 })
        that.initRecord()
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
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function () {
    var that = this
    // 并发 guard：加载中不重复发请求
    if (that._loadingMore) return
    // 终页 guard：没有下一页时不再请求
    if (!that._hasMore) return
    if (that.data.listState !== 'ready') return
    // 本次分页沿用当前筛选版本；期间若切换筛选，initRecord 会自增版本号使结果作废
    var seq = that._reqSeq
    var page = that.data.page
    var data = {
      userId: 0,
      actyId: 0,
      address: that.data.area,
      actyIds: that.data.actType,
      page: page
    }
    console.log(data)
    that._loadingMore = true
    that.setData({ loadingMore: true })
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('acty/getsports', 'POST', data, '数据加载中 ...', (res) => {
      if (seq !== that._reqSeq) {
        // 筛选已切换，本次结果作废；不修改任何状态，
        // 否则会清掉新筛选分页请求的 _loadingMore guard 导致重复发请求
        return
      }
      if (res.data.success) {
        var recordData = Array.isArray(res.data.data) ? res.data.data : []
        // 按 id 去重，避免重复分页数据串入
        var seen = {}
        var content = that.data.recordList.concat(recordData).filter(function (item) {
          var key = String(item.id)
          if (seen[key]) return false
          seen[key] = true
          return true
        })
        var hasMore = recordData.length > 0
        that._loadingMore = false
        that._hasMore = hasMore
        that.setData({
          recordList: content,
          noHistory: false,
          hasMore: hasMore,
          // 成功后才推进页码；空页则停在当前页
          page: hasMore ? page + 1 : page,
          loadingMore: false,
          pendingCount: content.filter(item => Number(item.state) === 0).length
        })
        wx.hideLoading({
          success: (res) => { },
        })
      } else {
        // 业务失败：页码不推进，允许重试
        that._loadingMore = false
        that.setData({ loadingMore: false })
        wx.hideLoading({
          success: (res) => { },
        })
        wx.showToast({
          title: res.data.error || '加载失败',
          icon: 'none',
          duration: 1500
        })
      }
    }, () => {
      // 网络失败：恢复状态，页码不推进，允许重试
      if (seq !== that._reqSeq) {
        // 过期回调直接返回，不得清掉新请求的 guard
        return
      }
      that._loadingMore = false
      that.setData({ loadingMore: false })
      wx.hideLoading()
    })
  }
})

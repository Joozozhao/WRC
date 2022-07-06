// pages/prizemanage/prizemanage.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    prizeList: [],
    userList: [],
    page: 1,
    noHistory: true,
    memberModal: false,
    stype: 0,
    checked: '',
    choosed: '',
    goodsId: 0,
    score: '',
    energy: '',
    userid: '',
    storageId: 0,
    userName: '',
    nickName: '',
    getName: '',
    grantid: '',
    add: false,
    viewShowed: false, //显示结果view的状态
    inputVal: "", // 搜索框值
    catList: [], //搜索渲染推荐数据
    nameList: []
  },
  toDetail: function(e){
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../prizedetails/prizedetails?id='+ id,
    })
  },
  initPrize: function(){
    // var userId = app.globalData.userId
    var that = this
    that.setData({
      page: 1
    })
    var data = {
      gn : "", 
      type : "全部",
      page: that.data.page++
    }
    console.log(data)
    util.request('goods/searchlist', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        var orderData = res.data.data
        console.log(orderData)
        that.setData({
          prizeList: orderData,
          noHistory: false
        })
      }
    })
  },
  initDetail : function(id){
    var that = this
    var data = {
      id: id
    }
    util.request('goods/get', 'POST', data, '数据加载中...', (res)=>{
      console.log(res.data)
      if(res.data.success){
        that.setData({
          allType: res.data.data.goodsStorageList
        })
      }else{
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
      
    })
  },
  setState:function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    var state = e.currentTarget.dataset.state
    var num = e.currentTarget.dataset.num
    var myList = that.data.prizeList
    var data = {
      id: id,
      state: state
    }
    console.log(data)
    if(num!==''){
      util.request('goods/setstate', 'POST', data, '数据加载中 ...', (res)=>{
        if(res.data.success){
          for (let i in myList) {
            //遍历列表数据      
            if (i == index) {
              //根据下标找到目标,改变状态  
              if (myList[i].state == 0) {
                myList[i].state = parseInt(myList[i].state) + 1
              } else {
                myList[i].state = parseInt(myList[i].state) - 1
              }
            }
          }
          //数组重新赋值
          this.setData({
            prizeList: myList
          })
          wx.showToast({
            title: '设置成功',
            icon: 'none',
            duration: 1500
          })
        }
        // that.setData({
        //   page: 1
        // })
        // that.onLoad()
      })
    } else {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
    }
    
  },
  payGood:function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    var stype = e.currentTarget.dataset.type
    var score = e.currentTarget.dataset.score
    var energy = e.currentTarget.dataset.energy
    var total = e.currentTarget.dataset.total
    if(total==0){
      wx.showToast({
        title: '库存不足',
        icon: 'error',
        duration: 1500
      })
    } else{
      that.initDetail(id)
      that.setData({
        goodsId: id,
        stype: stype,
        score: score,
        energy: energy,
        memberModal: true
      })
    }
  },
  editGood:function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../editprize/editprize?id=' + id,
    })
  },
  setType:function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '../addtype/addtype?id=' + id,
    })
  },
  delPrize:function(e){
    var id = e.currentTarget.dataset.id
    var index = e.currentTarget.dataset.index
    var that = this
    var data ={
      id: id
    }
    console.log(data)
    wx.showModal({   
      title: '是否确定删除此奖品？',
      success: function (res) {
        if (res.confirm) {             
          //点击确定后
          util.request('goods/del', 'POST', data, '数据加载中 ...', (res)=>{
            console.log(res.data)
            if(res.data.success){
              wx.showToast({
                title: '删除成功！',
              })
              var prizeList = that.data.prizeList
              prizeList.splice(index,1)
              that.setData({
                prizeList: that.data.prizeList
              })
            }else{
              // that.setData({
              //   prizeList: []
              // })
              // that.setData({
              //   page: 1
              // })
              // that.initPrize()
              wx.showToast({
                title: res.data.error,
                icon: 'none',
                duration: 1500
              })  
            }
          })
         } else {
           console.log('用户取消')
         }
       }
    })
    
  },
  uploadPri:function(){
    wx.navigateTo({
      url: '../uploadprize/uploadprize',
    })
  },
  closeIt: function(){
    this.setData({
      memberModal: false
    })
  },
  chooseOne:function(e){
    var that = this
    var id = e.currentTarget.dataset.id
    console.log(id)
    that.setData({
      typeId: id,
      storageId: id
    })
  },
  choose: function(e){
    this.setData({
      stype: 0
    })
  },
  choose2: function(e){
    this.setData({
      stype: 1
    })
  },
  search: function(e){
    var that = this
    var value = e.detail.value
    var list1 = that.data.nameList
    var data = { 
      name: value
    }
    console.log(data)
    util.request('user/searchname', 'POST', data, '数据加载中 ...', (res)=>{
      console.log(res)
      if(res.data.success){
        that.setData({
          nameList: res.data.data,
          viewShowed: true,
          add: true
        })
        console.log(that.data.nameList)
      }
    })    
  },
  name: function(e){
    var that =this
    var name = e.currentTarget.dataset.name
    that.setData({
      username: name,
      viewShowed: false,
      add: false
    })
  },
  // 隐藏搜索框样式
  hideInput: function() {
    this.setData({
      username: "",
      viewShowed: false,
      add: false
    })
  },
  onConfirm: function(e){
    var that = this
    var formatDate = e.detail.value
    if(that.data.storageId==0){
      wx.showToast({
        title: '请选择奖品规格!',
        icon: 'none',
        duration: 1500
      })
      return false
    } 
    if(formatDate.username==''){
      wx.showToast({
        title: '请输入用户姓名!',
        icon: 'none',
        duration: 1500
      })
      return false
    } 
    var data = { 
      // id : formatDate.userid
      name: formatDate.username
    }
    // util.request('user/get', 'POST', data, '数据加载中 ...', (res)=>{
    util.request('user/searchname', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      console.log(res)
      if(res.data.success){
        that.setData({
          grantid: res.data.data[0].id,
          getName: formatDate.username
        })
        // if(that.data.userName==''){
        //   that.setData({
        //     getName: that.data.nickName
        //   })
        // } else {
        //   that.setData({
        //     getName: that.data.userName
        //   })
        // }
      
      var data = {
        goodsId: that.data.goodsId,
        userId: that.data.grantid,
        storageId: that.data.typeId,
        type: that.data.stype,
        score: formatDate.score
      }
      console.log(data)
      wx.showModal({   
        title: '是否确定分配奖品给'+ that.data.getName + '吗？',
        success: function (res) {
          if (res.confirm) {             //点击确定后
            util.request('order/grant', 'POST', data, '数据加载中...', (res)=>{
              console.log(res.data)
              if(res.data.success){
                wx.showToast({
                  title: '分配成功！',
                })
                that.setData({
                  memberModal: false
                })
              }
            })
           } else {
             console.log('用户取消')
           }
         }
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
  onCancel: function(){
    this.setData({
      memberModal: false
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function () {
    this.initPrize()
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    this.loadMore()
  },
  loadMore: function(){
    var that = this
    var data = {
      gn : "", 
      type : "全部",
      page: that.data.page++
    }
    console.log(data)
    wx.showLoading({
      title: '加载中',
      icon: 'loading'
    })
    util.request('goods/searchlist', 'POST', data, '数据加载中 ...', (res)=>{
      var that = this
      if(res.data.success){
        var orderData = res.data.data
        var content = that.data.prizeList.concat(orderData)
        console.log(res.data)
        that.setData({
          prizeList: content,
          noHistory: false
        })
        wx.hideLoading({
          success: (res) => {},
        })
      } else {
        wx.hideLoading({
          success: (res) => {},
        })
      }
    })
  }
})
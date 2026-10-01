// pages/addNewAddress/addNewAddress.js
const util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    customItem: [],
    detailed: '请选择',
    formData: '',
    address: '',
    disable: '',
    submitting: false
  },
  //省市联动
  bindRegionChange: function (e) {
    var that = this
    //为了让选择框有个默认值，    
    that.setData({
      clas: '',
    // })　　　//下拉框所选择的值
    // console.log('picker发送选择改变，携带值为', e.detail.value)

    // this.setData({
      //拼的字符串传后台
      address: e.detail.value[0] + "" + e.detail.value[1] + "" + e.detail.value[2],
      //下拉框选中的值
      region: e.detail.value,
    // })

    // this.setData({
      "AddSite.area": e.detail.value[0] + "" + e.detail.value[1] + "" + e.detail.value[2]
    })
  },
  onSubmit: function (e){
    var that = this
    var userId = app.globalData.userId
    var formData = e.detail.value
    if (that.data.submitting) {
      return false
    }
    if (formData.name == '') {
      wx.showToast({
        title: '联系人不能为空!',
        icon: 'none',
        duration: 1500
      })  
      return false
    }
    if(formData.mobile == '') {
      wx.showToast({
        title: '电话号码不能为空!',
        icon: 'none',
        duration: 1500
      })
      return false
    }
    // if(!util.isPhone(formData.mobile)){
    //   wx.showToast({
    //     title: '请输入正确手机号!',
    //     icon: 'none',
    //     duration: 1500
    //   })
    //   return false
    // }
    if(that.data.address == ''){
      wx.showToast({
        title: '请选择省市区!',
        icon: 'none',
        duration: 1500
      })  
      return false
    }
    if(formData.addressDet == ''){
      wx.showToast({
        title: '请输入详细地址!',
        icon: 'none',
        duration: 1500
      })  
      return false
    }
    var addr = that.data.address
    var data = {
      userId: userId,
      name: formData.name,
      mobile: formData.mobile,
      addr: addr + formData.addressDet
    }
    console.log(data)
    that.setData({
      submitting: true
    })
    wx.showLoading({
      title: '保存中',
      mask: true
    })
    util.request('user/saveaddr', 'POST', data, '数据加载中 ...', (res)=>{
      wx.hideLoading()
      console.log(res)
      if(res.data.success){
        that.setData({
          disable: true
        })
        wx.navigateBack({
          delta: 1,
          fail: function () {
            wx.redirectTo({
              url: '../address/address'
            })
          }
        })
      }else{
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
  }
})
// pages/addtype/addtype.js
var util = require('../../utils/util.js')
// 获取应用实例
const app = getApp()
Page({
  /**
   * 页面的初始数据
   */
  data: {
    goodId: 0,
    goods_name: '',
    page: 1,
    typeInfor: [{
      goodsStorageList: [{
        tag_desc: '',
        stock: ''
      }],
      tagName: ''
    }],
    addShow: true,
    delShow: false,
    typeHide: false,
    newItem: [
      {
        tag_desc: null,
        stock: null,
      }
    ]
  },
  initType: function () {
    var that = this
    var data = {
      id: that.data.goodId,
      gn: '',
      page: that.data.page++
    }
    wx.showLoading({
      title: '加载中',
      icon: 'loading',
      mask: true
    })
    util.request('goods/get', 'POST', data, '数据加载中 ...', (res) => {
      if (res.data.success) {
        if(res.data.data.goodsStorageList!=undefined){
          this.setData({
            typeInfor: res.data.data.goodsStorageList,
            goods_name: res.data.data.goods_name
          })
        }else{
          this.setData({
            goods_name: res.data.data.goods_name
          })
        }
        wx.hideLoading({
          success: (res) => { },
        })
      } else {
        wx.hideLoading({
          success: (res) => { },
        })
        wx.showToast({
          title: res.data.error,
          icon: 'none',
          duration: 1500
        })
      }
    })
  },
  saveIpt: function(e){
    var val = e.detail.value
    this.setData({
      value: val
    })
  },
  addItem: function (e) {
    var idx = e.currentTarget.dataset.index
    var lists = this.data.typeInfor[idx].goodsStorageList
    var newData = {
      tag_desc: "",
      stock: ''
    };
    // lists.push(newData);//实质是添加lists数组内容，使for循环多一次
    let goodTemp = 'typeInfor[' + idx + '].goodsStorageList';
    this.setData({
      [goodTemp]: lists.concat(newData)
    })
  },
  addTag: function () {
    var lists = this.data.typeInfor
    var newData = {
      goodsStorageList: [{
        tag_desc: '',
        stock: ''
      }],
      tagName: ''
    };
    lists.push(newData);//实质是添加lists数组内容，使for循环多一次
    this.setData({
      typeInfor: lists
    })
  },
  //删除规格
  del: function (e) {
    var that = this
    var id = e.currentTarget.dataset.id
    var idx = e.currentTarget.dataset.index
    var childidx = e.currentTarget.dataset.childindex
    if (id == undefined) {
      var infors = that.data.typeInfor
      var typeInfor = that.data.typeInfor[idx].goodsStorageList
      if (typeInfor.length == 1) {
        var infor = 'typeInfor[' + idx + ']';
        infors.splice(idx, 1)
        that.setData({
          typeInfor: infors
        })
      } else {
        typeInfor.splice(childidx, 1)
        var subInfor = 'typeInfor[' + idx + '].goodsStorageList';
        that.setData({
          [subInfor]: typeInfor
        })
      }
    } else {
      wx.showModal({
        title: '是否确定删除内容？',
        success: function (res) {
          if (res.confirm) {
            var data = {
              id: id
            }
            util.request('goods/delgoodstags', 'POST', data, '数据加载中 ...', (res) => {
              if (res.data.success) {
                that.setData({
                  page: 1
                })
                var infors = that.data.typeInfor
                var typeInfor = that.data.typeInfor[idx].goodsStorageList
                if (typeInfor.length == 1) {
                  var infor = 'typeInfor[' + idx + ']';
                  infors.splice(idx, 1)
                  that.setData({
                    typeInfor: infors
                  })
                } else {
                  typeInfor.splice(childidx, 1)
                  var subInfor = 'typeInfor[' + idx + '].goodsStorageList';
                  that.setData({
                    [subInfor]: typeInfor
                  })
                }
                // that.initType()
                wx.showToast({
                  title: '已删除',
                  icon: 'none',
                  duration: 1500
                })
              } else {
                that.setData({
                  typeInfor: []
                })
                wx.showToast({
                  title: res.data.error,
                  icon: 'none',
                  duration: 1500
                })
              }
            })
          } else {
          }
        }
      })
    }
  },
  addMore: function () {
    this.setData({
      typeHide: true,
      delShow: true,
      addShow: false
    })
  },
  delType: function () {
    this.setData({
      typeHide: false,
      delShow: false,
      addShow: true
    })
  },
  submit: function (e) {
    var that = this
    var typeInfor = that.data.typeInfor
    var formData = e.detail.value
    var params = []
    var tag = ""
    var desc = ""
    var stock = ""
    for (var i = 0; i < typeInfor.length; i++) {
      var _t = "Type_Name" + [i]
      for (var j = 0; j < typeInfor[i].goodsStorageList.length; j++) {
        var _n = "Name" + i + j
        var _s = "Total" + i + j
        if (formData[_t] == '') {
          wx.showToast({
            title: '规格不能为空!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        if (formData[_n] == '') {
          wx.showToast({
            title: '名称不能为空!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        if (formData[_s] == '') {
          wx.showToast({
            title: '库存不能为空!',
            icon: 'none',
            duration: 1500
          })
          return false
        }
        var data = {
          gId: that.data.goodId,
          tag: formData[_t],
          desc: formData[_n],
          stock: formData[_s],
          type: 0,
          remark: ''
        }
        tag += formData[_t] + "#,#"
        desc += formData[_n] + "#,#"
        stock += formData[_s] + "#,#"
        params.push(data)
      }
    }
    var subData = {
      gId: that.data.goodId,
      tag: tag,
      desc: desc,
      stock: stock
    }
    util.request('goods/createupdatetags', 'POST', subData, '数据加载中 ...', (res) => {
      if (res.data.success) {
        wx.showToast({
          title: '添加成功'
        })
        // that.initType()
        setTimeout(function(){
          wx.navigateBack({
            delta: 1
          })
        },1500)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var id = options.id
    this.setData({
      goodId: id
    })
    this.initType()
  }
})
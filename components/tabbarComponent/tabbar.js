// tabBarComponent/tabBar.js
const app = getApp();
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    tabbar: {
      type: Object,
      value: {
        "backgroundColor": "#fbfcf9",
        "color": "#87928c",
        "selectedColor": "#0b503b",
        "list": [{
          "pagePath": "/pages/index/index",
          "text": "首页",
          "iconPath": "/images/redesign/home.svg"
        }, {
          "pagePath": "/pages/activity/activity",
          "text": "团跑",
          "iconPath": "/images/redesign/groups.svg"
        }, {
          "pagePath": "/pages/challenge/challenge",
          "text": "挑战",
          "iconPath": "/images/redesign/trophy.svg"
        }, {
          "pagePath": "/pages/mydata/mydata",
          "text": "我的",
          "iconPath": "/images/redesign/person.svg"
        }]
      }
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    isIphoneX: /iPhone (X|1[1-9])/.test((app.globalData.systemInfo && app.globalData.systemInfo.model) || '')
  },

  /**
   * 组件的方法列表
   */
  methods: {

  }
})

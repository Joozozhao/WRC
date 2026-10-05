// pages/mydata/mydata.js
const util = require("../../utils/util.js");
const heatmap = require("../../utils/recent-run-heatmap.js");
const participation = require("../../utils/participation-timeline.js");
const { toDisplayMemberLevel } = require('../../utils/member-level.js');
const { getRegionLabel } = require('../../utils/profile-badges.js');
const app = getApp();
const playPageMotion = require('../../utils/page-motion.js')

Page({
  /**
   * 页面的初始数据
   */
  data: {
    tabbar: {},
    userId: 0,
    headerImg: "../../images/default.png",
    userName: "",
    nickName: "",
    sex: "",
    level: "",
    levelLabel: "",
    regionLabel: "",
    score: 0,
    energy: 0,
    totalDistance: 0,
    monthDistance: 0,
    weekDistance: "0.0",
    weekLoaded: false,
    yearDistance: "0.0",
    yearLoaded: false,
    statsLoaded: false,
    duty: "",
    marathons: [],
    totalChallenge: 0,
    totalActy: 0,
    activityList: [],
    activityList2: [],
    challengeStatus: "loading",
    runStatus: "loading",
    challengeHasMore: false,
    runHasMore: false,
    challengeCountKnown: false,
    runCountKnown: false,
    page: 1,
    page2: 1,
    recentHeatmap: null,
    heatmapStatus: "loading",
    heatmapRangeLabels: ["最近1个月", "最近3个月", "最近6个月", "最近12个月"],
    heatmapRangeIndex: 2,
    heatmapRangeValue: heatmap.DEFAULT_RANGE_MONTHS,
    heatmapCheckinDays: 0,
    heatmapDaysText: "—",
    heatmapCellSize: heatmap.HEATMAP_MIN_CELL,
    heatmapColumnGap: heatmap.HEATMAP_GAP,
    heatmapColumnStride: heatmap.HEATMAP_MIN_CELL + heatmap.HEATMAP_GAP,
    heatmapCanvasWidth: heatmap.HEATMAP_VIEWPORT_RPX,
    heatmapMonthAxisHeight: heatmap.HEATMAP_MONTH_AXIS_HEIGHT,
    heatmapScrollLeft: 0,
    heatmapTooltipVisible: false,
    heatmapSelectedDate: "",
    heatmapTooltipDate: "",
    heatmapTooltipDistance: "",
    heatmapTooltipLeft: 0,
    heatmapTooltipTop: 0,
    // 行 0/2/4 对应周一/周三/周五，与左侧星期轴逐行对齐。
    heatmapWeekdayRows: ["周一", "", "周三", "", "周五", "", ""]
  },

  openLogin: function() {
    var that = this;
    wx.getUserProfile({
      desc: "用于完善跑者会员资料",
      success: function(infoRes) {
        var wxUser = infoRes.userInfo || {};
        wx.login({
          success: function(loginRes) {
            if (!loginRes.code) {
              wx.showToast({ title: "登录失败", icon: "none" });
              return;
            }
            util.request("user/wxlogin", "POST", { code: loginRes.code }, "登录中...", function(res) {
              if (res.data && res.data.success && res.data.data) {
                app.globalData.userId = res.data.data.id;
                app.globalData.openId = res.data.data.open_id;
                wx.setStorageSync("userId", res.data.data.id);
                wx.setStorageSync("openId", res.data.data.open_id);
                that.myLogin(res.data.data.id);
              } else {
                util.request("user/wxregister", "POST", {
                  code: loginRes.code,
                  nickName: wxUser.nickName || "",
                  header_url: wxUser.avatarUrl || "",
                  gender: wxUser.gender || 1
                }, "注册中...", function(regRes) {
                  if (regRes.data && regRes.data.success && regRes.data.data) {
                    var newId = regRes.data.data.id || regRes.data.data.userId;
                    app.globalData.userId = newId;
                    wx.setStorageSync("userId", newId);
                    that.myLogin(newId);
                  } else {
                    wx.showToast({ title: "登录或注册失败", icon: "none" });
                  }
                });
              }
            });
          }
        });
      },
      fail: function() {
        wx.showToast({ title: "已取消登录", icon: "none" });
      }
    });
  },

  openProfile: function() {
    var userId = this.data.userId;
    if (userId > 0) {
      wx.navigateTo({ url: "../userinfor/userinfor" });
    } else {
      this.openLogin();
    }
  },

  goActivity: function() {
    wx.switchTab({ url: "../activity/activity" });
  },

  goChallenge: function() {
    wx.switchTab({ url: "../challenge/challenge" });
  },

  initInfor: function(id) {
    var that = this;
    if (!id || id <= 0) return;
    var data = { userId: id };
    util.request("user/getsportinfo", "POST", data, "", function(res) {
      if (res && res.data && res.data.success) {
        var myData = res.data.data || {};
        that.setData({
          headerImg: myData.headerImg || "../../images/default.png",
          userName: myData.userName || "",
          nickName: myData.nickName || "",
          sex: myData.sex || "",
          level: myData.level || "",
          levelLabel: toDisplayMemberLevel(myData.level),
          regionLabel: getRegionLabel(myData),
          score: myData.score || 0,
          energy: myData.energy || 0,
          monthDistance: myData.monthDistance || 0,
          totalDistance: myData.totalDistance || 0,
          statsLoaded: true
        });
      }
    });
  },

  checkPoint: function() {
    wx.navigateTo({ url: "../checkpoint/checkpoint" });
  },

  checkEnergy: function() {
    wx.navigateTo({ url: "../energy/energy" });
  },

  editInfor: function() {
    var openId = app.globalData.openId;
    if (!openId) {
      wx.showToast({ title: "请先登录小程序！", icon: "none" });
      return;
    }
    wx.navigateTo({ url: "../userinfor/userinfor" });
  },

  toRecord: function() {
    wx.navigateTo({ url: "../record/record" });
  },

  toHistory: function() {
    wx.navigateTo({ url: "../history/history" });
  },

  toPrize: function() {
    wx.navigateTo({ url: "../prize/prize" });
  },

  toManage: function() {
    wx.navigateTo({ url: "../manage/manage" });
  },

  getWeekRuns: function(userId) {
    var that = this;
    if (!userId || userId <= 0) return;
    util.request("user/getWeekRuleList", "POST", { user_id: userId }, "", function(res) {
      if (res && res.data && res.data.success && res.data.data) {
        var days = res.data.data || [];
        var runCount = days.filter(function(day) {
          return Number(day.sport_total) > 0;
        }).length;
        var total = 0;
        days.forEach(function(day) {
          var val = Number(day.sport_total) || 0;
          if (val > 0) total += val;
        });
        that.setData({
          weekDistance: (Math.round(total * 10) / 10).toFixed(1),
          weekLoaded: true
        });
      } else {
        that.setData({
          weekDistance: "0.0",
          weekLoaded: true
        });
      }
    }, function() {
      that.setData({
        weekDistance: "0.0",
        weekLoaded: true
      });
    });
  },

  getYearDistance: function(userId) {
    var that = this;
    if (!userId || userId <= 0) return;
    var openId = wx.getStorageSync("openId") || app.globalData.openId || "";
    var postData = {
      nickName: "",
      mobile: "",
      openId: openId,
      sort: 4,
      levelId: "",
      page: 1,
      size: 100
    };
    util.request("user/getuserlist", "POST", postData, "", function(res) {
      if (res && res.data && res.data.success && Array.isArray(res.data.data)) {
        var list = res.data.data;
        var me = list.find(function(item) {
          return String(item.id) === String(userId) || (openId && item.open_id === openId);
        });
        if (me && me.year_count !== undefined && me.year_count !== null) {
          var yr = Number(me.year_count) || 0;
          that.setData({
            yearDistance: (Math.round(yr * 10) / 10).toFixed(1),
            yearLoaded: true
          });
          return;
        }
      }
      that.setData({
        yearDistance: "0.0",
        yearLoaded: true
      });
    }, function() {
      that.setData({
        yearDistance: "0.0",
        yearLoaded: true
      });
    });
  },

  initDuty: function(userId) {
    var that = this;
    if (!userId || userId <= 0) {
      this.setData({ duty: "" });
      return;
    }
    util.request("user/get", "POST", { id: userId }, "", function(res) {
      if (res && res.data && res.data.success && res.data.data) {
        var d = res.data.data.duty;
        if (d == "团长,管理员" || d == "管理员,团长") {
          that.setData({ duty: "管理员/团长" });
        } else {
          that.setData({ duty: d || "" });
        }
      }
    });
  },

  initMarathon: function(userId) {
    var that = this;
    if (!userId || userId <= 0) return;
    util.request("user/marathonpb", "POST", { userId: userId }, "", function(res) {
      if (res.data && res.data.success) {
        that.setData({ marathons: res.data.data || [] });
      }
    });
  },

  navigateWithParams: function() {
    var userId = this.data.userId;
    if (!userId || userId <= 0) return;
    wx.navigateTo({ url: "../results/results?id=" + userId });
  },

  // 参与记录的两个来源独立分页，切换账号或重新进入页面会作废旧回调。
  getParticipationController: function() {
    var that = this;
    if (!this._participationController) {
      this._participationController = participation.createParticipationController({
        isCurrentUser: function(requestUserId) {
          return String(that.data.userId) === String(requestUserId);
        },
        fetchPage: function(requestUserId, type, page, onSuccess, onFail) {
          util.request("acty/getacty", "POST", { userId: requestUserId, type: type, page: page }, "", onSuccess, onFail);
        },
        onState: function(patch) { that.setData(patch); }
      });
    }
    return this._participationController;
  },

  initParticipationData: function(userId) {
    this.getParticipationController().load(userId);
  },

  loadMore: function() {
    this.getParticipationController().loadMore("challenge");
  },

  loadMore2: function() {
    this.getParticipationController().loadMore("run");
  },

  toDet: function(e) {
    var id = e.detail.id;
    var type = e.detail.type;
    if (type == "挑战") {
      wx.navigateTo({
        url: "../challengedetail/challengedetail?id=" + id + "&userid=" + this.data.userId
      });
    } else {
      wx.navigateTo({
        url: "../activitydetail/activitydetail?id=" + id + "&userid=" + this.data.userId
      });
    }
  },

  /** 跑步热力图的编排器（分页全量拉取、用户守卫、竞态防护、月份切换本地重算都在 util 内）。 */
  getHeatmapController: function() {
    var that = this;
    if (!this._heatmapController) {
      this._heatmapController = heatmap.createHeatmapController({
        now: function() {
          return new Date();
        },
        monthsBack: heatmap.DEFAULT_RANGE_MONTHS,
        isCurrentUser: function(requestUserId) {
          return String(that.data.userId) === String(requestUserId);
        },
        fetchRecords: function(requestUserId, page, onSuccess, onFail) {
          var params = { userId: requestUserId, type: -1, page: page };
          util.request("user/getsportlist", "POST", params, "", onSuccess, onFail);
        }
      });
    }
    return this._heatmapController;
  },

  initHeatmapData: function(userId) {
    var that = this;
    this.getHeatmapController().load(userId, {
      onState: function(state) {
        that.applyHeatmapState(state);
      }
    });
  },

  /**
   * 落一次编排器状态：标题天数、下拉选中项、方格几何与滚动位置都在这里同步。
   * ready 才写真实打卡天数，guest/loading/error 一律显示「—天」。
   */
  applyHeatmapState: function(state) {
    var months = heatmap.normalizeMonths(state && state.monthsBack, heatmap.DEFAULT_RANGE_MONTHS);
    var index = heatmap.RANGE_OPTIONS.indexOf(months);
    if (index < 0) index = heatmap.RANGE_OPTIONS.indexOf(heatmap.DEFAULT_RANGE_MONTHS);
    var ready = !!state && state.status === "ready" && !!state.recentHeatmap;
    var patch = {
      heatmapStatus: state ? state.status : "error",
      recentHeatmap: ready ? state.recentHeatmap : null,
      heatmapRangeIndex: index,
      heatmapRangeValue: months,
      heatmapCheckinDays: ready ? (state.checkinDays || 0) : 0,
      heatmapDaysText: ready ? String(state.checkinDays || 0) : "—"
    };
    patch.heatmapTooltipVisible = false;
    if (ready) {
      var layout = heatmap.computeHeatmapLayout(state.recentHeatmap.weeks.length);
      patch.heatmapCellSize = layout.cell;
      patch.heatmapColumnGap = layout.gap;
      patch.heatmapColumnStride = layout.stride;
      patch.heatmapCanvasWidth = layout.canvasWidth;
      patch.heatmapMonthAxisHeight = layout.axisHeight;
      // 默认滚到最新端：切范围时数值变化会驱动 scroll-view 重新定位到末尾。
      patch.heatmapScrollLeft = Math.round(layout.scrollRpx * this.getPxPerRpx());
    }
    this.setData(patch);
    // 加载失败时把具体原因打到控制台，便于定位是哪个字段/结构不符合预期。
    if (state && state.status === "error") {
      console.warn("[mydata] 热力图加载失败：", state.reason || "unknown");
    }
  },

  /** 点击热力格显示日期与当日跑量；定位时限制在热力卡片内部，避免横向滚动区裁切。 */
  onHeatmapDayTap: function(e) {
    var dataset = e && e.currentTarget && e.currentTarget.dataset || {};
    if (dataset.isPadding === true || dataset.isPadding === "true" || !dataset.date) return;
    if (this.data.heatmapSelectedDate === dataset.date && this.data.heatmapTooltipVisible) {
      this.setData({ heatmapTooltipVisible: false, heatmapSelectedDate: "" });
      return;
    }

    var parts = String(dataset.date).split("-");
    var km = Number(dataset.distance);
    if (!Number.isFinite(km)) km = 0;
    var that = this;
    this.setData({
      heatmapTooltipVisible: true,
      heatmapSelectedDate: dataset.date,
      heatmapTooltipDate: parts.length === 3 ? Number(parts[0]) + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日" : dataset.date,
      heatmapTooltipDistance: km.toFixed(2)
    }, function() {
      var query = wx.createSelectorQuery();
      query.select("#heatmap-section").boundingClientRect();
      query.select("#heatmap-day-" + dataset.date).boundingClientRect();
      query.select("#heatmap-tooltip").boundingClientRect();
      query.exec(function(rects) {
        var section = rects && rects[0];
        var cell = rects && rects[1];
        var tooltip = rects && rects[2];
        if (!section || !cell || !tooltip) return;

        var pxPerRpx = that.getPxPerRpx();
        var inset = 12 * pxPerRpx;
        var maxLeft = Math.max(inset, section.width - tooltip.width - inset);
        var left = cell.left + cell.width / 2 - section.left - tooltip.width / 2;
        left = Math.max(inset, Math.min(left, maxLeft));
        var top = cell.top - section.top - tooltip.height - 10 * pxPerRpx;
        if (top < inset) top = cell.bottom - section.top + 10 * pxPerRpx;
        // 接近卡片底部时改放到日期上方，避免压住图例。
        if (top + tooltip.height > section.height - inset) {
          top = cell.top - section.top - tooltip.height - 10 * pxPerRpx;
        }
        that.setData({ heatmapTooltipLeft: left, heatmapTooltipTop: Math.max(inset, top) });
      });
    });
  },

  /** rpx -> px 的换算比例（scroll-left 只认 px）。 */
  getPxPerRpx: function() {
    if (!this._pxPerRpx) {
      var width = 375;
      try {
        if (typeof wx.getWindowInfo === "function") {
          var win = wx.getWindowInfo();
          if (win && win.windowWidth) width = win.windowWidth;
        } else if (typeof wx.getSystemInfoSync === "function") {
          var info = wx.getSystemInfoSync();
          if (info && info.windowWidth) width = info.windowWidth;
        }
      } catch (err) {
        width = 375;
      }
      this._pxPerRpx = width / 750;
    }
    return this._pxPerRpx;
  },

  /** 右上角下拉：切换 1/3/6/12 个月，直接用已加载数据本地重算，不重复拉取分页。 */
  onHeatmapRangeChange: function(e) {
    var raw = e && e.detail ? e.detail.value : undefined;
    var index = Number(raw);
    if (!(index >= 0 && index < heatmap.RANGE_OPTIONS.length)) {
      index = this.data.heatmapRangeIndex;
    }
    var months = heatmap.RANGE_OPTIONS[index];
    this.setData({ heatmapRangeIndex: index, heatmapRangeValue: months, heatmapTooltipVisible: false, heatmapSelectedDate: "" });
    this.getHeatmapController().setMonths(months);
  },

  /** 加载失败时由页面重试：以当前用户重新发起请求。 */
  retryHeatmap: function() {
    var userId = this.data.userId || wx.getStorageSync("userId") || app.globalData.userId || 0;
    if (userId !== this.data.userId) {
      this.setData({ userId: userId });
    }
    this.initHeatmapData(userId);
  },

  onLoad: function(options) {
    app.editTabbar();
  },

  onShow: function() {
    playPageMotion(this)
    wx.hideTabBar();
    var userId = wx.getStorageSync("userId") || app.globalData.userId || 0;
    if (userId !== this.data.userId) {
      this.setData({
        headerImg: "../../images/default.png",
        userName: "",
        nickName: "",
        score: 0,
        energy: 0,
        monthDistance: 0,
        totalDistance: 0,
        duty: "",
        marathons: [],
        activityList: [],
        activityList2: [],
        totalChallenge: 0,
        totalActy: 0
      });
    }
    this.setData({ userId: userId, statsLoaded: false, weekLoaded: false, yearLoaded: false });
    this.initHeatmapData(userId);
    this.initParticipationData(userId);
    if (userId > 0) {
      this.initInfor(userId);
      this.getWeekRuns(userId);
      this.getYearDistance(userId);
      this.initDuty(userId);
      this.initMarathon(userId);
    }
  },

  onHide: function() {},

  onUnload: function() {
    if (this._participationController) this._participationController.dispose();
  },

  myLogin: function(userId) {
    this.setData({ userId: userId, statsLoaded: false, weekLoaded: false });
    this.initInfor(userId);
    this.getWeekRuns(userId);
    this.getYearDistance(userId);
    this.initDuty(userId);
    this.initMarathon(userId);
    this.initHeatmapData(userId);
    this.initParticipationData(userId);
  }
});

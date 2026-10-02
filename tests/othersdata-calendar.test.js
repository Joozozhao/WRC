const test = require("node:test");
const assert = require("node:assert/strict");

global.wx = global.wx || {};
global.wx.request = global.wx.request || function(options) {
  if (options && typeof options.success === "function") {
    options.success({ data: { success: true, data: [] } });
  }
};
global.wx.setNavigationBarTitle = global.wx.setNavigationBarTitle || function() {};
global.wx.navigateTo = global.wx.navigateTo || function() {};
global.wx.showToast = global.wx.showToast || function() {};
global.wx.switchTab = global.wx.switchTab || function() {};
global.wx.getStorageSync = global.wx.getStorageSync || function() { return ""; };

function createOthersdataPage() {
  let pageOptions = null;
  const originalPage = global.Page;
  const originalGetApp = global.getApp;

  global.getApp = () => ({
    globalData: { userId: 1, openId: "mock_openid" }
  });

  global.Page = (opts) => {
    pageOptions = opts;
  };

  delete require.cache[require.resolve("../pages/othersdata/othersdata.js")];
  require("../pages/othersdata/othersdata.js");

  global.Page = originalPage;
  global.getApp = originalGetApp;

  const instance = Object.assign({}, pageOptions);
  instance.data = JSON.parse(JSON.stringify(pageOptions.data));
  instance.setData = function (updates, cb) {
    Object.assign(this.data, updates);
    if (typeof cb === "function") cb();
  };
  return instance;
}

test("buildMonthPage 正确生成 35 或 42 个自然日历单元格并统计当月跑量", () => {
  const p = createOthersdataPage();
  const mockDailyMap = {
    "2026-10-01": 5.07,
    "2026-10-02": 10.01
  };
  const pageData = p.buildMonthPage("2026-10", mockDailyMap);
  assert.equal(pageData.monthKey, "2026-10");
  assert.equal(pageData.monthLabel, "2026年10月");
  assert.equal(pageData.days.length % 7, 0); // 必须是 7 的倍数（完整的星期网格）
  assert.equal(pageData.runDaysCount, 2);
  assert.equal(pageData.totalDistance, "15.1");
});

test("左右划动触发 onMonthSwiperChange 时，准确同步当前月份索引与前后切换边界", () => {
  const p = createOthersdataPage();
  p.setData({
    availableMonths: ["2026-08", "2026-09", "2026-10"],
    currentMonthIndex: 2
  });

  // 向左滑到 2026-09 (index 1)
  p.onMonthSwiperChange({ detail: { current: 1 } });
  assert.equal(p.data.currentMonthIndex, 1);
  assert.equal(p.data.canPrevMonth, true);
  assert.equal(p.data.canNextMonth, true);

  // 向左滑到最旧月 2026-08 (index 0)
  p.onMonthSwiperChange({ detail: { current: 0 } });
  assert.equal(p.data.currentMonthIndex, 0);
  assert.equal(p.data.canPrevMonth, false);
  assert.equal(p.data.canNextMonth, true);
});

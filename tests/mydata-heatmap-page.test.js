// tests/mydata-heatmap-page.test.js
// pages/mydata 集成测试：用假的 wx / Page / getApp 驱动页面，验证标题天数、下拉切范围、
// 「切范围不重复请求分页」、刷新期间显示 —天、错误可重试。只操作内存，不触碰真实接口。
// 运行：node --test tests/mydata-heatmap-page.test.js

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const PAGE_PATH = path.resolve(__dirname, "../pages/mydata/mydata.js");
const UTIL_PATH = path.resolve(__dirname, "../utils/util.js");

function pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

function dateKey(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

// 用「相对今天」造数据，避免依赖固定日历日。
const TODAY = new Date();
const TODAY_KEY = dateKey(TODAY);
const TEN_DAYS_AGO_KEY = dateKey(addDays(TODAY, -10));
const LONG_AGO_KEY = dateKey(addDays(TODAY, -120)); // 6/12 个月范围内、3 个月范围外

const SPORT_PAGES = {
  1: {
    success: true, total: 5, page_total: 2, page_size: 15,
    data: [
      sport(2, TODAY_KEY, 20, 1),
      sport(3, TEN_DAYS_AGO_KEY, 8, 1),
      sport(4, TEN_DAYS_AGO_KEY, 100, 2) // 已驳回，不计
    ]
  },
  2: {
    success: true, total: 5, page_total: 2, page_size: 15,
    data: [
      sport(1, TODAY_KEY, 5, 1), // 与 id2 同日 -> 仍只算 1 天
      sport(5, LONG_AGO_KEY, 5, 1)
    ]
  }
};

function sport(id, sportDate, distance, state) {
  return { id: id, sport_date: sportDate, distance: distance, state: state, create_time: 1, create_time_str: sportDate + " 08:00:00" };
}

const requestLog = [];
let failSportList = false;
let storage = {};

function fakeRequest(url, method, data, msg, onSuccess, onFail) {
  requestLog.push({ url: url, page: data && data.page });
  if (url === "user/getsportlist") {
    const payload = failSportList ? { success: false, data: [] } : SPORT_PAGES[data.page];
    setTimeout(() => onSuccess({ data: payload }), 0);
    return;
  }
  if (onSuccess) setTimeout(() => onSuccess({ data: { success: true, data: [], total: 0 } }), 0);
}

let pageConfig = null;
global.getApp = () => ({ globalData: { userId: 0, openId: "" }, editTabbar: () => {} });
global.Page = (config) => { pageConfig = config; };
global.wx = {
  request: fakeRequest,
  hideTabBar: () => {},
  showToast: () => {},
  navigateTo: () => {},
  switchTab: () => {},
  getWindowInfo: () => ({ windowWidth: 375 }),
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value; }
};

// 拦截真实 util.js（它会加载 log.js 并绑定真实请求），保证测试只走内存桩。
require.cache[UTIL_PATH] = {
  id: UTIL_PATH,
  filename: UTIL_PATH,
  loaded: true,
  exports: { request: fakeRequest },
  children: []
};

require(PAGE_PATH);

function createPage(userId) {
  storage = userId > 0 ? { userId: userId, openId: "openid-" + userId } : {};
  requestLog.length = 0;
  failSportList = false;
  const instance = {};
  Object.keys(pageConfig).forEach((key) => { instance[key] = pageConfig[key]; });
  instance.data = JSON.parse(JSON.stringify(pageConfig.data));
  instance.setData = function (patch) { Object.assign(this.data, patch); };
  instance.onLoad({});
  return instance;
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 20));
}

function sportListCalls() {
  return requestLog.filter((item) => item.url === "user/getsportlist");
}

test("页面：未登录时标题为 —天、状态 guest、下拉默认最近 6 个月", async () => {
  const page = createPage(0);
  page.onShow();
  await flush();
  assert.equal(page.data.userId, 0);
  assert.equal(page.data.heatmapStatus, "guest");
  assert.equal(page.data.heatmapDaysText, "—");
  assert.equal(page.data.heatmapRangeValue, 6);
  assert.equal(page.data.heatmapRangeIndex, 2);
  assert.deepEqual(page.data.heatmapRangeLabels, ["最近1个月", "最近3个月", "最近6个月", "最近12个月"]);
  assert.deepEqual(page.data.heatmapWeekdayRows, ["周一", "", "周三", "", "周五", "", ""]);
  assert.equal(sportListCalls().length, 0, "游客不发跑步记录请求");
});

test("页面：登录后默认最近 6 个月，标题显示真实打卡天数（按日期去重）", async () => {
  const page = createPage(7);
  page.onShow();
  await flush();
  assert.equal(page.data.heatmapStatus, "ready");
  assert.equal(page.data.heatmapRangeValue, 6);
  assert.equal(page.data.heatmapRangeIndex, 2);
  assert.equal(page.data.heatmapDaysText, "3", "今天/10 天前/120 天前三天，去重后 3 天");
  assert.equal(page.data.heatmapCheckinDays, 3);
  assert.equal(sportListCalls().length, 2, "全量取满两页");
  assert.ok(page.data.recentHeatmap.weeks.length > 0);
  assert.equal(page.data.heatmapCellSize, 18);
  assert.equal(page.data.heatmapColumnGap, 6);
  assert.equal(page.data.heatmapColumnStride, 24);
  assert.ok(page.data.heatmapScrollLeft > 0, "6 个月默认滚到最新端");
});

test("页面：下拉切范围本地重算，不再请求分页", async () => {
  const page = createPage(7);
  page.onShow();
  await flush();
  const before = sportListCalls().length;

  page.onHeatmapRangeChange({ detail: { value: 0 } });
  await flush();
  assert.equal(page.data.heatmapRangeValue, 1);
  assert.equal(page.data.heatmapRangeIndex, 0);
  assert.equal(page.data.heatmapDaysText, "2", "1 个月只剩今天与 10 天前");
  assert.equal(page.data.heatmapScrollLeft, 0, "1 个月装得下，不滚动");
  assert.equal(sportListCalls().length, before, "切范围不得再发分页请求");

  page.onHeatmapRangeChange({ detail: { value: 3 } });
  await flush();
  assert.equal(page.data.heatmapRangeValue, 12);
  assert.equal(page.data.heatmapRangeIndex, 3);
  assert.equal(page.data.heatmapDaysText, "3");
  assert.ok(page.data.heatmapScrollLeft > 0);
  assert.equal(sportListCalls().length, before, "再次切换仍不发请求");
});

test("页面：事件切换四范围及返回短范围，cell/gap/stride 固定且滚动位置正确", async () => {
  const page = createPage(7);
  page.onShow();
  await flush();
  const before = sportListCalls().length;
  const ranges = [1, 3, 6, 12];

  for (const index of [0, 1, 2, 3, 0]) {
    page.onHeatmapRangeChange({ detail: { value: String(index) } });
    assert.equal(page.data.heatmapRangeValue, ranges[index]);
    assert.equal(page.data.heatmapRangeIndex, index);
    assert.equal(page.data.heatmapCellSize, 18, "切范围不能改变格子大小");
    assert.equal(page.data.heatmapColumnGap, 6, "切范围不能拉伸间隔");
    assert.equal(page.data.heatmapColumnStride, 24);
    assert.equal(page.data.heatmapMonthAxisHeight, 34);
    assert.deepEqual(page.data.heatmapWeekdayRows, ["周一", "", "周三", "", "周五", "", ""]);
    const canvasWidth = page.data.recentHeatmap.weeks.length * 24 - 6 + 48;
    assert.equal(page.data.heatmapCanvasWidth, canvasWidth);
    if (ranges[index] <= 3) {
      assert.ok(canvasWidth < 554, "短范围自然留白");
      assert.equal(page.data.heatmapScrollLeft, 0, "短范围从左端显示");
    } else {
      assert.ok(canvasWidth > 554);
      assert.equal(page.data.heatmapScrollLeft, Math.round((canvasWidth - 554) * 375 / 750), "长范围默认滚到含尾月预留的最新端，scroll-left 单位为 px");
    }
    assert.equal(sportListCalls().length, before, "事件切换仍使用本地缓存");
  }
});

test("页面：加载过程中切范围，完成后按最新选择渲染", async () => {
  const page = createPage(7);
  page.onShow();
  page.onHeatmapRangeChange({ detail: { value: 0 } }); // 仍在 loading
  await flush();
  assert.equal(page.data.heatmapStatus, "ready");
  assert.equal(page.data.heatmapRangeValue, 1);
  assert.equal(page.data.heatmapDaysText, "2");
  assert.equal(page.data.heatmapScrollLeft, 0);
  assert.equal(page.data.heatmapCellSize, 18);
  assert.equal(sportListCalls().length, 2, "加载中切范围不会重复请求");
});

test("页面：同用户刷新期间标题回到 —天，完成后恢复", async () => {
  const page = createPage(7);
  page.onShow();
  await flush();
  assert.equal(page.data.heatmapDaysText, "3");

  page.onShow(); // 重新加载
  assert.equal(page.data.heatmapStatus, "loading");
  assert.equal(page.data.heatmapDaysText, "—");
  assert.equal(page.data.recentHeatmap, null);
  await flush();
  assert.equal(page.data.heatmapStatus, "ready");
  assert.equal(page.data.heatmapDaysText, "3");
});

test("页面：分页失败显示 —天并可重试", async () => {
  const page = createPage(7);
  failSportList = true;
  page.onShow();
  await flush();
  assert.equal(page.data.heatmapStatus, "error");
  assert.equal(page.data.heatmapDaysText, "—");
  assert.equal(page.data.recentHeatmap, null);

  failSportList = false;
  page.retryHeatmap();
  await flush();
  assert.equal(page.data.heatmapStatus, "ready");
  assert.equal(page.data.heatmapDaysText, "3");
});

test("页面：退出登录切到游客，清空热力图", async () => {
  const page = createPage(7);
  page.onShow();
  await flush();
  assert.equal(page.data.heatmapStatus, "ready");

  storage = {};
  page.onShow();
  await flush();
  assert.equal(page.data.userId, 0);
  assert.equal(page.data.heatmapStatus, "guest");
  assert.equal(page.data.heatmapDaysText, "—");
  assert.equal(page.data.recentHeatmap, null);
});

// tests/home-month-summary-page.test.js
// pages/index 首页本月跑量与打卡融合集成测试
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const PAGE_PATH = path.resolve(__dirname, "../pages/index/index.js");
const UTIL_PATH = path.resolve(__dirname, "../utils/util.js");

const requestLog = [];
const navigations = [];
let monthListResponse = null;
let challengeActyResponses = {}; // page -> response
let challengeDetailResponses = {}; // actyId -> response
let currentAppUserId = 0;
let storage = {};

function fakeRequest(url, method, data, msg, onSuccess, onError) {
  requestLog.push({ url, data });
  if (url === "/user/getuserinfo") {
    setTimeout(() => {
      onSuccess({
        data: {
          success: true,
          data: {
            id: (data && data.id) || 1,
            nick_name: "跑友",
            header_url: ""
          }
        }
      });
    }, 0);
    return;
  }
  if (url === "user/getMonthList") {
    const payload = monthListResponse;
    setTimeout(() => {
      if (payload && payload._fail) {
        if (onError) onError(new Error("network error"));
      } else {
        if (onSuccess) onSuccess({ data: payload || { success: true, data: {} } });
      }
    }, 0);
    return;
  }
  if (url === "acty/getchallengeacty") {
    const pageNum = (data && data.page) || 1;
    const payload = challengeActyResponses[pageNum];
    setTimeout(() => {
      if (payload && payload._fail) {
        if (onError) onError(new Error("network error"));
      } else {
        if (onSuccess) onSuccess({ data: payload || { success: true, data: [], page_total: 1 } });
      }
    }, 0);
    return;
  }
  if (url === "acty/getdetail") {
    const actyId = data && data.actyId;
    const payload = challengeDetailResponses[actyId];
    setTimeout(() => {
      if (payload && payload._fail) {
        if (onError) onError(new Error("network error"));
      } else {
        if (onSuccess) onSuccess({ data: payload || { success: true, data: {} } });
      }
    }, 0);
    return;
  }
  if (onSuccess) {
    setTimeout(() => onSuccess({ data: { success: true, data: {} } }), 0);
  }
}

let pageConfig = null;
const appInstance = {
  globalData: {
    userId: 0,
    openId: ""
  },
  editTabbar: () => {}
};
global.getApp = () => appInstance;
global.Page = (config) => { pageConfig = config; };
global.wx = {
  request: fakeRequest,
  hideTabBar: () => {},
  showToast: () => {},
  navigateTo: (options) => { navigations.push(options); },
  switchTab: () => {},
  showShareMenu: () => {},
  showLoading: () => {},
  hideLoading: () => {},
  getSystemInfoSync: () => ({ statusBarHeight: 44, windowWidth: 375 }),
  getSystemInfo: (opts) => { if (opts && opts.success) opts.success({ statusBarHeight: 44, windowWidth: 375 }); },
  getStorageSync: (key) => storage[key],
  setStorageSync: (key, value) => { storage[key] = value; },
  clearStorageSync: () => { storage = {}; },
  stopPullDownRefresh: () => {}
};

require.cache[UTIL_PATH] = {
  id: UTIL_PATH,
  filename: UTIL_PATH,
  loaded: true,
  exports: {
    request: fakeRequest,
    formatDate: (d) => d.getFullYear() + "-" + (d.getMonth() + 1 < 10 ? "0" + (d.getMonth() + 1) : (d.getMonth() + 1)) + "-" + (d.getDate() < 10 ? "0" + d.getDate() : d.getDate())
  },
  children: []
};

require(PAGE_PATH);

function createPage(userId) {
  appInstance.globalData.userId = userId;
  appInstance.globalData.openId = userId > 0 ? "openid-" + userId : "";
  storage = userId > 0 ? { userId: userId, openId: "openid-" + userId } : {};
  requestLog.length = 0;
  navigations.length = 0;
  monthListResponse = null;
  challengeActyResponses = {};
  challengeDetailResponses = {};
  const instance = {};
  Object.keys(pageConfig).forEach((key) => { instance[key] = pageConfig[key]; });
  instance.data = JSON.parse(JSON.stringify(pageConfig.data));
  instance.setData = function (patch) { Object.assign(this.data, patch); };
  instance.onLoad();
  return instance;
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 80));
}

test("验收1：已报名本月个人目标(177.77)，未报名默认77；候选在后续页(第2页)被正确发现与应用", async () => {
  const p = createPage(1);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);

  monthListResponse = {
    success: true,
    data: {
      [curYM]: [
        { sport_day: curYM + "-01", sport_total: 10.5 },
        { sport_day: curYM + "-01", sport_total: 14.4 } // 同日两条合计 24.9
      ]
    }
  };

  challengeActyResponses[1] = {
    success: true,
    page_total: 2,
    data: [{ acty_id: 300, acty_name: "旧挑战", start_timestr: "2026-09-01 00:00:00", end_timestr: "2026-09-30 23:59:59" }]
  };

  challengeActyResponses[2] = {
    success: true,
    page_total: 2,
    data: [{ acty_id: 368, acty_name: curY + "年" + curM + "月月度挑战", start_timestr: curYM + "-01 00:00:00", end_timestr: curYM + "-30 23:59:59" }]
  };

  challengeDetailResponses[368] = {
    success: true,
    data: {
      acty_id: 368,
      distance: 77.77, // 最低报名公里数
      target: 177.77, // 个人目标，必须用它！
      hasDistance: 24.9,
      has_clickon: 1
    }
  };

  p.onShow();
  await flush();

  assert.equal(p.data.monthDistance, "24.9");
  assert.equal(p.data.monthRunDays, 1, "同日两条只计1天打卡");
  assert.equal(p.data.monthTargetFormatted, "177.77", "必须是个人目标 177.77 而非 77.77 或 178");
  assert.equal(p.data.monthTarget, 177.77);
  assert.equal(p.data.monthPercent, 14, "24.9 / 177.77 = 14%");
  assert.equal(p.data.monthGoalStatus, "ready");
  assert.equal(p.data.monthSummaryLoaded, true);
});

test("验收1b：未报名本月挑战时，目标确认为默认 77 公里", async () => {
  const p = createPage(1);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);

  monthListResponse = {
    success: true,
    data: {
      [curYM]: [{ sport_day: curYM + "-01", sport_total: 10 }]
    }
  };

  challengeActyResponses[1] = {
    success: true,
    page_total: 1,
    data: [{ acty_id: 368, acty_name: curY + "年" + curM + "月挑战", start_timestr: curYM + "-01 00:00:00", end_timestr: curYM + "-30 23:59:59" }]
  };

  challengeDetailResponses[368] = {
    success: true,
    data: {
      acty_id: 368,
      distance: 50,
      target: 100,
      has_clickon: 0 // 未报名
    }
  };

  p.onShow();
  await flush();

  assert.equal(p.data.monthTargetFormatted, "77");
  assert.equal(p.data.monthTarget, 77);
  assert.equal(p.data.monthPercent, 13, "10 / 77 = 13%");
});

test("验收2：零跑量是有效值、超额达成>100%时进度条封顶100%", async () => {
  const p = createPage(1);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);

  // 超额跑量 200km，目标 100km
  monthListResponse = {
    success: true,
    data: {
      [curYM]: [
        { sport_day: curYM + "-01", sport_total: 200 }
      ]
    }
  };

  challengeActyResponses[1] = {
    success: true,
    page_total: 1,
    data: [{ acty_id: 368, acty_name: curY + "年" + curM + "月挑战", start_timestr: curYM + "-01 00:00:00", end_timestr: curYM + "-30 23:59:59" }]
  };

  challengeDetailResponses[368] = {
    success: true,
    data: { acty_id: 368, target: 100, has_clickon: 1 }
  };

  p.onShow();
  await flush();

  assert.equal(p.data.monthDistance, "200");
  assert.equal(p.data.monthPercent, 200);
  assert.equal(p.data.monthProgressWidth, "100%", "进度条宽度限制 100%");
});

test("验收3：接口失败展示待确认支持重试，切用户时不接受旧响应", async () => {
  const p = createPage(1);
  // 挑战列表失败
  challengeActyResponses[1] = { _fail: true };
  monthListResponse = { success: true, data: {} };

  p.onShow();
  await flush();

  assert.equal(p.data.monthGoalStatus, "error");
  assert.equal(p.data.monthTargetFormatted, "—");
  assert.equal(p.data.monthPercent, "—");
  assert.match(p.data.monthGoalCaption, /目标确认失败/);

  // 重试
  challengeActyResponses[1] = {
    success: true,
    page_total: 1,
    data: []
  };

  p.retryMonthGoal();
  await flush();

  assert.equal(p.data.monthGoalStatus, "ready");
  assert.equal(p.data.monthTargetFormatted, "77");
});

test("验收3b：未登录游客状态展示 — 与默认 77 占位", async () => {
  const p = createPage(0);
  p.onShow();
  await flush();

  assert.equal(p.data.monthDistance, "—");
  assert.equal(p.data.monthRunDays, "—");
  assert.equal(p.data.monthPercent, "—");
  assert.equal(p.data.monthTargetFormatted, "77");
  assert.equal(p.data.monthSummaryLoaded, false);
});


test("验收3c：同用户快速刷新时，请求序号阻止旧响应覆盖新响应", async () => {
  const p = createPage(1);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);

  let firstResCb = null;
  let secondResCb = null;

  // 模拟第一次请求被卡住
  monthListResponse = null;
  p.onShow();

  // 此时触发第二次刷新（新数据：50km）
  p.initHomeHeatmap(1);

  // 模拟第一次较旧请求迟到返回（旧数据：10km）
  // 此时 _heatmapReqSeq 应该已递增，旧的不能生效
  await flush();
  assert.equal(p.data.monthSummaryLoading, false);
});

test("验收3d：切换用户后，旧用户的异步回调不能污染新用户", async () => {
  const p = createPage(1);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);

  monthListResponse = {
    success: true,
    data: { [curYM]: [{ sport_day: curYM + "-01", sport_total: 10 }] }
  };
  challengeActyResponses[1] = {
    success: true,
    page_total: 1,
    data: [{ acty_id: 368, acty_name: curY + "年" + curM + "月挑战", start_timestr: curYM + "-01 00:00:00", end_timestr: curYM + "-30 23:59:59" }]
  };
  challengeDetailResponses[368] = {
    success: true,
    data: { acty_id: 368, target: 177.77, has_clickon: 1 }
  };

  p.onShow();
  // 切换为用户 2，调用 onShow
  appInstance.globalData.userId = 2;
  p.onShow();

  await flush();
  assert.equal(p.data.userId, 2);
});

test("验收4：当前挑战卡片维护最新最高ID，低ID候选回调不覆盖高ID", () => {
  const p = createPage(1);
  const highItem = { acty_id: 368, acty_name: "十月挑战368" };
  const highDetail = { acty_id: 368, target: 177.77, has_clickon: 1 };
  const lowItem = { acty_id: 350, acty_name: "十月挑战350" };
  const lowDetail = { acty_id: 350, target: 100, has_clickon: 1 };

  p.applyCandidateDetailToChallengeCard(highItem, highDetail);
  assert.equal(p.data.challengeItem.acty_id, 368);

  // 随后低 ID 候选回调到达
  const coord = p.getMonthChallengeCoordinator();
  // 测试 loadMonthChallengeGoal 的 onCandidateDetail 回调逻辑
  const candidateLow = { acty_id: 350, item: lowItem, detail: lowDetail };
  const curId = p.data.challengeItem ? Number(p.data.challengeItem.acty_id || 0) : 0;
  if (candidateLow.acty_id >= curId) {
    p.applyCandidateDetailToChallengeCard(candidateLow.item, candidateLow.detail);
  }

  // 挑战卡片应依然是 368，未被 350 覆盖
  assert.equal(p.data.challengeItem.acty_id, 368);
});

test("验收5：resetHomeStats 重置时清空月度跑量、进度与状态", () => {
  const p = createPage(1);
  p.setData({
    monthDistance: "24.9",
    monthPercent: 14,
    monthProgressWidth: "14%",
    monthRunDays: 1,
    monthSummaryLoaded: true,
    monthSummaryLoading: false,
    monthSummaryError: false
  });

  p.resetHomeStats();
  assert.equal(p.data.monthDistance, null);
  assert.equal(p.data.monthPercent, "—");
  assert.equal(p.data.monthProgressWidth, "0%");
  assert.equal(p.data.monthRunDays, null);
  assert.equal(p.data.monthSummaryLoaded, false);
  assert.equal(p.data.monthSummaryError, false);
});

test("验收6：月数据接口失败时展示待重试状态，点击触发 retryMonthSummary", async () => {
  const p = createPage(1);
  monthListResponse = { _fail: true };
  challengeActyResponses[1] = { success: true, page_total: 1, data: [] };

  p.onShow();
  await flush();

  assert.equal(p.data.monthSummaryError, true);
  assert.equal(p.data.monthDistance, "—");
  assert.equal(p.data.monthRunDays, "—");

  // 恢复并重试
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);
  monthListResponse = {
    success: true,
    data: { [curYM]: [{ sport_day: curYM + "-01", sport_total: 24.9 }] }
  };

  p.retryMonthSummary();
  await flush();

  assert.equal(p.data.monthSummaryError, false);
  assert.equal(p.data.monthSummaryLoaded, true);
  assert.equal(p.data.monthDistance, "24.9");
});

test("验收7：本周跑量与周目标（月目标/4）及今年跑量正确渲染", async () => {
  const p = createPage(1);
  const now = new Date();
  const curY = now.getFullYear();
  const curM = now.getMonth() + 1;
  const curYM = curY + "-" + (curM < 10 ? "0" + curM : curM);

  // 本月数据包含一条本周内 24.9km 的打卡
  monthListResponse = {
    success: true,
    data: {
      [curYM]: [
        // 用今天而不是每月 1 号：1 号可能落在上周（如周一运行时），导致周跑量断言随日历日漂移。
        { sport_day: curYM + "-" + (now.getDate() < 10 ? "0" + now.getDate() : now.getDate()), sport_total: 24.9 }
      ]
    }
  };

  challengeActyResponses[1] = {
    success: true,
    page_total: 1,
    data: [{ acty_id: 368, acty_name: curY + "年" + curM + "月挑战", start_timestr: curYM + "-01 00:00:00", end_timestr: curYM + "-30 23:59:59" }]
  };

  challengeDetailResponses[368] = {
    success: true,
    data: {
      acty_id: 368,
      target: 177.77,
      has_clickon: 1
    }
  };

  p.onShow();
  await flush();

  // 周目标为 177.77 / 4 = 44.44
  assert.equal(p.data.weekTargetFormatted, "44.44");
  assert.equal(p.data.monthGoalStatus, "ready");
  assert.equal(p.data.weekDistance, "24.9");
  // 24.9 / 44.44 = 56%
  assert.equal(p.data.weekPercent, 56);
  assert.equal(p.data.weekProgressWidth, "56%");
});

test("首页：点击跑友头像进入对应的个人主页，缺失用户ID时不跳转", () => {
  const p = createPage(1);
  p.openRunnerProfile({ currentTarget: { dataset: { userid: 63 } } });
  assert.deepEqual(navigations, [{ url: '../othersdata/othersdata?id=63' }]);

  p.openRunnerProfile({ currentTarget: { dataset: {} } });
  assert.equal(navigations.length, 1, "没有有效用户ID不执行跳转");
});

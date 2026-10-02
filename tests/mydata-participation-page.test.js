const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const requests = [];
const navigations = [];
let storage = {};
let config;
const app = { globalData: { userId: 0 }, editTabbar: () => {} };
global.getApp = () => app;
global.Page = value => { config = value; };
global.wx = {
  hideTabBar: () => {}, getWindowInfo: () => ({ windowWidth: 375 }),
  getStorageSync: key => storage[key], navigateTo: value => navigations.push(value.url)
};
const utilPath = path.resolve(__dirname, "../utils/util.js");
require.cache[utilPath] = { id: utilPath, filename: utilPath, loaded: true, exports: {
  request: (url, method, data, msg, success, fail) => {
    if (url === "acty/getacty") requests.push({ data, success, fail });
    else if (success) success({ data: { success: true, data: [], total: 0, page_total: 0, page_size: 15 } });
  }
} };
require("../pages/mydata/mydata.js");

function page(userId) {
  storage = userId > 0 ? { userId } : {};
  app.globalData.userId = 0;
  requests.length = 0;
  navigations.length = 0;
  const instance = Object.assign({}, config);
  instance.data = JSON.parse(JSON.stringify(config.data));
  instance.setData = patch => Object.assign(instance.data, patch);
  instance.onLoad({});
  return instance;
}
function respond(request, items, total) {
  request.success({ data: { success: true, data: items, total } });
}

test("父页加载正确用户和类型，并将列表与分页状态一起更新", () => {
  const p = page(7);
  p.onShow();
  assert.deepEqual(requests.map(req => req.data), [{ userId: 7, type: "挑战", page: 1 }, { userId: 7, type: "团跑", page: 1 }]);
  respond(requests[0], [{ id: 5, start_timestr: "2026-10-01 00:00:00" }], 2);
  respond(requests[1], [], 0);
  assert.equal(p.data.totalChallenge, 2);
  assert.equal(p.data.challengeStatus, "ready");
  assert.equal(p.data.challengeCountKnown, true);
  assert.equal(p.data.activityList[0].start_timestr, "2026-10-01 00:00:00");
  p.loadMore();
  p.loadMore();
  assert.equal(requests.length, 3);
  assert.equal(requests[2].data.page, 2);
  requests[2].fail();
  p.loadMore({ detail: { retry: true } });
  assert.equal(requests[3].data.page, 2);
});

test("登出清空记录并作废旧回调；再次登录从第一页加载", () => {
  const p = page(7);
  p.onShow();
  storage = {};
  p.onShow();
  respond(requests[0], [{ id: 5 }], 1);
  assert.equal(p.data.userId, 0);
  assert.equal(p.data.activityList.length, 0);
  assert.equal(p.data.challengeHasMore, false);
  p.myLogin(9);
  assert.deepEqual(requests[2].data, { userId: 9, type: "挑战", page: 1 });
  assert.deepEqual(requests[3].data, { userId: 9, type: "团跑", page: 1 });
});

test("页面销毁后不再回写参与列表", () => {
  const p = page(7);
  p.onShow();
  p.onUnload();
  respond(requests[0], [{ id: 5 }], 1);
  assert.equal(p.data.activityList.length, 0);
});

test("两类记录详情携带当前用户，走各自既有详情页", () => {
  const p = page(7);
  p.data.userId = 7;
  p.toDet({ detail: { id: 5, type: "挑战" } });
  p.toDet({ detail: { id: 6, type: "团跑" } });
  assert.deepEqual(navigations, ["../challengedetail/challengedetail?id=5&userid=7", "../activitydetail/activitydetail?id=6&userid=7"]);
});

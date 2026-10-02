const test = require("node:test");
const assert = require("node:assert/strict");
let config;
const destinations = [];
global.Component = value => { config = value; };
global.wx = { switchTab: value => destinations.push(value.url) };
require("../components/all-activity/all-activity.js");

function item(id, type) {
  return { id, acty_name: "记录 " + id, start_timestr: "2026-10-01", acty_type: type };
}
function component(patch) {
  const c = { data: JSON.parse(JSON.stringify(config.data)), events: [] };
  Object.keys(config.properties).forEach(key => { c.data[key] = config.properties[key].value; });
  Object.assign(c.data, { challengeStatus: "ready", runStatus: "ready" }, patch);
  Object.assign(c, config.methods);
  c.setData = value => Object.assign(c.data, value);
  c.triggerEvent = (name, detail) => c.events.push({ name, detail });
  config.lifetimes.attached.call(c);
  return c;
}
function filter(c, value) {
  c.onFilterTap({ currentTarget: { dataset: { filter: value } } });
}

test("分类切换复用记录、重置8条且不请求接口", () => {
  const c = component({ activityList: Array.from({ length: 17 }, (_, i) => item(i + 1)), activityList2: [item(30)] });
  assert.equal(c.data.view.shownCount, 8);
  c.onLoadMore();
  assert.equal(c.data.view.shownCount, 16);
  assert.equal(c.events.length, 0);
  filter(c, "run");
  assert.equal(c.data.visibleLimit, 8);
  assert.equal(c.data.view.shownCount, 1);
  assert.equal(c.data.view.groups[0].items[0].type, "团跑");
  filter(c, "unknown");
  assert.equal(c.data.activeFilter, "run");
  assert.equal(c.events.length, 0);
});

test("本地先展开，展完后按筛选请求并预留下一批8条", () => {
  const c = component({ activityList: Array.from({ length: 15 }, (_, i) => item(i + 1)), challengeHasMore: true, runHasMore: true });
  c.onLoadMore();
  assert.equal(c.data.view.shownCount, 15);
  assert.equal(c.events.length, 0);
  c.onLoadMore();
  assert.equal(c.data.visibleLimit, 24);
  assert.deepEqual(c.events.map(event => event.name), ["parentEvent", "parentEvent2"]);
  const r = component({ activityList2: [item(30)], runHasMore: true, challengeHasMore: true });
  filter(r, "run");
  r.onLoadMore();
  assert.deepEqual(r.events.map(event => event.name), ["parentEvent2"]);
});

test("活跃源繁忙时阻止本地及远程展开，不活跃源不阻塞", () => {
  const c = component({ activityList: Array.from({ length: 17 }, (_, i) => item(i + 1)), runStatus: "loadingMore", challengeHasMore: true });
  assert.equal(c.data.moreDisabled, true);
  c.onLoadMore();
  assert.equal(c.data.visibleLimit, 8);
  assert.equal(c.events.length, 0);
  filter(c, "challenge");
  assert.equal(c.data.moreDisabled, false);
  c.onLoadMore();
  assert.equal(c.data.view.shownCount, 16);
});

test("初始加载、未知总数和分类空态明确区分", () => {
  const c = component({ challengeStatus: "loading", runStatus: "loading" });
  assert.equal(c.data.showSkeleton, true);
  assert.equal(c.data.showEmpty, false);
  assert.equal(c.data.challengeCountText, "—");
  c.data.challengeStatus = "ready";
  c.data.challengeCountKnown = true;
  filter(c, "challenge");
  assert.equal(c.data.challengeCountText, "0");
  assert.equal(c.data.showSkeleton, false);
  assert.equal(c.data.showEmpty, true);
  assert.equal(c.data.emptyShowChallenge, true);
  assert.equal(c.data.emptyShowRun, false);
  c.toChallengeTab();
  c.toActivityTab();
  assert.deepEqual(destinations, ["/pages/challenge/challenge", "/pages/activity/activity"]);
});

test("部分失败仍展示成功源，重试使用原事件", () => {
  const c = component({ challengeStatus: "error", activityList2: [item(30)], runCountKnown: true, totalActy: 201 });
  assert.equal(c.data.view.shownCount, 1);
  assert.equal(c.data.challengeError, true);
  assert.equal(c.data.showEmpty, false);
  assert.equal(c.data.runCountText, "201");
  c.onRetryChallenge();
  c.onRetryRun();
  assert.deepEqual(c.events, [{ name: "parentEvent", detail: { retry: true } }, { name: "parentEvent2", detail: { retry: true } }]);
});

test("详情事件区分类别，缺失id不跳转；封面失败回退占位", () => {
  const c = component();
  for (const id of [undefined, null, ""]) c.getInfor({ currentTarget: { dataset: { id, type: "挑战" } } });
  assert.equal(c.events.length, 0);
  c.getInfor({ currentTarget: { dataset: { id: 5, type: "挑战" } } });
  assert.deepEqual(c.events[0], { name: "parentEvent3", detail: { id: 5, type: "挑战" } });
  c.onCoverError({ currentTarget: { dataset: { key: "challenge:5" } } });
  assert.equal(c.data.failedCovers["challenge:5"], true);
});

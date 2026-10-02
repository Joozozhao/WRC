const test = require("node:test");
const assert = require("node:assert/strict");
const { createParticipationView, createParticipationController } = require("../utils/participation-timeline.js");

function record(id, date, extra) {
  return Object.assign({ id: id, start_timestr: date, acty_name: "活动 " + id, acty_img: "https://example.test/" + id + ".jpg" }, extra);
}

function harness() {
  const requests = [];
  const patches = [];
  let currentUser = 7;
  const controller = createParticipationController({
    isCurrentUser: id => String(id) === String(currentUser),
    fetchPage: (userId, type, page, success, fail) => requests.push({ userId, type, page, success, fail }),
    onState: patch => patches.push(patch)
  });
  return { controller, requests, patches, setUser: id => { currentUser = id; } };
}

function respond(request, data, total) {
  const payload = { success: true, data };
  if (total !== undefined) payload.total = total;
  request.success({ data: payload });
}

test("合并两类记录，按活动日期倒序和月份分组；不修改接口原数据", () => {
  const challenges = [record(1, "2026-10-01 00:00:00"), record(2, "2026-12-01 00:00:00")];
  const runs = [record(3, "2026-04-15 11:00:00"), record(4, "2026-04-22 00:00:00")];
  const before = JSON.stringify([challenges, runs]);
  const view = createParticipationView(challenges, runs, "all");
  assert.deepEqual(view.groups.map(group => group.label), ["2026年12月", "2026年10月", "2026年4月"]);
  assert.deepEqual(view.groups.flatMap(group => group.items.map(item => item.id)), [2, 1, 4, 3]);
  assert.equal(view.groups[2].items[0].dateText, "2026.04.22");
  assert.equal(view.groups[2].items[0].type, "团跑");
  assert.equal(JSON.stringify([challenges, runs]), before);
});

test("分类筛选与本地条数上限不会混入另一类记录", () => {
  const challenges = [record(1, "2026-10-01"), record(2, "2026-09-01")];
  const runs = [record(3, "2026-12-01")];
  const view = createParticipationView(challenges, runs, "challenge", 1);
  assert.equal(view.filteredCount, 2);
  assert.equal(view.shownCount, 1);
  assert.equal(view.hasLocalMore, true);
  assert.deepEqual(view.groups[0].items.map(item => item.id), [1]);
  assert.equal(createParticipationView(challenges, runs, "run", 8).shownCount, 1);
  assert.equal(createParticipationView(challenges, runs, "all", 0).groups.length, 0);
});

test("源内去重、源间相同 id 独立；挑战子类型仍走挑战详情", () => {
  const view = createParticipationView([
    record(1, "2026-10-01", { acty_name: "旧标题", acty_type: "V挑战" }),
    record("1", "2026-10-01", { acty_name: "更新标题", acty_type: "V挑战" })
  ], [record(1, "2026-10-01")], "all");
  const items = view.groups[0].items;
  assert.equal(items.length, 2);
  assert.notEqual(items[0].key, items[1].key);
  assert.equal(items[0].title, "更新标题");
  assert.equal(items[0].type, "挑战");
});

test("无效或缺失日期保留记录并置后；闰年和本地日期不会被时区改变", () => {
  const view = createParticipationView([
    record(1, "2026-02-29"), record(2, "2024-02-29T23:00:00Z"),
    record(3, "2026/4/2 11:00"), record(4, "2026.04.01"),
    record(5, null, { acty_name: "", acty_img: null }), record(6, "2026-13-01")
  ], [], "all");
  assert.deepEqual(view.groups.map(group => group.key), ["2026-04", "2024-02", "undated"]);
  assert.deepEqual(view.groups[2].items.map(item => item.id), [1, 5, 6]);
  assert.equal(view.groups[1].items[0].dateText, "2024.02.29");
  assert.equal(view.groups[2].items[1].title, "未命名挑战");
  assert.equal(view.groups[2].items[1].cover, "");
  assert.equal(view.groups[2].items[1].hasDate, false);
});

test("初次加载两类各一页；重复点击不发并行的同页请求", () => {
  const h = harness();
  h.controller.load(7);
  assert.deepEqual(h.requests.map(req => [req.type, req.page]), [["挑战", 1], ["团跑", 1]]);
  assert.equal(h.controller.getState().challengeStatus, "loading");
  assert.equal(h.controller.loadMore("challenge"), false);
  assert.equal(h.controller.loadMore("run"), false);
  assert.equal(h.requests.length, 2);
  respond(h.requests[0], [record(1, "2026-10-01")], 3);
  respond(h.requests[1], [], 0);
  const state = h.controller.getState();
  assert.equal(state.page, 2);
  assert.equal(state.challengeCountKnown, true);
  assert.equal(state.totalChallenge, 3);
  assert.equal(state.challengeHasMore, true);
  assert.equal(state.runHasMore, false);
  assert.equal(h.controller.loadMore("run"), false);
});

test("网络失败保留已加载记录，重试原页，成功后才推进页码", () => {
  const h = harness();
  h.controller.load(7);
  respond(h.requests[0], [record(1, "2026-10-01")], 2);
  respond(h.requests[1], [], 0);
  h.controller.loadMore("challenge");
  assert.equal(h.requests[2].page, 2);
  assert.equal(h.controller.getState().challengeStatus, "loadingMore");
  h.requests[2].fail(new Error("offline"));
  assert.equal(h.controller.getState().challengeStatus, "error");
  assert.equal(h.controller.getState().page, 2);
  assert.equal(h.controller.getState().activityList.length, 1);
  h.controller.loadMore("challenge");
  assert.equal(h.requests[3].page, 2);
  respond(h.requests[3], [record(2, "2026-09-01")], 2);
  assert.equal(h.controller.getState().page, 3);
  assert.equal(h.controller.getState().challengeHasMore, false);
  assert.equal(h.controller.loadMore("challenge"), false);
});

test("一类失败不会清空另一类；失败不显示虚假的零总数", () => {
  const h = harness();
  h.controller.load(7);
  h.requests[0].success({ data: { success: false, data: [] } });
  respond(h.requests[1], [record(8, "2026-04-22")], 1);
  const state = h.controller.getState();
  assert.equal(state.challengeStatus, "error");
  assert.equal(state.challengeCountKnown, false);
  assert.equal(state.runStatus, "ready");
  assert.equal(state.totalActy, 1);
  assert.equal(state.activityList2[0].id, 8);
  h.controller.loadMore("challenge");
  assert.equal(h.requests[2].page, 1);
});

test("接口缺失 total 时保留未知总数，直到空页确认没有更多", () => {
  const h = harness();
  h.controller.load(7);
  respond(h.requests[0], [record(1, "2026-10-01")]);
  respond(h.requests[1], [], "0");
  assert.equal(h.controller.getState().challengeCountKnown, false);
  assert.equal(h.controller.getState().challengeHasMore, true);
  h.controller.loadMore("challenge");
  respond(h.requests[2], []);
  assert.equal(h.controller.getState().challengeHasMore, false);
  assert.equal(h.controller.getState().activityList.length, 1);
});

test("重叠页按 id 合并且更新元数据，不重复渲染", () => {
  const h = harness();
  h.controller.load(7);
  respond(h.requests[0], [record(1, "2026-10-01")], 2);
  respond(h.requests[1], [], 0);
  h.controller.loadMore("challenge");
  respond(h.requests[2], [record("1", "2026-10-01", { acty_name: "新标题" }), record(2, "2026-09-01")], 2);
  const state = h.controller.getState();
  assert.equal(state.activityList.length, 2);
  assert.equal(state.activityList[0].acty_name, "新标题");
  assert.equal(state.challengeHasMore, false);
});

test("空页、重复页或错误结构不被误判为全部加载，也不跳页", () => {
  for (const bad of [[], [record(1, "2026-10-01")], [null], {}, null]) {
    const h = harness();
    h.controller.load(7);
    respond(h.requests[0], [record(1, "2026-10-01")], 3);
    h.controller.loadMore("challenge");
    respond(h.requests[2], bad, 3);
    const state = h.controller.getState();
    assert.equal(state.challengeStatus, "error");
    assert.equal(state.page, 2);
    assert.equal(state.challengeHasMore, true);
    assert.equal(state.activityList.length, 1);
  }
});

test("切换用户后忽略旧请求；刷新同一用户也忽略上一轮请求", () => {
  const h = harness();
  h.controller.load(7);
  const old = h.requests[0];
  h.setUser(9);
  h.controller.load(9);
  respond(old, [record(1, "2026-10-01")], 1);
  assert.equal(h.controller.getState().activityList.length, 0);
  const previousRound = h.requests[2];
  h.controller.load(9);
  respond(previousRound, [record(2, "2026-10-01")], 1);
  assert.equal(h.controller.getState().activityList.length, 0);
  respond(h.requests[4], [record(3, "2026-10-01")], 1);
  assert.equal(h.controller.getState().activityList[0].id, 3);
});

test("注销和销毁时旧回调不能回写页面，也不能继续发请求", () => {
  const h = harness();
  h.controller.load(7);
  h.setUser(0);
  h.controller.load(0);
  respond(h.requests[0], [record(1, "2026-10-01")], 1);
  assert.equal(h.controller.getState().activityList.length, 0);
  assert.equal(h.controller.loadMore("challenge"), false);
  h.setUser(7);
  h.controller.load(7);
  const patchCount = h.patches.length;
  h.controller.dispose();
  respond(h.requests[2], [record(2, "2026-10-01")], 1);
  h.controller.load(7);
  assert.equal(h.patches.length, patchCount);
  assert.equal(h.requests.length, 4);
});

test("同一请求回调仅处理一次，守卫发现用户改变时不会开始下一页", () => {
  const h = harness();
  h.controller.load(7);
  respond(h.requests[0], [record(1, "2026-10-01")], 2);
  h.requests[0].fail(new Error("late fail"));
  respond(h.requests[0], [record(3, "2026-10-01")], 2);
  assert.equal(h.controller.getState().challengeStatus, "ready");
  assert.equal(h.controller.getState().activityList[0].id, 1);
  h.setUser(8);
  assert.equal(h.controller.loadMore("challenge"), false);
  assert.equal(h.requests.length, 2);
});

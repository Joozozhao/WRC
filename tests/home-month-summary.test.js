// tests/home-month-summary.test.js
const test = require("node:test");
const assert = require("node:assert/strict");
const summary = require("../utils/home-month-summary.js");

function d(y, m, day) {
  return new Date(y, m - 1, day);
}

// ---------------------------------------------------- 1. 日期合法性与跨月活动严格校验

test("isValidDateKey: 严格验证有效日历日期，排除 2026-02-30、2026-13-01 等非法日期", () => {
  assert.equal(summary.isValidDateKey("2026-10-01"), true);
  assert.equal(summary.isValidDateKey("2024-02-29"), true, "闰年2月29有效");
  assert.equal(summary.isValidDateKey("2026-02-29"), false, "平年2月29无效");
  assert.equal(summary.isValidDateKey("2026-02-30"), false, "2月30不存在");
  assert.equal(summary.isValidDateKey("2026-13-01"), false, "月份13无效");
  assert.equal(summary.isValidDateKey("2026-04-31"), false, "4月只有30天");
  assert.equal(summary.isValidDateKey("2026-10-01 08:00:00"), false);
  assert.equal(summary.isValidDateKey(null), false);
});

test("isCurrentMonthChallenge: 起止跨月或全年活动排除，不能仅凭开始月份视作当月挑战", () => {
  const curY = 2026;
  const curM = 10;

  // 正确的当月单月挑战（起止在同月）
  assert.equal(summary.isCurrentMonthChallenge({
    acty_name: "2026年10月月度挑战",
    start_timestr: "2026-10-01 00:00:00",
    end_timestr: "2026-10-31 23:59:59",
    acty_type: "挑战"
  }, curY, curM), true);

  // 起止跨月活动（如10-01至11-15），不能作为10月月度挑战
  assert.equal(summary.isCurrentMonthChallenge({
    acty_name: "金秋跨月挑战",
    start_timestr: "2026-10-01 00:00:00",
    end_timestr: "2026-11-15 23:59:59",
    acty_type: "挑战"
  }, curY, curM), false);

  // 全年/百天/季活动
  assert.equal(summary.isCurrentMonthChallenge({ acty_name: "2026全年365天挑战", acty_type: "挑战" }, curY, curM), false);
  assert.equal(summary.isCurrentMonthChallenge({ acty_name: "第四季度百天跑", acty_type: "挑战" }, curY, curM), false);

  // V挑战排除
  assert.equal(summary.isCurrentMonthChallenge({ acty_name: "10月V挑战", acty_type: "V挑战" }, curY, curM), false);
});

test("resolveTotalPages: page_total缺失或非法时，结合 total 与 page_size 计算", () => {
  // 正常 page_total
  assert.equal(summary.resolveTotalPages({ page_total: 6, total: 83, page_size: 15 }), 6);
  // page_total 缺失，通过 83 / 15 算出 6 页
  assert.equal(summary.resolveTotalPages({ total: 83, page_size: 15 }), 6);
  // 字符串数字兼容
  assert.equal(summary.resolveTotalPages({ page_total: "6" }), 6);
  assert.equal(summary.resolveTotalPages({ total: "30", page_size: "15" }), 2);
  // 异常兜底
  assert.equal(summary.resolveTotalPages(null), null);
});

// ---------------------------------------------------- 2. 目标决策与异常防护

test("resolveMonthGoal: has_clickon=1 但 target 无效，不能返回默认77，必须报错待确认", () => {
  const candidates = [
    {
      acty_id: 368,
      verified: true,
      hasJoined: true,
      target: 0, // 无效 target
      item: { acty_id: 368, acty_name: "十月挑战" }
    }
  ];

  const res = summary.resolveMonthGoal({ candidates });
  assert.equal(res.status, "error");
  assert.equal(res.reason, "invalid_joined_target");
  assert.equal(res.target, null);
  assert.equal(res.targetFormatted, "—");
});

test("resolveMonthGoal: has_clickon 缺失或非法，不能当作未报名，必须进入 error", () => {
  const candidates = [
    {
      acty_id: 368,
      verified: true,
      hasJoined: null, // 缺失/非法
      target: 100,
      item: { acty_id: 368, acty_name: "十月挑战" }
    }
  ];

  const res = summary.resolveMonthGoal({ candidates });
  assert.equal(res.status, "error");
  assert.equal(res.reason, "invalid_has_clickon");
});

test("resolveMonthGoal: 列表或详情失败时，若没有已报名候选，绝对不能默认77", () => {
  const res = summary.resolveMonthGoal({
    candidates: [{ acty_id: 368, verified: false, detailFailed: true }],
    hasDetailFailure: true
  });
  assert.equal(res.status, "error");
  assert.equal(res.target, null);
});

test("resolveMonthGoal: 真实目标 177.77 公里保留2位精度，且与 distance 77.77 严格区分", () => {
  const candidates = [
    {
      acty_id: 368,
      verified: true,
      hasJoined: true,
      target: 177.77,
      item: { acty_id: 368, acty_name: "十月挑战", distance: 77.77 },
      detail: { distance: 77.77, target: 177.77, has_clickon: 1 }
    }
  ];

  const res = summary.resolveMonthGoal({ candidates });
  assert.equal(res.status, "ready");
  assert.equal(res.target, 177.77);
  assert.equal(res.targetFormatted, "177.77");
});

// ---------------------------------------------------- 3. 月跑量解析与日历

test("parseMonthRecords: 2026-02-30 非法日期不计入跑量，同日计1天", () => {
  const monthData = [
    { sport_day: "2026-10-01", sport_total: 10.5 },
    { sport_day: "2026-10-01", sport_total: 14.4 },
    { sport_day: "2026-10-32", sport_total: 5.0 }, // 畸形日期
    { sport_day: "2026-02-30", sport_total: 10.0 } // 非法日期
  ];

  const parsed = summary.parseMonthRecords(monthData, 2026, 10, d(2026, 10, 10));
  assert.equal(parsed.totalDistance, 24.9);
  assert.equal(parsed.runDaysCount, 1);
});

// ---------------------------------------------------- 4. 编排器测试（隔离与重试）

function makeCoordinatorHarness(currentUser) {
  const harness = {
    userId: currentUser,
    states: [],
    requestLog: [],
    pendingRequests: []
  };

  const fakeReq = (url, method, data, msg, onSuccess, onError) => {
    harness.requestLog.push({ url, data });
    harness.pendingRequests.push({ url, data, onSuccess, onError });
  };

  harness.coordinator = summary.createMonthChallengeCoordinator({
    request: fakeReq,
    now: () => d(2026, 10, 1),
    defaultTarget: 77
  });

  harness.load = (uid) => {
    harness.userId = uid;
    harness.coordinator.load(uid, {
      onState: (st) => harness.states.push(st)
    });
  };

  return harness;
}

test("编排器: 每次 load 时详情缓存独立，切换用户或刷新不串台个人目标", () => {
  const h = makeCoordinatorHarness(1);
  h.load(1);

  // 用户1第1页
  h.pendingRequests[0].onSuccess({
    data: {
      success: true,
      page_total: 1,
      data: [{ acty_id: 368, start_timestr: "2026-10-01 00:00:00", end_timestr: "2026-10-31 23:59:59" }]
    }
  });

  // 用户1详情返回个人目标 177.77
  h.pendingRequests[1].onSuccess({
    data: {
      success: true,
      data: { acty_id: 368, target: 177.77, has_clickon: 1 }
    }
  });

  assert.equal(h.states[h.states.length - 1].target, 177.77);

  // 切换为用户 2，重新 load(2)
  h.load(2);
  // 用户2第1页，相同挑战 368
  const reqUser2Page1 = h.pendingRequests[2];
  assert.equal(reqUser2Page1.data.userId, 2);
  reqUser2Page1.onSuccess({
    data: {
      success: true,
      page_total: 1,
      data: [{ acty_id: 368, start_timestr: "2026-10-01 00:00:00", end_timestr: "2026-10-31 23:59:59" }]
    }
  });

  // 必须重新向服务器请求用户2的 368 详情，不得复用用户1的缓存！
  assert.equal(h.pendingRequests.length, 4, "用户2必须发出独立的 getdetail 请求");
  const reqUser2Detail = h.pendingRequests[3];
  assert.equal(reqUser2Detail.data.userId, 2);
  assert.equal(reqUser2Detail.data.actyId, 368);

  // 用户2未报名该挑战
  reqUser2Detail.onSuccess({
    data: {
      success: true,
      data: { acty_id: 368, target: 100, has_clickon: 0 }
    }
  });

  assert.equal(h.states[h.states.length - 1].target, 77, "用户2未报名，目标为默认77");
});


test("resolveTotalPages: 严格整数校验，浮点数如 0.5 或非法缺失元数据返回 null", () => {
  assert.equal(summary.resolveTotalPages({ page_total: 0.5 }), null);
  assert.equal(summary.resolveTotalPages({ page_total: "abc" }), null);
  assert.equal(summary.resolveTotalPages({ total: 10.5, page_size: 15 }), null);
  assert.equal(summary.resolveTotalPages({}), null);
  assert.equal(summary.resolveTotalPages(null), null);
});

test("resolveMonthGoal: has_clickon 为空字符串时视为非法缺失，不能当做未报名，必须进入 error", () => {
  const candidates = [
    {
      acty_id: 368,
      verified: true,
      hasJoined: null,
      target: 177.77,
      item: { acty_id: 368, acty_name: "十月挑战" },
      detail: { has_clickon: "" }
    }
  ];
  const res = summary.resolveMonthGoal({ candidates });
  assert.equal(res.status, "error");
  assert.equal(res.reason, "invalid_has_clickon");
});

test("parseWeekRecords: 严格提取当周有效日期打卡，排除未来日期与跨周历史", () => {
  const fixedNow = new Date("2026-10-01T12:00:00");
  const monthData = {
    "2026-09": [
      { sport_day: "2026-09-28", sport_total: 10 },
      { sport_day: "2026-09-27", sport_total: 5 } // 上周日
    ],
    "2026-10": [
      { sport_day: "2026-10-01", sport_total: 24.9 },
      { sport_day: "2026-10-02", sport_total: 15 } // 未来日期
    ]
  };
  const res = summary.parseWeekRecords(monthData, fixedNow);
  assert.equal(res.totalDistance, 34.9);
  assert.equal(res.runDaysCount, 2);
  assert.deepEqual(res.dailyMap, { "2026-09-28": 10, "2026-10-01": 24.9 });
});

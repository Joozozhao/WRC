// tests/recent-run-heatmap.test.js
// 纯逻辑单测：node --test tests/recent-run-heatmap.test.js
// 只操作内存数据，不触碰任何后端接口。

const test = require("node:test");
const assert = require("node:assert/strict");
const hm = require("../utils/recent-run-heatmap.js");

function d(year, month, day) {
  return new Date(year, month - 1, day);
}

function keyToDate(key) {
  const parts = key.split("-").map(Number);
  return d(parts[0], parts[1], parts[2]);
}

function findDay(heatmap, key) {
  for (const week of heatmap.weeks) {
    for (const day of week.days) {
      if (day.key === key) return day;
    }
  }
  return null;
}

function inclusiveDayCount(start, end) {
  let count = 0;
  let cursor = start;
  while (cursor <= end) {
    count += 1;
    cursor = hm.addDays(cursor, 1);
  }
  return count;
}

// getsportlist 单条记录
function rec(id, sportDate, distance, state) {
  return {
    id: id,
    sport_date: sportDate,
    distance: distance,
    state: state,
    create_time: 1758000000,
    create_time_str: sportDate + " 08:00:00"
  };
}

// getsportlist 单页信封
function page(records, pageTotal, total, pageSize) {
  return { success: true, total: total, page_total: pageTotal, page_size: pageSize || 15, data: records };
}

// parseSportListPage 归一化后的记录（aggregateSportRecords 的输入）
function nrec(id, sportDate, distance, state) {
  return { id: id, sportDate: sportDate, distance: distance, state: state };
}

// ---------------------------------------------------------------- 范围与月份

test("normalizeMonths：只接受 1/3/6/12，其余回落默认 6", () => {
  assert.deepEqual(hm.RANGE_OPTIONS, [1, 3, 6, 12]);
  assert.equal(hm.DEFAULT_RANGE_MONTHS, 6);
  assert.equal(hm.normalizeMonths(1), 1);
  assert.equal(hm.normalizeMonths(3), 3);
  assert.equal(hm.normalizeMonths(6), 6);
  assert.equal(hm.normalizeMonths("12"), 12);
  assert.equal(hm.normalizeMonths(5), 6);
  assert.equal(hm.normalizeMonths(0), 6);
  assert.equal(hm.normalizeMonths(-3), 6);
  assert.equal(hm.normalizeMonths(undefined), 6);
  assert.equal(hm.normalizeMonths(null), 6);
  assert.equal(hm.normalizeMonths("abc"), 6);
  assert.equal(hm.normalizeMonths(5, 3), 3, "非法值回落到指定 fallback");
  assert.equal(hm.normalizeMonths(3, 12), 3, "合法值优先于 fallback");
});

test("computeRangeStart：起点为往前三个月同日的次日", () => {
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 10, 1), 3)), "2026-07-02");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 7, 15), 3)), "2026-04-16");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2024, 3, 30), 3)), "2023-12-31");
});

test("computeRangeStart：跨年边界", () => {
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2024, 1, 15), 3)), "2023-10-16");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2024, 3, 31), 3)), "2024-01-01");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 3, 31), 3)), "2026-01-01");
});

test("computeRangeStart：闰年与非闰年的月末取整", () => {
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2024, 5, 31), 3)), "2024-03-01");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 5, 31), 3)), "2026-03-01");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 6, 30), 3)), "2026-03-31");
});

test("computeRangeStart：1 / 6 / 12 个月与跨年", () => {
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 10, 1), 1)), "2026-09-02");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 10, 1), 6)), "2026-04-02");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 10, 1), 12)), "2025-10-02");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2026, 1, 31), 1)), "2026-01-01");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2024, 3, 31), 6)), "2023-10-01");
  assert.equal(hm.toDateKey(hm.computeRangeStart(d(2024, 3, 31), 12)), "2023-04-01");
});

test("addMonthsClamped：不向下一月溢出", () => {
  assert.equal(hm.toDateKey(hm.addMonthsClamped(d(2026, 3, 31), -1)), "2026-02-28");
  assert.equal(hm.toDateKey(hm.addMonthsClamped(d(2024, 3, 31), -1)), "2024-02-29");
  assert.equal(hm.toDateKey(hm.addMonthsClamped(d(2026, 1, 31), -3)), "2025-10-31");
});

test("isValidDateKey：只接受真实存在的 YYYY-MM-DD", () => {
  assert.equal(hm.isValidDateKey("2026-09-30"), true);
  assert.equal(hm.isValidDateKey("2024-02-29"), true);
  assert.equal(hm.isValidDateKey("2026-02-29"), false);
  assert.equal(hm.isValidDateKey("2026-13-01"), false);
  assert.equal(hm.isValidDateKey("2026-9-30"), false);
  assert.equal(hm.isValidDateKey("2026-10-01 08:00:00"), false);
  assert.equal(hm.isValidDateKey(20261001), false);
  assert.equal(hm.isValidDateKey(null), false);
});

test("isSuccessFlag：兼容 number / string 的既有 truthy 口径", () => {
  assert.equal(hm.isSuccessFlag(true), true);
  assert.equal(hm.isSuccessFlag(1), true);
  assert.equal(hm.isSuccessFlag("1"), true);
  assert.equal(hm.isSuccessFlag("true"), true);
  assert.equal(hm.isSuccessFlag(false), false);
  assert.equal(hm.isSuccessFlag(0), false);
  assert.equal(hm.isSuccessFlag("0"), false);
  assert.equal(hm.isSuccessFlag("false"), false);
  assert.equal(hm.isSuccessFlag(""), false);
  assert.equal(hm.isSuccessFlag(null), false);
});

test("readCount：只接受有限非负整数，不静默取整", () => {
  assert.equal(hm.readCount(0), 0);
  assert.equal(hm.readCount(15), 15);
  assert.equal(hm.readCount("932"), 932);
  assert.equal(hm.readCount("0"), 0);
  assert.equal(hm.readCount(1.9), null, "小数不得被吞成 1");
  assert.equal(hm.readCount("3.5"), null);
  assert.equal(hm.readCount(-1), null);
  assert.equal(hm.readCount(NaN), null);
  assert.equal(hm.readCount(Infinity), null);
  assert.equal(hm.readCount("abc"), null);
  assert.equal(hm.readCount(""), null);
  assert.equal(hm.readCount(null), null);
  assert.equal(hm.readCount(undefined), null);
});

test("levelForDistance：等级阈值与非法值", () => {
  assert.equal(hm.levelForDistance(0), 0);
  assert.equal(hm.levelForDistance(-1), 0);
  assert.equal(hm.levelForDistance(0.01), 1);
  assert.equal(hm.levelForDistance(3), 1);
  assert.equal(hm.levelForDistance(3.0001), 2);
  assert.equal(hm.levelForDistance(7), 2);
  assert.equal(hm.levelForDistance(7.5), 3);
  assert.equal(hm.levelForDistance(12), 3);
  assert.equal(hm.levelForDistance(12.01), 4);
  assert.equal(hm.levelForDistance("5"), 2);
  assert.equal(hm.levelForDistance("abc"), 0);
  assert.equal(hm.levelForDistance(NaN), 0);
  assert.equal(hm.levelForDistance(Infinity), 0);
  assert.equal(hm.levelForDistance(null), 0);
  assert.equal(hm.levelForDistance(true), 0);
  assert.equal(hm.levelForDistance({}), 0);
});

// ---------------------------------------------------------------- 网格

test("buildRecentHeatmap：1/3/6/12 个月的列数与范围端点", () => {
  const cases = [
    { months: 1, weeks: 5, start: "2026-09-02" },
    { months: 3, weeks: 14, start: "2026-07-02" },
    { months: 6, weeks: 27, start: "2026-04-02" },
    { months: 12, weeks: 53, start: "2025-10-02" }
  ];
  cases.forEach((item) => {
    const heatmap = hm.buildRecentHeatmap({ today: d(2026, 10, 1), dailyMap: {}, monthsBack: item.months });
    assert.equal(heatmap.monthsBack, item.months);
    assert.equal(heatmap.rangeStart, item.start);
    assert.equal(heatmap.rangeEnd, "2026-10-01");
    assert.equal(heatmap.weeks.length, item.weeks, item.months + " 个月的列数");
    heatmap.weeks.forEach((week) => assert.equal(week.days.length, 7, "每周必须是 7 格"));
  });
});

test("buildRecentHeatmap：每周固定 7 格，首尾范围外为透明 padding", () => {
  const today = d(2026, 10, 1);
  const monthsBack = 6;
  const start = hm.computeRangeStart(today, monthsBack);
  const heatmap = hm.buildRecentHeatmap({ today, dailyMap: {}, monthsBack });

  assert.ok(heatmap.weeks.length > 0);
  const flat = [];
  heatmap.weeks.forEach((week) => {
    assert.equal(week.days.length, 7, "每周必须是 7 格");
    assert.equal(keyToDate(week.key).getDay(), 1, "周键必须是周一");
    week.days.forEach((day, index) => {
      assert.deepEqual(Object.keys(day).sort(), ["distance", "isPadding", "key", "level"], "每格暴露日期键、跑量和热力等级");
      assert.equal(keyToDate(day.key).getDay(), (index + 1) % 7, "列顺序为周一至周日");
      flat.push(day);
    });
  });

  const inRange = flat.filter((day) => !day.isPadding);
  const padding = flat.filter((day) => day.isPadding);
  assert.equal(inRange.length, inclusiveDayCount(start, today), "非 padding 格数等于范围内天数");
  inRange.forEach((day) => {
    const date = keyToDate(day.key);
    assert.ok(date >= start && date <= today, day.key + " 应落在范围内");
  });
  padding.forEach((day) => {
    const date = keyToDate(day.key);
    assert.ok(date < start || date > today, day.key + " padding 必须在范围外");
  });

  const firstReal = flat.findIndex((day) => !day.isPadding);
  const lastReal = flat.length - 1 - [...flat].reverse().findIndex((day) => !day.isPadding);
  flat.forEach((day, index) => {
    if (index > firstReal && index < lastReal) {
      assert.equal(day.isPadding, false, "中间不允许出现 padding");
    }
  });
  assert.equal(inRange[0].key, hm.toDateKey(start));
  assert.equal(inRange[inRange.length - 1].key, hm.toDateKey(today));
});

test("buildRecentHeatmap：跨年范围也保持 7 格与边界", () => {
  const today = d(2024, 1, 15);
  const heatmap = hm.buildRecentHeatmap({
    today,
    monthsBack: 3,
    dailyMap: { "2023-12-25": 15, "2024-01-05": 5 }
  });
  heatmap.weeks.forEach((week) => assert.equal(week.days.length, 7));
  assert.equal(findDay(heatmap, "2023-12-25").level, 4);
  assert.equal(findDay(heatmap, "2024-01-05").level, 2);
  assert.equal(findDay(heatmap, "2024-01-16").isPadding, true, "终点之后只允许出现 padding 格");
  assert.equal(findDay(heatmap, "2023-10-15"), null, "起点之前不应有单元格");
});

// ---------------------------------------------------------------- 月份轴

test("月份轴：标签有序、span 铺满、中文标签", () => {
  const heatmap = hm.buildRecentHeatmap({ today: d(2026, 10, 1), dailyMap: {}, monthsBack: 6 });
  const labels = heatmap.monthLabels;
  assert.ok(labels.length >= 6);
  let sum = 0;
  labels.forEach((label, index) => {
    assert.match(label.label, /^\d{1,2}月$/);
    assert.ok(label.span >= 1);
    assert.ok(label.index >= 0 && label.index < heatmap.weeks.length);
    if (index > 0) {
      assert.ok(
        label.index >= labels[index - 1].index + hm.MIN_MONTH_LABEL_GAP,
        "相邻标签列距必须不小于 MIN_MONTH_LABEL_GAP"
      );
    }
    sum += label.span;
  });
  assert.equal(sum, heatmap.weeks.length, "span 之和等于总列数");
  const last = labels[labels.length - 1];
  assert.equal(last.index + last.span, heatmap.weeks.length, "最后一个标签恰好铺到最右列");
});

test("月份轴：起始不足月也会标出该月", () => {
  const heatmap = hm.buildRecentHeatmap({ today: d(2026, 10, 1), dailyMap: {}, monthsBack: 3 });
  assert.equal(heatmap.rangeStart, "2026-07-02");
  assert.equal(heatmap.monthLabels[0].label, "7月", "7 月只有 2 天起，仍要标 7 月");
  assert.equal(heatmap.monthLabels[0].index, 0);
});

test("月份轴：末尾仅 1 天的月标不挤压（span=1，不越界）", () => {
  const heatmap = hm.buildRecentHeatmap({ today: d(2026, 10, 1), dailyMap: {}, monthsBack: 1 });
  assert.equal(heatmap.rangeStart, "2026-09-02");
  const last = heatmap.monthLabels[heatmap.monthLabels.length - 1];
  assert.equal(last.label, "10月", "10 月只有 10-01 一天，仍要标出");
  assert.equal(last.span, 1);
  assert.equal(last.index + last.span, heatmap.weeks.length);
});

test("月份轴：相邻列距不足时丢弃后出现的标签", () => {
  const start = d(2026, 9, 28);
  const end = d(2026, 10, 2);
  const weeks = hm.buildHeatmapWeeks(start, end, {});
  const labels = hm.buildMonthLabels(weeks, start, end);
  assert.deepEqual(labels.map((item) => item.label), ["9月"]);
  assert.equal(labels[0].span, weeks.length);
});

test("月份轴：起始月只剩 1 天时改留天数更多的末尾月", () => {
  const start = hm.computeRangeStart(d(2026, 11, 30), 1);
  assert.equal(hm.toDateKey(start), "2026-10-31");
  const end = d(2026, 11, 30);
  const weeks = hm.buildHeatmapWeeks(start, end, {});
  const labels = hm.buildMonthLabels(weeks, start, end);
  assert.equal(labels.length, 1);
  assert.equal(labels[0].label, "11月");
  assert.equal(labels[0].span, weeks.length);
});

test("月份轴：首月被后月替换时，首标签 index 必须 > 0（模板按 index 定位）", () => {
  const start = d(2026, 8, 30); // 周日，8 月只剩 30/31 两天
  const end = d(2026, 9, 30);
  const weeks = hm.buildHeatmapWeeks(start, end, {});
  assert.equal(keyToDate(weeks[0].key).getDay(), 1);
  const labels = hm.buildMonthLabels(weeks, start, end);
  assert.deepEqual(labels.map((item) => item.label), ["9月"]);
  assert.equal(labels[0].index, 1, "9-01 落在第二列，首标签不能被画到第 0 列");
  assert.equal(labels[0].span, weeks.length - 1);
});

// ---------------------------------------------------------------- 打卡天数

test("checkinDays：按日期去重、驳回不计、待审计入、范围外未来不计", () => {
  const groups = [[
    nrec(1, "2026-09-10", 5, 1),
    nrec(2, "2026-09-10", 4, 1), // 同日第二条，仍只算 1 天
    nrec(3, "2026-09-11", 20, 2), // 驳回，不计
    nrec(4, "2026-09-12", 24.9, 0), // 待审，计入
    nrec(5, "2026-10-05", 3, 1) // 未来，超出范围
  ]];
  const aggregated = hm.aggregateSportRecords(groups);
  const heatmap = hm.buildRecentHeatmap({ today: d(2026, 10, 1), dailyMap: aggregated.dailyMap, monthsBack: 6 });
  assert.equal(heatmap.checkinDays, 2, "只有 09-10 与 09-12 计入");
  assert.equal(findDay(heatmap, "2026-09-10").level, 3, "5+4=9km 属于第 3 级");
  assert.equal(findDay(heatmap, "2026-09-10").distance, 9, "点击日期使用同日记录的聚合跑量");
  assert.equal(findDay(heatmap, "2026-09-11").level, 0);
  assert.equal(findDay(heatmap, "2026-09-11").distance, 0, "无跑量日期展示 0 公里");
  assert.equal(findDay(heatmap, "2026-09-12").level, 4);
  assert.equal(findDay(heatmap, "2026-09-12").distance, 24.9);
  assert.equal(findDay(heatmap, "2026-10-05"), null, "未来日期没有单元格");
});

test("checkinDays：随范围变化，范围外日期不计", () => {
  const dailyMap = { "2026-08-15": 5, "2026-09-20": 8, "2026-10-01": 20 };
  const today = d(2026, 10, 1);
  assert.equal(hm.buildRecentHeatmap({ today, dailyMap, monthsBack: 1 }).checkinDays, 2);
  assert.equal(hm.buildRecentHeatmap({ today, dailyMap, monthsBack: 3 }).checkinDays, 3);
  assert.equal(hm.buildRecentHeatmap({ today, dailyMap, monthsBack: 6 }).checkinDays, 3);
  assert.equal(hm.countCheckinDays(null, today, today), 0);
});

// ---------------------------------------------------------------- 渲染几何

test("几何常量与 wxss 版面自洽：750 = 页面边距 + 卡片边距 + 星期轴 + 可视宽度", () => {
  const pagePad = 40 * 2;
  const cardPad = 26 * 2;
  assert.equal(
    hm.HEATMAP_VIEWPORT_RPX + hm.HEATMAP_WEEKDAY_COLUMN_RPX + hm.HEATMAP_WEEKDAY_MARGIN_RPX + cardPad + pagePad,
    750
  );
});

test("computeHeatmapLayout：四范围统一 21.6/6/27.6，短范围自然留白、长范围滚到含尾月标的末端", () => {
  // 27.6 的二进制浮点有噪声，几何断言统一 round1 后比较。
  const round1 = (n) => Math.round(n * 10) / 10;
  const cases = [
    { months: 1, gridWidth: 132, canvasWidth: 180, scrollRpx: 0 },
    { months: 3, gridWidth: 380.4, canvasWidth: 428.4, scrollRpx: 0 },
    { months: 6, gridWidth: 739.2, canvasWidth: 787.2, scrollRpx: 233.2 },
    { months: 12, gridWidth: 1456.8, canvasWidth: 1504.8, scrollRpx: 950.8 }
  ];
  cases.forEach((item) => {
    const heatmap = hm.buildRecentHeatmap({ today: d(2026, 10, 1), dailyMap: {}, monthsBack: item.months });
    const layout = hm.computeHeatmapLayout(heatmap.weeks.length);
    assert.equal(layout.cell, 21.6, item.months + " 个月的格子固定为 21.6rpx");
    assert.equal(layout.gap, 6, "间隔不得拉伸");
    assert.equal(layout.stride, 27.6);
    assert.equal(round1(layout.gridWidth), item.gridWidth);
    assert.equal(round1(layout.canvasWidth), item.canvasWidth);
    assert.equal(layout.canvasWidth - layout.gridWidth, 48, "尾月预留保持 48rpx");
    assert.equal(layout.axisHeight, 40.8);
    assert.equal(round1(layout.scrollRpx), item.scrollRpx);
    if (item.months <= 3) {
      assert.ok(layout.canvasWidth < hm.HEATMAP_VIEWPORT_RPX, "短范围保留空白，不铺满可视宽度");
    } else {
      assert.equal(layout.scrollRpx + hm.HEATMAP_VIEWPORT_RPX, layout.canvasWidth, "滚动上限完整露出尾月标");
    }
  });
});

test("computeHeatmapLayout：固定尺寸下的滚动边界包含尾月预留", () => {
  const round1 = (n) => Math.round(n * 10) / 10;
  const fits = hm.computeHeatmapLayout(15);
  const overflows = hm.computeHeatmapLayout(20);
  assert.equal(round1(fits.canvasWidth), 456);
  assert.equal(fits.scrollRpx, 0);
  assert.equal(round1(overflows.gridWidth), 546, "网格本身仍能装下");
  assert.equal(round1(overflows.canvasWidth), 594, "加上尾月预留后需要横滚");
  assert.equal(round1(overflows.scrollRpx), 40);
  [fits, overflows].forEach((layout) => {
    assert.deepEqual([layout.cell, layout.gap, layout.stride], [21.6, 6, 27.6]);
  });
});

test("rpxToPx：按 750 基准换算，异常宽度回落 375", () => {
  assert.equal(hm.rpxToPx(750, 375), 375);
  assert.equal(hm.rpxToPx(72, 375), 36);
  assert.equal(hm.rpxToPx(750, 0), 375);
  assert.equal(hm.rpxToPx(750, undefined), 375);
  assert.equal(hm.rpxToPx(0, 375), 0);
});

// ---------------------------------------------------------------- 分页解析

test("parseSportListPage：结构失败不当作空页", () => {
  assert.equal(hm.parseSportListPage(null).reason, "response_not_object");
  assert.equal(hm.parseSportListPage([]).reason, "response_not_object");
  assert.equal(hm.parseSportListPage("oops").reason, "response_not_object");
  assert.equal(hm.parseSportListPage({ success: false, data: [], total: 0, page_total: 1 }).reason, "success_not_true");
  assert.equal(hm.parseSportListPage({ success: true, data: {} }).reason, "data_not_array");
  assert.equal(hm.parseSportListPage({ success: true, data: [], total: undefined }).reason, "total_invalid:undefined");
  assert.equal(
    hm.parseSportListPage({ success: true, data: [], total: 3, page_total: undefined }).reason,
    "page_total_invalid:undefined"
  );
  assert.equal(
    hm.parseSportListPage({ success: true, data: [], total: 3, page_total: 0 }).reason,
    "page_total_invalid:0"
  );
  assert.equal(
    hm.parseSportListPage({ success: true, data: [], total: 1.9, page_total: 1 }).reason,
    "total_invalid:1.9",
    "小数 total 不合法"
  );
  assert.equal(
    hm.parseSportListPage({ success: true, data: [], total: "3.5", page_total: 1 }).reason,
    "total_invalid:3.5"
  );
  assert.equal(
    hm.parseSportListPage({ success: true, data: [], total: 3, page_total: 2.5 }).reason,
    "page_total_invalid:2.5"
  );
});

test("parseSportListPage：total=0 却带数据视为畸形", () => {
  const parsed = hm.parseSportListPage({ success: true, total: 0, page_total: 1, data: [rec(1, "2026-10-01", 5, 1)] });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.reason, "total_zero_with_data:1");
});

test("parseSportListPage：success 兼容 number / string", () => {
  const data = [rec(1, "2026-10-01", 5, 1)];
  assert.equal(hm.parseSportListPage({ success: 1, total: 1, page_total: 1, data }).ok, true);
  assert.equal(hm.parseSportListPage({ success: "true", total: 1, page_total: 1, data }).ok, true);
  assert.equal(hm.parseSportListPage({ success: "0", total: 1, page_total: 1, data }).ok, false);
});

test("parseSportListPage：total / page_total / page_size 兼容字符串数字", () => {
  const parsed = hm.parseSportListPage({ success: true, total: "932", page_total: "63", page_size: "15", data: [] });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.total, 932);
  assert.equal(parsed.pageTotal, 63);
  assert.equal(parsed.pageSize, 15);
});

test("parseSportListPage：total=0 时允许 page_total=0（空账户）", () => {
  const parsed = hm.parseSportListPage({ success: true, total: 0, page_total: 0, data: [] });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.pageTotal, 0);
});

test("parseSportListPage：字段畸形 / 缺省一律 ok=false", () => {
  const wrap = (entry) => ({ success: true, total: 1, page_total: 1, data: [entry] });

  assert.equal(hm.parseSportListPage(wrap(null)).reason, "record_not_object:0");
  assert.equal(hm.parseSportListPage(wrap({ sport_date: "2026-10-01", distance: 1, state: 1 })).reason, "record_id_invalid:0");
  assert.equal(hm.parseSportListPage(wrap({ id: 1, distance: 1, state: 1 })).reason, "sport_date_invalid:undefined");
  assert.equal(
    hm.parseSportListPage(wrap({ id: 1, sport_date: "2026-02-30", distance: 1, state: 1 })).reason,
    "sport_date_invalid:2026-02-30"
  );
  assert.equal(
    hm.parseSportListPage(wrap({ id: 1, sport_date: "2026-10-01", distance: 1 })).reason,
    "state_invalid:2026-10-01"
  );
  assert.equal(
    hm.parseSportListPage(wrap({ id: 1, sport_date: "2026-10-01", state: 1 })).reason,
    "distance_missing:2026-10-01"
  );
  assert.equal(
    hm.parseSportListPage(wrap({ id: 1, sport_date: "2026-10-01", distance: "abc", state: 1 })).reason,
    "distance_invalid:2026-10-01"
  );
  assert.equal(
    hm.parseSportListPage(wrap({ id: 1, sport_date: "2026-10-01", distance: Infinity, state: 1 })).reason,
    "distance_invalid:2026-10-01"
  );
});

test("parseSportListPage：合法的 0 / 负数 distance 保留但计为无跑量", () => {
  const parsed = hm.parseSportListPage({
    success: true,
    total: 3,
    page_total: 1,
    data: [rec(1, "2026-10-01", 6, 1), rec(2, "2026-10-02", 0, 0), rec(3, "2026-10-03", -2, 0)]
  });
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.records.map((item) => item.distance), [6, 0, -2]);
});

test("aggregateSportRecords：id 去重 + 排除 state2 + 待审 state0 计入 + 同日累加", () => {
  const groups = [
    [nrec(1, "2026-09-10", 5, 1), nrec(2, "2026-09-10", 4, 1)], // 同日累加 -> 9
    [nrec(1, "2026-09-10", 5, 1)], // 重复 id，忽略
    [nrec(3, "2026-09-11", 20, 2)], // 已驳回，排除
    [nrec(4, "2026-09-12", 24.9, 0)] // 待审核，计入
  ];
  const result = hm.aggregateSportRecords(groups);
  assert.equal(result.distinctIds, 4, "去重后 id 数为 4");
  assert.deepEqual(result.dailyMap, { "2026-09-10": 9, "2026-09-12": 24.9 });
});

test("aggregateSportRecords：非正跑量与空输入", () => {
  assert.deepEqual(hm.aggregateSportRecords([]), { dailyMap: {}, distinctIds: 0 });
  assert.deepEqual(hm.aggregateSportRecords(null), { dailyMap: {}, distinctIds: 0 });
  const result = hm.aggregateSportRecords([[nrec(1, "2026-09-10", 0, 1), nrec(2, "2026-09-11", -3, 1)]]);
  assert.deepEqual(result.dailyMap, {});
  assert.equal(result.distinctIds, 2);
});

// ---------------------------------------------------------------- 分页编排

function makeHarness(currentUser, options) {
  const state = {
    currentUser: currentUser,
    pending: [],
    states: [],
    calls: [],
    inFlight: 0,
    maxInFlight: 0
  };
  state.controller = hm.createHeatmapController(Object.assign({
    now: () => d(2026, 10, 1),
    concurrency: 2,
    isCurrentUser: (userId) => String(userId) === String(state.currentUser),
    fetchRecords: (userId, pageNo, onSuccess, onFail) => {
      state.calls.push(pageNo);
      state.inFlight += 1;
      state.maxInFlight = Math.max(state.maxInFlight, state.inFlight);
      state.pending.push({
        userId: userId,
        page: pageNo,
        ok: (res) => { state.inFlight -= 1; onSuccess(res); },
        fail: (err) => { state.inFlight -= 1; onFail(err); }
      });
    }
  }, options || {}));
  state.load = (userId) => state.controller.load(userId, { onState: (s) => state.states.push(s) });
  state.setMonths = (months) => state.controller.setMonths(months);
  state.statuses = () => state.states.map((s) => s.status);
  state.months = () => state.states.map((s) => s.monthsBack);
  state.req = (userId, pageNo) => state.pending.filter((p) => p.page === pageNo && String(p.userId) === String(userId)).pop();
  return state;
}

test("编排：未登录直接 guest，且不发请求", () => {
  const h = makeHarness(0);
  h.load(0);
  assert.deepEqual(h.statuses(), ["guest"]);
  assert.equal(h.states[0].recentHeatmap, null);
  assert.equal(h.states[0].checkinDays, 0);
  assert.equal(h.pending.length, 0);
});

test("编排：单页成功即 ready", () => {
  const h = makeHarness(1);
  h.load(1);
  assert.deepEqual(h.statuses(), ["loading"]);
  assert.deepEqual(h.calls, [1]);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-15", 15, 1)], 1, 1) });
  assert.deepEqual(h.statuses(), ["loading", "ready"]);
  assert.equal(findDay(h.states[1].recentHeatmap, "2026-09-15").level, 4);
  assert.equal(h.states[1].checkinDays, 1);
  assert.equal(h.states[1].monthsBack, 6, "默认最近 6 个月");
});

test("编排：多页受控并发 + 乱序返回仍正确", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-30", 5, 1)], 3, 3) });
  assert.deepEqual([...h.calls].sort((a, b) => a - b), [1, 2, 3], "第 1 页后并发取 2/3 页");
  assert.ok(h.maxInFlight <= 2, "并发不超过上限");

  h.req(1, 3).ok({ data: page([rec(3, "2026-09-01", 20, 1)], 3, 3) });
  assert.deepEqual(h.statuses(), ["loading"], "缺页前不得 ready");
  h.req(1, 2).ok({ data: page([rec(2, "2026-09-15", 8, 1)], 3, 3) });
  assert.deepEqual(h.statuses(), ["loading", "ready"]);
  const heatmap = h.states[1].recentHeatmap;
  assert.equal(findDay(heatmap, "2026-09-01").level, 4);
  assert.equal(findDay(heatmap, "2026-09-15").level, 3);
  assert.equal(findDay(heatmap, "2026-09-30").level, 2);
});

test("编排：任意一页网络失败 => error，可重试", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-30", 5, 1)], 2, 3) });
  h.req(1, 2).fail(new Error("network"));
  assert.deepEqual(h.statuses(), ["loading", "error"]);
  assert.equal(h.states[1].reason, "request_failed:page2");

  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-30", 5, 1)], 2, 3) });
  h.req(1, 2).ok({ data: page([rec(2, "2026-09-29", 7, 1), rec(4, "2026-09-28", 3, 1)], 2, 3) });
  assert.deepEqual(h.statuses(), ["loading", "error", "loading", "ready"]);
});

test("编排：业务 success:false 的页 => error（不当作空页）", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-30", 5, 1)], 2, 2) });
  h.req(1, 2).ok({ data: { success: false, data: [] } });
  assert.deepEqual(h.statuses(), ["loading", "error"]);
  assert.equal(h.states[1].reason, "page2:success_not_true");
});

test("编排：跨页重复 id 只算一次（去重后满足 total）", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1), rec(2, "2026-09-11", 6, 1)], 2, 3) });
  h.req(1, 2).ok({ data: page([rec(1, "2026-09-10", 5, 1), rec(3, "2026-09-12", 8, 1)], 2, 3) });
  assert.deepEqual(h.statuses(), ["loading", "ready"]);
  const heatmap = h.states[1].recentHeatmap;
  assert.equal(findDay(heatmap, "2026-09-10").level, 2, "重复 id 不得被累加成 10km");
  assert.equal(findDay(heatmap, "2026-09-12").level, 3);
  assert.equal(h.states[1].checkinDays, 3);
});

test("编排：去重后 id 数少于 total => error（不冒充完整）", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1), rec(2, "2026-09-11", 6, 1)], 2, 5) });
  h.req(1, 2).ok({ data: page([rec(1, "2026-09-10", 5, 1), rec(3, "2026-09-12", 7, 1)], 2, 5) });
  assert.deepEqual(h.statuses(), ["loading", "error"]);
  assert.equal(h.states[1].reason, "record_count_mismatch:3/5");
});

test("编排：去重后 id 数多于 total => error（要求完全一致）", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 2, 2) });
  h.req(1, 2).ok({ data: page([rec(2, "2026-09-11", 6, 1), rec(3, "2026-09-12", 7, 1)], 2, 2) });
  assert.deepEqual(h.statuses(), ["loading", "error"]);
  assert.equal(h.states[1].reason, "record_count_mismatch:3/2");
});

test("编排：后续页 total/page_total 与第一页不一致 => error（避免混合快照）", () => {
  const totalChanged = makeHarness(1);
  totalChanged.load(1);
  totalChanged.req(1, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 2, 2) });
  totalChanged.req(1, 2).ok({ data: page([rec(2, "2026-09-11", 6, 1)], 2, 3) });
  assert.deepEqual(totalChanged.statuses(), ["loading", "error"]);
  assert.equal(totalChanged.states[1].reason, "page2:metadata_mismatch:total:3/2");

  const pagesChanged = makeHarness(1);
  pagesChanged.load(1);
  pagesChanged.req(1, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 2, 2) });
  pagesChanged.req(1, 2).ok({ data: page([rec(2, "2026-09-11", 6, 1)], 3, 2) });
  assert.deepEqual(pagesChanged.statuses(), ["loading", "error"]);
  assert.equal(pagesChanged.states[1].reason, "page2:metadata_mismatch:page_total:3/2");
});

test("编排：page_total 过大直接 error", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 2000, 2000) });
  assert.deepEqual(h.statuses(), ["loading", "error"]);
  assert.equal(h.states[1].reason, "page_total_too_large:2000");
});

test("编排：切换用户后，旧用户的迟到响应被丢弃", () => {
  const h = makeHarness(7);
  h.load(7);
  h.currentUser = 8;
  h.load(8);
  assert.deepEqual(h.statuses(), ["loading", "loading"]);
  assert.equal(h.controller.getDailyMap(), null, "换用户必须清空已加载数据");

  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  assert.deepEqual(h.statuses(), ["loading", "loading"], "旧用户响应不得落地");

  h.req(8, 1).ok({ data: page([rec(9, "2026-09-20", 20, 1)], 1, 1) });
  assert.deepEqual(h.statuses(), ["loading", "loading", "ready"]);
  assert.equal(findDay(h.states[2].recentHeatmap, "2026-09-20").level, 4);
  assert.equal(findDay(h.states[2].recentHeatmap, "2026-09-10").level, 0);
});

test("编排：退出登录后清空缓存，旧用户的迟到响应不得混入", () => {
  const h = makeHarness(7);
  h.load(7);
  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  assert.equal(h.controller.getStatus(), "ready");

  h.currentUser = 0;
  h.load(0);
  assert.deepEqual(h.statuses(), ["loading", "ready", "guest"]);
  assert.equal(h.controller.getDailyMap(), null);
  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  assert.deepEqual(h.statuses(), ["loading", "ready", "guest"]);
});

test("编排：缺少数据源时直接 error", () => {
  const controller = hm.createHeatmapController({ now: () => d(2026, 10, 1) });
  const states = [];
  controller.load(7, { onState: (s) => states.push(s) });
  assert.deepEqual(states.map((s) => s.status), ["error"]);
  assert.equal(states[0].reason, "fetch_records_unavailable");
});

test("编排：默认并发为 4 且不超过上限", () => {
  const h = makeHarness(1, { concurrency: undefined });
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-30", 5, 1)], 10, 10) });
  assert.ok(h.calls.length <= 5, "第 1 页后并发拉取不超过 4 页");
  assert.ok(h.maxInFlight <= hm.PAGE_CONCURRENCY, "并发不超过默认上限");
});

test("编排：同一用户重复刷新后，旧分页成功或失败均不得覆盖新图", () => {
  const h = makeHarness(7);
  h.load(7);
  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 3, 3) });
  const oldPage2 = h.req(7, 2);
  const oldPage3 = h.req(7, 3);
  h.load(7);
  h.req(7, 1).ok({ data: page([rec(9, "2026-09-20", 20, 1)], 1, 1) });
  oldPage2.ok({ data: page([rec(2, "2026-09-10", 5, 1)], 3, 3) });
  oldPage3.fail(new Error("late failure"));
  assert.deepEqual(h.statuses(), ["loading", "loading", "ready"]);
  assert.equal(findDay(h.states[2].recentHeatmap, "2026-09-20").level, 4);
  assert.equal(findDay(h.states[2].recentHeatmap, "2026-09-10").level, 0);
});

// ---------------------------------------------------------------- 切范围（本地重算）

test("编排：切范围只用已加载数据本地重算，不重复请求分页", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({
    data: page([rec(1, "2026-08-15", 5, 1), rec(2, "2026-10-01", 20, 1), rec(3, "2026-09-20", 8, 1)], 1, 3)
  });
  assert.deepEqual(h.statuses(), ["loading", "ready"]);
  assert.equal(h.states[1].monthsBack, 6);
  assert.equal(h.states[1].checkinDays, 3, "6 个月内三天都算");

  const callsBefore = h.calls.length;
  h.setMonths(3);
  assert.equal(h.calls.length, callsBefore, "切范围不得再发分页请求");
  assert.deepEqual(h.statuses(), ["loading", "ready", "ready"]);
  assert.equal(h.states[2].monthsBack, 3);
  assert.equal(h.states[2].checkinDays, 3, "3 个月起点 07-02，三天都在范围内");
  assert.equal(findDay(h.states[2].recentHeatmap, "2026-08-15").level, 2);

  h.setMonths(1);
  assert.equal(h.calls.length, callsBefore, "再次切换仍不发请求");
  assert.equal(h.states[3].monthsBack, 1);
  assert.equal(h.states[3].checkinDays, 2, "1 个月起点 09-02，08-15 被排除");
  assert.equal(findDay(h.states[3].recentHeatmap, "2026-08-15"), null);

  h.setMonths(12);
  assert.equal(h.states[4].checkinDays, 3);
  assert.equal(findDay(h.states[4].recentHeatmap, "2026-08-15").level, 2);
});

test("编排：加载过程中切范围，完成后按最新选择渲染", () => {
  const h = makeHarness(1);
  h.load(1);
  assert.deepEqual(h.months(), [6], "loading 状态带当前选择");
  h.setMonths(1);
  assert.deepEqual(h.months(), [6, 1], "loading 途中改选也要被记录");
  assert.deepEqual(h.statuses(), ["loading", "loading"]);

  h.req(1, 1).ok({ data: page([rec(1, "2026-09-20", 8, 1), rec(2, "2026-08-15", 5, 1)], 1, 2) });
  const last = h.states[h.states.length - 1];
  assert.equal(last.status, "ready");
  assert.equal(last.monthsBack, 1, "完成后展示最新选择");
  assert.equal(last.checkinDays, 1);
  assert.equal(findDay(last.recentHeatmap, "2026-08-15"), null);
});

test("编排：切范围遇到非法值时保持当前选择", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([rec(1, "2026-09-20", 8, 1)], 1, 1) });
  h.setMonths(5);
  assert.equal(h.states[h.states.length - 1].monthsBack, 6, "非法值回落默认 6");
  h.setMonths(3);
  h.setMonths("nope");
  assert.equal(h.states[h.states.length - 1].monthsBack, 3, "非法值保留当前 3 个月");
});

test("编排：空账户（total=0）也能 ready 并给出 0 天", () => {
  const h = makeHarness(1);
  h.load(1);
  h.req(1, 1).ok({ data: page([], 0, 0) });
  assert.deepEqual(h.statuses(), ["loading", "ready"]);
  assert.equal(h.states[1].checkinDays, 0);
  assert.ok(h.states[1].recentHeatmap.weeks.length > 0);
});

test("编排：换用户后 setMonths 不得复活旧用户缓存", () => {
  const h = makeHarness(7);
  h.load(7);
  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  assert.equal(h.controller.getStatus(), "ready");

  // 页面 onShow 会针对新用户重新 load，缓存必须清空
  h.currentUser = 8;
  h.load(8);
  h.setMonths(3);
  const duringLoading = h.states[h.states.length - 1];
  assert.equal(duringLoading.status, "loading", "切范围时仍是 loading，不得复活旧图");
  assert.equal(duringLoading.recentHeatmap, null);
  assert.equal(duringLoading.monthsBack, 3);
  assert.equal(h.controller.getDailyMap(), null);

  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  assert.equal(h.states[h.states.length - 1].status, "loading", "旧用户迟到响应不得落地");

  h.req(8, 1).ok({ data: page([rec(9, "2026-09-20", 20, 1)], 1, 1) });
  const ready = h.states[h.states.length - 1];
  assert.equal(ready.status, "ready");
  assert.equal(ready.monthsBack, 3, "按切换后的范围渲染");
  assert.equal(findDay(ready.recentHeatmap, "2026-09-20").level, 4);
  assert.equal(findDay(ready.recentHeatmap, "2026-09-10").level, 0, "旧用户数据不得残留");
});

test("编排：同用户刷新期间保持 loading、无图（页面显示 —天）", () => {
  const h = makeHarness(7);
  h.load(7);
  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  assert.equal(h.states[h.states.length - 1].status, "ready");

  h.load(7);
  const loading = h.states[h.states.length - 1];
  assert.equal(loading.status, "loading");
  assert.equal(loading.recentHeatmap, null, "刷新期间不得沿用旧图");
  assert.equal(loading.checkinDays, 0);

  h.setMonths(3);
  const stillLoading = h.states[h.states.length - 1];
  assert.equal(stillLoading.status, "loading");
  assert.equal(stillLoading.recentHeatmap, null);

  h.req(7, 1).ok({ data: page([rec(1, "2026-09-10", 5, 1)], 1, 1) });
  const ready = h.states[h.states.length - 1];
  assert.equal(ready.status, "ready");
  assert.equal(ready.monthsBack, 3);
  assert.equal(ready.checkinDays, 1);
});

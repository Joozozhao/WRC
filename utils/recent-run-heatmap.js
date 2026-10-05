// utils/recent-run-heatmap.js
// 「我的」页跑步热力图的纯数据逻辑（默认最近 6 个月，可切 1 / 3 / 6 / 12 个月）。
// 该模块不依赖 wx / Page / 网络，既可在小程序里 require，也可在 Node 里直接单测。
//
// 数据来源：user/getsportlist（与 pages/record 同一契约）
//   POST { userId, type: -1, page }
//   resp { success, total, page_size, page_total, data: [ { id, distance, sport_date, state, ... } ] }
//   - 列表按 create_time 降序，sport_date 可能回填，因此不能用“某页 sport_date 早于起点就停”来截断。
//   - state: 1 通过 / 2 驳回 / 其它（含 0）待审核；驳回不计入跑量，待审核计入。
//   - 分页必须取满 page_total，任何一页失败都算整体失败（不展示部分结果冒充完整）。
//   - page_size 参数在服务端无效，契约里没有它，切勿再传。
//
// 热力图约定：
//   - 范围：终点为今天；起点为今天往前 X 个日历月的同日（该月无同日则取月末）再 +1 天，
//           X 取 1 / 3 / 6 / 12，默认 6。例：2026-10-01 + 6 个月 -> 2026-04-02。
//   - 网格：每周周一至周日固定 7 格，范围之外的首尾格子为透明 padding（isPadding=true）。
//   - 等级：0 无跑量；<=3km 为 1；<=7km 为 2；<=12km 为 3；>12km 为 4。
//   - 打卡天数 checkinDays：范围内“有正跑量”的日期去重计数，不是记录条数。

var RANGE_OPTIONS = [1, 3, 6, 12];
var DEFAULT_RANGE_MONTHS = 6;
var DAYS_PER_WEEK = 7;
// 分页并发上限：全量分页串行太慢，但也不宜一次性打满。
var PAGE_CONCURRENCY = 4;
// 页数防御上限：page_total 异常大时直接报错，避免无限请求。
var MAX_PAGES = 1000;
// 不计入跑量的审核状态（2 = 已驳回）。待审核（0）计入。
var EXCLUDED_STATES = [2];
// 月份轴相邻标签的最小列距：低于该间距就判定为会挤压/重叠，丢弃后出现的标签。
var MIN_MONTH_LABEL_GAP = 3;

function pad2(value) {
  return value < 10 ? "0" + value : "" + value;
}

function toDateKey(date) {
  return date.getFullYear() + "-" + pad2(date.getMonth() + 1) + "-" + pad2(date.getDate());
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function addDays(date, amount) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
}

// b - a 的整数天数（用 UTC 归一，规避时区/夏令时误差）。
function dayDiff(a, b) {
  var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((ub - ua) / 86400000);
}

// 往前推若干个月；目标月没有相同日时取该月最后一天，不向下一月溢出。
function addMonthsClamped(date, delta) {
  var total = date.getMonth() + delta;
  var targetYear = date.getFullYear() + Math.floor(total / 12);
  var targetMonth = ((total % 12) + 12) % 12;
  var targetDay = Math.min(date.getDate(), daysInMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth, targetDay);
}

// 只接受 1 / 3 / 6 / 12，其余一律回落到 fallback（默认 6 个月）。
function normalizeMonths(value, fallback) {
  var num = Number(value);
  if (RANGE_OPTIONS.indexOf(num) !== -1) return num;
  var fb = Number(fallback);
  if (RANGE_OPTIONS.indexOf(fb) !== -1) return fb;
  return DEFAULT_RANGE_MONTHS;
}

// 起点 = 今天往前 X 个月的同日（无同日取月末）再 +1 天。
function computeRangeStart(today, monthsBack) {
  var months = normalizeMonths(monthsBack);
  var anchor = addMonthsClamped(startOfDay(today), -months);
  return addDays(anchor, 1);
}

var DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateKey(value) {
  if (typeof value !== "string" || !DATE_KEY_RE.test(value)) return false;
  var parts = value.split("-");
  var year = parseInt(parts[0], 10);
  var month = parseInt(parts[1], 10);
  var day = parseInt(parts[2], 10);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > daysInMonth(year, month - 1)) return false;
  return true;
}

// success 兼容 boolean / number / string：既有调用方用的是 truthy 判断，这里保持同样口径，
// 只把明确的 false / 0 / "0" / "false" / 空串判为失败。
function isSuccessFlag(value) {
  if (value === true) return true;
  if (typeof value === "number") return Number.isFinite(value) && value !== 0;
  if (typeof value === "string") {
    var text = value.trim().toLowerCase();
    return text !== "" && text !== "0" && text !== "false";
  }
  return false;
}

// 严格读取数值字段（distance）：
//   positive    正有限数
//   nonpositive 合法但非正（0 / 负数，合法、忽略为无跑量）
//   missing     字段缺省（undefined / null / 空串）
//   invalid     非法数值（NaN / Infinity / 布尔 / 对象 / 非数字串）
function readEntryKm(value) {
  if (value === undefined || value === null) return { status: "missing" };
  var num;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string") {
    if (value.trim() === "") return { status: "missing" };
    num = Number(value);
  } else {
    return { status: "invalid" };
  }
  if (!Number.isFinite(num)) return { status: "invalid" };
  return { status: num > 0 ? "positive" : "nonpositive", km: num };
}

// 读取非负整数（total / page_total / page_size / state）。
// 只接受有限非负整数：1.9 / -1 / NaN / Infinity / 非数字串一律返回 null，不做静默取整。
function readCount(value) {
  var num;
  if (typeof value === "number") {
    num = value;
  } else if (typeof value === "string" && value.trim() !== "") {
    num = Number(value);
  } else {
    return null;
  }
  if (!Number.isInteger(num) || num < 0) return null;
  return num;
}

// 0 无跑量；1 (0,3]；2 (3,7]；3 (7,12]；4 (12,+)。
function levelForDistance(value) {
  var read = readEntryKm(value);
  if (read.status !== "positive") return 0;
  if (read.km <= 3) return 1;
  if (read.km <= 7) return 2;
  if (read.km <= 12) return 3;
  return 4;
}

// 校验单条打卡记录，取出聚合需要的四个字段。
function parseRecord(item, index) {
  if (!item || typeof item !== "object" || Array.isArray(item)) {
    return { error: "record_not_object:" + index };
  }
  var id = item.id;
  var idOk = (typeof id === "number" && Number.isFinite(id)) || (typeof id === "string" && id.trim() !== "");
  if (!idOk) return { error: "record_id_invalid:" + index };
  if (!isValidDateKey(item.sport_date)) return { error: "sport_date_invalid:" + String(item.sport_date) };
  var state = readCount(item.state);
  if (state === null) return { error: "state_invalid:" + String(item.sport_date) };
  var distance = readEntryKm(item.distance);
  if (distance.status === "missing") return { error: "distance_missing:" + String(item.sport_date) };
  if (distance.status === "invalid") return { error: "distance_invalid:" + String(item.sport_date) };
  return { record: { id: id, sportDate: item.sport_date, state: state, distance: distance.km } };
}

// 解析 user/getsportlist 单页响应体（即 wx 响应的 res.data）。
// ok=false 时 reason 指出第一个不合法的地方；绝不把畸形页当成“空页/0”。
function parseSportListPage(envelope) {
  var result = { ok: false, records: [], total: 0, pageTotal: 0, pageSize: 0, reason: "" };
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) {
    result.reason = "response_not_object";
    return result;
  }
  if (!isSuccessFlag(envelope.success)) {
    result.reason = "success_not_true";
    return result;
  }
  if (!Array.isArray(envelope.data)) {
    result.reason = "data_not_array";
    return result;
  }
  var total = readCount(envelope.total);
  if (total === null) {
    result.reason = "total_invalid:" + String(envelope.total);
    return result;
  }
  var pageTotal = readCount(envelope.page_total);
  if (pageTotal === null || (total > 0 && pageTotal < 1)) {
    result.reason = "page_total_invalid:" + String(envelope.page_total);
    return result;
  }
  if (total === 0 && envelope.data.length > 0) {
    result.reason = "total_zero_with_data:" + envelope.data.length;
    return result;
  }

  var records = [];
  for (var i = 0; i < envelope.data.length; i++) {
    var parsed = parseRecord(envelope.data[i], i);
    if (parsed.error) {
      result.reason = parsed.error;
      return result;
    }
    records.push(parsed.record);
  }

  result.records = records;
  result.total = total;
  result.pageTotal = pageTotal;
  result.pageSize = readCount(envelope.page_size) || 0;
  result.ok = true;
  return result;
}

// 聚合所有页的记录：按 id 去重（跨页/乱序安全），按 sport_date 累加正跑量，排除被驳回的状态。
// recordGroups 是“每页记录数组”的集合，顺序无关。
function aggregateSportRecords(recordGroups, options) {
  var excludedStates = (options && options.excludedStates) || EXCLUDED_STATES;
  var seen = {};
  var dailyMap = {};
  var distinctIds = 0;
  (recordGroups || []).forEach(function(records) {
    (records || []).forEach(function(record) {
      var idKey = String(record.id);
      if (seen[idKey]) return;
      seen[idKey] = true;
      distinctIds += 1;
      if (excludedStates.indexOf(record.state) !== -1) return;
      if (!(record.distance > 0)) return;
      dailyMap[record.sportDate] = (dailyMap[record.sportDate] || 0) + record.distance;
    });
  });
  return { dailyMap: dailyMap, distinctIds: distinctIds };
}

// 周一为一周的第一天。
function mondayOf(date) {
  var offset = (date.getDay() + 6) % 7;
  return addDays(date, -offset);
}

// 生成 [start, end]（含两端）的周网格，范围外为 isPadding 透明格。
// distance 与 level 共用聚合值，供点击日期时展示当天跑量。
function buildHeatmapWeeks(start, end, dailyMap) {
  var weeks = [];
  var cursor = mondayOf(start);
  var guard = 0;
  while (cursor <= end) {
    var days = [];
    for (var i = 0; i < DAYS_PER_WEEK; i++) {
      var dayDate = addDays(cursor, i);
      var key = toDateKey(dayDate);
      var isPadding = dayDate < start || dayDate > end;
      var distance = isPadding ? 0 : (dailyMap && dailyMap[key] || 0);
      days.push({
        key: key,
        level: levelForDistance(distance),
        distance: distance,
        isPadding: isPadding
      });
    }
    weeks.push({ key: toDateKey(cursor), days: days });
    cursor = addDays(cursor, DAYS_PER_WEEK);
    guard += 1;
    if (guard > 400) break;
  }
  return weeks;
}

// 某个月落在 [start, end] 内的天数（用于「末尾不足月」的取舍）。
function monthDaysInRange(year, monthIndex, start, end) {
  var first = new Date(year, monthIndex, 1);
  var last = new Date(year, monthIndex, daysInMonth(year, monthIndex));
  if (first < start) first = start;
  if (last > end) last = end;
  if (first > last) return 0;
  return dayDiff(first, last) + 1;
}

// 月份轴：每个自然月一个标签，落在「该月第一日（起始不足月则取范围首日）所在周」的列上。
// 相邻标签列距小于 MIN_MONTH_LABEL_GAP 视为会挤压/重叠：默认丢弃后出现的标签；
// 但若后出现的月份在范围内天数更多（例如起始月只剩 1 天），则改留它、弃掉前一个。
// 返回值 [{ key, label, index, span }]：模板必须按 index 绝对定位（left = index * stride），
// 因为首月被后月标签替换掉时首标签的 index 可能 > 0；span 只描述到下一个标签的列数，便于断言。
function buildMonthLabels(weeks, start, end) {
  var labels = [];
  if (!weeks || !weeks.length) return labels;
  var base = mondayOf(start);
  var candidates = [];
  var year = start.getFullYear();
  var month = start.getMonth();
  while (true) {
    var monthFirst = new Date(year, month, 1);
    if (monthFirst > end) break;
    var anchor = monthFirst < start ? start : monthFirst;
    var weekIndex = Math.floor(dayDiff(base, mondayOf(anchor)) / DAYS_PER_WEEK);
    candidates.push({
      key: toDateKey(monthFirst),
      label: (month + 1) + "月",
      index: weekIndex,
      days: monthDaysInRange(year, month, start, end)
    });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  for (var i = 0; i < candidates.length; i++) {
    var candidate = candidates[i];
    candidate.index = Math.min(Math.max(candidate.index, 0), weeks.length - 1);
    var keep = true;
    while (labels.length && candidate.index < labels[labels.length - 1].index + MIN_MONTH_LABEL_GAP) {
      var last = labels[labels.length - 1];
      if (candidate.days > last.days) {
        labels.pop();
        continue;
      }
      keep = false;
      break;
    }
    if (keep) labels.push(candidate);
  }

  for (var j = 0; j < labels.length; j++) {
    var nextIndex = j + 1 < labels.length ? labels[j + 1].index : weeks.length;
    labels[j].span = Math.max(1, nextIndex - labels[j].index);
  }
  return labels;
}

// 打卡天数 = 范围内有正跑量的日期去重计数（不是记录条数）。
function countCheckinDays(dailyMap, start, end) {
  if (!dailyMap) return 0;
  var startKey = toDateKey(start);
  var endKey = toDateKey(end);
  var count = 0;
  Object.keys(dailyMap).forEach(function(key) {
    if (key < startKey || key > endKey) return;
    if (dailyMap[key] > 0) count += 1;
  });
  return count;
}

// 组装页面用的热力图。
// 返回 { monthsBack, rangeStart, rangeEnd, weeks, monthLabels, checkinDays }。
// weeks        每列一周，每列 7 格 { key, level, isPadding }；
// monthLabels  月份轴 [{ key, label, index, span }]；
// checkinDays  范围内有正跑量的日期数。
function buildRecentHeatmap(options) {
  var opts = options || {};
  var today = startOfDay(opts.today instanceof Date ? opts.today : new Date());
  var dailyMap = opts.dailyMap || {};
  var monthsBack = normalizeMonths(opts.monthsBack);
  var start = computeRangeStart(today, monthsBack);
  var weeks = buildHeatmapWeeks(start, today, dailyMap);
  return {
    monthsBack: monthsBack,
    rangeStart: toDateKey(start),
    rangeEnd: toDateKey(today),
    weeks: weeks,
    monthLabels: buildMonthLabels(weeks, start, today),
    checkinDays: countCheckinDays(dailyMap, start, today)
  };
}

// ---------------------------------------------------------------- 渲染几何
// 版面常量与 pages/mydata/mydata.wxss 保持一致（单位 rpx，750rpx = 屏宽）。
// 可视滚动宽度 = 750 - 页面左右 40*2 - 卡片左右 26*2 - 星期轴(56 + 8)。
// 星期轴用「周一/周三/周五」三字标签，所以比 GitHub 的单词更宽，几何常量必须跟着走。
var HEATMAP_VIEWPORT_RPX = 554;
var HEATMAP_WEEKDAY_COLUMN_RPX = 56;
var HEATMAP_WEEKDAY_MARGIN_RPX = 8;
var HEATMAP_MIN_CELL = 21.6;
// 保留原有尺寸常量接口；所有范围统一为 21.6rpx（18 的 1.2 倍），不再随周数放大。
var HEATMAP_MAX_CELL = HEATMAP_MIN_CELL;
var HEATMAP_GAP = 6;
// 末尾月份标签可能比最后一列宽（例如「10月」），reserve 直接计入 canvas 宽度：
//   - 1/3 个月能整体装下时，canvas 不会超出可视宽度，因此不会出现无意义的尾部横滚；
//   - 6/12 个月装不下时才滚动，且滚动上限按 canvas 宽度算，滚到最新端后最后一列 + 尾月标完整可见。
var HEATMAP_LABEL_RESERVE_RPX = 48;
var HEATMAP_MONTH_AXIS_HEIGHT = 40.8;

// 固定方格与间距：短范围左对齐自然留白，含尾月标装不下时横滚到最新端。
function computeHeatmapLayout(weekCount) {
  var count = Math.max(1, Math.floor(weekCount || 0));
  var cell = HEATMAP_MIN_CELL;
  var stride = cell + HEATMAP_GAP;
  var gridWidth = count * stride - HEATMAP_GAP;
  var canvasWidth = gridWidth + HEATMAP_LABEL_RESERVE_RPX;
  return {
    cell: cell,
    gap: HEATMAP_GAP,
    stride: stride,
    gridWidth: gridWidth,
    canvasWidth: canvasWidth,
    // 滚动只发生在 canvas 超出可视宽度时，且滚到 canvas 末尾（而非 gridWidth）以露出尾月标。
    scrollRpx: Math.max(0, canvasWidth - HEATMAP_VIEWPORT_RPX),
    axisHeight: HEATMAP_MONTH_AXIS_HEIGHT
  };
}

// rpx -> px（scroll-left 等属性只认 px）。
function rpxToPx(rpx, windowWidthPx) {
  var width = Number(windowWidthPx);
  if (!Number.isFinite(width) || width <= 0) width = 375;
  return rpx * width / 750;
}

// ---------------------------------------------------------------- 分页编排
//   - 先取第 1 页拿到 total / page_total；
//   - 其余页按 concurrency 上限受控并发；
//   - 全部成功且“去重后的 id 数 >= total”才进入 ready，否则 error（可重试）；
//   - 只允许最新一次 load 的响应落地（请求序列 + 当前用户守卫）；
//   - load 成功后把 dailyMap 缓存下来，切换月份范围时本地重算，不再请求分页。
// options: now(), isCurrentUser(userId), fetchRecords(userId, page, onSuccess, onFail),
//          concurrency, monthsBack。
function createHeatmapController(options) {
  var opts = options || {};
  var seq = 0;
  var concurrency = opts.concurrency > 0 ? Math.floor(opts.concurrency) : PAGE_CONCURRENCY;
  var monthsBack = normalizeMonths(opts.monthsBack);
  var dailyMap = null;
  var phase = "idle";
  var reasonText = "";
  var handlers = null;

  function now() {
    return opts.now ? opts.now() : new Date();
  }

  function isStale(token, requestUserId) {
    if (token !== seq) return true;
    if (opts.isCurrentUser && !opts.isCurrentUser(requestUserId)) return true;
    return false;
  }

  function snapshot() {
    var state = {
      status: phase,
      monthsBack: monthsBack,
      reason: reasonText,
      recentHeatmap: null,
      checkinDays: 0
    };
    if (phase === "ready" && dailyMap) {
      var heatmap = buildRecentHeatmap({ today: now(), dailyMap: dailyMap, monthsBack: monthsBack });
      state.recentHeatmap = heatmap;
      state.monthsBack = heatmap.monthsBack;
      state.checkinDays = heatmap.checkinDays;
      state.rangeStart = heatmap.rangeStart;
      state.rangeEnd = heatmap.rangeEnd;
    }
    return state;
  }

  function emit() {
    if (handlers && typeof handlers.onState === "function") handlers.onState(snapshot());
  }

  function settle(nextPhase, nextReason) {
    phase = nextPhase;
    reasonText = nextReason || "";
    if (nextPhase !== "ready") dailyMap = null;
  }

  function load(userId, nextHandlers) {
    if (nextHandlers) handlers = nextHandlers;
    seq += 1;
    var token = seq;

    if (!(userId > 0)) {
      settle("guest", "");
      emit();
      return token;
    }
    if (typeof opts.fetchRecords !== "function") {
      settle("error", "fetch_records_unavailable");
      emit();
      return token;
    }

    settle("loading", "");
    emit();

    var pagesByIndex = {};
    var pageTotal = 0;
    var total = 0;
    var settled = 0;
    var failed = false;
    var pageOneHandled = false;
    var nextPage = 2;
    var inFlight = 0;

    function fail(reason) {
      if (failed) return;
      failed = true;
      settle("error", reason);
      emit();
    }

    function finish() {
      var groups = [];
      for (var p = 1; p <= pageTotal; p++) groups.push(pagesByIndex[p] || []);
      var aggregated = aggregateSportRecords(groups, { excludedStates: EXCLUDED_STATES });
      // 去重后的记录数必须与第一页声明的 total 完全一致，否则说明分页过程中数据发生了变化（混合快照）。
      if (aggregated.distinctIds !== total) {
        fail("record_count_mismatch:" + aggregated.distinctIds + "/" + total);
        return;
      }
      dailyMap = aggregated.dailyMap;
      phase = "ready";
      reasonText = "";
      emit();
    }

    function requestPage(page) {
      opts.fetchRecords(userId, page, function(response) {
        inFlight -= 1;
        if (failed || isStale(token, userId)) return;
        var parsed = parseSportListPage(response && response.data);
        if (!parsed.ok) {
          fail("page" + page + ":" + parsed.reason);
          return;
        }
        // 后续页的 total / page_total 必须与第一页一致，避免新增/删除造成混合快照。
        if (parsed.total !== total) {
          fail("page" + page + ":metadata_mismatch:total:" + parsed.total + "/" + total);
          return;
        }
        if (parsed.pageTotal !== pageTotal) {
          fail("page" + page + ":metadata_mismatch:page_total:" + parsed.pageTotal + "/" + pageTotal);
          return;
        }
        pagesByIndex[page] = parsed.records;
        settled += 1;
        if (settled === pageTotal) {
          finish();
          return;
        }
        pump();
      }, function() {
        inFlight -= 1;
        if (failed || isStale(token, userId)) return;
        fail("request_failed:page" + page);
      });
    }

    function pump() {
      while (!failed && inFlight < concurrency && nextPage <= pageTotal) {
        var page = nextPage;
        nextPage += 1;
        inFlight += 1;
        requestPage(page);
      }
    }

    function startPool() {
      if (pageTotal > MAX_PAGES) {
        fail("page_total_too_large:" + pageTotal);
        return;
      }
      nextPage = 2;
      inFlight = 0;
      pump();
    }

    opts.fetchRecords(userId, 1, function(response) {
      if (isStale(token, userId) || failed || pageOneHandled) return;
      pageOneHandled = true;
      var parsed = parseSportListPage(response && response.data);
      if (!parsed.ok) {
        fail("page1:" + parsed.reason);
        return;
      }
      pagesByIndex[1] = parsed.records;
      total = parsed.total;
      pageTotal = parsed.pageTotal;
      settled = 1;
      if (pageTotal <= 1) {
        finish();
        return;
      }
      startPool();
    }, function() {
      if (isStale(token, userId)) return;
      fail("request_failed:page1");
    });

    return token;
  }

  // 切换月份范围：只改选择并就地重算，绝不重新请求分页。
  // - 已 ready：立刻用缓存 dailyMap 重算并 emit；
  // - loading：记住最新选择，等本次加载完成后按最新选择渲染；
  // - guest / error：更新选择并 emit 当前状态（标题随之更新）。
  function setMonths(next) {
    monthsBack = normalizeMonths(next, monthsBack);
    emit();
    return monthsBack;
  }

  function clear() {
    seq += 1;
    settle("guest", "");
    emit();
  }

  return {
    load: load,
    setMonths: setMonths,
    clear: clear,
    getMonths: function() { return monthsBack; },
    getStatus: function() { return phase; },
    getDailyMap: function() { return dailyMap; },
    getSeq: function() { return seq; }
  };
}

module.exports = {
  RANGE_OPTIONS: RANGE_OPTIONS,
  DEFAULT_RANGE_MONTHS: DEFAULT_RANGE_MONTHS,
  DAYS_PER_WEEK: DAYS_PER_WEEK,
  PAGE_CONCURRENCY: PAGE_CONCURRENCY,
  MAX_PAGES: MAX_PAGES,
  EXCLUDED_STATES: EXCLUDED_STATES,
  MIN_MONTH_LABEL_GAP: MIN_MONTH_LABEL_GAP,
  HEATMAP_VIEWPORT_RPX: HEATMAP_VIEWPORT_RPX,
  HEATMAP_WEEKDAY_COLUMN_RPX: HEATMAP_WEEKDAY_COLUMN_RPX,
  HEATMAP_WEEKDAY_MARGIN_RPX: HEATMAP_WEEKDAY_MARGIN_RPX,
  HEATMAP_MIN_CELL: HEATMAP_MIN_CELL,
  HEATMAP_MAX_CELL: HEATMAP_MAX_CELL,
  HEATMAP_GAP: HEATMAP_GAP,
  HEATMAP_LABEL_RESERVE_RPX: HEATMAP_LABEL_RESERVE_RPX,
  HEATMAP_MONTH_AXIS_HEIGHT: HEATMAP_MONTH_AXIS_HEIGHT,
  pad2: pad2,
  toDateKey: toDateKey,
  startOfDay: startOfDay,
  daysInMonth: daysInMonth,
  addDays: addDays,
  dayDiff: dayDiff,
  addMonthsClamped: addMonthsClamped,
  normalizeMonths: normalizeMonths,
  computeRangeStart: computeRangeStart,
  isValidDateKey: isValidDateKey,
  isSuccessFlag: isSuccessFlag,
  readEntryKm: readEntryKm,
  readCount: readCount,
  levelForDistance: levelForDistance,
  parseSportListPage: parseSportListPage,
  aggregateSportRecords: aggregateSportRecords,
  mondayOf: mondayOf,
  buildHeatmapWeeks: buildHeatmapWeeks,
  monthDaysInRange: monthDaysInRange,
  buildMonthLabels: buildMonthLabels,
  countCheckinDays: countCheckinDays,
  buildRecentHeatmap: buildRecentHeatmap,
  computeHeatmapLayout: computeHeatmapLayout,
  rpxToPx: rpxToPx,
  createHeatmapController: createHeatmapController
};

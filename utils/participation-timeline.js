// 参与记录：只使用接口提供的活动日期，不推断完成状态或个人跑量。
function dateParts(value) {
  if (typeof value !== "string") return null;
  var match = value.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?=$|[T\s])/);
  if (!match) return null;
  var year = Number(match[1]);
  var month = Number(match[2]);
  var day = Number(match[3]);
  var leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  var days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]) return null;
  return { year: year, month: month, day: day, order: year * 10000 + month * 100 + day };
}

function pad2(value) {
  return value < 10 ? "0" + value : String(value);
}

function hasId(item) {
  return item.id !== undefined && item.id !== null && String(item.id) !== "";
}

function mergeParticipationRecords(previous, incoming) {
  var records = [];
  var positions = Object.create(null);
  (previous || []).concat(incoming || []).forEach(function(item) {
    if (!item || typeof item !== "object" || Array.isArray(item)) return;
    var copy = Object.assign({}, item);
    if (hasId(item)) {
      var key = "$" + String(item.id);
      if (positions[key] !== undefined) {
        records[positions[key]] = copy;
        return;
      }
      positions[key] = records.length;
    }
    records.push(copy);
  });
  return records;
}

function createParticipationView(challengeList, runList, filter, limit) {
  var selected = filter === "challenge" || filter === "run" ? filter : "all";
  var items = [];
  function append(list, source, type) {
    mergeParticipationRecords([], Array.isArray(list) ? list : []).forEach(function(item, index) {
      var date = dateParts(item.start_timestr);
      items.push({
        key: source + ":" + (hasId(item) ? String(item.id) : "missing-" + index),
        id: item.id,
        type: type,
        title: typeof item.acty_name === "string" && item.acty_name.trim() ? item.acty_name.trim() : "未命名" + type,
        cover: typeof item.acty_img === "string" ? item.acty_img : "",
        dateText: date ? date.year + "." + pad2(date.month) + "." + pad2(date.day) : "时间未提供",
        hasDate: !!date,
        monthKey: date ? date.year + "-" + pad2(date.month) : "undated",
        monthLabel: date ? date.year + "年" + date.month + "月" : "日期未提供",
        dateOrder: date ? date.order : -1,
        originalOrder: items.length
      });
    });
  }
  if (selected !== "run") append(challengeList, "challenge", "挑战");
  if (selected !== "challenge") append(runList, "run", "团跑");
  items.sort(function(a, b) {
    return b.dateOrder - a.dateOrder || a.originalOrder - b.originalOrder;
  });
  var count = items.length;
  var max = limit === undefined || limit === null ? count : Number(limit);
  if (!isFinite(max) || max < 0) max = count;
  items = items.slice(0, Math.floor(max));
  var groups = [];
  items.forEach(function(item) {
    var group = groups[groups.length - 1];
    if (!group || group.key !== item.monthKey) {
      group = { key: item.monthKey, label: item.monthLabel, items: [] };
      groups.push(group);
    }
    group.items.push({ key: item.key, id: item.id, type: item.type, title: item.title, cover: item.cover, dateText: item.dateText, hasDate: item.hasDate });
  });
  return { groups: groups, filteredCount: count, shownCount: items.length, hasLocalMore: count > items.length };
}

function readTotal(payload) {
  var raw = payload.total;
  if (raw === undefined || raw === null || raw === "" || typeof raw === "boolean") return null;
  var value = Number(raw);
  return isFinite(value) && value >= 0 && Math.floor(value) === value ? value : null;
}

// 两个源分别分页；只有成功收到新记录后才前进页码。失败保留列表与待重试页。
function createParticipationController(options) {
  options = options || {};
  var generation = 0;
  var userId = 0;
  var disposed = false;
  var sources;
  function emptySource() {
    return { records: [], total: 0, countKnown: false, nextPage: 1, hasMore: false, status: "ready", pending: false };
  }
  function reset() {
    sources = { challenge: emptySource(), run: emptySource() };
  }
  reset();
  function snapshot() {
    return {
      activityList: sources.challenge.records.slice(), activityList2: sources.run.records.slice(),
      totalChallenge: sources.challenge.total, totalActy: sources.run.total,
      challengeCountKnown: sources.challenge.countKnown, runCountKnown: sources.run.countKnown,
      challengeStatus: sources.challenge.status, runStatus: sources.run.status,
      challengeHasMore: sources.challenge.hasMore, runHasMore: sources.run.hasMore,
      page: sources.challenge.nextPage, page2: sources.run.nextPage
    };
  }
  function publish() {
    if (!disposed && typeof options.onState === "function") options.onState(snapshot());
  }
  function current(requestGeneration, requestUser) {
    return !disposed && generation === requestGeneration && String(userId) === String(requestUser) &&
      (typeof options.isCurrentUser !== "function" || options.isCurrentUser(requestUser));
  }
  function request(sourceName) {
    var source = sources[sourceName];
    if (!source || source.pending || !source.hasMore || !(Number(userId) > 0) || disposed) return false;
    if (typeof options.isCurrentUser === "function" && !options.isCurrentUser(userId)) return false;
    var requestGeneration = generation;
    var requestUser = userId;
    var page = source.nextPage;
    var done = false;
    source.pending = true;
    source.status = source.records.length ? "loadingMore" : "loading";
    publish();
    function finishError() {
      if (done || !current(requestGeneration, requestUser)) return;
      done = true;
      source.pending = false;
      source.status = "error";
      publish();
    }
    function success(response) {
      if (done || !current(requestGeneration, requestUser)) return;
      var payload = response && response.data;
      if (!payload || (payload.success !== true && payload.success !== 1) || !Array.isArray(payload.data) ||
          payload.data.some(function(item) { return !item || typeof item !== "object" || Array.isArray(item); })) {
        finishError();
        return;
      }
      var total = readTotal(payload);
      var combined = mergeParticipationRecords(source.records, payload.data);
      var known = total !== null || source.countKnown;
      var effectiveTotal = total !== null ? total : source.total;
      // total 与空页/重复页矛盾时不能假称已全部加载，也不能跳过失败页。
      if ((known && effectiveTotal < combined.length) ||
          (!payload.data.length && known && effectiveTotal > combined.length) ||
          (payload.data.length && combined.length === source.records.length)) {
        finishError();
        return;
      }
      done = true;
      source.pending = false;
      source.records = combined;
      source.total = total !== null ? total : source.total;
      source.countKnown = known;
      source.nextPage = page + 1;
      source.hasMore = known ? combined.length < source.total : payload.data.length > 0;
      source.status = "ready";
      publish();
    }
    try {
      if (typeof options.fetchPage !== "function") finishError();
      else options.fetchPage(requestUser, sourceName === "challenge" ? "挑战" : "团跑", page, success, finishError);
    } catch (error) {
      finishError();
    }
    return true;
  }
  return {
    load: function(id) {
      if (disposed) return;
      generation += 1;
      userId = Number(id) > 0 ? id : 0;
      reset();
      if (userId) {
        sources.challenge.hasMore = sources.run.hasMore = true;
        sources.challenge.status = sources.run.status = "loading";
      }
      publish();
      if (userId) {
        request("challenge");
        request("run");
      }
    },
    loadMore: function(sourceName) { return request(sourceName); },
    getState: snapshot,
    dispose: function() { generation += 1; disposed = true; }
  };
}

module.exports = { createParticipationView: createParticipationView, mergeParticipationRecords: mergeParticipationRecords, createParticipationController: createParticipationController };

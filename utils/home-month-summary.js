// utils/home-month-summary.js
// 首页本月跑量与打卡融合纯逻辑与编排控制器

const DEFAULT_DEFAULT_TARGET = 77;

function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

function formatDateKey(date) {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
}

/**
 * 严格验证真实有效的 YYYY-MM-DD 日期，防止如 2026-02-30、2026-13-01 计入
 */
function isValidDateKey(str) {
  if (typeof str !== 'string') return false;
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;
  const y = parseInt(m[1], 10);
  const mon = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  if (mon < 1 || mon > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, mon - 1, d);
  return dt.getFullYear() === y && dt.getMonth() + 1 === mon && dt.getDate() === d;
}

function parseDateKey(str) {
  if (!isValidDateKey(str)) return null;
  const parts = str.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatKm(num) {
  if (num === null || num === undefined || !Number.isFinite(Number(num))) return '—';
  const val = Number(num);
  const fixed = (Math.round(val * 100) / 100).toFixed(2);
  if (fixed.endsWith('.00')) {
    return fixed.slice(0, -3);
  }
  if (fixed.endsWith('0')) {
    return fixed.slice(0, -1);
  }
  return fixed;
}

/**
 * 解析用户当月跑量：严格校验日期、排除非当月、未来日期与负数/非数
 * 同日多次打卡跑量累加，但打卡天数按唯一日期计数
 */
function parseMonthRecords(monthData, year, month, now) {
  const nowDate = now instanceof Date ? now : new Date();
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());
  const curMonthKey = year + '-' + pad2(month);

  const dailyMap = {};
  const dayItems = Array.isArray(monthData) ? monthData : (monthData && monthData[curMonthKey]) || [];

  if (Array.isArray(dayItems)) {
    dayItems.forEach((item) => {
      if (!item) return;
      const dayStr = item.sport_day;
      if (!isValidDateKey(dayStr)) return;

      const m = dayStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      const itemY = parseInt(m[1], 10);
      const itemM = parseInt(m[2], 10);
      const itemD = parseInt(m[3], 10);
      if (itemY !== year || itemM !== month) return;

      const itemDate = new Date(itemY, itemM - 1, itemD);
      if (itemDate > todayStart) return;

      const rawDist = item.sport_total;
      const dist = Number(rawDist);
      if (rawDist === null || rawDist === undefined || rawDist === '' || !Number.isFinite(dist) || dist <= 0) {
        return;
      }

      if (dailyMap[dayStr] === undefined) {
        dailyMap[dayStr] = dist;
      } else {
        dailyMap[dayStr] += dist;
      }
    });
  }

  let totalDist = 0;
  let runDaysCount = 0;

  Object.keys(dailyMap).forEach((dayStr) => {
    const d = dailyMap[dayStr];
    if (d > 0) {
      totalDist += d;
      runDaysCount++;
    }
  });

  totalDist = Math.round(totalDist * 100) / 100;

  return {
    totalDistance: totalDist,
    runDaysCount: runDaysCount,
    dailyMap: dailyMap
  };
}

function buildMonthHeatmap(year, month, dailyMap, now) {
  const nowDate = now instanceof Date ? now : new Date();
  const todayStr = formatDateKey(nowDate);
  const todayStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate());

  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);
  const totalDays = lastDay.getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7;

  const days = [];
  for (let p = 0; p < startWeekday; p++) {
    days.push({ isEmpty: true, key: 'pad_' + p });
  }

  for (let d = 1; d <= totalDays; d++) {
    const curDate = new Date(year, month - 1, d);
    const dateStr = formatDateKey(curDate);
    const isFuture = curDate > todayStart;

    let dist = 0;
    if (dailyMap && dailyMap[dateStr] !== undefined) {
      dist = Number(dailyMap[dateStr]) || 0;
    }

    let level = 0;
    if (dist > 0 && !isFuture) {
      if (dist <= 3) level = 1;
      else if (dist <= 7) level = 2;
      else if (dist <= 12) level = 3;
      else level = 4;
    }

    const item = {
      isEmpty: false,
      dateStr: dateStr,
      year: year,
      month: month,
      day: d,
      distance: dist > 0 ? (Math.round(dist * 100) / 100) : 0,
      displayKm: dist > 0 ? (Math.round(dist * 10) / 10) : null,
      level: isFuture ? -1 : level,
      isFuture: isFuture,
      isToday: dateStr === todayStr,
      dateLabel: month + '月' + d + '日'
    };
    days.push(item);
  }

  return {
    year: year,
    month: month,
    monthLabel: month + '月',
    fullMonthLabel: year + '年' + month + '月',
    days: days
  };
}

function parseDateVal(val) {
  if (typeof val === 'string') {
    const m = val.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) {
      return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    }
  } else if (typeof val === 'number' && val > 1000000000) {
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

/**
 * 判断是否为当前月的普通月度挑战：
 * 1. 排除 V挑战
 * 2. 排除全年/年度/365天挑战
 * 3. 检查起止时间跨度：若起止时间跨月（例如超过35天或分属不同月份），不是单月普通月度挑战
 * 4. 必须落在当前年当前月
 */
function isCurrentMonthChallenge(entry, curYear, curMonth) {
  if (!entry) return false;
  if (entry.acty_type === 'V挑战') return false;

  const name = entry.acty_name || '';
  if (/全年|年度|365天|季|百天/.test(name)) return false;

  // 起止时间跨度检查
  const sDate = parseDateVal(entry.start_time) || parseDateVal(entry.start_timestr);
  const eDate = parseDateVal(entry.end_time) || parseDateVal(entry.end_timestr);

  if (sDate && eDate) {
    const sY = sDate.getFullYear();
    const sM = sDate.getMonth() + 1;
    const eY = eDate.getFullYear();
    const eM = eDate.getMonth() + 1;
    // 起止不在同一个月，或者跨越了不同年，说明非单月挑战
    if (sY !== eY || sM !== eM) {
      return false;
    }
    return sY === curYear && sM === curMonth;
  }

  if (sDate) {
    return sDate.getFullYear() === curYear && (sDate.getMonth() + 1) === curMonth;
  }

  // 名字解析回退
  const ym = name.match(/(\d{4})年\s*(\d{1,2})月/);
  if (ym) {
    return parseInt(ym[1], 10) === curYear && parseInt(ym[2], 10) === curMonth;
  }
  const y2m = name.match(/(\d{2})年\s*(\d{1,2})月/);
  if (y2m) {
    return (2000 + parseInt(y2m[1], 10)) === curYear && parseInt(y2m[2], 10) === curMonth;
  }
  const mOnly = name.match(/(\d{1,2})月/);
  if (mOnly) {
    return parseInt(mOnly[1], 10) === curMonth;
  }
  const zhMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10, '十一': 11, '十二': 12 };
  const mZh = name.match(/([一二三四五六七八九十]+)月/);
  if (mZh && zhMap[mZh[1]]) {
    return zhMap[mZh[1]] === curMonth;
  }

  return false;
}

/**
 * 目标决策：
 * - 只有完整分页成功或无可疑更高候选时才能得出最终目标
 * - 已报名且 target 有效：展示最新 id 的 target
 * - has_clickon=1 但 target 无效：视为严重异常，进入 error，不能当作默认 77
 * - has_clickon 缺失/非法：进入 error，不能当作未报名
 * - 分页/详情失败：进入 error
 * - 完整无报名：返回默认 77
 */
function resolveMonthGoal(params) {
  const {
    candidates = [],
    hasListFailure = false,
    hasDetailFailure = false,
    defaultTarget = DEFAULT_DEFAULT_TARGET
  } = params || {};

  // 1. 先检查所有候选的验证完整性与报名合法性
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    if (c.verified) {
      if (c.hasJoined === null || c.hasJoined === undefined) {
        return {
          status: 'error',
          target: null,
          targetFormatted: '—',
          challenge: null,
          isDefault: false,
          caption: '目标确认失败，点击重试',
          reason: 'invalid_has_clickon'
        };
      }
      if (c.hasJoined === true) {
        // 已报名但 target 非正数或非法
        if (!Number.isFinite(c.target) || c.target <= 0) {
          return {
            status: 'error',
            target: null,
            targetFormatted: '—',
            challenge: null,
            isDefault: false,
            caption: '报名目标异常，点击重试',
            reason: 'invalid_joined_target'
          };
        }
      }
    }
  }

  const verifiedJoined = candidates.filter((c) => {
    return c && c.verified && c.hasJoined === true && Number.isFinite(c.target) && c.target > 0;
  });

  if (verifiedJoined.length > 0) {
    verifiedJoined.sort((a, b) => {
      const idA = Number(a.acty_id || a.id || 0);
      const idB = Number(b.acty_id || b.id || 0);
      return idB - idA;
    });
    const chosen = verifiedJoined[0];
    const highestJoinedId = Number(chosen.acty_id || chosen.id || 0);

    const hasHigherFailed = candidates.some((c) => {
      if (!c.verified && c.detailFailed) {
        const failedId = Number(c.acty_id || c.id || 0);
        return failedId > highestJoinedId;
      }
      return false;
    });

    if (hasHigherFailed || hasListFailure) {
      return {
        status: 'error',
        target: null,
        targetFormatted: '—',
        challenge: null,
        isDefault: false,
        caption: '目标确认失败，点击重试',
        reason: hasHigherFailed ? 'higher_candidate_detail_failed' : 'list_failure_with_candidate'
      };
    }

    return {
      status: 'ready',
      target: chosen.target,
      targetFormatted: formatKm(chosen.target),
      challenge: chosen.detail ? Object.assign({}, chosen.item, chosen.detail) : chosen.item,
      isDefault: false,
      caption: (chosen.item.acty_name || '月度挑战') + ' · 目标 ' + formatKm(chosen.target) + ' 公里'
    };
  }

  // 没有已报名候选，若列表或任何候选详情失败，绝不能默认77
  if (hasListFailure || hasDetailFailure || candidates.some(c => !c.verified)) {
    return {
      status: 'error',
      target: null,
      targetFormatted: '—',
      challenge: null,
      isDefault: false,
      caption: '目标确认失败，点击重试',
      reason: hasListFailure ? 'list_fetch_failed' : 'detail_fetch_failed'
    };
  }

  // 完整验证完毕，确认没有报名
  return {
    status: 'ready',
    target: defaultTarget,
    targetFormatted: formatKm(defaultTarget),
    challenge: null,
    isDefault: true,
    caption: '本月默认参考目标 · ' + formatKm(defaultTarget) + ' 公里'
  };
}

function calculateProgress(distance, target) {
  if (distance === null || distance === undefined || target === null || target === undefined) {
    return { percent: '—', progressWidth: '0%' };
  }
  const distNum = Number(distance);
  const targetNum = Number(target);
  if (!Number.isFinite(distNum) || !Number.isFinite(targetNum) || targetNum <= 0) {
    return { percent: '—', progressWidth: '0%' };
  }
  const ratio = (distNum / targetNum) * 100;
  const percent = Math.round(ratio);
  const widthNum = Math.max(0, Math.min(100, Math.round(ratio)));
  return {
    percent: percent,
    progressWidth: widthNum + '%'
  };
}

/**
 * 确定分页总页数：结合 page_total, total, page_size
 */
function resolveTotalPages(resData) {
  if (!resData) return null;
  const rawPt = resData.page_total;
  if (rawPt !== null && rawPt !== undefined && rawPt !== "") {
    const ptNum = Number(rawPt);
    if (Number.isInteger(ptNum) && ptNum > 0) {
      return ptNum;
    }
  }

  const rawTotal = resData.total;
  const rawPageSize = resData.page_size;
  if (rawTotal !== null && rawTotal !== undefined && rawTotal !== "") {
    const totalNum = Number(rawTotal);
    const sizeNum = rawPageSize ? Number(rawPageSize) : 15;
    if (Number.isInteger(totalNum) && totalNum >= 0 && Number.isInteger(sizeNum) && sizeNum > 0) {
      return totalNum === 0 ? 0 : Math.ceil(totalNum / sizeNum);
    }
  }

  return null;
}

/**
 * 挑战全量分页串行拉取与详情验证控制器
 * 每次 load 时清空详情缓存，保证用户与请求完全隔离
 */
function createMonthChallengeCoordinator(options) {
  const {
    request,
    now = () => new Date(),
    defaultTarget = DEFAULT_DEFAULT_TARGET
  } = options || {};

  let currentUserId = null;
  let currentSeq = 0;

  function load(userId, callbacks) {
    const { onState, onCandidateDetail } = callbacks || {};
    const seq = ++currentSeq;
    currentUserId = userId;

    // 用户级详情缓存仅在当前 load 会话内有效
    const sessionDetails = {};

    if (!(userId > 0)) {
      if (onState) {
        onState({
          seq: seq,
          status: 'guest',
          target: defaultTarget,
          targetFormatted: formatKm(defaultTarget),
          challenge: null,
          isDefault: true,
          caption: '登录后同步挑战目标 · 默认参考目标 ' + formatKm(defaultTarget) + ' 公里'
        });
      }
      return;
    }

    if (onState) {
      onState({
        seq: seq,
        status: 'loading',
        target: null,
        targetFormatted: '—',
        challenge: null,
        isDefault: false,
        caption: '正在同步挑战目标…'
      });
    }

    const nowDate = typeof now === 'function' ? now() : new Date();
    const curYear = nowDate.getFullYear();
    const curMonth = nowDate.getMonth() + 1;

    let page = 1;
    let totalPages = 1;
    let candidates = [];
    let hasListFailure = false;
    let hasDetailFailure = false;

    function fetchNextPage() {
      if (seq !== currentSeq || userId !== currentUserId) return;

      const pageToFetch = page;
      fetchPageWithRetry(pageToFetch, 0, (resData) => {
        if (seq !== currentSeq || userId !== currentUserId) return;
        if (pageToFetch === 1) {
          const resolved = resolveTotalPages(resData);
          if (resolved === null) {
            hasListFailure = true;
            finalizeGoal();
            return;
          }
          totalPages = resolved;
        }

        const items = Array.isArray(resData.data) ? resData.data : [];
        items.forEach((item) => {
          if (isCurrentMonthChallenge(item, curYear, curMonth)) {
            candidates.push({
              item: item,
              acty_id: item.acty_id || item.id,
              verified: false,
              hasJoined: null,
              target: null,
              detail: null,
              detailFailed: false
            });
          }
        });

        if (page < totalPages) {
          page++;
          fetchNextPage();
        } else {
          // 列表完整拉取成功，开始验证本月候选详情
          verifyCandidates();
        }
      }, (err) => {
        if (seq !== currentSeq || userId !== currentUserId) return;
        hasListFailure = true;
        finalizeGoal();
      });
    }

    function fetchPageWithRetry(pageNum, retryCount, onSuccess, onError) {
      if (seq !== currentSeq || userId !== currentUserId) return;
      const data = {
        userId: userId,
        type: '挑战',
        page: pageNum
      };
      request('acty/getchallengeacty', 'POST', data, '', (res) => {
        if (seq !== currentSeq || userId !== currentUserId) return;
        const resData = res && res.data;
        if (resData && resData.success && Array.isArray(resData.data)) {
          onSuccess(resData);
        } else {
          if (retryCount < 1) {
            fetchPageWithRetry(pageNum, retryCount + 1, onSuccess, onError);
          } else {
            onError(new Error('Page ' + pageNum + ' failed'));
          }
        }
      }, (err) => {
        if (seq !== currentSeq || userId !== currentUserId) return;
        if (retryCount < 1) {
          fetchPageWithRetry(pageNum, retryCount + 1, onSuccess, onError);
        } else {
          onError(err || new Error('Page ' + pageNum + ' network error'));
        }
      });
    }

    function verifyCandidates() {
      if (seq !== currentSeq || userId !== currentUserId) return;
      if (candidates.length === 0) {
        finalizeGoal();
        return;
      }

      // 按 ID 降序逐个串行验证
      candidates.sort((a, b) => Number(b.acty_id || 0) - Number(a.acty_id || 0));

      let candidateIndex = 0;
      function verifyNextCandidate() {
        if (seq !== currentSeq || userId !== currentUserId) return;
        if (candidateIndex >= candidates.length) {
          finalizeGoal();
          return;
        }

        const candidate = candidates[candidateIndex];
        const actyId = candidate.acty_id;

        if (sessionDetails[actyId]) {
          applyDetail(candidate, sessionDetails[actyId]);
          candidateIndex++;
          verifyNextCandidate();
          return;
        }

        fetchDetailWithRetry(actyId, 0, (detail) => {
          if (seq !== currentSeq || userId !== currentUserId) return;
          sessionDetails[actyId] = detail;
          applyDetail(candidate, detail);
          if (onCandidateDetail) {
            onCandidateDetail(candidate);
          }
          candidateIndex++;
          verifyNextCandidate();
        }, (err) => {
          if (seq !== currentSeq || userId !== currentUserId) return;
          candidate.detailFailed = true;
          hasDetailFailure = true;
          candidateIndex++;
          verifyNextCandidate();
        });
      }

      verifyNextCandidate();
    }

    function fetchDetailWithRetry(actyId, retryCount, onSuccess, onError) {
      if (seq !== currentSeq || userId !== currentUserId) return;
      request('acty/getdetail', 'POST', { actyId: actyId, userId: userId }, '', (res) => {
        if (seq !== currentSeq || userId !== currentUserId) return;
        const detail = res && res.data && res.data.success && res.data.data;
        if (detail) {
          onSuccess(detail);
        } else {
          if (retryCount < 1) {
            fetchDetailWithRetry(actyId, retryCount + 1, onSuccess, onError);
          } else {
            onError(new Error('Detail ' + actyId + ' failed'));
          }
        }
      }, (err) => {
        if (seq !== currentSeq || userId !== currentUserId) return;
        if (retryCount < 1) {
          fetchDetailWithRetry(actyId, retryCount + 1, onSuccess, onError);
        } else {
          onError(err || new Error('Detail ' + actyId + ' network error'));
        }
      });
    }

    function applyDetail(candidate, detail) {
      candidate.verified = true;
      candidate.detail = detail;
      const rawClick = detail.has_clickon;
      if (rawClick === undefined || rawClick === null || rawClick === "" || typeof rawClick === "boolean") {
        candidate.hasJoined = null;
      } else {
        const rawJoined = Number(rawClick);
        if (rawJoined === 1) candidate.hasJoined = true;
        else if (rawJoined === 0) candidate.hasJoined = false;
        else candidate.hasJoined = null;
      }
      const targetNum = Number(detail.target);
      candidate.target = Number.isFinite(targetNum) && targetNum > 0 ? targetNum : null;
    }

    function finalizeGoal() {
      if (seq !== currentSeq || userId !== currentUserId) return;
      const outcome = resolveMonthGoal({
        candidates: candidates,
        hasListFailure: hasListFailure,
        hasDetailFailure: hasDetailFailure,
        defaultTarget: defaultTarget
      });
      if (onState) {
        onState(Object.assign({ seq: seq }, outcome));
      }
    }

    fetchNextPage();
  }

  function getCurrentSeq() {
    return currentSeq;
  }

  return {
    load: load,
    getCurrentSeq: getCurrentSeq
  };
}

/**
 * 解析用户当周跑量：取当前自然周（周一至周日）所有有效合法打卡
 * 严格校验日期、排除未来日期与负数/非数
 * 同日多次打卡跑量累加，但打卡天数按唯一日期计数
 */
function parseWeekRecords(monthData, now) {
  const nowDate = now instanceof Date ? now : new Date();
  const y = nowDate.getFullYear();
  const m = nowDate.getMonth();
  const d = nowDate.getDate();
  const todayStart = new Date(y, m, d);
  const dayOfWeek = todayStart.getDay();
  const diffToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(y, m, d - diffToMonday);

  const weekDaysSet = new Set();
  for (let i = 0; i < 7; i++) {
    const curDt = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    weekDaysSet.add(formatDateKey(curDt));
  }

  let allItems = [];
  if (Array.isArray(monthData)) {
    allItems = monthData;
  } else if (monthData && typeof monthData === "object") {
    Object.keys(monthData).forEach((k) => {
      if (Array.isArray(monthData[k])) {
        allItems = allItems.concat(monthData[k]);
      }
    });
  }

  const dailyMap = {};
  allItems.forEach((item) => {
    if (!item) return;
    const dayStr = item.sport_day;
    if (!isValidDateKey(dayStr)) return;
    if (!weekDaysSet.has(dayStr)) return;

    const parts = dayStr.split("-").map(Number);
    const itemDate = new Date(parts[0], parts[1] - 1, parts[2]);
    if (itemDate > todayStart) return;

    const rawDist = item.sport_total;
    const dist = Number(rawDist);
    if (rawDist === null || rawDist === undefined || rawDist === "" || !Number.isFinite(dist) || dist <= 0) {
      return;
    }

    dailyMap[dayStr] = (dailyMap[dayStr] || 0) + dist;
  });

  let totalDist = 0;
  let runDaysCount = 0;
  Object.keys(dailyMap).forEach((dayStr) => {
    const dist = dailyMap[dayStr];
    if (dist > 0) {
      totalDist += dist;
      runDaysCount++;
    }
  });

  totalDist = Math.round(totalDist * 100) / 100;
  return {
    totalDistance: totalDist,
    runDaysCount: runDaysCount,
    dailyMap: dailyMap
  };
}

module.exports = {
  DEFAULT_DEFAULT_TARGET,
  pad2,
  formatDateKey,
  isValidDateKey,
  parseDateKey,
  formatKm,
  parseMonthRecords,
  parseWeekRecords,
  buildMonthHeatmap,
  isCurrentMonthChallenge,
  resolveMonthGoal,
  calculateProgress,
  resolveTotalPages,
  createMonthChallengeCoordinator
};


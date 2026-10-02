// 参与记录 · 方案B 时间列表
// 数据排序/去重/分组由 utils/participation-timeline.js 的
// createParticipationView 统一负责，组件只维护筛选、可见条数与交互。
var timeline = require('../../utils/participation-timeline.js');
var createParticipationView = timeline.createParticipationView;

var PAGE_STEP = 8;
var EMPTY_VIEW = { groups: [], filteredCount: 0, shownCount: 0, hasLocalMore: false };

Component({
  options: {
    multipleSlots: true
  },
  properties: {
    totalChallenge: {
      type: Number,
      value: 0,
      observer: '_refresh'
    },
    totalActy: {
      type: Number,
      value: 0,
      observer: '_refresh'
    },
    activityList: {
      type: Array,
      value: [],
      observer: '_refresh'
    },
    activityList2: {
      type: Array,
      value: [],
      observer: '_refresh'
    },
    challengeStatus: {
      type: String,
      value: 'loading',
      observer: '_refresh'
    },
    runStatus: {
      type: String,
      value: 'loading',
      observer: '_refresh'
    },
    challengeHasMore: {
      type: Boolean,
      value: false,
      observer: '_refresh'
    },
    runHasMore: {
      type: Boolean,
      value: false,
      observer: '_refresh'
    },
    challengeCountKnown: {
      type: Boolean,
      value: false,
      observer: '_refresh'
    },
    runCountKnown: {
      type: Boolean,
      value: false,
      observer: '_refresh'
    }
  },
  data: {
    activeFilter: 'all',
    visibleLimit: PAGE_STEP,
    view: EMPTY_VIEW,
    failedCovers: {},
    challengeCountText: '\u2014',
    runCountText: '\u2014',
    showSkeleton: true,
    challengeError: false,
    runError: false,
    showEmpty: false,
    emptyTitle: '',
    emptyDesc: '',
    emptyShowChallenge: false,
    emptyShowRun: false,
    showLoadMore: false,
    moreDisabled: false,
    moreText: '\u52a0\u8f7d\u66f4\u591a'
  },
  lifetimes: {
    attached: function() {
      this._refresh();
    }
  },
  methods: {
    _isBusy: function(status) {
      return status === 'loading' || status === 'loadingMore';
    },
    _refresh: function() {
      var d = this.data;
      var view;
      try {
        view = createParticipationView(d.activityList || [], d.activityList2 || [], d.activeFilter, d.visibleLimit);
      } catch (e) {
        if (typeof console !== 'undefined' && console.warn) {
          console.warn('[all-activity] createParticipationView failed:', e);
        }
        view = EMPTY_VIEW;
      }
      if (!view || !view.groups) {
        view = EMPTY_VIEW;
      }

      var wantChallenge = d.activeFilter !== 'run';
      var wantRun = d.activeFilter !== 'challenge';

      var challengeLoading = wantChallenge && d.challengeStatus === 'loading';
      var runLoading = wantRun && d.runStatus === 'loading';
      var challengeError = wantChallenge && d.challengeStatus === 'error';
      var runError = wantRun && d.runStatus === 'error';
      var anyBusy = (wantChallenge && this._isBusy(d.challengeStatus)) ||
        (wantRun && this._isBusy(d.runStatus));
      var anyLoadingMore = (wantChallenge && d.challengeStatus === 'loadingMore') ||
        (wantRun && d.runStatus === 'loadingMore');

      var hasRows = view.groups.length > 0;
      var showSkeleton = !hasRows && (challengeLoading || runLoading);
      var showEmpty = !hasRows && !showSkeleton && !challengeError && !runError && !anyBusy;

      var emptyTitle = '';
      var emptyDesc = '';
      var emptyShowChallenge = false;
      var emptyShowRun = false;
      if (showEmpty) {
        if (d.activeFilter === 'challenge') {
          emptyTitle = '\u6682\u65e0\u6311\u6218\u8bb0\u5f55';
          emptyDesc = '\u53c2\u52a0\u6311\u6218\u540e\uff0c\u8bb0\u5f55\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc';
          emptyShowChallenge = true;
        } else if (d.activeFilter === 'run') {
          emptyTitle = '\u6682\u65e0\u56e2\u8dd1\u8bb0\u5f55';
          emptyDesc = '\u53c2\u52a0\u56e2\u8dd1\u540e\uff0c\u8bb0\u5f55\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc';
          emptyShowRun = true;
        } else {
          emptyTitle = '\u6682\u65e0\u53c2\u4e0e\u8bb0\u5f55';
          emptyDesc = '\u53bb\u53c2\u52a0\u4e00\u6b21\u6311\u6218\u6216\u56e2\u8dd1\u5427';
          emptyShowChallenge = true;
          emptyShowRun = true;
        }
      }

      var showLoadMore = view.hasLocalMore ||
        (wantChallenge && d.challengeHasMore && !challengeError) ||
        (wantRun && d.runHasMore && !runError);
      var moreDisabled = anyBusy;

      this.setData({
        view: view,
        challengeCountText: d.challengeCountKnown ? String(d.totalChallenge) : '\u2014',
        runCountText: d.runCountKnown ? String(d.totalActy) : '\u2014',
        showSkeleton: showSkeleton,
        challengeError: challengeError,
        runError: runError,
        showEmpty: showEmpty,
        emptyTitle: emptyTitle,
        emptyDesc: emptyDesc,
        emptyShowChallenge: emptyShowChallenge,
        emptyShowRun: emptyShowRun,
        showLoadMore: showLoadMore,
        moreDisabled: moreDisabled,
        moreText: anyLoadingMore ? '\u6b63\u5728\u52a0\u8f7d\u2026' : '\u52a0\u8f7d\u66f4\u591a'
      });
    },
    onFilterTap: function(e) {
      var filter = e.currentTarget.dataset.filter;
      if (filter !== 'all' && filter !== 'challenge' && filter !== 'run') {
        return;
      }
      if (filter === this.data.activeFilter) {
        return;
      }
      this.setData({
        activeFilter: filter,
        visibleLimit: PAGE_STEP
      });
      this._refresh();
    },
    onLoadMore: function() {
      var d = this.data;
      var wantChallenge = d.activeFilter !== 'run';
      var wantRun = d.activeFilter !== 'challenge';
      // 当前分类涉及的任一源在加载中时，不展开也不重复请求。
      var anyBusy = (wantChallenge && this._isBusy(d.challengeStatus)) ||
        (wantRun && this._isBusy(d.runStatus));
      if (anyBusy) {
        return;
      }
      // 先展开本地已加载的数据，本地展示完再请求下一页。
      if (d.view.hasLocalMore) {
        this.setData({ visibleLimit: d.visibleLimit + PAGE_STEP });
        this._refresh();
        return;
      }
      // 远程请求的同时预扩可见上限，新页到达后立即多展示一屏。
      this.setData({ visibleLimit: d.visibleLimit + PAGE_STEP });
      if (wantChallenge && d.challengeHasMore && !this._isBusy(d.challengeStatus)) {
        this.triggerEvent('parentEvent');
      }
      if (wantRun && d.runHasMore && !this._isBusy(d.runStatus)) {
        this.triggerEvent('parentEvent2');
      }
    },
    onRetryChallenge: function() {
      this.triggerEvent('parentEvent', { retry: true });
    },
    onRetryRun: function() {
      this.triggerEvent('parentEvent2', { retry: true });
    },
    getInfor: function(e) {
      var id = e.currentTarget.dataset.id;
      var type = e.currentTarget.dataset.type;
      if (id === undefined || id === null || String(id) === '') {
        return;
      }
      this.triggerEvent('parentEvent3', { id: id, type: type });
    },
    onCoverError: function(e) {
      var key = e.currentTarget.dataset.key;
      if (!key || this.data.failedCovers[key]) {
        return;
      }
      var failed = {};
      for (var k in this.data.failedCovers) {
        if (Object.prototype.hasOwnProperty.call(this.data.failedCovers, k)) {
          failed[k] = this.data.failedCovers[k];
        }
      }
      failed[key] = true;
      this.setData({ failedCovers: failed });
    },
    toChallengeTab: function() {
      wx.switchTab({
        url: '/pages/challenge/challenge',
        fail: function() {
          wx.navigateTo({ url: '/pages/challenge/challenge' });
        }
      });
    },
    toActivityTab: function() {
      wx.switchTab({
        url: '/pages/activity/activity',
        fail: function() {
          wx.navigateTo({ url: '/pages/activity/activity' });
        }
      });
    }
  }
});

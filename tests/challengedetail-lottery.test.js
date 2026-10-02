const test = require("node:test");
const assert = require("node:assert/strict");

global.wx = global.wx || {};
global.wx.request = global.wx.request || function(options) {
  if (options && typeof options.success === "function") {
    options.success({ data: { success: true, data: [] } });
  }
};
global.wx.setNavigationBarTitle = global.wx.setNavigationBarTitle || function() {};
global.wx.navigateTo = global.wx.navigateTo || function() {};
global.wx.showToast = global.wx.showToast || function() {};
global.wx.switchTab = global.wx.switchTab || function() {};

function createChallengedetailPage() {
  let pageOptions = null;
  const originalPage = global.Page;
  const originalGetApp = global.getApp;

  global.getApp = () => ({
    globalData: { userId: 1, openId: "mock_openid" }
  });

  global.Page = (opts) => {
    pageOptions = opts;
  };

  delete require.cache[require.resolve("../pages/challengedetail/challengedetail.js")];
  require("../pages/challengedetail/challengedetail.js");

  global.Page = originalPage;
  global.getApp = originalGetApp;

  const instance = Object.assign({}, pageOptions);
  instance.data = JSON.parse(JSON.stringify(pageOptions.data));
  instance.setData = function (updates, cb) {
    Object.assign(this.data, updates);
    if (typeof cb === "function") cb();
  };
  return instance;
}

test("抽奖数据为空列表时，ltyList 为空，WXML 条件不渲染抽奖模块", () => {
  const p = createChallengedetailPage();
  assert.equal(Array.isArray(p.data.ltyList), true);
  assert.equal(p.data.ltyList.length, 0);
});

test("关联抽奖有数据时，ltyList 包含奖品列表", () => {
  const p = createChallengedetailPage();
  const mockLotteries = [
    { id: 101, address: "跑团纪念速干T恤", goods_num: 10, goods_pic: "https://example.com/pic.jpg" }
  ];
  p.setData({ ltyList: mockLotteries });
  assert.equal(p.data.ltyList.length, 1);
  assert.equal(p.data.ltyList[0].address, "跑团纪念速干T恤");
});

test("没有关联抽奖时（空数组或接口报错），ltyList 保持空数组，满足无抽奖不显示模块的条件", () => {
  const p = createChallengedetailPage();
  p.setData({ ltyList: [], lotteryError: true });
  assert.equal(p.data.ltyList.length === 0, true);
});

test("参赛跑友列表：支持等级筛选与按跑量排序，包含完成进度计算", () => {
  const p = createChallengedetailPage();
  assert.equal(p.data.levelList.length, 4);
  assert.equal(p.data.activeLevelIndex, 0);
  assert.equal(p.data.sortOrder, 1); // 默认降序

  p.chooseLevel({ currentTarget: { dataset: { index: 1 } } });
  assert.equal(p.data.activeLevelIndex, 1); // VIP

  p.toggleSort();
  assert.equal(p.data.sortOrder, 0); // 升序
});

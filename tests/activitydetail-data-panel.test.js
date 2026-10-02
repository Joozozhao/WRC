const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const pagePath = path.resolve(__dirname, '../pages/activitydetail/activitydetail.js')
const source = fs.readFileSync(pagePath, 'utf8')

function createPage(userId = 42, deviceApis = {}) {
  let config
  const requests = []
  const navigation = []
  const toasts = []
  let refreshStops = 0
  const app = { globalData: { userId } }
  vm.runInNewContext(source, {
    Page: options => { config = options },
    getApp: () => app,
    require: name => {
      if (name === '../../utils/util.js') {
        return {
          request: (url, method, data, message, success, fail) => {
            requests.push({ url, method, data, success, fail })
          },
          dislodgeZero: value => value,
          showLogin: () => {}
        }
      }
      return require(path.resolve(path.dirname(pagePath), name))
    },
    wx: Object.assign({
      setNavigationBarTitle: () => {},
      navigateTo: options => navigation.push(options.url),
      showToast: options => toasts.push(options.title),
      stopPullDownRefresh: () => { refreshStops += 1 }
    }, deviceApis)
  }, { filename: pagePath })
  const page = Object.assign({}, config, {
    data: JSON.parse(JSON.stringify(config.data)),
    setData(patch) { Object.assign(this.data, patch) }
  })
  const calls = url => requests.filter(request => request.url === url)
  const last = url => calls(url).at(-1)
  return { page, requests, calls, last, navigation, toasts, refreshStops: () => refreshStops }
}

function succeed(request, data) {
  request.success({ data: { success: true, data } })
}

function detail(overrides = {}) {
  return Object.assign({
    acty_name: '周末团跑', acty_state: 1, distance: 0,
    start_timestr: '2026-10-02 19:00:00', end_timestr: '2026-10-02 21:00:00',
    has_clickon: 0, has_sign: 0, has_name: '跑友', has_mobile: '', level: 1
  }, overrides)
}

function records(start = 1, count = 15) {
  return Array.from({ length: count }, (_, index) => ({
    user_id: start + index, distance: index === 0 ? 0 : 5.25, level: 'VIP'
  }))
}

const panelEvent = panel => ({ currentTarget: { dataset: { panel } } })

test('设备安全间距优先胶囊底部+20px；字段无效、API缺失或异常时安全回退', () => {
  const cases = [
    { apis: {}, expected: 96 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 59 }), getMenuButtonBoundingClientRect: () => ({ bottom: 97 }) }, expected: 117 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 44 }), getMenuButtonBoundingClientRect: () => ({ top: 50, height: 32 }) }, expected: 102 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 59 }), getMenuButtonBoundingClientRect: () => ({ bottom: 0, top: 65, height: 32 }) }, expected: 117 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 24 }) }, expected: 82 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 0 }) }, expected: 58 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 59 }), getMenuButtonBoundingClientRect: () => ({ bottom: NaN, top: -1, height: 32 }) }, expected: 117 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: Infinity }), getMenuButtonBoundingClientRect: () => ({ bottom: '97', top: 65, height: 0 }) }, expected: 96 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: null }), getMenuButtonBoundingClientRect: () => null }, expected: 96 },
    { apis: { getSystemInfoSync: () => { throw new Error('unavailable') }, getMenuButtonBoundingClientRect: () => ({ bottom: 90 }) }, expected: 110 },
    { apis: { getSystemInfoSync: () => ({ statusBarHeight: 44 }), getMenuButtonBoundingClientRect: () => { throw new Error('unavailable') } }, expected: 102 }
  ]
  for (const { apis, expected } of cases) {
    const { page, calls } = createPage(42, apis)
    assert.equal(page.data.contentTop, 96)
    page.onLoad({ id: '88' })
    assert.equal(page.data.contentTop, expected)
    assert.equal(calls('acty/getdetail').length, 1, '设备适配不得阻断原有加载')
    assert.equal(calls('acty/getclickuser').length, 1)
  }
})

test('onLoad 初始化报名资格、详情、榜单；真实零和空成员列表均成功加载', () => {
  const { page, last, calls, navigation } = createPage()
  assert.equal(page.data.dataPanel, 'results')
  for (const field of ['memberError', 'statsError', 'logError', 'actyMemberError']) {
    assert.equal(page.data[field], false)
  }
  page.onLoad({ id: '88' })
  for (const url of ['acty/getclickuser', 'acty/getdetail', 'acty/getsport', 'acty/getactyuser', 'acty/getsportlog']) {
    assert.equal(calls(url).length, 1, url)
  }
  assert.equal(last('acty/getdetail').data.userId, 42)
  assert.equal(last('acty/getclickuser').data.actyId, '88')
  assert.equal(page.data.loading, true)
  assert.equal(page.data.memberLoading, true)
  assert.equal(page.data.statsLoading, true)
  page.signIn()
  assert.equal(navigation.length, 0, '详情未就绪时不能报名')

  succeed(last('acty/getdetail'), detail())
  succeed(last('acty/getsport'), { total: 0, number: 0, user_list: [] })
  succeed(last('acty/getactyuser'), [])
  succeed(last('acty/getclickuser'), [])
  succeed(last('acty/getsportlog'), [])
  assert.equal(page.data.distance, 0)
  assert.equal(page.data.allDistance, 0)
  assert.equal(page.data.allNum, 0)
  assert.equal(page.data.actyIn, 0)
  for (const field of ['statsLoaded', 'memberLoaded', 'logLoaded', 'actyMemberLoaded']) {
    assert.equal(page.data[field], true, field)
  }
  assert.equal(page.data.statsLoading, false)
  assert.equal(page.data.memberLoading, false)
  assert.equal(page.data.logHasMore, false)
  assert.equal(page.data.myRecord, null, '空榜单不能伪造个人成绩')
  page.signIn()
  assert.equal(navigation.length, 1)
  assert.match(navigation[0], /^\.\.\/signin\/signin\?id=88&has_name=跑友&has_mobile=&target=0&acty_type=/)
})

test('切换仅接受 results/members，已获取的数据和正在加载的请求不会重复拉取', () => {
  const { page, requests, last } = createPage()
  page.onLoad({ id: '88' })
  page.switchDataPanel(panelEvent('members'))
  succeed(last('acty/getactyuser'), [{ id: 42, level: '普通' }])
  succeed(last('acty/getsportlog'), records())
  const count = requests.length
  const logList = page.data.logList
  const members = page.data.avastars
  page.switchDataPanel(panelEvent('results'))
  page.switchDataPanel(panelEvent('members'))
  page.switchDataPanel(panelEvent('members'))
  for (const event of [panelEvent('invalid'), panelEvent(0), {}, undefined]) {
    page.switchDataPanel(event)
    assert.equal(page.data.dataPanel, 'members')
  }
  assert.equal(requests.length, count)
  assert.equal(page.data.logList, logList)
  assert.equal(page.data.avastars, members)
  assert.equal(members[0].level, '普通', '原始会员值保持不变')
})

test('触底和按钮只在 results 加载下一页；加载中及不足15行时不重复请求', () => {
  const { page, calls, last } = createPage()
  page.setData({ actyId: '88', myId: 42 })
  page.fetchSportLog(true)
  page.onReachBottom()
  page.loadMoreLogs()
  assert.equal(calls('acty/getsportlog').length, 1)
  succeed(last('acty/getsportlog'), records())
  assert.equal(page.data.logPage, 2)
  assert.equal(page.data.logHasMore, true)
  assert.equal(page.data.logList[0].displayDistance, '0.00')
  assert.equal(page.data.logList[0].level, 'VIP')
  assert.equal(page.data.myRecord, null)

  page.switchDataPanel(panelEvent('members'))
  page.onReachBottom()
  page.loadMoreLogs()
  assert.equal(calls('acty/getsportlog').length, 1)
  page.switchDataPanel(panelEvent('results'))
  page.loadMoreLogs()
  page.onReachBottom()
  assert.equal(calls('acty/getsportlog').length, 2)
  assert.equal(last('acty/getsportlog').data.page, 2)
  succeed(last('acty/getsportlog'), [{ user_id: '42', distance: 0, level: '非会员' }])
  assert.equal(page.data.logList.length, 16)
  assert.equal(page.data.logList[15].rankNum, 16)
  assert.equal(page.data.myRecord.user_id, '42', '后续页仅采用接口里的真实个人记录')
  assert.equal(page.data.myRecord.distance, 0)
  assert.equal(page.data.logHasMore, false)
  page.onReachBottom()
  page.loadMoreLogs()
  assert.equal(calls('acty/getsportlog').length, 2)
})

for (const failure of ['network', 'business', 'missing-data']) {
  test(`成员、统计、参与列表独立识别 ${failure} 失败，并可通过 retryLoad 恢复`, () => {
    const { page, last } = createPage()
    page.onLoad({ id: '88' })
    succeed(last('acty/getdetail'), detail())
    for (const [url, prefix] of [
      ['acty/getactyuser', 'member'], ['acty/getsport', 'stats'], ['acty/getclickuser', 'actyMember']
    ]) {
      const request = last(url)
      if (failure === 'network') request.fail(new Error('offline'))
      else request.success({ data: { success: failure !== 'business', data: null } })
      assert.equal(page.data[`${prefix}Error`], true)
      assert.equal(page.data[`${prefix}Loading`], false)
      assert.equal(page.data[`${prefix}Loaded`], false)
      assert.equal(page.data.loadError, false, '独立数据失败不覆盖活动详情状态')
      assert.equal(page.data.logError, false)
    }
    page.retryLoad()
    assert.equal(page.data.memberError, false)
    assert.equal(page.data.statsError, false)
    assert.equal(page.data.actyMemberError, false)
    succeed(last('acty/getdetail'), detail())
    succeed(last('acty/getactyuser'), [])
    succeed(last('acty/getclickuser'), [])
    succeed(last('acty/getsport'), { total: 0, number: 0 })
    assert.equal(page.data.memberLoaded, true)
    assert.equal(page.data.statsLoaded, true)
    assert.equal(page.data.actyMemberLoaded, true)
  })

  test(`榜单 ${failure} 失败保留已获取成绩；显式重试同一页，无重复与跳页`, () => {
    const { page, last, calls } = createPage()
    page.setData({ actyId: '88' })
    page.fetchSportLog(true)
    succeed(last('acty/getsportlog'), records())
    page.loadMoreLogs()
    const failed = last('acty/getsportlog')
    if (failure === 'network') failed.fail(new Error('offline'))
    else failed.success({ data: { success: failure !== 'business', data: null } })
    assert.equal(page.data.logError, true)
    assert.equal(page.data.logLoading, false)
    assert.equal(page.data.logList.length, 15)
    assert.equal(page.data.logPage, 2)
    page.onReachBottom()
    assert.equal(calls('acty/getsportlog').length, 2, '失败后触底不自动反复重试')
    page.retryLogs()
    page.retryLogs()
    assert.equal(calls('acty/getsportlog').length, 3)
    assert.equal(last('acty/getsportlog').data.page, 2)
    succeed(last('acty/getsportlog'), records(16, 1))
    assert.equal(page.data.logError, false)
    assert.equal(page.data.logList.length, 16)
    assert.equal(page.data.logPage, 3)
    assert.equal(page.data.logHasMore, false)
  })
}

test('统计缺少总距离或人数时可识别失败，不把未知数据当成真实0', () => {
  const { page, last } = createPage()
  for (const data of [{}, { total: 0 }, { number: 0 }]) {
    page.initActyDetail('88')
    succeed(last('acty/getsport'), data)
    assert.equal(page.data.statsError, true)
    assert.equal(page.data.statsLoaded, false)
    assert.equal(page.data.statsLoading, false)
  }
})

test('下拉刷新覆盖旧分页响应、清除旧个人成绩，空榜单仍为成功状态', () => {
  const { page, last, refreshStops } = createPage()
  page.setData({ actyId: '88', myId: 1 })
  page.fetchSportLog(true)
  succeed(last('acty/getsportlog'), records())
  assert.equal(page.data.myRecord.user_id, 1)
  page.loadMoreLogs()
  const oldPage = last('acty/getsportlog')
  page.onPullDownRefresh()
  const refresh = last('acty/getsportlog')
  assert.equal(refresh.data.page, 1)
  assert.equal(page.data.myRecord, null)
  succeed(refresh, [])
  succeed(oldPage, records(16))
  assert.equal(page.data.logList.length, 0)
  assert.equal(page.data.logPage, 2)
  assert.equal(page.data.logHasMore, false)
  assert.equal(page.data.myRecord, null)
  assert.equal(page.data.logError, false)
  assert.equal(refreshStops(), 1)
})

test('成员 tab 下拉刷新详情、成员、统计、聚跑和相册，并在榜单刷新完成后结束刷新', () => {
  const { page, calls, last, requests, refreshStops } = createPage()
  page.onLoad({ id: '88' })
  succeed(last('acty/getdetail'), detail())
  succeed(last('acty/getactyuser'), [{ id: 1, level: 'VIP' }])
  succeed(last('acty/getsport'), { total: 5, number: 1 })
  succeed(last('acty/getclickuser'), [{ id: 1 }])
  succeed(last('acty/getactyimgs'), [])
  succeed(last('acty/getsportlog'), records())
  page.switchDataPanel(panelEvent('members'))
  const beforeRefresh = requests.length

  page.onPullDownRefresh()
  assert.equal(page.data.dataPanel, 'members', '刷新保留当前 tab')
  for (const url of ['acty/getdetail', 'acty/getactyuser', 'acty/getsport', 'acty/getclickuser', 'acty/getactyimgs', 'acty/getsportlog']) {
    assert.equal(calls(url).length, 2, url)
  }
  const refreshedRequests = requests.slice(beforeRefresh)
  assert.equal(refreshedRequests[0].url, 'acty/getdetail')
  assert.equal(refreshedRequests.at(-1).url, 'acty/getsportlog', 'retryLoad 先于榜单刷新')
  assert.equal(last('acty/getsportlog').data.page, 1)
  assert.equal(page.data.memberLoading, true)
  assert.equal(page.data.statsLoading, true)
  assert.equal(page.data.actyMemberLoading, true)
  assert.equal(refreshStops(), 0)

  succeed(last('acty/getdetail'), detail({ acty_name: '更新后的团跑' }))
  succeed(last('acty/getactyuser'), [{ id: 42, level: '普通' }, { id: 43, level: '非会员' }])
  succeed(last('acty/getsport'), { total: 0, number: 0 })
  succeed(last('acty/getclickuser'), [{ id: 42 }])
  succeed(last('acty/getactyimgs'), [{ img_url: '/updated-group-photo.jpg' }])
  assert.equal(page.data.acty_name, '更新后的团跑')
  assert.equal(page.data.actyIn, 2)
  assert.equal(page.data.avastars[0].id, 42)
  assert.equal(page.data.allDistance, 0)
  assert.equal(page.data.allNum, 0)
  assert.equal(page.data.actyMember[0].id, 42)
  assert.equal(page.data.actyImg[0].img_url, '/updated-group-photo.jpg')
  assert.equal(page.data.acty_img, '/updated-group-photo.jpg')
  assert.equal(page.data.memberLoaded, true)
  assert.equal(page.data.statsLoaded, true)
  assert.equal(page.data.actyMemberLoaded, true)
  assert.equal(refreshStops(), 0, '刷新结束仍由榜单回调负责')
  succeed(last('acty/getsportlog'), [])
  assert.equal(page.data.logList.length, 0)
  assert.equal(page.data.dataPanel, 'members')
  assert.equal(refreshStops(), 1)
})

test('首屏或刷新失败均可重试第一页，失败回调结束下拉刷新', () => {
  const { page, last, refreshStops } = createPage()
  page.setData({ actyId: '88' })
  page.fetchSportLog(true)
  last('acty/getsportlog').fail(new Error('offline'))
  page.retryLogs()
  assert.equal(last('acty/getsportlog').data.page, 1)
  succeed(last('acty/getsportlog'), records())
  page.onPullDownRefresh()
  last('acty/getsportlog').success({ data: { success: false } })
  assert.equal(refreshStops(), 1)
  assert.equal(page.data.logPage, 2)
  page.retryLogs()
  assert.equal(last('acty/getsportlog').data.page, 1, '失败的刷新应重试第一页')
  succeed(last('acty/getsportlog'), [])
  assert.equal(page.data.logList.length, 0)
  assert.equal(page.data.logError, false)
})

test('报名地区、结束状态、既有报名资格和指定 userid 的 API 参数保持原语义', () => {
  const { page, last, navigation, toasts } = createPage()
  page.onLoad({ id: '88', userid: '7' })
  assert.equal(last('acty/getdetail').data.userId, '7')
  assert.equal(last('acty/getactyuser').data.userId, '7')
  assert.equal(last('acty/getactyuser').data.level, '')
  assert.equal(last('acty/getactyuser').data.distance, 1)
  succeed(last('acty/getdetail'), detail({ region: '北京,上海', acty_type: '团跑 活动' }))
  page.setData({ myAddress: ' 广州 ' })
  page.signIn()
  assert.equal(navigation.length, 0)
  assert.equal(toasts.at(-1), '地区暂不支持')
  page.setData({ myAddress: ' 北京 ' })
  page.signIn()
  assert.equal(navigation.length, 1)
  assert.match(navigation[0], /acty_type=%E5%9B%A2%E8%B7%91%20%E6%B4%BB%E5%8A%A8$/)
  page.setData({ myAddress: '' })
  page.signIn()
  assert.equal(navigation.length, 2, '用户地区缺省沿用允许报名规则')
  page.setData({ myAddress: '广州', region: '' })
  page.signIn()
  assert.equal(navigation.length, 3, '活动地区缺省不限制报名')
  page.setData({ state: '已结束' })
  page.signIn()
  page.setData({ state: 1, signTrue: false })
  page.signIn()
  assert.equal(navigation.length, 3)
})

test('详情异常或缺失 id 会解除加载状态并阻止报名', () => {
  const { page, last, navigation } = createPage()
  page.initActyDetail('88')
  last('acty/getdetail').success(undefined)
  assert.equal(page.data.loading, false)
  assert.equal(page.data.loadError, true)
  page.signIn()
  assert.equal(navigation.length, 0)
  page.initActyDetail(undefined)
  assert.equal(page.data.loading, false)
  assert.equal(page.data.loadError, true)
})

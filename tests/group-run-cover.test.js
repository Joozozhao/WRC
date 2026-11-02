const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const DEFAULT = '/images/redesign/group-run-default-cover.jpg'
const manual = 'https://example.test/uploaded-cover.jpg'
const photo = 'https://example.test/album-photo.jpg'

function createPage(name) {
  const filename = path.resolve(__dirname, '../pages', name, name + '.js')
  const requests = []
  let config
  let preview
  const util = {
    request(url, method, data, message, success, fail) { requests.push({ url, data, success, fail }) },
    dislodgeZero: value => value
  }
  vm.runInNewContext(fs.readFileSync(filename, 'utf8'), {
    Page: value => { config = value },
    getApp: () => ({ globalData: { userId: 42 }, editTabbar() {} }),
    require: name => name === '../../utils/util.js' ? util : require(path.resolve(path.dirname(filename), name)),
    wx: { showLoading() {}, hideLoading() {}, setNavigationBarTitle() {}, showToast() {} },
    console: { log() {} }, setTimeout() {}, clearTimeout() {}
  }, { filename })
  const page = Object.assign({}, config, {
    data: JSON.parse(JSON.stringify(config.data)),
    setData(patch) {
      for (const [key, value] of Object.entries(patch)) {
        const fields = key.replace(/\[(\d+)\]/g, '.$1').split('.')
        let target = this.data
        for (const field of fields.slice(0, -1)) target = target[field]
        target[fields.at(-1)] = value
      }
    },
    selectComponent() { return { open: (...args) => { preview = args } } }
  })
  return { page, requests, last: url => requests.filter(r => r.url === url).at(-1), preview: () => preview }
}
function succeed(request, data) { request.success({ data: { success: true, data } }) }
function activity(cover, id = 88) {
  return { id, acty_img: cover, acty_type: '团跑', acty_state: 1, start_timestr: '2026-10-30 07:00:00', end_timestr: '2026-10-30 09:00:00' }
}
function loadList(h, cover) {
  h.page.initActy()
  succeed(h.last('acty/getactylist'), [activity(cover)])
}

test('团跑列表：上传封面与相册并存时，列表始终显示上传封面', () => {
  const h = createPage('activity')
  loadList(h, manual)
  succeed(h.last('acty/getactyimgs'), [{ id: 1, img_url: photo }])
  assert.equal(h.page.data.activityList[0].acty_img, manual)
})

for (const albumFirst of [true, false]) {
  test('详情：手动封面优先，不依赖接口顺序，albumFirst=' + albumFirst, () => {
    const h = createPage('activitydetail')
    h.page.setData({ actyId: 88 })
    h.page.initActyDetail(88)
    h.page.getactyimgs()
    const responses = [
      () => succeed(h.last('acty/getdetail'), activity(manual)),
      () => succeed(h.last('acty/getactyimgs'), [{ id: 1, img_url: photo }])
    ]
    if (albumFirst) responses.reverse()
    responses.forEach(fn => fn())
    assert.equal(h.page.data.acty_img, manual)
    assert.equal(h.page.data.actyImg.length, 1, '相册继续保留')
  })
}

for (const name of ['activity', 'activitylist']) {
  test(name + '：无封面无相册用默认图，默认占位不阻止相册封面', () => {
    const h = createPage(name)
    loadList(h, DEFAULT)
    assert.equal(h.page.data.activityList[0].acty_img, DEFAULT)
    succeed(h.last('acty/getactyimgs'), [null, { img_url: '' }, { id: 1, img_url: photo }])
    assert.equal(h.page.data.activityList[0].acty_img, photo)
  })

  test(name + '：刷新后的手动封面不被旧相册响应覆盖', () => {
    const h = createPage(name)
    loadList(h, '')
    const stale = h.last('acty/getactyimgs')
    loadList(h, manual)
    succeed(stale, [{ id: 1, img_url: photo }])
    assert.equal(h.page.data.activityList[0].acty_img, manual)
  })

  test(name + '：坏封面按手动、相册、默认回退，失败后不循环', () => {
    const h = createPage(name)
    loadList(h, manual)
    succeed(h.last('acty/getactyimgs'), [{ id: 1, img_url: photo }])
    const fail = () => h.page.onCoverError({ currentTarget: { dataset: { id: 88 } } })
    fail()
    assert.equal(h.page.data.activityList[0].acty_img, photo)
    fail()
    assert.equal(h.page.data.activityList[0].acty_img, DEFAULT)
    fail()
    assert.equal(h.page.data.activityList[0].acty_img, DEFAULT)
  })
}

test('详情：刷新可移除旧相册封面，空相册加空封面回到默认图', () => {
  const h = createPage('activitydetail')
  h.page.setData({ actyId: 88 })
  h.page.initActyDetail(88)
  succeed(h.last('acty/getdetail'), activity(''))
  h.page.getactyimgs()
  succeed(h.last('acty/getactyimgs'), [{ id: 1, img_url: photo }])
  assert.equal(h.page.data.acty_img, photo)
  h.page.retryLoad()
  succeed(h.last('acty/getdetail'), activity(''))
  succeed(h.last('acty/getactyimgs'), [])
  assert.equal(h.page.data.acty_img, DEFAULT)
})

test('详情：手动封面可单独预览，不冒充相册首图', () => {
  const h = createPage('activitydetail')
  h.page.setData({ actyId: 88 })
  h.page.initActyDetail(88)
  succeed(h.last('acty/getdetail'), activity(manual))
  h.page.preview({ currentTarget: { dataset: { url: manual } } })
  assert.deepEqual(Array.from(h.preview()[0]), [manual])
  assert.equal(h.preview()[1], manual)
})

test('详情：手动封面和多张相册连续失效后停在默认图，不重复请求坏图', () => {
  const h = createPage('activitydetail')
  h.page.setData({ actyId: 88 })
  h.page.initActyDetail(88)
  succeed(h.last('acty/getdetail'), activity(manual))
  h.page.getactyimgs()
  const second = 'https://example.test/second-photo.jpg'
  succeed(h.last('acty/getactyimgs'), [{ id: 1, img_url: photo }, { id: 2, img_url: second }])
  for (const expected of [photo, second, DEFAULT, DEFAULT]) {
    h.page.onCoverError()
    assert.equal(h.page.data.acty_img, expected)
  }
})

test('详情：刷新前的详情及相册响应不能覆盖新的手动封面', () => {
  const h = createPage('activitydetail')
  h.page.setData({ actyId: 88 })
  h.page.initActyDetail(88)
  h.page.getactyimgs()
  const oldDetail = h.last('acty/getdetail')
  const oldAlbum = h.last('acty/getactyimgs')
  h.page.retryLoad()
  succeed(h.last('acty/getdetail'), activity(manual))
  succeed(h.last('acty/getactyimgs'), [])
  succeed(oldDetail, activity(photo))
  succeed(oldAlbum, [{ id: 1, img_url: photo }])
  assert.equal(h.page.data.acty_img, manual)
  assert.equal(h.page.data.actyImg.length, 0)
})

test('默认图的本地、绝对 URL 和查询参数形式均不被当作手动封面', () => {
  const { resolveGroupCover } = require('../utils/group-run-cover.js')
  for (const origin of ['', '  ', null, DEFAULT, 'https://example.test' + DEFAULT + '?v=3', '/images/redesign/group-run-default-cover.png']) {
    assert.equal(resolveGroupCover(origin, []), DEFAULT)
    assert.equal(resolveGroupCover(origin, [{ img_url: photo }]), photo)
  }
  assert.equal(resolveGroupCover('  ' + manual + '  ', [{ img_url: photo }]), manual)
})

for (const name of ['activity', 'activitylist']) {
  test(name + '：分页新增记录按活动 ID 回填，旧记录保留手动封面', () => {
    const h = createPage(name)
    loadList(h, manual)
    const firstAlbum = h.last('acty/getactyimgs')
    h.page.loadMore()
    succeed(h.last('acty/getactylist'), [activity('', 89)])
    const secondAlbum = h.last('acty/getactyimgs')
    succeed(secondAlbum, [{ img_url: photo }])
    succeed(firstAlbum, [{ img_url: 'https://example.test/first-album.jpg' }])
    assert.equal(h.page.data.activityList[0].id, 88)
    assert.equal(h.page.data.activityList[0].acty_img, manual)
    assert.equal(h.page.data.activityList[1].id, 89)
    assert.equal(h.page.data.activityList[1].acty_img, photo)
  })

  test(name + '：相册查询失败仍保留手动封面；空封面仍显示默认图', () => {
    const h = createPage(name)
    loadList(h, manual)
    h.last('acty/getactyimgs').fail(new Error('network'))
    assert.equal(h.page.data.activityList[0].acty_img, manual)
    loadList(h, '')
    h.last('acty/getactyimgs').fail(new Error('network'))
    assert.equal(h.page.data.activityList[0].acty_img, DEFAULT)
  })
}

test('列表相册回填保持最多三并发，失败会继续队列，手动封面不受影响', () => {
  const h = createPage('activity')
  h.page.initActy()
  succeed(h.last('acty/getactylist'), [1, 2, 3, 4, 5].map(id => activity(manual, id)))
  let albums = h.requests.filter(r => r.url === 'acty/getactyimgs')
  assert.equal(albums.length, 3)
  albums[0].fail(new Error('network'))
  albums = h.requests.filter(r => r.url === 'acty/getactyimgs')
  assert.equal(albums.length, 4)
  succeed(albums[1], [{ img_url: photo }])
  albums = h.requests.filter(r => r.url === 'acty/getactyimgs')
  assert.equal(albums.length, 5)
  for (const request of albums.slice(2)) succeed(request, [])
  assert.equal(h.page._coverSyncRunning, 0)
  assert.ok(h.page.data.activityList.every(item => item.acty_img === manual))
})

const util = require('../../utils/util.js')

Page({
  data: {
    itemId: '', code: '', hasCode: false,
    detailState: 'loading', goodName: '', goodsType: -1,
    priceValue: '', priceUnit: '', priceKnown: false, goodsRemark: '',
    primaryImage: '', gallery: [], galleryState: 'loading', heroIndex: 0,
    detailImages: [], detailImagesState: 'loading',
    records: [], recordsState: 'loading', recordCountLabel: '',
    specGroups: [], specCount: 0, availableCount: 0,
    selectedStorageId: '', selectedTypeOne: '', selectedTypeTwo: '', selectedStock: null,
    actionBusy: false
  },

  onLoad: function (options) {
    const params = options || {}
    const itemId = params.id == null ? '' : String(params.id)
    this.setData({
      itemId,
      code: params.code == null ? '' : String(params.code),
      hasCode: Object.prototype.hasOwnProperty.call(params, 'code')
    })
    if (!itemId) {
      this.setData({ detailState: 'error' })
      return
    }
    this.loadPage()
  },

  loadPage: function () {
    const version = (this._requestVersion || 0) + 1
    this._requestVersion = version
    this._extraImages = []
    this.setData({
      detailState: 'loading', goodName: '', goodsType: -1,
      priceValue: '', priceUnit: '', priceKnown: false, goodsRemark: '',
      primaryImage: '', gallery: [], galleryState: 'loading', heroIndex: 0,
      detailImages: [], detailImagesState: 'loading',
      records: [], recordsState: 'loading', recordCountLabel: '',
      specGroups: [], specCount: 0, availableCount: 0,
      selectedStorageId: '', selectedTypeOne: '', selectedTypeTwo: '', selectedStock: null,
      actionBusy: false
    })
    this.loadGoods(version)
    this.loadGallery(version)
    this.loadDetailImages(version)
    this.loadRecords(version)
  },

  retryPage: function () {
    if (this.data.itemId) this.loadPage()
  },

  loadGoods: function (version) {
    util.request('goods/get', 'POST', { id: this.data.itemId }, '', (res) => {
      if (version !== this._requestVersion) return
      const body = res && res.data
      if (!body || !body.success || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
        this.setData({ detailState: 'error' })
        return
      }
      this.applyGoods(body.data)
    }, () => {
      if (version === this._requestVersion) this.setData({ detailState: 'error' })
    })
  },

  normalizeGroups: function (rawGroups) {
    if (!Array.isArray(rawGroups)) return []
    return rawGroups.map((group, groupIndex) => {
      const rawOptions = group && Array.isArray(group.goodsStorageList) ? group.goodsStorageList : []
      return {
        key: 'group-' + groupIndex,
        title: group && typeof group.tagName === 'string' && group.tagName.trim() ? group.tagName.trim() : '规格分组未命名',
        options: rawOptions.map((option, optionIndex) => {
          const rawStock = option && option.stock
          const stockText = rawStock == null ? '' : String(rawStock).trim()
          const stock = Number(stockText)
          const stockKnown = stockText !== '' && Number.isInteger(stock) && stock >= 0
          const id = option && option.id != null ? String(option.id) : ''
          const validId = Number.isInteger(Number(id)) && Number(id) > 0
          const label = option && typeof option.tag_desc === 'string' ? option.tag_desc.trim() : ''
          return {
            key: groupIndex + '-' + optionIndex,
            id,
            label: label || '规格名称未提供',
            typeOne: option && option.goods_tag != null ? String(option.goods_tag) : '',
            typeTwo: label,
            stock: stockKnown ? stock : null,
            stockLabel: !validId || !label ? '规格信息不完整' : !stockKnown ? '库存待确认' : stock > 0 ? '剩余 ' + stock : '已兑完',
            available: Boolean(validId && label && stockKnown && stock > 0)
          }
        })
      }
    })
  },

  findOption: function (groups, id) {
    if (!id) return null
    for (let i = 0; i < groups.length; i++) {
      const option = groups[i].options.find(item => item.id === String(id))
      if (option) return option
    }
    return null
  },

  applyGoods: function (goods) {
    const type = goods.goods_type === 0 || goods.goods_type === '0' ? 0
      : goods.goods_type === 1 || goods.goods_type === '1' ? 1 : -1
    const rawPrice = type === 0 ? goods.score : type === 1 ? goods.energy : null
    const priceText = rawPrice == null ? '' : String(rawPrice).trim()
    const priceKnown = priceText !== '' && Number.isFinite(Number(priceText)) && Number(priceText) >= 0
    const groups = this.normalizeGroups(goods.goodsStorageList)
    const options = groups.reduce((list, group) => list.concat(group.options), [])
    const selected = this.findOption(groups, this.data.selectedStorageId)
    const current = selected && selected.available ? selected : null
    this.setData({
      detailState: 'ready',
      goodName: typeof goods.goods_name === 'string' ? goods.goods_name.trim() : '',
      goodsType: type,
      priceValue: priceKnown ? priceText : '',
      priceUnit: type === 0 ? '积分' : type === 1 ? '小花儿' : '',
      priceKnown,
      goodsRemark: typeof goods.goods_remark === 'string' ? goods.goods_remark.trim() : '',
      primaryImage: typeof goods.goods_pic === 'string' ? goods.goods_pic.trim() : '',
      specGroups: groups,
      specCount: options.length,
      availableCount: options.filter(item => item.available).length,
      selectedStorageId: current ? current.id : '',
      selectedTypeOne: current ? current.typeOne : '',
      selectedTypeTwo: current ? current.typeTwo : '',
      selectedStock: current ? current.stock : null
    })
    this.updateGallery()
    return { groups, priceKnown }
  },

  updateGallery: function () {
    const urls = []
    const seen = new Set()
    const add = (url) => {
      if (url && !seen.has(url)) {
        seen.add(url)
        urls.push(url)
      }
    }
    add(this.data.primaryImage)
    const extraImages = this._extraImages || []
    extraImages.forEach(add)
    const oldGallery = this.data.gallery
    this.setData({
      gallery: urls.map(url => {
        const old = oldGallery.find(item => item.url === url)
        return { url, failed: old ? old.failed : false }
      }),
      heroIndex: Math.min(this.data.heroIndex, Math.max(urls.length - 1, 0))
    })
  },

  loadGallery: function (version) {
    this.setData({ galleryState: 'loading' })
    util.request('goods/getlistimgs', 'POST', { gId: this.data.itemId, type: 0 }, '', (res) => {
      if (version !== this._requestVersion) return
      const body = res && res.data
      if (!body || !body.success || !Array.isArray(body.data)) {
        this.setData({ galleryState: 'error' })
        return
      }
      this._extraImages = body.data.map(item => item && item.goods_pic).filter(url => typeof url === 'string' && url.trim()).map(url => url.trim())
      this.setData({ galleryState: this._extraImages.length ? 'ready' : 'empty' })
      this.updateGallery()
    }, () => {
      if (version === this._requestVersion) this.setData({ galleryState: 'error' })
    })
  },

  retryGallery: function () {
    if (this.data.galleryState === 'error') this.loadGallery(this._requestVersion)
  },

  changeHero: function (e) {
    this.setData({ heroIndex: e.detail.current })
  },

  heroImageError: function (e) {
    const index = Number(e.currentTarget.dataset.index)
    if (this.data.gallery[index]) this.setData({ ['gallery[' + index + '].failed']: true })
  },

  loadDetailImages: function (version) {
    this.setData({ detailImagesState: 'loading' })
    util.request('goods/getlistimgs', 'POST', { gId: this.data.itemId, type: 1 }, '', (res) => {
      if (version !== this._requestVersion) return
      const body = res && res.data
      if (!body || !body.success || !Array.isArray(body.data)) {
        this.setData({ detailImagesState: 'error' })
        return
      }
      const images = body.data.map(item => item && item.goods_pic).filter(url => typeof url === 'string' && url.trim()).map((url, index) => ({ key: index, url: url.trim(), failed: false }))
      this.setData({ detailImages: images, detailImagesState: images.length ? 'ready' : 'empty' })
    }, () => {
      if (version === this._requestVersion) this.setData({ detailImagesState: 'error' })
    })
  },

  retryDetailImages: function () {
    if (this.data.detailImagesState === 'error') this.loadDetailImages(this._requestVersion)
  },

  detailImageError: function (e) {
    const index = Number(e.currentTarget.dataset.index)
    if (this.data.detailImages[index]) this.setData({ ['detailImages[' + index + '].failed']: true })
  },

  loadRecords: function (version) {
    this.setData({ recordsState: 'loading' })
    util.request('goods/getusers', 'POST', { goodsId: this.data.itemId, page: 1 }, '', (res) => {
      if (version !== this._requestVersion) return
      const body = res && res.data
      if (!body || !body.success || !Array.isArray(body.data)) {
        this.setData({ recordsState: 'error' })
        return
      }
      const records = body.data.filter(item => item && typeof item === 'object').map((item, index) => ({
        key: index,
        name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : '昵称暂缺',
        avatar: typeof item.header_url === 'string' ? item.header_url.trim() : '',
        time: typeof item.create_time === 'string' && item.create_time.trim() ? item.create_time.trim().slice(0, 19) : '时间暂缺'
      }))
      const total = Number(body.total)
      const count = body.total != null && body.total !== '' && Number.isFinite(total) && total >= records.length ? total : records.length
      this.setData({ records, recordsState: records.length ? 'ready' : 'empty', recordCountLabel: '共 ' + count + ' 条' })
    }, () => {
      if (version === this._requestVersion) this.setData({ recordsState: 'error' })
    })
  },

  retryRecords: function () {
    if (this.data.recordsState === 'error') this.loadRecords(this._requestVersion)
  },

  chooseSpec: function (e) {
    const option = this.findOption(this.data.specGroups, e.currentTarget.dataset.id)
    if (!option || !option.available) return
    this.setData({
      selectedStorageId: option.id,
      selectedTypeOne: option.typeOne,
      selectedTypeTwo: option.typeTwo,
      selectedStock: option.stock
    })
  },

  startExchange: function () {
    if (this.data.detailState !== 'ready' || this.data.actionBusy) return
    if (!this.data.priceKnown || !this.data.goodName) {
      wx.showToast({ title: '奖品信息暂不完整', icon: 'none' })
      return
    }
    if (!this.data.availableCount) {
      wx.showToast({ title: '当前没有可选库存', icon: 'none' })
      return
    }
    const storageId = this.data.selectedStorageId
    if (!storageId) {
      wx.showToast({ title: '请先选择奖品规格', icon: 'none' })
      wx.pageScrollTo({ selector: '#reward-specifications', duration: 280 })
      return
    }

    // 进入订单页前重读库存；最终兑换仍由订单页的提交操作处理。
    this.setData({ actionBusy: true })
    const version = this._requestVersion
    util.request('goods/get', 'POST', { id: this.data.itemId }, '', (res) => {
      if (version !== this._requestVersion) return
      const body = res && res.data
      if (!body || !body.success || !body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
        this.setData({ actionBusy: false })
        wx.showToast({ title: '库存确认失败，请重试', icon: 'none' })
        return
      }
      const fresh = this.applyGoods(body.data)
      const option = this.findOption(fresh.groups, storageId)
      if (!option || !option.available) {
        this.setData({ actionBusy: false })
        wx.showToast({ title: '所选规格已无库存，请重选', icon: 'none' })
        return
      }
      if (!fresh.priceKnown || !this.data.goodName) {
        this.setData({ actionBusy: false })
        wx.showToast({ title: '奖品信息暂不完整', icon: 'none' })
        return
      }
      const encode = encodeURIComponent
      let url = '../confirmorder/confirmorder?id=' + encode(this.data.itemId)
        + '&storageId=' + encode(option.id)
        + '&typeOne=' + encode(option.typeOne)
        + '&typeTwo=' + encode(option.typeTwo)
      if (this.data.hasCode) url += '&code=' + encode(this.data.code)
      wx.navigateTo({
        url,
        fail: () => wx.showToast({ title: '订单页暂无法打开', icon: 'none' }),
        complete: () => this.setData({ actionBusy: false })
      })
    }, () => {
      if (version === this._requestVersion) {
        this.setData({ actionBusy: false })
        wx.showToast({ title: '库存确认失败，请重试', icon: 'none' })
      }
    })
  },

  onShareAppMessage: function () {
    return {
      title: (this.data.goodName || '奖品详情') + '｜WRC 兑换中心',
      path: '/pages/prizedetails/prizedetails?id=' + encodeURIComponent(this.data.itemId)
    }
  }
})

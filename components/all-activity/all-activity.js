Component({
  options: {
    multipleSlots: true
  },
  properties: {
    totalChallenge: {
      type: Number,
      value: 0
    },
    totalActy: {
      type: Number,
      value: 0
    },
    activityList: {
      type: Array,
      value: []
    },
    activityList2: {
      type: Array,
      value: []
    }
  },
  methods: {
    onTapChild() {
      this.triggerEvent('parentEvent');
    },
    onTapChild2() {
      this.triggerEvent('parentEvent2');
    },
    getInfor(e) {
      var id = e.currentTarget.dataset.id;
      var type = e.currentTarget.dataset.type;
      this.triggerEvent('parentEvent3', { id: id, type: type });
    },
    toChallengeTab() {
      wx.switchTab({
        url: '/pages/challenge/challenge',
        fail: function() {
          wx.navigateTo({ url: '/pages/challenge/challenge' });
        }
      });
    },
    toActivityTab() {
      wx.switchTab({
        url: '/pages/activity/activity',
        fail: function() {
          wx.navigateTo({ url: '/pages/activity/activity' });
        }
      });
    }
  }
});

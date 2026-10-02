# 底部导航四个图标还原（2026-10-01）

用户反馈底部导航图标变成实心/带颜色，要求还原为参考设计：未选中为细线描边灰图标，选中为实心深松绿图标。

## 问题来源

- `images/redesign/groups.svg` 是实心三人图标（应为两人描边）。
- `images/redesign/trophy.svg` 于 9 月 30 日被加上硬编码 `fill="#165b3f"`，任何页面都显示绿色。
- 组件只有单一 `iconPath`，选中态无法呈现参考截图中的实心深绿图标。

## 修改

- `groups.svg` 换成两人描边图标；`trophy.svg` 去掉硬编码绿色，恢复描边。
- 新增 `home-active.svg`、`groups-active.svg`、`trophy-active.svg`、`person-active.svg` 四个实心图标，填充选中色 `#0b503b`。
- `app.js` 每个标签补 `selectedIconPath`（恢复旧版双图标机制，仅 4 行新增）。
- `components/tabbarComponent/tabbar.wxml` 选中时使用 `selectedIconPath`。
- 应用户要求调整比例：图标 46rpx → 56rpx，文字 23rpx → 20rpx，间距 6rpx → 4rpx，导航总高 102rpx 不变。

未改动工作区中他人未提交的 dark 深色导航变体；团跑页深色导航经反色滤镜后选中图标呈现实心白色，与其自身设计一致。

## 验证

- 微信开发者工具 2.02.2609231 RC、iPhone 17 模拟器逐页检查：我的页「我的」实心绿、首页「首页」实心绿、挑战页「挑战」实心绿，未选中均为描边灰图标，与参考截图一致；问题面板 0 错误 0 警告。
- `npm test`：109 项通过、0 失败。
- 验证截图：[tabbar-icons-restore-2026-10-01.jpg](tabbar-icons-restore-2026-10-01.jpg)（依次为首页、挑战、我的选中态）。
- 尺寸调整后截图：[tabbar-icons-size-2026-10-01.jpg](tabbar-icons-size-2026-10-01.jpg)。
- 真机未验证；测试为内存桩，不访问业务接口。

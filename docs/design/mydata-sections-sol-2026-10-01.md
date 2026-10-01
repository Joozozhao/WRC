# WRC 「我的」页面下半部重设计稿规范 (GPT Sol 2026-10-01)

## 1. 设计核心原则
- **延续统一主题**：背景温润暖白（`#fbfcf9`）、主文本与标题深松绿（`#072f27`）、辅助松绿（`#0b503b`）、边线与分割线（`#e1e9e3` / `#f0f4f0`）、操作亮点荧光黄绿（`#d9ff3f`，文本 `#062b23`）。
- **极简大气与字重分层**：
  - 一级/二级标题、核心大数字加粗（`font-weight: 700 ~ 800`）。
  - 辅助说明小字（如“记录 · 兑换 · 管理”、“你的高光时刻”、“每一次挑战与团聚”、赛事副标、活动日期、查看更多等）全部严格遵照用户要求，调整为 **`font-weight: 200`**。
- **一体化与消灭网格空洞**：
  - 将「常用服务」从原来生硬的 2x2 网格（导致非管理员时右下角产生缺角留白）改为**一体化纯白卡片分组列表**（类似 iOS 系统设置 / 微信服务单页）。条目间采用精致细分界线，无论 3 项还是 4 项均自然平铺、呼吸感十足。
- **海报图片完整露出**：
  - 改变以往在图片上压深色遮罩、大阴影、文字重叠的做法，将卡片改为“上图下文”或“纯净海报 + 底部极简图解”，让跑友合影与挑战徽章海报 100% 完整展现。

---

## 2. 详细模块尺寸与规范 (rpx 基准)

### A. 常用服务 (Services Card)
- **容器**：
  - `background: #ffffff;`
  - `border: 1rpx solid #e1e9e3;`
  - `border-radius: 24rpx;`
  - `overflow: hidden;`
  - `box-shadow: 0 4rpx 14rpx rgba(7, 47, 39, 0.02);`
- **条目行 (`.profile-service-row`)**：
  - `min-height: 104rpx;`
  - `padding: 0 32rpx;`
  - 条目之间使用 `1rpx solid #f0f4f0` 分割线。
  - 左侧主标题：`font-size: 28rpx; font-weight: 700; color: #072f27;`
  - 左侧辅助说明：`font-size: 22rpx; font-weight: 200; color: #73877b;`
  - 右侧箭头：`font-size: 28rpx; font-weight: 200; color: #0b503b;`

### B. 马拉松成绩 (Marathon PR)
- **章节头部**：
  - 标题行左侧：“马拉松成绩”（`font-size: 34rpx; font-weight: 800;`），副标题“你的高光时刻”（`font-size: 22rpx; font-weight: 200; color: #667970;`）。
  - 右侧直接收纳快捷入口：“查看全部成绩 →”（`font-size: 23rpx; font-weight: 200; color: #0b503b;`），去掉底部多余的单行查看。
- **卡片列表**：
  - 白卡一体化或条目间分割线，`border-radius: 24rpx; border: 1rpx solid #e1e9e3;`
  - 赛事名称支持最多两行截断（`line-clamp: 2`），不换行溢出。
  - 赛事类型/组别药丸标签：`font-size: 20rpx; font-weight: 200; background: #eaf3ed; color: #2e6949; padding: 2rpx 12rpx; border-radius: 8rpx;`
  - 比赛日期：`font-size: 21rpx; font-weight: 200; color: #718175;`
  - 成绩数字：`font-size: 36rpx; font-weight: 800; color: #0b503b; font-variant-numeric: tabular-nums;`

### C. 参与记录 (All Activity Components)
- **卡片头部**：
  - 挑战/团跑标识与大字；右侧胶囊徽标保留（`XX 次 ›`），其中说明小字字重 `200`。
- **海报内容区**：
  - 卡片宽度 `320rpx`（挑战）/ `280rpx`（团跑）。
  - 图片高度统一优化，移除大块暗黑半透明遮盖文字，将文字放置在海报下方独立纯白信息带。
  - 活动标题：`font-size: 24rpx; font-weight: 700; color: #072f27;`
  - 举办时间/活动说明：`font-size: 20rpx; font-weight: 200; color: #718175;`
- **末尾导流卡**：
  - 虚线边框卡片（`border: 1rpx dashed #d0dcd2; background: #f4f8f4;`），内部圆形白色箭头 + 文案（字重 `200`）。


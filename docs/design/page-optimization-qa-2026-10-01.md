# WRC 页面全量巡检与优化验收记录（2026-10-01）

## 1. 检查背景与约束

- **环境**：微信开发者工具 2.02.2609231 RC，模拟机型 iPhone 17，已登录管理员账号（ID 1 赵彦兵）。
- **约束边界**：并行 Codex 线程正在修改打卡记录页（`pages/record/record.*`）与底部导航栏（`components/tabbarComponent/*`）。本轮严格避开上述文件，专注解决由于主页面重构导致的次级页面级联样式缺失、WXML 内联语法错误、以及接口入参不一致问题。
- **保护既有工作区**：未做任何破坏性 clean 或 reset，改动保持高内聚、自包含。

---

## 2. 发现的缺陷与优化修复

### 2.1 首页（pages/index）内联样式 Lint 错误
- **问题**：`pages/index/index.wxml:91` 挑战进度条内联样式中包含三元表达式，导致微信开发者工具编辑器报出 2 处 CSS 语法错误。
- **优化**：在 `index.js` 的数据流中引入响应式字段 `challengeProgressWidth`（在数据重置、进度计算和异常兜底四处逻辑中规范更新），WXML 改用标准的属性插值 `style="width: {{challengeProgressWidth}};"`。
- **验证**：重新编译后编辑器问题面板 0 错误；模拟器实测挑战卡片进度条正常渲染满宽。

### 2.2 「我的」页面（pages/mydata）本周运动天数显示异常
- **问题**：`mydata.js` 中的 `getWeekRuns` 接口请求参数传递了 `{ userId }`，而后端该接口规范为 `{ user_id }`，导致接口未能正常返回本周运动统计，登录状态下「本周运动·天」始终呈现占位符「—」。
- **优化**：修正参数键名为 `user_id`。
- **验证**：模拟器热重载后，卡片正常解析并展示出本周运动数据「1」。

### 2.3 跑团管理（pages/manage）重设计与交互升级
- **问题**：原页面仍为老旧亮绿色大色块（`#4CB944`）及彩虹渐变边框，与重设计规范（暖白底 `#fbfcf9`、深绿正文 `#072f27`、荧光黄绿 `#d9ff3f`）不符。
- **优化**：全面重塑 `manage.wxml/wxss/json`：
  - 引入规范的 Hero 结构（`WRC · ADMIN` eyebrow + 大标题 + 荧光短线 + 简洁描述）；
  - 按业务维度组织为四组模块卡片（活动、运营、成员与订单、配置）；
  - 使用 `/images/redesign/chevron.svg` 右箭头与触控态反馈；
  - 保持 JS 绑定的全部 8 个管理入口 handler（创建团跑、创建挑战、抽奖管理、奖品管理、打卡管理、会员管理、订单管理、跑团配置）零改动。
- **验证**：模拟器核验 UI 视觉清爽，点击各二级入口均顺畅导航。

### 2.4 会员管理（pages/userlist）旧依赖断裂导致的巨型图回归
- **问题**：`userlist.wxss` 原先通过 `@import "../mydata/mydata.wxss"` 复用旧类；随着 `mydata` 被规范化重构，其旧版布局类（`.user-pic`、`.vip`、`.sex` 等）被移除，导致会员头像上的 VIP 勋章和性别角标失去约束，渲染成全屏巨幅图片。
- **优化**：解耦对 `mydata.wxss` 的依赖，从版本库中将用户列表所需的类抽取为自身模块的自包含样式，并将导航栏统一至 `#fbfcf9`。
- **验证**：在 iPhone 17 模拟器中进入会员管理页，实测 VIP 勋章（40rpx）、性别角标（25rpx）、姓名及设置胶囊排版已完全恢复正常。

### 2.5 级联 @import 断裂跨页面扫描与自包含修复
- **排查**：对全项目页面进行依赖反查，发现多个次级页面（`othersdata`, `activitylist`, `prizelist`, `lotterydetail`, `orderlist`, `confirmorder`, `orderdetail`, `admin`）均依赖已被重设计的公共样式文件。
- **优化**：通过脚本批量提取对应页面在 HEAD 中的有效规则，并注入为独立维护的自包含样式块，彻底切断向下污染和对重构文件的脆弱依赖。
- **重点修复**：
  - `orderlist.wxss`：补齐商品卡片所需的 `display: flex; align-items: center;`，并在模拟器实测确认订单图文横向布局恢复，状态徽章（待发货/已发货/已签收）精准居左上角。
  - `admin.wxss`：补齐表单项 `.form-item` 弹性排版及右对齐输入框 `.ipt`。
  - 统一清理新增样式的换行符（CRLF → LF）与行尾空格，确保 `git diff --check` 完全洁净。

---

## 3. 业务数据层面的异常发现

- **挑战管理后台配置注意**：当前挑战列表中的「2026年12月里程挑战」，结束日期展示为 `2026-12-03`（仅持续 3 天）。根据命名常规应为整月挑战，属于后端或后台录入测试数据问题，前端解析与渲染正常。

---

## 4. 交付文件清单

| 文件路径 | 状态 | 说明 |
| --- | --- | --- |
| `pages/index/index.wxml` / `index.js` | 修改 | 修复内联 CSS 语法错误，引入响应式宽度变量 |
| `pages/mydata/mydata.js` | 修改 | 修复周打卡接口 `user_id` 参数入参问题 |
| `pages/manage/manage.*` | 修改 | 跑团管理全面重构为 WRC 设计体系与分组卡片 |
| `pages/userlist/userlist.*` | 修改 | 会员管理解耦自包含，修复角标撑破页面问题 |
| `pages/orderlist/orderlist.wxss` | 修改 | 修复订单列表水平图文弹性布局与自包含样式 |
| `pages/admin/admin.wxss` | 修改 | 跑团配置项表单布局自包含补齐 |
| `pages/othersdata/othersdata.wxss` 等 | 修改 | 解除向被重构文件的脆弱 import，自包含化 |
| `docs/design/page-optimization-qa-2026-10-01.md` | 新增 | 本轮检查与优化验收文档 |


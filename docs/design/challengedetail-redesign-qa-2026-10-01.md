# 挑战详情页（pages/challengedetail）整合报名跑友与抽奖控制验收文档

- 验收日期：2026-10-01
- 目标页面：pages/challengedetail/challengedetail
- 涉及改动：
  - pages/challengedetail/challengedetail.wxml
  - pages/challengedetail/challengedetail.wxss
  - pages/challengedetail/challengedetail.js
  - app.json（移除已删除的 pages/actyin/actyin 路由）
  - project.config.json（移除 pages/actyin/actyin 编译入口）
  - tests/challengedetail-lottery.test.js
  - 已彻底删除独立页面目录：pages/actyin/

---

## 需求落实要点

1. 直接在挑战详情页最底部显示跑友数据并删除 actyin 页面
   - 数据整合：将原本独立页面 pages/actyin/actyin 的全部数据能力与交互完整迁移整合至 pages/challengedetail/challengedetail 最底部。
   - 交互能力保留：
     - 等级切换：支持 全部 / VIP / 普通 / 非会员 一键过滤。
     - 跑量排序：支持按已完成跑量升序/降序灵活切换。
     - 卡片详情：展示排名序号（01/02/03 高亮）、用户头像、跑友昵称、会员/性别/ID/已达标徽标，以及分子分母完成里程、进度条和完成百分比。
     - 个人主页互通：点击跑友卡片直接跳转个人主页（自己前往“我的”，他人前往“TA的主页”）。
   - 独立页面清理：物理删除 pages/actyin/ 目录及其下的 js/json/wxml/wxss，清理 app.json 与 project.config.json 引用，无任何残留悬挂路由。

2. 关联抽奖模块显示控制
   - 维持外层条件 wx:if 仅在 ltyList 且 length > 0 时渲染。当活动未配置抽奖或无关联抽奖时，抽奖模块完全不显示。

---

## 验证结论

- 自动化测试：tests/challengedetail-lottery.test.js 新增对跑友数据筛选与排序交互的断言覆盖，npm test 全量 113 项测试全部通过。
- 真机模拟器实测：微信开发者工具中以 iPhone 17 实测挑战详情（2026年10月里程挑战），底部完整呈现跑友筛选栏与 6 位成员的排行榜卡片，无抽奖占位，页面完整紧凑。截图归档于 docs/design/challengedetail-with-squad-2026-10-01.jpg。

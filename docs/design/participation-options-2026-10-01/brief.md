# 参与记录：三稿比较（2026-10-01）

用户希望先比较设计稿，本轮仅制作候选视觉稿，不替换小程序页面。

共用基准：暖白 `#fbfcf9`、深松绿 `#072f27`、少量荧光黄绿 `#d9ff3f`；标题和核心数据突出，说明和日期轻字重。保留参考截图中的 80 次挑战、201 次团跑、两张挑战海报和两条团跑记录；不增加排名、完成率、个人里程或未经确认的状态。

## A · 轻量相册

直接在页面背景上分组，取消包裹整个分类的大白卡与重复卡片边框。海报和合影作为主内容，名称、日期排在图下；分类总次数与标题同一行。适合保留现有横滑交互，降低视觉复杂度。

## B · 时间列表

使用「全部 / 挑战 80 / 团跑 201」分类切换，将记录按月份组织成时间列表。活动名称和日期为主，封面作为右侧小缩略图。适合经常查找某一条历史记录。

## C · 精选大图

每组突出一条大图记录，下一条收成简洁的缩略图行。挑战采用海报与文字并排，团跑采用宽幅合影加下方说明，形成不同的视觉节奏。适合突出活动回忆和海报内容。

三稿使用内置 imagegen 工具生成，以用户截图为设计参考。生成图用于比较视觉方向；文字、照片细节和分页交互在选定方案后的实现阶段核对。

## 输出与查看

- [并排比较与放大查看](index.html)
- [A：轻量相册](option-a.png)
- [B：时间列表](option-b.png)
- [C：精选大图](option-c.png)
- [三稿对比截图](comparison.jpg)
- [完整生成提示词](prompts.json)

三张图均为 1024 × 1536，已确认预览页完整加载；放大查看、关闭与单方案筛选正常，无页面横向溢出。比较页已保留打开。本轮只新增此目录下的设计材料。

## 生成提示词共同约束

Use case: ui-mockup. Produce a high fidelity, front-on, portrait mobile interface section. No device bezel, perspective, decorative background, top status bar or unrelated app modules. Show only the participation-record section. Use the attachment as a reference for content, existing poster imagery and runner photos. Preserve the WRC warm off-white, deep pine green and restrained lime palette. Use crisp, readable simplified Chinese system typography; bold headings, light metadata. Remove redundant nested card borders and pill clutter. Do not invent progress, ranks, running distances, badges or business statuses.

Exact shared text: 「参与记录」「每一次挑战与团聚」「挑战」「团跑」「80 次」「201 次」「2026年12月里程挑战」「2026年10月里程挑战」「微网跑团273期聚跑」「微网跑团272期聚跑」. Dates may be shortened to 2026.12.01, 2026.10.01, 2026.04.22 and 2026.04.15. No meaningless 00:00 time suffixes.

Variant A: two unboxed horizontal photo/poster galleries on the page background, generous images, understated inline counts, title and short date beneath each image. Show both challenge posters and both group-run photos. Preserve natural image proportions; no letterbox slabs, image overlays, heavy borders or shadows.

Variant B: one chronological list with 「全部 / 挑战 80 / 团跑 201」 tabs, subtle month groups, thin timeline line and dots, four spacious rows with activity name/date on the left and a modest cover thumbnail on the right. Use fine separators instead of cards. Compact, calm and easy to scan.

Variant C: a visual feature for each category, one dominant record followed by one quiet secondary row. For challenge, a large original poster on the left and name/date on the right in a single open composition. For group-run, a large full-width runner photo with caption below. The second record in each category is a thumbnail list row. Clearly different composition from A and B, with restrained colors and no nested cards.

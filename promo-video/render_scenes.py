from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).parent
ASSET = ROOT / "assets"
OUT = ROOT / "renders" / "frames"
OUT.mkdir(parents=True, exist_ok=True)
W, H = 1080, 1920
GREEN = "#0B503B"
DEEP = "#07372B"
LIME = "#D9FF3F"
WHITE = "#F4F5EF"
SAGE = "#B8C8BE"
FONT_PATH = "/System/Library/Fonts/Hiragino Sans GB.ttc"


def font(size, bold=False):
    return ImageFont.truetype(FONT_PATH, size, index=1 if bold else 0)


def base(color=GREEN):
    return Image.new("RGB", (W, H), color)


def text(draw, xy, value, size, fill=WHITE, bold=False, spacing=12, anchor=None):
    draw.multiline_text(xy, value, font=font(size, bold), fill=fill, spacing=spacing, anchor=anchor)


def pill(draw, xy, value, fill=LIME, color=DEEP, size=23, pad=(18, 12)):
    f = font(size, True)
    box = draw.textbbox((0, 0), value, font=f)
    width, height = box[2] + pad[0] * 2, box[3] - box[1] + pad[1] * 2
    x, y = xy
    draw.rounded_rectangle((x, y, x + width, y + height), radius=height // 2, fill=fill)
    draw.text((x + pad[0], y + pad[1] - box[1]), value, font=f, fill=color)
    return width, height


def header(draw, left, number):
    text(draw, (84, 74), left, 24, SAGE, True)
    text(draw, (905, 74), number, 23, SAGE, True)


def glow(im, xy, radius=390):
    layer = Image.new("RGBA", im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = xy
    for r in range(radius, 0, -8):
        alpha = int(16 * (1 - r / radius) ** 2)
        d.ellipse((x-r, y-r, x+r, y+r), fill=(217, 255, 63, alpha))
    layer = layer.filter(ImageFilter.GaussianBlur(42))
    return Image.alpha_composite(im.convert("RGBA"), layer)


def crop_cover(path):
    im = Image.open(path).convert("RGB")
    scale = max(W / im.width, H / im.height)
    im = im.resize((int(im.width * scale), int(im.height * scale)), Image.Resampling.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2
    return im.crop((x, y, x + W, y + H))


def shade_photo(im, stronger=0.82):
    overlay = Image.new("RGBA", (W, H), (4, 38, 29, 95))
    px = overlay.load()
    for y in range(H):
        a = int(35 + stronger * 205 * (y / H) ** 1.65)
        for x in range(W):
            px[x, y] = (4, 38, 29, min(a, 238))
    return Image.alpha_composite(im.convert("RGBA"), overlay)


def scene1():
    im = shade_photo(crop_cover(ASSET / "group-run.jpg"), .88)
    im = glow(im, (930, 480), 330)
    d = ImageDraw.Draw(im)
    header(d, "WRC  ·  RUN TOGETHER", "01 / 06")
    text(d, (88, 820), "微网跑团", 37, WHITE, True)
    text(d, (88, 1000), "跑步，让相遇发生", 27, LIME, True)
    text(d, (82, 1095), "每一步，\n都算数。", 104, WHITE, True, 7)
    text(d, (90, 1390), "从自己的日常，到一群人的热爱。", 35, WHITE)
    d.line((90, 1510, 360, 1510), fill=LIME, width=5)
    text(d, (90, 1665), "每次出发，都是和自己的一次约定。", 26, "#E4EBE5")
    return im.convert("RGB")


def scene2():
    im = glow(base(GREEN), (930, 1080), 420)
    d = ImageDraw.Draw(im)
    header(d, "01 / RUN LOG", "记录跑步")
    text(d, (88, 220), "让每一段努力，都有迹可循", 25, LIME, True)
    text(d, (80, 290), "跑过的路，\n好好记下来。", 76, WHITE, True, 12)
    text(d, (88, 500), "跑量、打卡日历与年度累计，\n一页回看自己的坚持。", 30, SAGE, spacing=17)

    d.rounded_rectangle((68, 660, 1012, 1420), radius=34, fill=WHITE)
    text(d, (112, 705), "‹   首页 · 训练看板", 24, "#62776B", True)
    text(d, (112, 770), "本周跑量", 28, "#173E30", True)

    d.rounded_rectangle((104, 825, 976, 1105), radius=26, fill="#E7EEE8")
    text(d, (144, 860), "目标 30.0 公里 · 已完成 72%", 22, "#61776B")
    text(d, (140, 905), "21.6", 86, GREEN, True)
    text(d, (365, 955), "公里", 24, "#61776B")

    d.rounded_rectangle((140, 1015, 940, 1030), radius=7, fill="#DCE5DD")
    d.rounded_rectangle((140, 1015, 716, 1030), radius=7, fill=GREEN)

    stats = [("4 天", "本月打卡"), ("7 天", "连续打卡"), ("168", "今年公里")]
    for i, (v, label) in enumerate(stats):
        x = 104 + i * 296
        d.rounded_rectangle((x, 1125, x + 280, 1215), radius=18, fill="#E7EEE8")
        text(d, (x + 20, 1138), v, 29, GREEN, True)
        text(d, (x + 20, 1178), label, 18, "#61776B")

    text(d, (112, 1245), "跑步日历", 26, "#173E30", True)
    for i in range(28):
        row, col = divmod(i, 7)
        x, y = 116 + col * 119, 1295 + row * 26
        c = "#DCE5DD" if i not in (1, 3, 4, 8, 9, 11, 13, 17, 20, 24) else (GREEN if i in (3, 9, 17) else "#8DCB57")
        d.rounded_rectangle((x, y, x + 94, y + 18), radius=6, fill=c)

    cta_y1 = 1455
    d.rounded_rectangle((68, cta_y1, 1012, cta_y1 + 105), radius=28, fill=LIME)

    runner_path = Path("/Users/joozo/VibeCoding/WRC/images/redesign/runner.png")
    if runner_path.exists():
        im_rgba = im.convert("RGBA")
        r_im = Image.open(runner_path).convert("RGBA").resize((60, 60), Image.Resampling.LANCZOS)
        im_rgba.paste(r_im, (115, cta_y1 + 22), r_im)
        im = im_rgba.convert("RGB")
        d = ImageDraw.Draw(im)

    text(d, (200, cta_y1 + 33), "跑步打卡 · 上传截图留下每一步", 28, DEEP, True)
    text(d, (935, cta_y1 + 31), "→", 32, DEEP, True)

    pill(d, (112, 1590), "界面示意", "#DCE9D3", GREEN, 20)
    text(d, (112, 1685), "记录跑步，查看跑量与打卡日历，\n让每一步都有迹可循。", 27, "#E4EBE5", spacing=12)
    return im


def scene3():
    im = glow(base(GREEN), (980, 850), 400)
    d = ImageDraw.Draw(im)
    header(d, "02 / GROUP RUN", "发现团跑")
    text(d, (88, 240), "把一个人的路，跑成大家的故事", 25, LIME, True)
    text(d, (82, 310), "约一场团跑，\n一起出发。", 77, WHITE, True, 13)
    text(d, (88, 520), "发现身边的团跑活动，与跑友相约见面。", 30, "#E5ECE7")

    card_x1, card_y1, card_x2, card_y2 = 68, 650, 1012, 1540
    d.rounded_rectangle((card_x1, card_y1, card_x2, card_y2), radius=34, fill=WHITE)

    cover_path = Path("/Users/joozo/VibeCoding/WRC/images/redesign/group-run-night-branded.jpg")
    cov = Image.open(cover_path).convert("RGB")
    cov_w = card_x2 - card_x1
    cov_h = 420
    scale = max(cov_w / cov.width, cov_h / cov.height)
    cov = cov.resize((int(cov.width * scale), int(cov.height * scale)), Image.Resampling.LANCZOS)
    cx, cy = (cov.width - cov_w) // 2, (cov.height - cov_h) // 2
    cov_cropped = cov.crop((cx, cy, cx + cov_w, cy + cov_h))

    corner_r = 34
    mask_c = Image.new("L", (cov_w, cov_h), 0)
    mc_draw = ImageDraw.Draw(mask_c)
    mc_draw.rounded_rectangle((0, 0, cov_w, cov_h + corner_r), radius=corner_r, fill=255)

    im_rgba = im.convert("RGBA")
    cov_rgba = cov_cropped.convert("RGBA")
    im_rgba.paste(cov_rgba, (card_x1, card_y1), mask_c)
    im = im_rgba.convert("RGB")
    d = ImageDraw.Draw(im)

    pill(d, (112, card_y1 + 450), "团跑活动 · 界面示意", "#E5EFCF", GREEN, 20)
    text(d, (112, card_y1 + 515), "周六清晨 · 滨江绿道 10KM 团跑", 36, "#173E30", True)
    text(d, (112, card_y1 + 580), "时间：本周六 07:00 — 09:00", 24, "#65796F")
    text(d, (112, card_y1 + 625), "地点：滨江公园跑者驿站 · 集合签到", 24, "#65796F")

    d.line((112, card_y1 + 700, card_x2 - 44, card_y1 + 700), fill="#DCE4DE", width=2)
    text(d, (112, card_y1 + 735), "28 人已报名", 26, "#315C45", True)
    text(d, (card_x2 - 250, card_y1 + 735), "查看活动详情 →", 24, GREEN, True)

    text(d, (88, 1620), "发现团跑活动，和跑友相约，\n把今天的路一起跑完。", 28, WHITE, spacing=12)
    return im


def scene4():
    im = glow(base(GREEN), (120, 1070), 430)
    d = ImageDraw.Draw(im)
    header(d, "03 / CHALLENGE", "一起挑战")
    text(d, (88, 240), "为自己定一个，够得到的目标", 25, LIME, True)
    text(d, (82, 310), "一点点进步，\n看得见。", 80, WHITE, True, 12)
    text(d, (88, 520), "参加里程挑战，设定目标，随时查看完成进度。", 30, SAGE, spacing=17)

    card_x1, card_y1, card_x2, card_y2 = 68, 680, 1012, 1450
    d.rounded_rectangle((card_x1, card_y1, card_x2, card_y2), radius=34, fill=WHITE)

    pill(d, (112, card_y1 + 45), "月度挑战 · 界面示意", "#E5EFCF", GREEN, 20)
    text(d, (112, card_y1 + 115), "金秋十月 · 突破 100KM 里程挑战", 36, "#173E30", True)
    text(d, (112, card_y1 + 175), "时间：10月1日 — 10月31日 · 剩余 18 天", 24, "#65796F")

    d.line((112, card_y1 + 230, card_x2 - 44, card_y1 + 230), fill="#DCE4DE", width=2)

    cx, cy, r = 260, card_y1 + 430, 140
    d.ellipse((cx-r, cy-r, cx+r, cy+r), fill="#E7EEE8")
    d.pieslice((cx-r, cy-r, cx+r, cy+r), -90, int(-90 + 360 * 0.65), fill=GREEN)
    inner_r = 108
    d.ellipse((cx-inner_r, cy-inner_r, cx+inner_r, cy+inner_r), fill=WHITE)
    text(d, (cx, cy-22), "65%", 52, GREEN, True, anchor="mm")
    text(d, (cx, cy+32), "已完成", 18, "#73867C", anchor="mm")

    rx = 450
    text(d, (rx, card_y1 + 320), "我的挑战进度", 24, "#668075", True)
    text(d, (rx, card_y1 + 370), "65.0", 56, GREEN, True)
    text(d, (rx + 150, card_y1 + 395), "/ 100.0 公里", 24, "#65796F")
    text(d, (rx, card_y1 + 455), "还差 35.0 公里达到目标", 22, "#61776B")

    d.rounded_rectangle((rx, card_y1 + 505, card_x2 - 60, card_y1 + 520), radius=7, fill="#E7EEE8")
    d.rounded_rectangle((rx, card_y1 + 505, rx + int((card_x2 - 60 - rx) * 0.65), card_y1 + 520), radius=7, fill=GREEN)

    d.line((112, card_y1 + 610, card_x2 - 44, card_y1 + 610), fill="#DCE4DE", width=2)
    text(d, (112, card_y1 + 645), "56 人正在参与挑战", 24, "#315C45", True)
    text(d, (card_x2 - 250, card_y1 + 645), "查看挑战详情 →", 24, GREEN, True)

    text(d, (88, 1550), "加入里程挑战，设定目标，\n看见坚持一点点累积。", 29, WHITE, spacing=13)
    return im


def scene5():
    im = glow(base(DEEP), (960, 1250), 380)
    d = ImageDraw.Draw(im)
    header(d, "04 / RUN WITH FRIENDS", "跑友同行")
    text(d, (88, 240), "看见彼此的努力", 25, LIME, True)
    text(d, (82, 310), "跑友的每一步，\n都是鼓励。", 76, WHITE, True, 12)
    text(d, (88, 520), "浏览跑友动态与跑步数据，也看看大家的月榜、年榜。", 29, SAGE, spacing=15)

    cards = [
        (660, "张跑跑 · 晨跑打卡", "今天完成 8.5 公里。微风舒服，下一次大家一起出发！", "今天 06:45 · 里程 8.5KM · 平均配速 5'18''"),
        (940, "李明 · 挑战进度更新", "十月百公里挑战完成过半，离目标越来越近了。", "昨天 20:10 · 累计跑量 52.0KM · 达成率 52%")
    ]
    for y, name, copy, meta in cards:
        d.rounded_rectangle((70, y, 1010, y + 245), radius=27, fill="#0D4635", outline="#38634D", width=2)
        d.ellipse((110, y+30, 168, y+88), fill=LIME)
        initial = name[0]
        text(d, (139, y+59), initial, 25, GREEN, True, anchor="mm")
        text(d, (194, y+40), name, 26, WHITE, True)
        text(d, (112, y+115), copy, 23, WHITE)
        text(d, (112, y+180), meta, 19, SAGE)

    d.rounded_rectangle((70, 1240, 1010, 1440), radius=27, fill="#0D4635", outline="#38634D", width=2)
    pill(d, (108, 1280), "月榜 TOP 3", LIME, GREEN, 21)
    pill(d, (290, 1280), "年度跑量榜", "#315F49", WHITE, 21)
    text(d, (112, 1365), "相互激励，为每一位坚持奔跑的伙伴喝彩", 24, "#F4F5EF")

    text(d, (88, 1560), "分享进步，也为彼此加油。", 30, WHITE)
    return im


def scene6():
    im = glow(base(GREEN), (540, 750), 480)
    d = ImageDraw.Draw(im)
    header(d, "WRC  ·  RUN TOGETHER", "06 / 06")
    text(d, (540, 590), "WRC", 145, WHITE, True, anchor="mm")
    d.rounded_rectangle((473, 710, 607, 720), radius=5, fill=LIME)
    text(d, (540, 795), "微网跑团", 39, WHITE, True, anchor="mm")
    text(d, (540, 930), "记录  ·  挑战  ·  相聚", 25, LIME, True, anchor="mm")
    text(d, (540, 1070), "今天，", 58, WHITE, True, anchor="mm")
    text(d, (540, 1180), "一起跑。", 92, LIME, True, anchor="mm")
    d.rounded_rectangle((190, 1330, 890, 1420), radius=45, fill=LIME)
    text(d, (540, 1375), "打开微信小程序，和跑友一起出发", 26, DEEP, True, anchor="mm")
    text(d, (540, 1660), "微网跑团。今天，一起跑。", 26, "#E4EBE5", anchor="mm")
    return im


SCENES = [scene1, scene2, scene3, scene4, scene5, scene6]
for index, renderer in enumerate(SCENES, 1):
    target = OUT / f"scene-{index:02}.png"
    renderer().save(target, optimize=True)
    print(target)

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math

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
    d.rounded_rectangle((68, 690, 1012, 1545), radius=34, fill=WHITE)
    text(d, (112, 735), "‹   我的跑步", 25, "#62776B", True)
    text(d, (112, 810), "跑量记录", 30, "#173E30", True)
    d.rounded_rectangle((104, 875, 976, 1190), radius=26, fill="#E7EEE8")
    text(d, (144, 915), "本周跑量", 22, "#61776B")
    text(d, (140, 966), "21.6", 86, GREEN, True)
    text(d, (365, 1012), "公里", 24, "#61776B")
    stats = [("4 天", "本月打卡"), ("7 天", "连续打卡"), ("168", "今年公里")]
    for i, (v, label) in enumerate(stats):
        x = 134 + i * 273
        d.rounded_rectangle((x, 1085, x + 244, 1170), radius=16, fill=WHITE)
        text(d, (x + 18, 1095), v, 29, GREEN, True)
        text(d, (x + 18, 1135), label, 17, "#61776B")
    text(d, (112, 1230), "跑步日历", 26, "#173E30", True)
    for i in range(28):
        row, col = divmod(i, 7)
        x, y = 116 + col * 119, 1290 + row * 48
        c = "#DCE5DD" if i not in (1, 3, 4, 8, 9, 11, 13, 17, 20, 24) else (GREEN if i in (3, 9, 17) else "#8DCB57")
        d.rounded_rectangle((x, y, x + 94, y + 30), radius=8, fill=c)
    pill(d, (112, 1600), "界面示意", "#DCE9D3", GREEN, 20)
    text(d, (112, 1700), "记录跑步，查看跑量与打卡日历，\n让每一步都有迹可循。", 27, "#E4EBE5", spacing=12)
    return im.convert("RGB")


def scene3():
    im = glow(base(GREEN), (980, 850), 400)
    d = ImageDraw.Draw(im)
    header(d, "02 / GROUP RUN", "发现团跑")
    text(d, (88, 260), "把一个人的路，跑成大家的故事", 25, LIME, True)
    text(d, (82, 335), "约一场团跑，\n一起出发。", 77, WHITE, True, 13)
    text(d, (88, 545), "发现活动安排，与跑友相约见面。", 30, "#E5ECE7")
    d.rounded_rectangle((68, 850, 1012, 1475), radius=32, fill=WHITE)
    pill(d, (112, 900), "团跑活动 · 界面示意", "#E5EFCF", GREEN, 20)
    text(d, (106, 1000), "周末，一起去跑步", 40, "#173E30", True)
    text(d, (112, 1080), "浏览活动详情，确认时间与地点，\n报名后和跑友一起出发。", 28, "#65796F", spacing=16)
    d.line((112, 1250, 966, 1250), fill="#DCE4DE", width=2)
    d.rounded_rectangle((112, 1290, 205, 1400), radius=18, fill="#E5EFCF")
    text(d, (158, 1320), "周末", 21, GREEN, True, anchor="mm")
    text(d, (158, 1365), "团跑", 24, GREEN, True, anchor="mm")
    text(d, (240, 1290), "查看活动安排", 24, "#315C45", True)
    text(d, (240, 1340), "时间　·　地点　·　报名跑友", 21, GREEN)
    text(d, (88, 1590), "发现团跑活动，和跑友相约，\n把今天的路一起跑完。", 28, WHITE, spacing=12)
    return im.convert("RGB")


def scene4():
    im = glow(base(GREEN), (120, 1070), 430)
    d = ImageDraw.Draw(im)
    header(d, "03 / CHALLENGE", "一起挑战")
    text(d, (88, 250), "为自己定一个，够得到的目标", 25, LIME, True)
    text(d, (82, 325), "一点点进步，\n看得见。", 80, WHITE, True, 12)
    text(d, (88, 545), "参加里程挑战，设定目标，\n随时查看完成进度。", 30, SAGE, spacing=17)
    d.rounded_rectangle((68, 800, 1012, 1350), radius=34, fill=WHITE)
    cx, cy, r = 330, 1070, 151
    d.ellipse((cx-r, cy-r, cx+r, cy+r), fill="#DCE5DD")
    d.pieslice((cx-r, cy-r, cx+r, cy+r), -90, 144, fill=GREEN)
    d.ellipse((cx-r+25, cy-r+25, cx+r-25, cy+r-25), fill=WHITE)
    text(d, (cx, cy-28), "65%", 53, GREEN, True, anchor="mm")
    text(d, (cx, cy+39), "界面示意", 17, "#73867C", anchor="mm")
    text(d, (550, 915), "我的挑战进度", 22, "#668075")
    text(d, (548, 975), "向目标继续跑", 34, "#173E30", True)
    text(d, (548, 1045), "每一次打卡都在累积，\n离目标再近一点。", 23, "#61776B", spacing=14)
    d.rounded_rectangle((548, 1170, 940, 1190), radius=10, fill="#DCE5DD")
    d.rounded_rectangle((548, 1170, 803, 1190), radius=10, fill=GREEN)
    text(d, (88, 1450), "加入里程挑战，设定目标，\n看见坚持一点点累积。", 29, WHITE, spacing=13)
    return im.convert("RGB")


def scene5():
    im = glow(base(DEEP), (960, 1250), 380)
    d = ImageDraw.Draw(im)
    header(d, "04 / RUN WITH FRIENDS", "跑友同行")
    text(d, (88, 245), "看见彼此的努力", 25, LIME, True)
    text(d, (82, 320), "跑友的每一步，\n都是鼓励。", 76, WHITE, True, 12)
    text(d, (88, 535), "浏览跑友动态与跑步数据，\n也看看大家的月榜、年榜。", 29, SAGE, spacing=15)
    cards = [(730, "跑友动态", "完成今天的训练。下一次，也一起出发吧。", "跑步记录　·　里程与配速"),
             (1010, "跑步数据", "个人跑步日历，汇总每一次打卡。", "月度数据　·　年度数据")]
    for y, name, copy, meta in cards:
        d.rounded_rectangle((70, y, 1010, y + 238), radius=27, fill="#0D4635", outline="#38634D", width=2)
        d.ellipse((110, y+30, 168, y+88), fill=LIME)
        text(d, (139, y+59), "跑" if name == "跑友动态" else "W", 25, GREEN, True, anchor="mm")
        text(d, (194, y+39), name, 25, WHITE, True)
        text(d, (112, y+117), copy, 23, WHITE)
        text(d, (112, y+178), meta, 19, SAGE)
    d.rounded_rectangle((70, 1300, 1010, 1465), radius=27, fill="#0D4635", outline="#38634D", width=2)
    pill(d, (108, 1340), "月榜", LIME, GREEN, 21)
    pill(d, (240, 1340), "年榜", "#315F49", WHITE, 21)
    text(d, (415, 1350), "为每一份坚持喝彩", 25, WHITE, True)
    text(d, (88, 1600), "分享进步，也为彼此加油。", 30, WHITE)
    return im.convert("RGB")


def scene6():
    im = glow(base(GREEN), (540, 750), 480)
    d = ImageDraw.Draw(im)
    header(d, "WRC  ·  RUN TOGETHER", "05 / 06")
    text(d, (540, 590), "WRC", 145, WHITE, True, anchor="mm")
    d.rounded_rectangle((473, 710, 607, 720), radius=5, fill=LIME)
    text(d, (540, 795), "微网跑团", 39, WHITE, True, anchor="mm")
    text(d, (540, 930), "记录  ·  挑战  ·  相聚", 25, LIME, True, anchor="mm")
    text(d, (540, 1070), "今天，", 58, WHITE, True, anchor="mm")
    text(d, (540, 1180), "一起跑。", 92, LIME, True, anchor="mm")
    d.rounded_rectangle((190, 1330, 890, 1420), radius=45, fill=LIME)
    text(d, (540, 1375), "打开微信小程序，和跑友一起出发", 26, DEEP, True, anchor="mm")
    text(d, (540, 1660), "微网跑团。今天，一起跑。", 26, "#E4EBE5", anchor="mm")
    return im.convert("RGB")


SCENES = [scene1, scene2, scene3, scene4, scene5, scene6]
for index, renderer in enumerate(SCENES, 1):
    target = OUT / f"scene-{index:02}.png"
    renderer().save(target, optimize=True)
    print(target)

import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "birds.json"

# Granice mapy z Wikimedia Commons
LAT_MIN, LAT_MAX = 48.7, 55.2
LON_MIN, LON_MAX = 13.8, 24.5

def lon_to_x(lon, width):
    return round((lon - LON_MIN) / (LON_MAX - LON_MIN) * width)

def lat_to_y(lat, height):
    return round((LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * height)

def draw_marker(draw, x, y):
    r_outer = 13
    r_inner = 9

    # cień
    draw.ellipse(
        [x - r_outer + 2, y - r_outer + 2, x + r_outer + 2, y + r_outer + 2],
        fill=(0, 0, 0, 45)
    )

    # biały ring
    draw.ellipse(
        [x - r_outer, y - r_outer, x + r_outer, y + r_outer],
        fill="white"
    )

    # czerwony środek
    draw.ellipse(
        [x - r_inner, y - r_inner, x + r_inner, y + r_inner],
        fill="#c83c3c"
    )

with open(DATA, "r", encoding="utf-8") as f:
    data = json.load(f)

base_map = ROOT / data["map_base"]["image"]

for dataset in data["datasets"]:
    img = Image.open(base_map).convert("RGBA")
    draw = ImageDraw.Draw(img)

    lat = dataset["map"]["lat"]
    lon = dataset["map"]["lon"]

    width, height = img.size
    x = lon_to_x(lon, width)
    y = lat_to_y(lat, height)

    draw_marker(draw, x, y)

    out = ROOT / dataset["map"]["image"]
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out)

    print("Saved:", out)
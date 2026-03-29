import json
from pathlib import Path

from PIL import Image, ImageDraw
from pyproj import Transformer

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "birds.json"

# Parametry mapy (QGIS export, EPSG:2180)
X_MIN = 117562.340
X_MAX = 904492.780
Y_MIN = 92488.200
Y_MAX = 829015.020

# Transformacja: WGS84 -> EPSG:2180
transformer = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True)


def x_to_px(x, width):
    return round((x - X_MIN) / (X_MAX - X_MIN) * width)


def y_to_px(y, height):
    return round((Y_MAX - y) / (Y_MAX - Y_MIN) * height)


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def lonlat_to_2180(lon, lat):
    return transformer.transform(lon, lat)


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


def save_web_only(img, out_path):
    web_size = 800

    img_web = img.resize((web_size, web_size), Image.LANCZOS)

    web_out = out_path.with_suffix(".webp")
    img_web.save(web_out, "WEBP", quality=80, method=6)

    return web_out


# --- MAIN ---

with open(DATA, "r", encoding="utf-8") as f:
    data = json.load(f)

base_map = ROOT / data["map_base"]["image"]

if not base_map.exists():
    raise FileNotFoundError(f"Brak pliku mapy bazowej: {base_map}")

for dataset in data.get("datasets", []):
    map_data = dataset.get("map", {})
    lat = map_data.get("lat")
    lon = map_data.get("lon")
    out_rel = map_data.get("image")

    if lat is None or lon is None or not out_rel:
        print(f"Pomijam dataset: {dataset.get('id', '<brak id>')}")
        continue

    with Image.open(base_map).convert("RGBA") as img:
        draw = ImageDraw.Draw(img)
        width, height = img.size

        # --- transformacja ---
        x_map, y_map = lonlat_to_2180(lon, lat)
        x = x_to_px(x_map, width)
        y = y_to_px(y_map, height)

        # --- clamp ---
        x = clamp(x, 0, width - 1)
        y = clamp(y, 0, height - 1)

        # --- marker ---
        draw_marker(draw, x, y)

        # --- zapis ---
        out = ROOT / out_rel
        out.parent.mkdir(parents=True, exist_ok=True)

        web_out = save_web_only(img, out)

        print(
            f"Saved: {web_out} | "
            f"lon={lon}, lat={lat} -> px=({x},{y})"
        )
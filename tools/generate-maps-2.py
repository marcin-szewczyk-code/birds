import json
from pathlib import Path

from PIL import Image, ImageDraw
from pyproj import Transformer

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "birds.json"

# Parametry mapy wyeksportowanej z QGIS
# CRS mapy: EPSG:2180
# Rozmiar obrazu: 1400 x 1400 px
# Extent:
#   X min = 120000
#   X max = 910000
#   Y min = 150000
#   Y max = 870000

X_MIN = 117562.340
X_MAX = 904492.780
Y_MIN = 92488.200
Y_MAX = 829015.020

# Transformacja: WGS84 (lon/lat) -> EPSG:2180
# always_xy=True oznacza: wejście podajemy jako (lon, lat)
transformer = Transformer.from_crs("EPSG:4326", "EPSG:2180", always_xy=True)


def x_to_px(x, width):
    return round((x - X_MIN) / (X_MAX - X_MIN) * width)


def y_to_px(y, height):
    return round((Y_MAX - y) / (Y_MAX - Y_MIN) * height)


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


def lonlat_to_2180(lon, lat):
    x, y = transformer.transform(lon, lat)
    return x, y


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

if not base_map.exists():
    raise FileNotFoundError(f"Brak pliku mapy bazowej: {base_map}")

for dataset in data.get("datasets", []):
    map_data = dataset.get("map", {})
    lat = map_data.get("lat")
    lon = map_data.get("lon")
    out_rel = map_data.get("image")

    if lat is None or lon is None or not out_rel:
        print(f"Pomijam dataset bez pełnych danych mapy: {dataset.get('id', '<brak id>')}")
        continue

    with Image.open(base_map).convert("RGBA") as img:
        draw = ImageDraw.Draw(img)
        width, height = img.size

        # 1. lon/lat -> EPSG:2180
        x_map, y_map = lonlat_to_2180(lon, lat)

        # 2. EPSG:2180 -> piksele obrazu
        x = x_to_px(x_map, width)
        y = y_to_px(y_map, height)

        # 3. zabezpieczenie przed wyjściem poza obraz
        x = clamp(x, 0, width - 1)
        y = clamp(y, 0, height - 1)

        # 4. marker
        draw_marker(draw, x, y)

        out = ROOT / out_rel
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out)

        print(
            f"Saved: {out} | "
            f"lon={lon}, lat={lat} -> "
            f"x2180={x_map:.2f}, y2180={y_map:.2f} -> "
            f"px={x}, py={y}"
        )
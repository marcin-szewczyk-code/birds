import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "birds.json"

# Parametry mapy bazowej:
# - projection: Equirectangular
# - N/S stretching: 160%
# - geographic limits:
#     N: 55.2° N
#     S: 48.7° N
#     W: 13.8° E
#     E: 24.5° E
#
# Uwaga:
# Mapa wejściowa jest już gotowym obrazem po rozciągnięciu w osi N/S.
# Dlatego współrzędne przeliczamy liniowo względem rozmiaru obrazu
# i granic geograficznych tej konkretnej mapy.

LAT_MIN = 48.7   # S
LAT_MAX = 55.2   # N
LON_MIN = 13.8   # W
LON_MAX = 24.5   # E

PROJECTION = "Equirectangular"
NS_STRETCH = 1.60


def lon_to_x(lon, width):
    return round((lon - LON_MIN) / (LON_MAX - LON_MIN) * width)


def lat_to_y(lat, height):
    return round((LAT_MAX - lat) / (LAT_MAX - LAT_MIN) * height)


def clamp(value, min_value, max_value):
    return max(min_value, min(value, max_value))


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
        x = lon_to_x(lon, width)
        y = lat_to_y(lat, height)

        x = clamp(x, 0, width - 1)
        y = clamp(y, 0, height - 1)

        draw_marker(draw, x, y)

        out = ROOT / out_rel
        out.parent.mkdir(parents=True, exist_ok=True)
        img.save(out)

        print("Saved:", out)
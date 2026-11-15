"""Compute a baseline surface distance; no route or slope is inferred."""
from pathlib import Path
import json
import math

CONFIG = Path(__file__).resolve().parents[1] / "data" / "nasa" / "mission_site.json"


def great_circle_km(lat1, lon1, lat2, lon2, radius_km=1737.4):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = (math.sin(dp / 2) ** 2 +
         math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2)
    return 2 * radius_km * math.asin(math.sqrt(min(1.0, a)))


def main():
    config = json.loads(CONFIG.read_text(encoding="utf-8"))
    a = config["locations"]["base_alpha"]
    b = config["locations"]["orion7_last_known"]
    d = great_circle_km(a["lat_deg"], a["lon_deg"], b["lat_deg"], b["lon_deg"], config["lunar_mean_radius_km"])
    print(f"Base Alpha -> ORION: {d:.3f} km (approximate shortest arc, NOT a safe road)")
    print("Slope, illumination and line of sight: still to be measured with NASA products.")


if __name__ == "__main__":
    main()

"""Least-cost route options between base and rover on the NASA LOLA Site01 slope raster.

Usage (from repo root): python scripts/compute_routes.py
Requires: rasterio numpy scikit-image pyproj
Reads data/nasa/mission_site.json and data/nasa/raw_lola/*.tif (not committed to git).
Writes data/nasa/route_options.json.

What this is: plausible routes on a 5 m/px slope map. NOT verified safe paths:
boulders, small craters, regolith softness and shadows are not in this data.
Speeds come from NASA VIPER documents (a robotic lunar polar rover) and are
used here as an analog; see SPEEDS for sources.
"""
import json
import math
from pathlib import Path

import numpy as np
import rasterio
from pyproj import CRS, Transformer
from skimage.graph import route_through_array

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'data/nasa/mission_site.json'
RAW = ROOT / 'data/nasa/raw_lola'
OUT = ROOT / 'data/nasa/route_options.json'
R = 1737400.0
BUFFER_M = 500          # extra map around the base-rover line
SLOPE_LIMIT_DEG = 15.0  # VIPER design limit, used as hard "no-go" analog

SPEEDS = {
    'top_speed_m_s': 0.20,
    'prospecting_speed_m_s': 0.10,
    'speed_made_good_m_s': 0.008,
    'sources': [
        'https://ntrs.nasa.gov/api/citations/20250004148/downloads/viper-2025-04-24.pdf '
        '(20 cm/s max driving speed; 0.8 cm/s Speed Made Good; 15 deg slope design limit)',
        'https://ntrs.nasa.gov/citations/20230004239 '
        '(up to 20 cm/s on flat terrain; effective speed ~1 cm/s after commanding, '
        'localization, navigation and obstacle-avoidance delays)',
    ],
    'caveat': 'VIPER is a teleoperated robotic rover, used here as an analog. '
              'Replace if the mission rover is a different vehicle.',
}

PROFILES = {
    'direct': {'desc': 'Shortest path that avoids slopes above the limit',
               'cost': lambda s: np.ones_like(s)},
    'balanced': {'desc': 'Trades some length for gentler slopes',
                 'cost': lambda s: 1.0 + (s / 5.0) ** 2},
    'flattest': {'desc': 'Strongly prefers flat ground, even if longer',
                 'cost': lambda s: 1.0 + (s / 2.0) ** 3},
}


def main():
    loc = json.loads(SITE.read_text(encoding='utf-8'))['locations']
    base, rover = loc['base_alpha'], loc['orion7_last_known']
    geo = CRS.from_proj4(f'+proj=longlat +a={R} +b={R} +no_defs +type=crs')
    st = CRS.from_proj4(f'+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +a={R} +b={R} '
                        '+units=m +no_defs +type=crs')
    tr = Transformer.from_crs(geo, st, always_xy=True)
    x0, y0 = tr.transform(base['lon_deg'], base['lat_deg'])
    x1, y1 = tr.transform(rover['lon_deg'], rover['lat_deg'])

    with rasterio.open(RAW / 'Site01_final_adj_5mpp_slp.tif') as slp, \
         rasterio.open(RAW / 'Site01_final_adj_5mpp_surf.tif') as dem:
        res = slp.res[0]
        xmin, xmax = min(x0, x1) - BUFFER_M, max(x0, x1) + BUFFER_M
        ymin, ymax = min(y0, y1) - BUFFER_M, max(y0, y1) + BUFFER_M
        win = rasterio.windows.from_bounds(xmin, ymin, xmax, ymax, slp.transform).round_offsets().round_lengths()
        s = slp.read(1, window=win, masked=True)
        z = dem.read(1, window=win, masked=True)
        wtr = slp.window_transform(win)
        if s.mask.any():
            raise ValueError('Window contains no-data pixels; widen coverage check before routing')
        s = np.asarray(s, dtype=float)
        z = np.asarray(z, dtype=float)

        def to_rc(x, y):
            r, c = rasterio.transform.rowcol(wtr, x, y)
            return int(r), int(c)

        a, b = to_rc(x0, y0), to_rc(x1, y1)

    results = {}
    for name, prof in PROFILES.items():
        cost = prof['cost'](s)
        cost = np.where(s > SLOPE_LIMIT_DEG, np.inf, cost)
        path, _ = route_through_array(cost, a, b, fully_connected=True, geometric=True)
        p = np.array(path)
        dxy = np.hypot(np.diff(p[:, 0]), np.diff(p[:, 1])) * res
        dz = np.diff(z[p[:, 0], p[:, 1]])
        len2d = float(dxy.sum())
        len3d = float(np.hypot(dxy, dz).sum())
        sl = s[p[:, 0], p[:, 1]]
        results[name] = {
            'description': prof['desc'],
            'length_m': round(len2d, 1),
            'length_3d_m': round(len3d, 1),
            'max_slope_deg': round(float(sl.max()), 2),
            'mean_slope_deg': round(float(sl.mean()), 2),
            'ascent_m': round(float(dz[dz > 0].sum()), 1),
            'descent_m': round(float(-dz[dz < 0].sum()), 1),
            'drive_hours_at_top_speed': round(len3d / SPEEDS['top_speed_m_s'] / 3600, 2),
            'drive_hours_at_prospecting_speed': round(len3d / SPEEDS['prospecting_speed_m_s'] / 3600, 2),
            'drive_hours_at_speed_made_good': round(len3d / SPEEDS['speed_made_good_m_s'] / 3600, 1),
        }
    straight = math.hypot(x1 - x0, y1 - y0)
    doc = {
        'status': 'computed',
        'straight_line_m': round(straight, 1),
        'grid_m_per_px': res,
        'slope_limit_deg': SLOPE_LIMIT_DEG,
        'speed_assumptions': SPEEDS,
        'routes': results,
        'notes': [
            'Routes are least-cost paths on a 5 m/px slope raster, not verified safe paths.',
            'Boulders, small craters, soil softness and shadow are NOT modeled.',
            'Drive time excludes stops (diagnosis, comms, sampling, setup).',
        ],
    }
    OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(doc, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()

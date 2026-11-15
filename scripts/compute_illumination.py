"""Sun visibility along the base-rover routes, derived from the LOLA 5 m DEM (horizon method).

Usage (repo root): python scripts/compute_illumination.py   (needs compute_routes.py outputs' inputs)
Requires: rasterio numpy scikit-image pyproj
Writes data/nasa/illumination_along_routes.json

Method: for each route point (observer 1 m above ground), find the terrain horizon angle
in 72 azimuth directions (every 5 deg) out to 3 km, including lunar curvature. At the lunar
south pole the Sun stays within about 1.5 deg of the horizon and circles through all azimuths,
so the fraction of azimuths whose horizon is below the Sun's elevation approximates the
fraction of time the point is sunlit, for that Sun elevation.

NOT a full illumination model: no ephemeris/time series, Sun treated as a point, terrain
beyond the downloaded tile ignored, interpolated DEM gaps (~10% fill in the source) not masked.
Use as a relative comparison between routes, not as an absolute percentage.
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
OUT = ROOT / 'data/nasa/illumination_along_routes.json'
R = 1737400.0
SLOPE_LIMIT = 15.0
HORIZON_KM = 3000.0
OBS_H = 1.0
SUN_ELEVS = [0.5, 1.0, 1.5]
AZ = np.deg2rad(np.arange(0, 360, 5))
PROFILES = {
    'direct': lambda s: np.ones_like(s),
    'balanced': lambda s: 1.0 + (s / 5.0) ** 2,
    'flattest': lambda s: 1.0 + (s / 2.0) ** 3,
}


def horizon_fracs(z, r, c, res):
    h0 = z[r, c] + OBS_H
    steps = np.arange(1, int(HORIZON_KM / res) + 1)
    d = steps * res
    curv = d ** 2 / (2 * R)
    hor = []
    for az in AZ:
        rr = np.rint(r - steps * math.cos(az)).astype(int)   # row decreases to the "north"
        cc = np.rint(c + steps * math.sin(az)).astype(int)
        ok = (rr >= 0) & (rr < z.shape[0]) & (cc >= 0) & (cc < z.shape[1])
        if not ok.any():
            hor.append(-90.0)
            continue
        zz = z[rr[ok], cc[ok]]
        ang = np.degrees(np.arctan2(zz - h0 - curv[ok], d[ok]))
        ang = ang[np.isfinite(ang)]
        hor.append(float(ang.max()) if ang.size else -90.0)
    return np.array(hor)


def main():
    loc = json.loads(SITE.read_text(encoding='utf-8'))['locations']
    base, rover = loc['base_alpha'], loc['orion7_last_known']
    geo = CRS.from_proj4(f'+proj=longlat +a={R} +b={R} +no_defs +type=crs')
    st = CRS.from_proj4(f'+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +a={R} +b={R} +units=m +no_defs +type=crs')
    tr = Transformer.from_crs(geo, st, always_xy=True)
    x0, y0 = tr.transform(base['lon_deg'], base['lat_deg'])
    x1, y1 = tr.transform(rover['lon_deg'], rover['lat_deg'])
    with rasterio.open(RAW / 'Site01_final_adj_5mpp_slp.tif') as slp, \
         rasterio.open(RAW / 'Site01_final_adj_5mpp_surf.tif') as dem:
        res = slp.res[0]
        buf = HORIZON_KM + 100
        b = slp.bounds
        xmin, xmax = max(min(x0, x1) - buf, b.left), min(max(x0, x1) + buf, b.right)
        ymin, ymax = max(min(y0, y1) - buf, b.bottom), min(max(y0, y1) + buf, b.top)
        win = rasterio.windows.from_bounds(xmin, ymin, xmax, ymax, slp.transform).round_offsets().round_lengths()
        s = np.asarray(slp.read(1, window=win, masked=True).filled(np.nan), dtype=float)
        z = np.asarray(dem.read(1, window=win, masked=True).filled(np.nan), dtype=float)
        wtr = slp.window_transform(win)
        a = tuple(int(v) for v in rasterio.transform.rowcol(wtr, x0, y0))
        bb = tuple(int(v) for v in rasterio.transform.rowcol(wtr, x1, y1))
    nan_share = float(np.isnan(z).mean())
    out = {}
    for name, f in PROFILES.items():
        cost = np.where(np.nan_to_num(s, nan=99) > SLOPE_LIMIT, np.inf, f(np.nan_to_num(s, nan=0)))
        path, _ = route_through_array(cost, a, bb, fully_connected=True, geometric=True)
        pts = path[::4]  # a point every ~20 m
        fr = {e: [] for e in SUN_ELEVS}
        annual = []
        # Sun elevation over a year ~ 1.5 deg * sin(phase): above the horizon only about half the time
        phases = np.sin(np.linspace(0, 2 * math.pi, 73)[:-1]) * 1.5
        for (r, c) in pts:
            hz = horizon_fracs(z, r, c, res)
            for e in SUN_ELEVS:
                fr[e].append(float((hz < e).mean()))
            annual.append(float(np.mean([(hz < e).mean() for e in phases])))
        out[name] = {
            'points_sampled': len(pts),
            'mean_horizon_deg': None,
            'annual_cycle_estimate': {
                'mean': round(float(np.mean(annual)), 3),
                'min': round(float(np.min(annual)), 3),
                'note': 'Sun elevation modeled as 1.5 deg*sin(phase) over a year (below horizon half the time)'},
            'sunlit_fraction_by_sun_elevation': {
                f'{e}deg': {
                    'mean': round(float(np.mean(v)), 3),
                    'min': round(float(np.min(v)), 3),
                    'share_of_route_below_50pct': round(float((np.array(v) < 0.5).mean()), 3),
                } for e, v in fr.items()},
        }
        out[name].pop('mean_horizon_deg')
    doc = {
        'status': 'computed_approximation',
        'method': 'DEM horizon angles, 72 azimuths, 3 km range, 1 m observer height',
        'dem_nodata_share_in_window': round(nan_share, 4),
        'routes': out,
        'notes': [
            'The 0.5/1.0/1.5 deg scenarios assume the Sun is UP at that elevation (sunny season); they are NOT annual averages. Use annual_cycle_estimate for a yearly figure. Compare routes with each other.',
            'Sun elevation at the lunar south pole stays within roughly 1.5 deg of the horizon; scenarios 0.5/1.0/1.5 deg.',
            'Point-source Sun; no ephemeris or time series; terrain outside the downloaded tile ignored.',
        ],
    }
    OUT.write_text(json.dumps(doc, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(doc, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    main()

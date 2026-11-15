"""Descarga y analiza rasteres oficiales LOLA Site01 (Connecting Ridge).

Usage from the project root: python scripts/integrate_lola.py [--download]
Requiere pip install rasterio pyproj numpy (solo para procesar mapas).
It never invents measurements if data is missing or the location falls outside the raster.
"""
import argparse
import json
import math
from pathlib import Path
from urllib.request import urlretrieve

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'data/nasa/mission_site.json'
FOLDER = ROOT / 'data/nasa/raw_lola'
OUTPUT = ROOT / 'data/nasa/lola_measurements.json'
SOURCE = 'https://pgda.gsfc.nasa.gov/data/LOLA_5mpp/Site01/'
FILES = {
    'elevation': 'Site01_final_adj_5mpp_surf.tif',
    'slope': 'Site01_final_adj_5mpp_slp.tif',
}
R = 1737400.0


def download_data():
    FOLDER.mkdir(parents=True, exist_ok=True)
    for label, name in FILES.items():
        path = FOLDER / name
        if path.is_file() and path.stat().st_size > 1024:
            print(f'[EXISTE] {label}: {path}')
            continue
        print(f'[DESCARGANDO] {SOURCE + name}')
        tmp = path.with_suffix('.partial')
        try:
            urlretrieve(SOURCE + name, tmp)
            tmp.replace(path)
        except Exception:
            tmp.unlink(missing_ok=True)
            raise


def _sample(dataset, x, y):
    import numpy as np
    left, bottom, right, top = dataset.bounds
    if not (left <= x <= right and bottom <= y <= top):
        raise ValueError('Punto fuera de la cobertura del GeoTIFF')
    value = next(dataset.sample([(x, y)], masked=True))[0]
    if np.ma.is_masked(value) or not np.isfinite(float(value)):
        raise ValueError('Pixel has no valid data')
    return float(value)


def compute():
    import numpy as np
    import rasterio
    from pyproj import CRS, Transformer

    location = json.loads(SITE.read_text(encoding='utf-8'))['locations']
    base, rover = location['base_alpha'], location['orion7_last_known']
    files = {key: FOLDER / name for key, name in FILES.items()}
    missing = [str(path) for path in files.values() if not path.exists()]
    if missing:
        raise FileNotFoundError('Faltan TIFF: ' + ', '.join(missing))

    # The product is lunar polar stereographic, not Earth WGS84.
    moon_geo = CRS.from_proj4(f'+proj=longlat +a={R} +b={R} +no_defs +type=crs')
    moon_stereo = CRS.from_proj4(
        f'+proj=stere +lat_0=-90 +lat_ts=-90 +lon_0=0 +a={R} +b={R} +units=m +no_defs +type=crs'
    )
    xy = Transformer.from_crs(moon_geo, moon_stereo, always_xy=True)
    x0, y0 = xy.transform(base['lon_deg'], base['lat_deg'])
    x1, y1 = xy.transform(rover['lon_deg'], rover['lat_deg'])

    with rasterio.open(files['elevation']) as dem, rasterio.open(files['slope']) as slp:
        if dem.width != slp.width or dem.height != slp.height or dem.transform != slp.transform:
            raise ValueError('The DEM and slope products do not share the same grid')
        # Verificar que el CRS del GeoTIFF, si lo declara, sea compatible con el lunar esperado.
        if dem.crs is not None:
            actual = CRS.from_wkt(dem.crs.to_wkt())
            if not moon_stereo.equals(actual, ignore_axis_order=True):
                t_actual = Transformer.from_crs(moon_geo, actual, always_xy=True)
                probes = [(base['lon_deg'], base['lat_deg']), (rover['lon_deg'], rover['lat_deg']),
                          (0.0, -89.0), (90.0, -88.0), (-137.0, -89.5)]
                worst = max(math.hypot(*(a - b for a, b in zip(xy.transform(lo, la),
                                                                t_actual.transform(lo, la))))
                            for lo, la in probes)
                if worst > 0.01:
                    raise ValueError(f'CRS inesperado en TIFF (diferencia {worst:.3f} m): {dem.crs}. '
                                     'Check the lunar projection before measuring.')
                print(f'[NOTE] The TIFF CRS has no standard name, but it matches numerically '
                      f'the expected one (largest difference {worst:.6f} m).')
        dist = math.hypot(x1-x0, y1-y0)
        n = max(2, int(math.ceil(dist / 5)) + 1)
        xs = np.linspace(x0, x1, n)
        ys = np.linspace(y0, y1, n)
        elevations = np.array([_sample(dem, float(x), float(y)) for x, y in zip(xs,ys)])
        slopes = np.array([_sample(slp, float(x), float(y)) for x, y in zip(xs,ys)])

    # Visibilidad 1D por perfil, con supuestos EXPLÍCITOS sobre alturas de antena.
    # Interpolated line height, with an approximate correction for lunar curvature.
    base_antenna_m, rover_antenna_m = 2.0, 1.0
    fractions = np.linspace(0, 1, n)
    direct = ((elevations[0] + base_antenna_m) * (1-fractions)
              + (elevations[-1] + rover_antenna_m) * fractions)
    # El arco lunar se eleva respecto a la cuerda que conecta los extremos.
    curved_surface = elevations + dist**2 * fractions*(1-fractions) / (2*R)
    margins = direct - curved_surface
    interior_min = float(np.min(margins[1:-1])) if n > 2 else float('nan')
    obstructed = bool(interior_min < 0)

    result = {
        'status': 'measured',
        'source': SOURCE,
        'files': FILES,
        'site': 'Site01 / Connecting Ridge',
        'projection': 'Moon south polar stereographic, radius 1737400 m, lat_ts -90, lon_0 0',
        'notes': [
            'Profile of a projected straight line, NOT a road verified as drivable.',
            'The visibility analysis assumes antennas of 2 m (base) and 1 m (rover); it does not model a radio link.',
            'Slopes come from the NASA raster, not from a vehicle dynamics model.',
            'Illumination is not obtained from these two products.',
        ],
        'topography': {
            'status': 'measured',
            'projected_line_length_m': round(dist, 2),
            'samples': n,
            'base_elevation_m': round(float(elevations[0]), 2),
            'rover_elevation_m': round(float(elevations[-1]), 2),
            'max_slope_deg_on_line': round(float(np.max(slopes)), 2),
            'mean_slope_deg_on_line': round(float(np.mean(slopes)), 2),
            'route_validated': False,
        },
        'visibility': {
            'status': 'conditional_model',
            'base_antenna_height_m': base_antenna_m,
            'rover_antenna_height_m': rover_antenna_m,
            'terrain_obstructs_assumed_los': obstructed,
            'minimum_clearance_m': round(interior_min, 2),
            'radio_link_verified': False,
        },
        'illumination': {'status': 'pending', 'reason': 'Needs the LROC product and a time series'},
    }
    OUTPUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f'[OK] Mediciones guardadas en {OUTPUT}')
    print(json.dumps(result, indent=2, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--download', action='store_true', help='Descargar GeoTIFF oficiales desde NASA')
    args = parser.parse_args()
    if args.download:
        try:
            download_data()
        except Exception as exc:
            print(f'[ERROR] Descarga incompleta: {exc}')
            raise SystemExit(1)
    try:
        compute()
    except (ValueError, FileNotFoundError, ImportError) as exc:
        print(f'[SIN MEDICIONES] {exc}')
        raise SystemExit(1)

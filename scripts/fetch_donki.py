"""Ejecutar con Internet: python scripts/fetch_donki.py"""
import json
import os
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import urlopen

params = urlencode({'startDate':'2024-05-10','endDate':'2024-05-12',
                    'api_key':os.environ.get('NASA_API_KEY','DEMO_KEY')})
try:
    with urlopen('https://api.nasa.gov/DONKI/SEP?'+params,timeout=20) as response:
        records=json.load(response)
except Exception as exc:
    raise SystemExit(f'No se pudo obtener DONKI: {exc}') from exc
if not isinstance(records,list):
    raise SystemExit('Respuesta inesperada (no es lista JSON).')
file=Path(__file__).resolve().parents[1]/'data/nasa/donki_sep_api_raw.json'
file.write_text(json.dumps(records,indent=2,ensure_ascii=False),encoding='utf-8')
print(f'Se guardaron {len(records)} eventos NASA en {file}.')
for event in records:
    print(event.get('sepID'),event.get('eventTime'),event.get('link'))

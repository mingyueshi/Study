"""人类起源专题的文件编排。"""
import json
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured

DATA_PATH = Path(__file__).with_name('data') / 'stations.json'


def load_stations():
    data = json.loads(DATA_PATH.read_text(encoding='utf-8'))
    stations = data['stations']
    if data['schema_version'] != 1 or not stations:
        raise ImproperlyConfigured('人类起源专题的数据版本或站点列表有误。')
    if len({station['slug'] for station in stations}) != len(stations):
        raise ImproperlyConfigured('人类起源专题的站点编号重复。')
    return stations

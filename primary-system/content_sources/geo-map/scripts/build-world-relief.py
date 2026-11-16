"""把 GMT 的半度地形网格编码为本地灰度图；只在更新素材时需要 netCDF4 和 Pillow。"""
import argparse
import hashlib
from pathlib import Path

from netCDF4 import Dataset
from PIL import Image
import numpy as np

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('grid', type=Path)
args = parser.parse_args()
expected = '62e38aa0008c00d7adbc9fe4bd9816761fad278da209095e417c177a05c43043'
if hashlib.sha256(args.grid.read_bytes()).hexdigest() != expected:
    raise SystemExit('源网格指纹不匹配，请先核对来源与版本。')
with Dataset(args.grid) as source:
    assert source.variables['z'].shape == (361, 721)
    assert tuple(source.variables['lat'][[0, -1]]) == (-90, 90)
    assert tuple(source.variables['lon'][[0, -1]]) == (-180, 180)
    heights = np.asarray(source.variables['z'][:], dtype=float)[::-1]
    pixels = np.rint(np.clip((heights + 11000) / 20000, 0, 1) * 255).astype('uint8')
dest = Path(__file__).resolve().parent.parent / 'assets/world-relief.png'
Image.fromarray(pixels).save(dest, optimize=True)
print(f'{dest.name}：721 × 361，SHA-256 {hashlib.sha256(dest.read_bytes()).hexdigest()}')

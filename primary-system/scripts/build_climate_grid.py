#!/usr/bin/env python3
"""从 Beck 1991–2020 GeoTIFF 以 0.25° 格心采样，输出中国专题使用的类别索引。"""
import argparse
import json
import math
from pathlib import Path

from PIL import Image

DEST = Path(__file__).resolve().parents[1] / 'content_sources/climate/china-climate-grid.js'
WEST, EAST, SOUTH, NORTH = 72, 136, 17, 55
STEP = 0.25
CODES = '0123456789abcdefghijklmnopqrstu'


def sample(path):
    # 输入是已核对来源的全球数据，像素数超过 Pillow 默认的照片大小限制。
    Image.MAX_IMAGE_PIXELS = None
    with Image.open(path) as raster:
        dx, dy, _ = raster.tag_v2[33550]
        _, _, _, left, top, _ = raster.tag_v2[33922]
        attrs = raster.tag_v2[34735]
        # 本版本采用经纬度 WGS 84，值为 Beck 图例里的 0—30。
        if raster.mode not in ('P', 'L') or (left, top) != (-180, 90) or 4326 not in attrs:
            raise ValueError('需要 Beck 分类图的全球 WGS84 字节栅格')
        if not (math.isclose(dx, dy) and math.isclose(raster.width * dx, 360)
                and math.isclose(raster.height * dy, 180)):
            raise ValueError('栅格的全球范围或比例不一致')
        cols = range(round((EAST - WEST) / STEP))
        rows = range(round((NORTH - SOUTH) / STEP))
        indexes = [int((WEST + STEP * (col + .5) - left) / dx) for col in cols]
        pixels = raster.load()
        cells = []
        for row in rows:
            y = int((top - (NORTH - STEP * (row + .5))) / dy)
            values = [pixels[x, y] for x in indexes]
            if any(value >= len(CODES) for value in values):
                raise ValueError('发现不在图例里的类别值')
            cells.append(''.join(CODES[value] for value in values))
        return dict(west=WEST, east=EAST, south=SOUTH, north=NORTH, step=STEP, rows=cells)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('tif', type=Path)
    data = json.dumps(sample(parser.parse_args().tif), indent=2, ensure_ascii=False)
    DEST.write_text(
        '/* 由 scripts/build_climate_grid.py 生成。Beck et al. (2023), CC BY 4.0。 */\n'
        '(function () {\n  const grid = ' + data + ';\n'
        "  if (typeof module === 'object' && module.exports) module.exports = grid;\n"
        '  else window.ChinaClimateGrid = grid;\n})();\n',
        encoding='utf-8',
    )


if __name__ == '__main__':
    main()

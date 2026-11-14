"""描红只使用当前已就绪的笔顺资产，不拉取或修订第二份字库。"""
import math


def writer_data(asset):
    """坏数据保留原有静态查看，不能交给交互笔顺引擎。"""
    if asset is None:
        return None
    strokes, medians = asset.strokes, asset.medians
    if not isinstance(strokes, list) or not isinstance(medians, list):
        return None
    if not strokes or len(strokes) != len(medians):
        return None
    for path, median in zip(strokes, medians):
        if not isinstance(path, str) or not path.strip():
            return None
        if not isinstance(median, list) or len(median) < 2:
            return None
        for point in median:
            if not isinstance(point, list) or len(point) != 2:
                return None
            if any(type(value) not in (int, float) or not math.isfinite(value) for value in point):
                return None
    return {"character": asset.character, "strokes": strokes, "medians": medians}

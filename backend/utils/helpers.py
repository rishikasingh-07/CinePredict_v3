"""
helpers.py — confidence score.
Overview/plot is NOT included: it's only used for AI suggestions, not the ML model.
"""

# Only fields the model actually uses
_FIELD_WEIGHTS = {
    "budget":                 25,
    "genres":                 20,
    "release_month":          14,
    "director":               12,
    "top_cast":               10,
    "runtime":                 9,
    "production_companies":    6,
    "keywords":                4,
}

def _filled(key, value) -> bool:
    if key == "genres":
        if isinstance(value, list): return len(value) > 0
        if isinstance(value, str):  return len(value.strip()) > 2
        return False
    if key in ("budget", "runtime"):
        try: return float(value) > 0
        except (TypeError, ValueError): return False
    if key in ("top_cast", "production_companies", "keywords"):
        if isinstance(value, list): return len(value) > 0
        return bool(value) and str(value).strip() not in ("", "[]")
    return bool(value) and str(value).strip() != ""

def calculate_confidence(data: dict) -> dict:
    total = sum(_FIELD_WEIGHTS.values())
    filled_w = filled_count = 0
    for field, w in _FIELD_WEIGHTS.items():
        if _filled(field, data.get(field)):
            filled_w += w
            filled_count += 1
    score = round((filled_w / total) * 100)
    label = "Low" if score < 35 else "Medium" if score < 65 else "High"
    return {
        "score": score, "label": label,
        "filled_fields": filled_count,
        "total_fields": len(_FIELD_WEIGHTS),
    }

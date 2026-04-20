"""
predictor.py — matches cinepredict_final.ipynb exactly.

Model artefacts required in /backend/model/:
  xgb_model.pkl, train_preds_sorted.pkl,
  encoding_maps.pkl, model_columns.json
Falls back to rule-based if files are missing.
"""

import os, json, math
import numpy as np
import pandas as pd

MODEL_DIR = os.path.dirname(__file__)

_xgb_model = _train_preds_sorted = _encoding_maps = _model_columns = None
_LOADED = False

def _load():
    global _xgb_model, _train_preds_sorted, _encoding_maps, _model_columns, _LOADED
    if _LOADED:
        return
    try:
        import joblib
        _xgb_model          = joblib.load(os.path.join(MODEL_DIR, "xgb_model.pkl"))
        _train_preds_sorted = joblib.load(os.path.join(MODEL_DIR, "train_preds_sorted.pkl"))
        _encoding_maps      = joblib.load(os.path.join(MODEL_DIR, "encoding_maps.pkl"))
        with open(os.path.join(MODEL_DIR, "model_columns.json")) as f:
            _model_columns = json.load(f)
        print("[predictor] Model artefacts loaded successfully")
    except Exception as e:
        print(f"[predictor] Could not load artefacts ({e}) — rule-based fallback active")
    _LOADED = True

ALL_GENRES = [
    "Action","Adventure","Animation","Comedy","Crime","Drama","Family",
    "Fantasy","History","Horror","Music","Mystery","Romance",
    "Science Fiction","Thriller","War","Western",
]
BLOCKBUSTER_GENRES = {"Action","Adventure","Animation","Family","Fantasy","Science Fiction"}
MAJOR_STUDIOS = {
    "warner bros","universal","paramount","walt disney","disney",
    "sony","columbia","twentieth century","20th century","fox",
    "dreamworks","lionsgate","new line","metro-goldwyn","mgm",
    "miramax","amblin","marvel","pixar","lucasfilm",
}

def _parse_list(val):
    import ast, re, json as _j
    if isinstance(val, list): return val
    if not val or (isinstance(val, float) and math.isnan(val)): return []
    try: return ast.literal_eval(str(val))
    except Exception: pass
    try: return _j.loads(str(val).replace("'", '"'))
    except Exception: pass
    return re.findall(r"'([^']+?)'", str(val))

def _encode(val, mapping, gm):
    return float(mapping.get(str(val).lower().strip(), gm))

def _preprocess(movie: dict) -> pd.DataFrame:
    enc  = _encoding_maps or {}
    gm   = enc.get("global_mean", 16.0)

    genres_list = [str(g).title() for g in _parse_list(movie.get("genres", []))]
    cast_list   = [str(c).lower()  for c in _parse_list(movie.get("top_cast", []))]
    prodco_list = [str(p).lower()  for p in _parse_list(movie.get("production_companies", []))]
    kw_list     = [str(k).lower()  for k in _parse_list(movie.get("keywords", []))]
    overview    = str(movie.get("overview", "") or "")
    director    = str(movie.get("director", "") or "unknown").lower().strip()
    language    = str(movie.get("original_language", "en") or "en").lower().strip()

    budget   = float(movie.get("budget", 0) or 0)
    runtime  = float(movie.get("runtime", 100) or 100)
    rm       = int(movie.get("release_month", 6) or 6)
    dow      = int(movie.get("release_dayofweek", 4) or 4)
    # cast_popularity_avg: users don't know this number, so we estimate:
    # - If cast names are provided and found in actor_map, encoding handles signal
    # - Default to dataset mean (~15) when not supplied
    _raw_cast_pop = movie.get("cast_popularity_avg")
    cast_pop = float(_raw_cast_pop) if _raw_cast_pop else 15.0

    lb  = math.log1p(budget)
    lr  = math.log1p(runtime)
    bpm = budget / max(runtime, 1)

    is_major = int(any(s in p for s in MAJOR_STUDIOS for p in prodco_list))
    is_block = int(bool(set(genres_list) & BLOCKBUSTER_GENRES))

    row = {
        "log_budget":lb, "log_budget_sq":lb**2, "log_runtime":lr,
        "log_budget_per_min":math.log1p(bpm),
        "release_year_norm":0.0, "release_month":rm, "release_dayofweek":dow,
        "month_sin":math.sin(2*math.pi*rm/12), "month_cos":math.cos(2*math.pi*rm/12),
        "dow_sin":math.sin(2*math.pi*dow/7),   "dow_cos":math.cos(2*math.pi*dow/7),
        "is_summer":int(rm in [6,7,8]), "is_holiday":int(rm in [11,12]),
        "is_spring":int(rm in [3,4]),   "is_friday":int(dow==4),
        "num_genres":len(genres_list),  "is_blockbuster_genre":is_block,
        **{f"g_{g.lower().replace(' ','_')}": int(g in genres_list) for g in ALL_GENRES},
        "log_cast_popularity":math.log1p(cast_pop), "cast_size":len(cast_list),
        "is_major_studio":is_major, "log_num_prodco":math.log1p(len(prodco_list)),
        "is_english":int(language=="en"),
        "log_keywords":math.log1p(len(kw_list)),
        "log_overview":math.log1p(len(overview.split())),
    }

    row["budget_x_summer"]      = lb * row["is_summer"]
    row["budget_x_holiday"]     = lb * row["is_holiday"]
    row["budget_x_blockbuster"] = lb * is_block
    row["budget_x_major"]       = lb * is_major
    row["cast_x_budget"]        = row["log_cast_popularity"] * lb
    row["summer_blockbuster"]   = row["is_summer"] * is_block
    row["holiday_family"]       = row["is_holiday"] * int("Family" in genres_list or "Animation" in genres_list)
    row["major_x_blockbuster"]  = is_major * is_block

    lead   = cast_list[0] if cast_list else "unknown"
    prodco = prodco_list[0] if prodco_list else "unknown"

    row["director_enc"]   = _encode(director, enc.get("director_map",  {}), gm)
    row["lead_actor_enc"] = _encode(lead,     enc.get("actor_map",     {}), gm)
    row["prodco_enc"]     = _encode(prodco,   enc.get("prodco_map",    {}), gm)
    row["language_enc"]   = _encode(language, enc.get("language_map",  {}), gm)

    row["budget_x_director"]    = lb * row["director_enc"]
    row["prodco_x_budget"]      = row["prodco_enc"] * lb
    row["cast_x_actor"]         = row["log_cast_popularity"] * row["lead_actor_enc"]
    row["director_x_actor"]     = row["director_enc"] * row["lead_actor_enc"]
    row["budget_x_popularity"]  = lb * row["log_cast_popularity"]
    row["director_x_budget_sq"] = row["director_enc"] * lb**2

    df_row = pd.DataFrame([row])
    if _model_columns:
        for col in _model_columns:
            if col not in df_row.columns:
                df_row[col] = 0.0
        df_row = df_row[_model_columns]
    return df_row

def _log_rev_to_score(log_rev: float) -> float:
    if _train_preds_sorted is None: return 50.0
    pct = np.searchsorted(_train_preds_sorted, log_rev, side="right") / len(_train_preds_sorted)
    return round(float(pct * 100), 1)

def _score_to_category(score: float) -> str:
    if   score >= 90: return "Blockbuster"
    elif score >= 75: return "Hit"
    elif score >= 55: return "Above Average"
    elif score >= 35: return "Average"
    else:             return "Flop"

def _rule_based(movie: dict) -> dict:
    import random
    budget = float(movie.get("budget", 0) or 0)
    genres = _parse_list(movie.get("genres", []))
    rm     = int(movie.get("release_month", 6) or 6)
    lang   = str(movie.get("original_language", "en")).lower()
    base = 35.0
    if budget >= 200_000_000: base += 22
    elif budget >= 100_000_000: base += 17
    elif budget >= 50_000_000: base += 12
    elif budget >= 10_000_000: base += 6
    else: base += 2
    base += min(3.0 * len({str(g).title() for g in genres} & BLOCKBUSTER_GENRES), 12)
    if rm in [6,7,8,11,12]: base += 8
    if lang == "en": base += 5
    base += random.uniform(-6, 6)
    score = round(max(0, min(100, base)), 1)
    rev   = budget * (score / 100) * 3.5
    return {"score":score, "category":_score_to_category(score),
            "predicted_revenue":round(rev), "roi":round(rev/budget, 2) if budget > 0 else 0.0}

def predict(movie_data: dict) -> dict:
    _load()
    if _xgb_model is None:
        return _rule_based(movie_data)
    try:
        X_new        = _preprocess(movie_data)
        log_rev      = float(_xgb_model.predict(X_new)[0])
        revenue      = float(np.expm1(log_rev))
        budget       = float(movie_data.get("budget", 0) or 0)
        roi          = round(revenue / budget, 2) if budget > 0 else 0.0
        score        = _log_rev_to_score(log_rev)
        return {"score":score, "category":_score_to_category(score),
                "predicted_revenue":round(revenue), "roi":roi}
    except Exception as e:
        print(f"[predictor] Error: {e} — rule-based fallback")
        return _rule_based(movie_data)

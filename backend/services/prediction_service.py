from model.predictor import predict

CATEGORY_META = {
    "Blockbuster":  {"color": "#22c55e", "icon": "🏆"},
    "Hit":          {"color": "#3b82f6", "icon": "🎯"},
    "Above Average":{"color": "#00e5ff", "icon": "📈"},
    "Average":      {"color": "#f59e0b", "icon": "📊"},
    "Flop":         {"color": "#ef4444", "icon": "📉"},
}

def predict_movie_success(movie_data: dict) -> dict:
    result   = predict(movie_data)
    category = result.get("category", "Average")
    meta     = CATEGORY_META.get(category, CATEGORY_META["Average"])

    return {
        "score":             result["score"],
        "category":          category,
        "category_color":    meta["color"],
        "category_icon":     meta["icon"],
        "predicted_revenue": result.get("predicted_revenue", 0),
        "roi":               result.get("roi", 0.0),
    }

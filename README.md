# 🎬 CinePredict — Pre-Release Movie Success Prediction Platform

A full-stack web app that predicts a movie's box-office success score using a rule-based ML placeholder (easily swappable for a real model) and delivers AI-powered suggestions via the Gemini API.

---

## Tech Stack

| Layer     | Technology                       |
|-----------|----------------------------------|
| Frontend  | React 18 + Vite + Tailwind CSS   |
| Backend   | Flask (Python 3.11)              |
| AI        | Google Gemini 1.5 Flash (free tier) |
| Deploy    | Render (free tier)               |

---

## Project Structure

```
movie-predictor/
├── render.yaml              ← Render Blueprint (deploy both services)
├── backend/
│   ├── app.py               ← Flask app entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   │   ├── predict.py       ← POST /predict
│   │   └── ai_feedback.py   ← POST /ai-feedback
│   ├── services/
│   │   ├── prediction_service.py  ← Wraps the ML model
│   │   └── gemini_service.py      ← Gemini / mock suggestions
│   ├── model/
│   │   └── predictor.py     ← Rule-based placeholder (swap for real model here)
│   └── utils/
│       └── helpers.py       ← Confidence score calculator
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── .env.example
    └── src/
        ├── App.jsx
        ├── components/
        │   ├── InputForm.jsx
        │   ├── ConfidenceMeter.jsx
        │   ├── ResultCard.jsx
        │   └── AISuggestions.jsx
        └── services/
            └── api.js
```

---

## 🔑 Getting a FREE Gemini API Key

1. Go to **https://aistudio.google.com/app/apikey**
2. Sign in with a Google account
3. Click **"Create API Key"**
4. Copy the key — it starts with `AIza...`
5. The free tier gives you **1,500 requests/day** and **1 million tokens/day** on `gemini-1.5-flash`

> **Note:** The app works fully without a Gemini key — it falls back to intelligent mock suggestions automatically.

---

## 🚀 Running Locally

### 1. Backend (Flask)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY (optional)

# Run
python app.py
# → Backend runs at http://localhost:5000
```

### 2. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# .env already has VITE_API_BASE_URL=http://localhost:5000 for local dev
# Vite's proxy in vite.config.js forwards /predict and /ai-feedback to Flask

# Run
npm run dev
# → Frontend runs at http://localhost:5173
```

Open **http://localhost:5173** in your browser.

---

## 🌐 Deploying to Render

### Option A — Render Blueprint (automated, recommended)

1. Push this entire repo to a **GitHub** repository
2. Go to **https://render.com** → Dashboard → **"New Blueprint"**
3. Connect your GitHub repo
4. Render detects `render.yaml` and sets up both services automatically
5. After both services deploy, set these environment variables in the Render dashboard:

**Backend service → Environment:**
```
GEMINI_API_KEY = AIza...your_key...   (optional)
ALLOWED_ORIGINS = https://your-frontend-name.onrender.com
```

**Frontend service → Environment:**
```
VITE_API_BASE_URL = https://your-backend-name.onrender.com
```

6. **Trigger a redeploy** of the frontend after setting `VITE_API_BASE_URL`

### Option B — Manual (two separate services)

**Backend:**
1. Render Dashboard → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** = `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 60`
6. Environment: Python 3.11, add `GEMINI_API_KEY`

**Frontend:**
1. Render Dashboard → New → Static Site
2. Connect your GitHub repo
3. Set **Root Directory** = `frontend`
4. Build Command: `npm install && npm run build`
5. Publish Directory: `dist`
6. Environment: add `VITE_API_BASE_URL` = your backend URL
7. Add rewrite rule: `/* → /index.html` (for SPA routing)

---

## 📡 API Reference

### `POST /predict`

**Request:**
```json
{
  "plot": "A retired astronaut returns to Earth only to discover...",
  "budget": 80000000,
  "runtime": 125,
  "genres": ["Sci-Fi", "Thriller"],
  "release_month": "July",
  "director": "Denis Villeneuve",
  "cast": "Cillian Murphy, Ana de Armas",
  "language": "English"
}
```

**Response:**
```json
{
  "score": 74.3,
  "category": "Hit",
  "category_color": "#3b82f6",
  "breakdown": {
    "budget_impact": 17.0,
    "genre_impact": 9.0,
    "runtime_effect": 6.0,
    "release_timing": 9.0,
    "cast_strength": 3.0,
    "plot_strength": 8.0
  },
  "confidence": {
    "score": 88,
    "label": "High",
    "filled_fields": 7,
    "total_fields": 8
  }
}
```

---

### `POST /ai-feedback`

**Request:**
```json
{
  "movie": {
    "plot": "A retired astronaut returns to Earth...",
    "budget": 80000000,
    "genres": ["Sci-Fi", "Thriller"],
    "release_month": "July",
    "director": "Denis Villeneuve",
    "cast": "Cillian Murphy, Ana de Armas",
    "language": "English"
  },
  "prediction": {
    "score": 74.3,
    "category": "Hit"
  }
}
```

**Response:**
```json
{
  "success": true,
  "source": "gemini",
  "suggestions": {
    "plot_analysis": "The sci-fi thriller premise has strong commercial appeal...",
    "casting_suggestions": "Cillian Murphy brings critical acclaim; consider adding a globally bankable co-lead...",
    "release_timing": "July is an excellent choice — summer tentpole season...",
    "budget_tips": "At $80M, allocate ~30% to VFX, 20% to marketing...",
    "marketing_angle": "Lead with a mystery-heavy teaser targeting 25-44 audiences...",
    "overall_recommendation": "Secure an IMAX release to add 25-40% to domestic gross..."
  }
}
```

---

## 🧠 Swapping in a Real ML Model

The prediction logic lives entirely in `backend/model/predictor.py`.

To replace the rule-based placeholder:

```python
# predictor.py
import joblib
import numpy as np

# Load your trained model once at startup
_model = joblib.load("model.pkl")          # or sklearn, xgboost, etc.
_scaler = joblib.load("scaler.pkl")

def predict(movie_data: dict) -> float:
    feature_vector = build_feature_vector(movie_data)   # your feature engineering
    features = np.array([feature_vector])
    scaled   = _scaler.transform(features)
    score    = float(_model.predict(scaled)[0])
    return max(0.0, min(100.0, score))
```

No other file needs to change — `prediction_service.py` calls `predict()` as a black box.

---

## 🎨 Score Categories

| Score  | Category    | Meaning                          |
|--------|-------------|----------------------------------|
| 80–100 | Blockbuster | Massive global commercial success |
| 60–79  | Hit         | Strong box office, good ROI       |
| 40–59  | Average     | Moderate performance              |
| 0–39   | Flop        | Below-average commercial result   |

---

## ⚠️ Render Free Tier Notes

- **Free web services spin down** after 15 minutes of inactivity (cold start ~30 seconds)
- **Static sites** have no cold start — they're always fast
- Upgrade to the Starter plan ($7/mo) to avoid cold starts on the backend
- The first request after a cold start may take 30–60 seconds

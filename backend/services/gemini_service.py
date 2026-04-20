"""
gemini_service.py — AI suggestions using Gemini 1.5 Flash.
Uses the movie's overview/plot for NLP-informed analysis.
"""

import os, json, re

def _build_prompt(movie: dict, prediction: dict) -> str:
    genres   = ", ".join(movie.get("genres") if isinstance(movie.get("genres"), list) else [movie.get("genres","")]) or "Not specified"
    budget   = f"${int(movie['budget']):,}" if movie.get("budget") else "Not specified"
    revenue  = f"${int(prediction['predicted_revenue']):,}" if prediction.get("predicted_revenue") else "N/A"
    roi      = f"{prediction.get('roi', 0):.2f}x" if prediction.get("roi") else "N/A"
    cast     = ", ".join(movie.get("top_cast") if isinstance(movie.get("top_cast"), list) else [str(movie.get("top_cast",""))]) or "Not specified"

    return f"""You are a veteran Hollywood box-office analyst with 20+ years of experience.
Analyse this pre-release movie and provide sharp, specific, actionable advice.

MOVIE DETAILS:
- Plot/Overview: {movie.get("overview") or movie.get("plot") or "Not provided"}
- Budget: {budget}
- Genre(s): {genres}
- Runtime: {movie.get("runtime") or "N/A"} minutes
- Director: {movie.get("director") or "Not specified"}
- Cast: {cast}
- Release Month: {movie.get("release_month") or "Not specified"}
- Language: {movie.get("original_language") or "Not specified"}
- Keywords: {movie.get("keywords") or "Not specified"}

MODEL PREDICTION:
- Success Score: {prediction.get("score","N/A")}/100
- Category: {prediction.get("category","N/A")}
- Predicted Revenue: {revenue}
- Predicted ROI: {roi}

Respond ONLY with a valid JSON object (no markdown, no explanation):
{{
  "plot_analysis": "2-3 sentences on commercial potential of this plot/overview",
  "casting_suggestions": "Concrete casting advice to boost box office",
  "release_timing": "Release window analysis and specific recommendation",
  "budget_tips": "How to allocate budget for maximum ROI",
  "marketing_angle": "Target demographics and marketing hook",
  "overall_recommendation": "The single highest-impact change to improve success"
}}"""

def _call_gemini(api_key: str, prompt: str) -> dict:
    import google.generativeai as genai
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        "gemini-3-flash-preview",
        generation_config={"temperature": 0.7, "max_output_tokens": 1024},
    )
    text = model.generate_content(prompt).text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if m:
        return json.loads(m.group())
    raise ValueError("Non-JSON response from Gemini")

def _mock(movie: dict, prediction: dict) -> dict:
    score    = prediction.get("score", 50)
    genres   = movie.get("genres", [])
    if isinstance(genres, str): genres = [genres]
    genres   = [str(g).lower() for g in genres]
    budget   = float(movie.get("budget", 0) or 0)
    rm       = int(movie.get("release_month", 6) or 6)
    overview = str(movie.get("overview") or movie.get("plot") or "")
    is_action = any(g in genres for g in ["action","adventure","science fiction"])
    is_peak   = rm in [5,6,7,11,12]

    plot_comment = (
        "The plot has strong commercial hooks and clear mass-market appeal. "
        "Ensure a satisfying third-act payoff — test with focus groups early."
        if score >= 65 else
        "The plot needs a sharper, more marketable hook. Consider adding a ticking-clock "
        "tension device and a clearer protagonist motivation to drive audience investment."
    )
    if overview and len(overview) > 50:
        plot_comment += f" Your {len(overview.split())}-word overview suggests {'good' if score >= 60 else 'limited'} narrative clarity."

    rev_str = f"${prediction['predicted_revenue']/1e6:.1f}M" if prediction.get("predicted_revenue") else "the predicted figure"

    return {
        "plot_analysis": plot_comment,
        "casting_suggestions": (
            "Secure at least one globally bankable lead. International markets account for "
            "60%+ of revenue — prioritise cross-market appeal."
            if score < 70 else
            "Strong casting choices can anchor the film. Lock in the cast early to build "
            "fan anticipation and leverage their social following."
        ),
        "release_timing": (
            f"Your month-{rm} release is in a peak window — maximise P&A spend 8 weeks out."
            if is_peak else
            "Consider shifting to a May–July or Nov–Dec release window. "
            "Peak-season films earn 35–45% more at the domestic box office on average."
        ),
        "budget_tips": (
            f"With a ${budget/1e6:.0f}M budget, target revenue of {rev_str}. "
            "Allocate ~25% to VFX/production value, 20% to A-list talent, 15% to global marketing."
            if budget > 50_000_000 else
            "Maximise on-screen production value — practical sets over CGI where possible. "
            "Reserve 20% of budget for targeted digital marketing on TikTok and YouTube."
        ),
        "marketing_angle": (
            "Lead with a high-energy IMAX-first trailer. Target 18–34 males globally, "
            "but build a secondary campaign for female audiences."
            if is_action else
            "Lead with an emotionally resonant trailer targeting 25–44 audiences. "
            "Festival buzz (Sundance, TIFF) can replace millions in paid media."
        ),
        "overall_recommendation": (
            "The project is well-positioned. Focus energy on locking in a globally "
            "recognised cast member and securing IMAX screens for opening weekend."
            if score >= 70 else
            "Your single biggest lever is script development — invest in a polish pass "
            "by a proven screenwriter, then attach a recognisable director."
        ),
    }

def get_ai_suggestions(data: dict) -> dict:
    movie      = data.get("movie", {})
    prediction = data.get("prediction", {})
    api_key    = os.environ.get("GEMINI_API_KEY", "").strip()

    if api_key:
        try:
            suggestions = _call_gemini(api_key, _build_prompt(movie, prediction))
            return {"success": True, "source": "gemini", "suggestions": suggestions}
        except Exception as e:
            print(f"[Gemini] Error: {e} — mock fallback")

    return {"success": True, "source": "mock", "suggestions": _mock(movie, prediction)}

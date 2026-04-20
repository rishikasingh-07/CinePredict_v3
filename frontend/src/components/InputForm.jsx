import React, { useState, useEffect } from "react";
import ConfidenceMeter from "./ConfidenceMeter";
import { predictMovie } from "../services/api";

const GENRES = [
  "Action","Adventure","Animation","Comedy","Crime","Drama",
  "Family","Fantasy","History","Horror","Music","Mystery",
  "Romance","Science Fiction","Thriller","War","Western",
];
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const LANGUAGES = ["English","Hindi","Spanish","French","Mandarin","Japanese","Korean","German","Italian","Portuguese","Arabic"];
const LANG_CODES = { English:"en",Hindi:"hi",Spanish:"es",French:"fr",Mandarin:"zh",Japanese:"ja",Korean:"ko",German:"de",Italian:"it",Portuguese:"pt",Arabic:"ar" };

// Confidence only uses model fields — NOT overview
function computeConfidence(form) {
  const weights = {
    budget:20, genres:18, release_month:14, director:12,
    top_cast:10, runtime:9, production_companies:10, keywords:7,
  };
  let total=0, filled=0, count=0;
  for (const [k,w] of Object.entries(weights)) {
    total += w;
    const v = form[k];
    let ok = false;
    if (k==="genres") ok = Array.isArray(v) && v.length>0;
    else if (k==="budget"||k==="runtime") { try{ok=parseFloat(v)>0;}catch{} }
    else ok = !!v && String(v).trim()!=="";
    if (ok) { filled+=w; count++; }
  }
  const score = Math.round((filled/total)*100);
  return { score, label:score<35?"Low":score<65?"Medium":"High",
    filled_fields:count, total_fields:Object.keys(weights).length };
}

const SectionLabel = ({children}) => (
  <p className="text-xs font-semibold tracking-[0.18em] uppercase mb-3 font-body"
    style={{color:"rgba(229,9,20,0.75)"}}>
    {children}
  </p>
);

const FieldLabel = ({children, note}) => (
  <label className="block mb-2 text-xs font-semibold tracking-widest uppercase font-body"
    style={{color:"rgba(255,255,255,0.45)"}}>
    {children}
    {note && <span className="ml-1.5 normal-case tracking-normal font-normal text-xs"
      style={{color:"rgba(255,255,255,0.25)"}}>{note}</span>}
  </label>
);

export default function InputForm({ onResult, loading, setLoading }) {
  const [form, setForm] = useState({
    overview:"", budget:"", runtime:"", genres:[],
    release_month:"", release_dayofweek:"4",
    director:"", top_cast:"", original_language:"",
    production_companies:"", keywords:"",
  });
  const [confidence, setConfidence] = useState(computeConfidence({}));
  const [error, setError] = useState("");

  useEffect(() => { setConfidence(computeConfidence(form)); }, [form]);

  const set = k => e => setForm(f => ({...f,[k]:e.target.value}));
  const toggleGenre = g => setForm(f => ({
    ...f, genres: f.genres.includes(g) ? f.genres.filter(x=>x!==g) : [...f.genres, g],
  }));

  // Submit is enabled once ANY model field is filled — overview is NOT required
  const canSubmit = !loading && (
    (form.budget && parseFloat(form.budget) > 0) ||
    form.genres.length > 0 ||
    form.director.trim() ||
    form.top_cast.trim()
  );

  const handleSubmit = async e => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      const langCode = LANG_CODES[form.original_language] || form.original_language || "en";
      const payload = {
        overview:          form.overview || "",
        budget:            form.budget  ? parseFloat(form.budget)  : null,
        runtime:           form.runtime ? parseFloat(form.runtime) : null,
        genres:            JSON.stringify(form.genres),
        release_month:     form.release_month ? MONTHS.indexOf(form.release_month)+1 : null,
        release_dayofweek: parseInt(form.release_dayofweek ?? 4),
        director:          form.director || null,
        top_cast:          form.top_cast
          ? JSON.stringify(form.top_cast.split(",").map(s=>s.trim()).filter(Boolean))
          : "[]",
        original_language: langCode,
        production_companies: form.production_companies
          ? JSON.stringify(form.production_companies.split(",").map(s=>s.trim()).filter(Boolean))
          : "[]",
        keywords: form.keywords
          ? JSON.stringify(form.keywords.split(",").map(s=>s.trim()).filter(Boolean))
          : "[]",
      };
      const result = await predictMovie(payload);
      onResult(result, payload);
    } catch(err) {
      setError(err?.response?.data?.error || "Backend unreachable — is the Flask server running?");
    } finally {
      setLoading(false);
    }
  };

  const sel = { backgroundImage:"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff40' d='M6 8L1 3h10z'/%3E%3C/svg%3E\")",
    backgroundRepeat:"no-repeat", backgroundPosition:"right 14px center" };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Main fields ── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* ── SECTION: Plot ── */}
          <div className="p-5 rounded-none" style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <SectionLabel>Plot / Overview</SectionLabel>
            <div className="mb-2 px-3 py-2 flex items-center gap-2 text-xs rounded-none"
              style={{background:"rgba(229,9,20,0.07)", border:"1px solid rgba(229,9,20,0.2)"}}>
              <span>🤖</span>
              <span style={{color:"rgba(255,255,255,0.5)"}}>
                Used only for <strong style={{color:"rgba(229,9,20,0.9)"}}>AI Suggestions</strong> — not the prediction model. Optional.
              </span>
            </div>
            <textarea
              className="neon-input w-full p-3.5 resize-none h-28 leading-relaxed rounded-none"
              placeholder="Describe your movie's plot and themes. The AI analyst will use this for detailed suggestions…"
              value={form.overview} onChange={set("overview")}
            />
            <p className="mt-1 text-xs" style={{color:"rgba(255,255,255,0.2)"}}>
              {form.overview.length > 0 ? `${form.overview.length} chars — ready for AI analysis` : "Optional — add for richer AI insights"}
            </p>
          </div>

          {/* ── SECTION: Production ── */}
          <div className="p-5" style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <SectionLabel>Production Details</SectionLabel>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Budget (USD)</FieldLabel>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-mono"
                    style={{color:"rgba(229,9,20,0.8)"}}>$</span>
                  <input type="number" min="0" className="neon-input w-full p-3.5 pl-8 rounded-none"
                    placeholder="50000000" value={form.budget} onChange={set("budget")} />
                </div>
              </div>
              <div>
                <FieldLabel>Runtime (min)</FieldLabel>
                <input type="number" min="1" max="300" className="neon-input w-full p-3.5 rounded-none"
                  placeholder="120" value={form.runtime} onChange={set("runtime")} />
              </div>
            </div>
          </div>

          {/* ── SECTION: Genres ── */}
          <div className="p-5" style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <SectionLabel>Genre(s)</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {GENRES.map(g => (
                <button key={g} type="button" onClick={() => toggleGenre(g)}
                  className={`genre-pill ${form.genres.includes(g)?"selected":""}`}>{g}</button>
              ))}
            </div>
          </div>

          {/* ── SECTION: Cast & Crew ── */}
          <div className="p-5" style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <SectionLabel>Cast & Crew</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Director</FieldLabel>
                <input type="text" className="neon-input w-full p-3.5 rounded-none"
                  placeholder="Christopher Nolan" value={form.director} onChange={set("director")} />
              </div>
              <div>
                <FieldLabel>Cast" note="comma-separated">Cast</FieldLabel>
                <input type="text" className="neon-input w-full p-3.5 rounded-none"
                  placeholder="Tom Hanks, Zendaya, Idris Elba" value={form.top_cast} onChange={set("top_cast")} />
              </div>
            </div>
          </div>

          {/* ── SECTION: Release ── */}
          <div className="p-5" style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <SectionLabel>Release & Distribution</SectionLabel>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <FieldLabel>Release Month</FieldLabel>
                <select className="neon-input w-full p-3.5 appearance-none rounded-none" style={sel}
                  value={form.release_month} onChange={set("release_month")}>
                  <option value="">Select month…</option>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel>Release Day</FieldLabel>
                <select className="neon-input w-full p-3.5 appearance-none rounded-none" style={sel}
                  value={form.release_dayofweek} onChange={set("release_dayofweek")}>
                  {DAYS.map((d,i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Language</FieldLabel>
                <select className="neon-input w-full p-3.5 appearance-none rounded-none" style={sel}
                  value={form.original_language} onChange={set("original_language")}>
                  <option value="">Select language…</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <FieldLabel note="comma-separated">Production Companies</FieldLabel>
                <input type="text" className="neon-input w-full p-3.5 rounded-none"
                  placeholder="Marvel Studios, Sony Pictures" value={form.production_companies} onChange={set("production_companies")} />
              </div>
            </div>
          </div>

          {/* ── SECTION: Keywords ── */}
          <div className="p-5" style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <SectionLabel>Keywords</SectionLabel>
            <FieldLabel note="comma-separated, boosts model accuracy">Thematic Keywords</FieldLabel>
            <input type="text" className="neon-input w-full p-3.5 rounded-none"
              placeholder="superhero, sequel, based on novel, space, time travel"
              value={form.keywords} onChange={set("keywords")} />
          </div>

          {error && (
            <div className="p-4 flex items-start gap-3 text-sm rounded-none"
              style={{background:"rgba(229,9,20,0.08)", border:"1px solid rgba(229,9,20,0.3)", color:"#ff6b6b"}}>
              <span className="text-lg flex-shrink-0">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" disabled={!canSubmit}
            className="btn-neon relative w-full py-4 text-base overflow-hidden rounded-none">
            <span className="relative z-10 flex items-center justify-center gap-3">
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  ANALYSING MOVIE…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  PREDICT SUCCESS
                </>
              )}
            </span>
          </button>
          {!canSubmit && !loading && (
            <p className="text-center text-xs -mt-2" style={{color:"rgba(255,255,255,0.25)"}}>
              Enter budget, genre, director, or cast to unlock prediction
            </p>
          )}
        </div>

        {/* ── Right col ── */}
        <div className="flex flex-col gap-4">
          <ConfidenceMeter confidence={confidence} />
          <div className="p-5 flex flex-col gap-3 rounded-none"
            style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase font-body"
              style={{color:"rgba(229,9,20,0.75)"}}>Model Tips</p>
            <ul className="flex flex-col gap-2.5">
              {[
                ["💰","Budget has the strongest impact on predicted revenue"],
                ["🎭","Major studio + blockbuster genre = significant boost"],
                ["📅","Friday release in summer/holiday season is optimal"],
                ["🎬","Director & cast encoding uses historical box-office data"],
                ["🔑","Keywords matched to training data patterns"],
                ["🤖","Add plot overview above to unlock AI expert analysis"],
              ].map(([icon,tip],i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs leading-relaxed"
                  style={{color:"rgba(255,255,255,0.45)"}}>
                  <span className="flex-shrink-0">{icon}</span><span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </form>
  );
}

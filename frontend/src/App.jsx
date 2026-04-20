import React, { useState, useRef } from "react";
import InputForm     from "./components/InputForm";
import ResultCard    from "./components/ResultCard";
import AISuggestions from "./components/AISuggestions";
import { getAIFeedback } from "./services/api";

/* ── Floating film cells (decoration) ──────────────────── */
const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.5 + 0.5,
  delay: Math.random() * 8,
  duration: Math.random() * 6 + 5,
  opacity: Math.random() * 0.15 + 0.03,
}));

function ParticleField() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {PARTICLES.map(p => (
        <div key={p.id} className="absolute rounded-full bg-cinema-red"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:`${p.size}px`, height:`${p.size}px`,
            opacity:p.opacity, animation:`float ${p.duration}s ease-in-out ${p.delay}s infinite` }} />
      ))}
    </div>
  );
}

/* ── Film strip header decoration ──────────────────────── */
function FilmStrip() {
  return (
    <div className="w-full flex items-center gap-0 overflow-hidden opacity-20 mb-1">
      {Array.from({length: 40}).map((_,i) => (
        <div key={i} className="flex-shrink-0 w-8 h-5 border border-cinema-red/60 mx-0.5 rounded-sm" />
      ))}
    </div>
  );
}

export default function App() {
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [movieData, setMovieData] = useState(null);
  const [aiData,    setAIData]    = useState(null);
  const [aiLoading, setAILoading] = useState(false);
  const [aiError,   setAIError]   = useState("");

  const resultRef = useRef(null);
  const aiRef     = useRef(null);

  const handleResult = (prediction, payload) => {
    setResult(prediction);
    setMovieData(payload);
    setAIData(null);
    setAIError("");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
  };

  const handleAIRequest = async () => {
    if (!result || !movieData) return;
    setAILoading(true);
    setAIError("");
    setAIData(null);
    try {
      const fb = await getAIFeedback(movieData, result);
      setAIData(fb);
      setTimeout(() => aiRef.current?.scrollIntoView({ behavior:"smooth", block:"start" }), 100);
    } catch(err) {
      setAIError(err?.response?.data?.error || "Could not fetch AI suggestions.");
    } finally {
      setAILoading(false);
    }
  };

  return (
    <div className="film-grain min-h-screen bg-void relative" style={{background:"#080808"}}>
      <ParticleField />

      {/* Subtle grid overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30"
        style={{
          backgroundImage: "linear-gradient(rgba(229,9,20,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(229,9,20,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Ambient red glow top */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-64 pointer-events-none z-0"
        style={{background:"radial-gradient(ellipse, rgba(229,9,20,0.07) 0%, transparent 70%)", filter:"blur(40px)"}} />

      <div className="relative z-10">

        {/* ── Hero Header ── */}
        <header className="text-center pt-12 pb-8 px-6">
          <FilmStrip />

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 mt-4 mb-6 px-4 py-1.5 rounded-none"
            style={{background:"rgba(229,9,20,0.1)", border:"1px solid rgba(229,9,20,0.3)"}}>
            <div className="w-2 h-2 rounded-full bg-cinema-red animate-pulse" />
            <span className="text-xs font-body font-semibold tracking-[0.25em] uppercase"
              style={{color:"rgba(229,9,20,0.9)"}}>CinePredict AI Platform</span>
          </div>

          {/* Title */}
          <div className="mb-5">
            <h1 className="font-display font-bold leading-[0.9] tracking-wider"
              style={{fontSize:"clamp(2.8rem,9vw,6.5rem)"}}>
              <span className="block cinema-title">PRE-RELEASE</span>
              <span className="block red-gradient-text">MOVIE SUCCESS</span>
              <span className="block cinema-title">PREDICTOR</span>
            </h1>
          </div>

          {/* Subtitle */}
          <p className="text-sm md:text-base max-w-lg mx-auto leading-relaxed"
            style={{color:"rgba(255,255,255,0.45)"}}>
            Input your movie details. Our ML model analyses budget, genre, timing,
            and cast to predict box-office revenue — then get AI-powered expert suggestions.
          </p>

          {/* Stat badges */}
          <div className="flex flex-wrap justify-center gap-3 mt-5">
            {[["🎬","ML Revenue Prediction"],["🤖","Gemini AI Insights"],["⚡","Real-time Analysis"]].map(([icon,label]) => (
              <div key={label} className="px-3.5 py-1.5 text-xs flex items-center gap-1.5"
                style={{border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.02)",
                  color:"rgba(255,255,255,0.45)"}}>
                <span>{icon}</span><span>{label}</span>
              </div>
            ))}
          </div>

          <FilmStrip />
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 flex flex-col gap-8">

          {/* ── Form ── */}
          <section>
            <InputForm onResult={handleResult} loading={loading} setLoading={setLoading} />
          </section>

          {/* ── Loading ── */}
          {loading && (
            <div className="glass rounded-none p-10 flex flex-col items-center gap-5 animate-fade-in"
              style={{border:"1px solid rgba(229,9,20,0.2)"}}>
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 animate-ping"
                  style={{borderColor:"rgba(229,9,20,0.2)"}} />
                <div className="absolute inset-2 rounded-full border-2 animate-spin"
                  style={{borderColor:"rgba(229,9,20,0.4)", animationDuration:"2s"}} />
                <div className="absolute inset-4 rounded-full border-2 animate-spin"
                  style={{borderColor:"rgba(229,9,20,0.2)", animationDuration:"3s", animationDirection:"reverse"}} />
                <div className="absolute inset-7 flex items-center justify-center text-xl">🎬</div>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl tracking-widest mb-1 red-gradient-text">ANALYSING…</p>
                <p className="text-xs tracking-wide" style={{color:"rgba(255,255,255,0.35)"}}>
                  Running ML model on your movie data
                </p>
              </div>
            </div>
          )}

          {/* ── Result ── */}
          {result && !loading && (
            <section ref={resultRef}>
              <div className="flex items-center gap-4 mb-5">
                <div className="cinema-divider flex-1" />
                <p className="text-xs tracking-[0.25em] uppercase font-semibold font-body px-3"
                  style={{color:"rgba(229,9,20,0.7)"}}>Analysis Result</p>
                <div className="cinema-divider flex-1" />
              </div>
              <ResultCard result={result} onRequestAI={handleAIRequest} aiLoading={aiLoading} />
            </section>
          )}

          {/* ── AI Suggestions ── */}
          {(aiData || aiLoading || aiError) && (
            <section ref={aiRef}>
              <div className="flex items-center gap-4 mb-5">
                <div className="cinema-divider flex-1" />
                <p className="text-xs tracking-[0.25em] uppercase font-semibold font-body px-3"
                  style={{color:"rgba(229,9,20,0.7)"}}>AI Expert Analysis</p>
                <div className="cinema-divider flex-1" />
              </div>
              <AISuggestions data={aiData} loading={aiLoading} error={aiError} source={aiData?.source} />
            </section>
          )}

        </main>

        <footer className="text-center py-8 font-body text-xs tracking-[0.2em] uppercase"
          style={{color:"rgba(255,255,255,0.15)"}}>
          CinePredict · Pre-Release Movie Intelligence Platform
        </footer>
      </div>
    </div>
  );
}

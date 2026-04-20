import React, { useEffect, useState, useRef } from "react";

const CAT = {
  "Blockbuster":   { color:"#f5c518", glow:"rgba(245,197,24,0.5)",  icon:"🏆", border:"rgba(245,197,24,0.3)" },
  "Hit":           { color:"#22c55e", glow:"rgba(34,197,94,0.5)",   icon:"🎯", border:"rgba(34,197,94,0.25)" },
  "Above Average": { color:"#E50914", glow:"rgba(229,9,20,0.55)",   icon:"📈", border:"rgba(229,9,20,0.3)" },
  "Average":       { color:"#a8a8a8", glow:"rgba(168,168,168,0.4)", icon:"📊", border:"rgba(168,168,168,0.2)" },
  "Flop":          { color:"#555555", glow:"rgba(80,80,80,0.4)",    icon:"📉", border:"rgba(80,80,80,0.2)" },
};
const DESC = {
  "Blockbuster":   "Award-season potential. Exceptional commercial outlook — positioned for global dominance.",
  "Hit":           "Strong commercial appeal. Likely to perform well with good ROI.",
  "Above Average": "Solid outlook. Expected to outperform typical releases in this category.",
  "Average":       "Moderate commercial potential. Execution and marketing will be decisive.",
  "Flop":          "Below-average indicators. Significant script, budget, or timing changes recommended.",
};

function useCountUp(target, duration=1400) {
  const [v,setV]=useState(0); const raf=useRef(null);
  useEffect(()=>{
    const start=performance.now();
    const tick=now=>{ const p=Math.min((now-start)/duration,1); const e=1-Math.pow(1-p,3);
      setV(Math.round(e*target)); if(p<1) raf.current=requestAnimationFrame(tick); };
    raf.current=requestAnimationFrame(tick);
    return ()=>cancelAnimationFrame(raf.current);
  },[target,duration]);
  return v;
}

function fmt(n) {
  if (!n||n<=0) return "N/A";
  if (n>=1e9)  return `$${(n/1e9).toFixed(2)}B`;
  if (n>=1e6)  return `$${(n/1e6).toFixed(1)}M`;
  if (n>=1e3)  return `$${(n/1e3).toFixed(0)}K`;
  return `$${n}`;
}

/* Gauge */
const GR=80,GCX=110,GCY=110,SD=215,ED=325,SW=110;
const pol=(cx,cy,r,d)=>({x:cx+r*Math.cos(d*Math.PI/180),y:cy+r*Math.sin(d*Math.PI/180)});
const arc=(cx,cy,r,s,e)=>{const S=pol(cx,cy,r,s),E=pol(cx,cy,r,e); return `M ${S.x} ${S.y} A ${r} ${r} 0 ${e-s>180?1:0} 1 ${E.x} ${E.y}`;};

function Gauge({score,color}) {
  const [anim,setAnim]=useState(0);
  useEffect(()=>{const t=setTimeout(()=>setAnim(score),100);return()=>clearTimeout(t);},[score]);
  const trackP=arc(GCX,GCY,GR,SD,ED);
  const fa=SD+(SW*anim)/100, fillP=arc(GCX,GCY,GR,SD,fa);
  const tip=pol(GCX,GCY,GR-10,fa);
  return (
    <svg viewBox="0 0 220 140" className="w-full max-w-[280px]">
      <defs>
        <linearGradient id="cinema-arc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#555555"/>
          <stop offset="35%"  stopColor="#a8a8a8"/>
          <stop offset="65%"  stopColor="#E50914"/>
          <stop offset="100%" stopColor="#f5c518"/>
        </linearGradient>
      </defs>
      <path d={trackP} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" strokeLinecap="round"/>
      <path d={fillP} fill="none" stroke="url(#cinema-arc)" strokeWidth="12" strokeLinecap="round"
        style={{transition:"d 1.2s cubic-bezier(0.4,0,0.2,1)",filter:`drop-shadow(0 0 6px ${color})`}}/>
      {[0,25,50,75,100].map(pct=>{
        const d=SD+(SW*pct)/100, p=pol(GCX,GCY,GR+16,d);
        return <text key={pct} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.2)" fontSize="8" fontFamily="'DM Sans',sans-serif">{pct}</text>;
      })}
      <circle cx={tip.x} cy={tip.y} r="6" fill={color}
        style={{filter:`drop-shadow(0 0 8px ${color})`,transition:"cx 1.2s cubic-bezier(0.4,0,0.2,1),cy 1.2s cubic-bezier(0.4,0,0.2,1)"}}/>
    </svg>
  );
}

function StatCard({label,value,color,icon}) {
  return (
    <div className="p-4 flex flex-col gap-1.5 rounded-none"
      style={{background:"rgba(20,20,20,0.9)", border:`1px solid ${color}25`}}>
      <div className="flex items-center gap-2">
        <span className="text-sm">{icon}</span>
        <p className="text-xs tracking-widest uppercase font-semibold font-body"
          style={{color:"rgba(255,255,255,0.35)"}}>{label}</p>
      </div>
      <p className="font-display text-xl tracking-wide" style={{color,textShadow:`0 0 16px ${color}55`}}>{value}</p>
    </div>
  );
}

export default function ResultCard({result,onRequestAI,aiLoading}) {
  const {score,category,confidence,predicted_revenue,roi}=result;
  const cfg=CAT[category]||CAT["Average"];
  const displayed=useCountUp(score,1400);

  return (
    <div className="animate-fade-up w-full">

      {/* Score section */}
      <div className="p-6 mb-4 rounded-none" style={{background:"rgba(20,20,20,0.95)",border:`1px solid ${cfg.border}`}}>
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-center mb-4 font-body"
          style={{color:"rgba(255,255,255,0.3)"}}>— Prediction Result —</p>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0"><Gauge score={score} color={cfg.color}/></div>
          <div className="flex flex-col items-center md:items-start gap-3 flex-1">
            <div className="flex items-end gap-2">
              <span className="font-display leading-none font-bold"
                style={{fontSize:"clamp(4rem,10vw,7rem)",color:cfg.color,
                  textShadow:`0 0 40px ${cfg.glow}, 0 0 80px ${cfg.glow}40`}}>
                {displayed}
              </span>
              <span className="text-2xl mb-3" style={{color:"rgba(255,255,255,0.3)"}}>/ 100</span>
            </div>
            {/* Category badge */}
            <div className="flex items-center gap-2 px-5 py-2 text-sm font-semibold tracking-widest uppercase font-display"
              style={{color:cfg.color,background:`${cfg.color}10`,border:`1px solid ${cfg.border}`,
                boxShadow:`0 0 20px ${cfg.glow}`}}>
              <span>{cfg.icon}</span><span>{category}</span>
            </div>
            {confidence && (
              <div className="flex items-center gap-2 text-xs" style={{color:"rgba(255,255,255,0.35)"}}>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {confidence.label} Confidence · {confidence.score}% · {confidence.filled_fields}/{confidence.total_fields} fields
              </div>
            )}
            <p className="text-sm max-w-sm text-center md:text-left leading-relaxed"
              style={{color:"rgba(255,255,255,0.5)"}}>{DESC[category]}</p>
          </div>
        </div>
      </div>

      {/* Revenue + ROI stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <StatCard label="Predicted Revenue" value={fmt(predicted_revenue)} color="#E50914" icon="💰"/>
        <StatCard label="Predicted ROI"    value={roi>0?`${roi.toFixed(2)}x`:"N/A"} color="#f5c518" icon="📈"/>
        <StatCard label="Success Score"    value={`${score}/100`} color={cfg.color} icon={cfg.icon}/>
      </div>

      {/* ROI benchmark */}
      {roi>0 && (
        <div className="p-4 mb-4 rounded-none"
          style={{background:"rgba(20,20,20,0.85)",border:"1px solid rgba(255,255,255,0.06)"}}>
          <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3 font-body"
            style={{color:"rgba(255,255,255,0.3)"}}>ROI Benchmark</p>
          <div className="flex flex-col gap-2.5">
            {[
              {label:"Break-even", threshold:1.0, color:"#a8a8a8"},
              {label:"Profitable", threshold:1.5, color:"#f59e0b"},
              {label:"Hit",        threshold:2.5, color:"#22c55e"},
              {label:"Blockbuster",threshold:4.0, color:"#f5c518"},
            ].map(({label,threshold,color})=>{
              const achieved=roi>=threshold;
              return (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-24 text-xs text-right flex-shrink-0 font-body"
                    style={{color:achieved?color:"rgba(255,255,255,0.25)"}}>{label}</div>
                  <div className="flex-1 h-1 rounded-none" style={{background:"rgba(255,255,255,0.05)"}}>
                    <div className="h-full transition-all duration-700 rounded-none"
                      style={{width:achieved?"100%":"0%",background:color,
                        boxShadow:achieved?`0 0 8px ${color}`:undefined}}/>
                  </div>
                  <div className="text-xs font-mono w-10 flex-shrink-0"
                    style={{color:"rgba(255,255,255,0.3)"}}>{threshold}x</div>
                  <div className="flex-shrink-0" style={{color:achieved?color:"rgba(255,255,255,0.15)"}}>
                    {achieved?"✓":"·"}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI CTA */}
      <button onClick={onRequestAI} disabled={aiLoading}
        className="btn-outline w-full py-4 text-sm flex items-center justify-center gap-3 rounded-none">
        {aiLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <span className="shimmer-text">CONSULTING AI ANALYSTS…</span>
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>
            </svg>
            GET AI SUGGESTIONS
          </>
        )}
      </button>
    </div>
  );
}

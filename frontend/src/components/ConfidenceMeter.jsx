import React, { useMemo } from "react";

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const LEVELS = [
  { min:0,  max:34,  label:"Low Confidence",    color:"#ef4444", glow:"rgba(239,68,68,0.5)" },
  { min:35, max:64,  label:"Medium Confidence",  color:"#f5c518", glow:"rgba(245,197,24,0.5)" },
  { min:65, max:100, label:"High Confidence",    color:"#E50914", glow:"rgba(229,9,20,0.6)" },
];
const getLevel = s => LEVELS.find(l=>s>=l.min&&s<=l.max) || LEVELS[0];

export default function ConfidenceMeter({ confidence }) {
  const score       = confidence?.score ?? 0;
  const filledCount = confidence?.filled_fields ?? 0;
  const totalCount  = confidence?.total_fields  ?? 8;
  const level  = useMemo(() => getLevel(score), [score]);
  const offset = useMemo(() => CIRCUMFERENCE - (score/100)*CIRCUMFERENCE, [score]);

  return (
    <div className="p-5 flex flex-col items-center gap-3 select-none rounded-none"
      style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.06)"}}>
      <p className="text-xs font-semibold tracking-[0.18em] uppercase font-body"
        style={{color:"rgba(229,9,20,0.75)"}}>Prediction Confidence</p>

      <div className="relative">
        <svg width="140" height="140" viewBox="0 0 140 140">
          <defs>
            <filter id="meter-glow">
              <feGaussianBlur stdDeviation="2.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          {/* Track */}
          <circle cx="70" cy="70" r={RADIUS} fill="none"
            stroke="rgba(255,255,255,0.05)" strokeWidth="10" strokeLinecap="round"/>
          {/* Tick marks */}
          {[0,25,50,75,100].map(pct => {
            const angle = (pct/100)*360-90;
            const rad   = angle*Math.PI/180;
            return <line key={pct}
              x1={70+48*Math.cos(rad)} y1={70+48*Math.sin(rad)}
              x2={70+44*Math.cos(rad)} y2={70+44*Math.sin(rad)}
              stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" strokeLinecap="round"/>;
          })}
          {/* Arc */}
          <circle cx="70" cy="70" r={RADIUS} fill="none"
            stroke={level.color} strokeWidth="10" strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{transition:"stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1),stroke 0.4s ease",
              filter:`drop-shadow(0 0 6px ${level.glow})`}}/>
          {/* Dot */}
          {score>2&&(()=>{
            const angle=(score/100)*360-90, rad=angle*Math.PI/180;
            return <circle key="dot" cx={70+RADIUS*Math.cos(rad)} cy={70+RADIUS*Math.sin(rad)} r="5"
              fill={level.color} style={{filter:`drop-shadow(0 0 6px ${level.glow})`}}/>;
          })()}
          {/* Center text */}
          <text x="70" y="63" textAnchor="middle" fill={level.color}
            fontSize="26" fontFamily="'Oswald',sans-serif" letterSpacing="1"
            style={{transition:"fill 0.4s ease"}}>{score}%</text>
          <text x="70" y="78" textAnchor="middle" fill="rgba(255,255,255,0.35)"
            fontSize="9" fontFamily="'DM Sans',sans-serif">{filledCount}/{totalCount} FIELDS</text>
        </svg>
      </div>

      {/* Level badge */}
      <div className="px-4 py-1.5 text-xs font-semibold tracking-wide font-body"
        style={{color:level.color, border:`1px solid ${level.color}50`,
          background:`${level.color}12`, textShadow:`0 0 10px ${level.glow}`,
          boxShadow:`0 0 14px ${level.color}20`, transition:"all 0.4s ease"}}>
        {level.label}
      </div>

      <p className="text-xs text-center max-w-[160px] leading-relaxed"
        style={{color:"rgba(255,255,255,0.25)"}}>
        Based on model inputs only — overview not included
      </p>
    </div>
  );
}

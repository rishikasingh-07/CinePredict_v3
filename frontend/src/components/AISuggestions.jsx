import React from "react";

const META = [
  { key:"plot_analysis",         title:"Plot Analysis",      icon:"🎭", color:"#E50914",  desc:"Commercial storytelling assessment" },
  { key:"casting_suggestions",   title:"Casting Strategy",   icon:"⭐", color:"#f5c518",  desc:"Star power & audience appeal" },
  { key:"release_timing",        title:"Release Timing",     icon:"📅", color:"#a8a8a8",  desc:"Optimal window for maximum revenue" },
  { key:"budget_tips",           title:"Budget Allocation",  icon:"💰", color:"#22c55e",  desc:"Maximise ROI with smart spending" },
  { key:"marketing_angle",       title:"Marketing Angle",    icon:"📢", color:"#f59e0b",  desc:"Target demographics & campaign hooks" },
  { key:"overall_recommendation",title:"Top Recommendation", icon:"🏆", color:"#E50914",  desc:"Highest-impact single change", featured:true },
];

function Card({meta,text,index}) {
  const {title,icon,color,desc,featured}=meta;
  return (
    <div className={`p-5 flex flex-col gap-3 animate-fade-up rounded-none ${featured?"sm:col-span-2":""}`}
      style={{background:"rgba(20,20,20,0.9)", border:`1px solid ${color}20`,
        animationDelay:`${index*0.07}s`, animationFillMode:"both",
        transition:"transform 0.2s ease"}}
      onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
      onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 flex items-center justify-center text-lg flex-shrink-0 rounded-none"
          style={{background:`${color}15`, border:`1px solid ${color}30`}}>
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold font-display tracking-wide" style={{color}}>{title}</p>
          <p className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>{desc}</p>
        </div>
        {featured && (
          <div className="px-2.5 py-1 text-xs font-bold tracking-widest uppercase font-display"
            style={{color, background:`${color}15`, border:`1px solid ${color}40`}}>KEY</div>
        )}
      </div>
      <p className="text-sm leading-relaxed" style={{color:"rgba(255,255,255,0.65)"}}>{text}</p>
      <div className="h-px mt-1" style={{background:`linear-gradient(90deg,${color},transparent)`,opacity:0.2}}/>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-5 flex flex-col gap-3 rounded-none"
      style={{background:"rgba(20,20,20,0.85)", border:"1px solid rgba(255,255,255,0.05)"}}>
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9"/>
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="skeleton h-3.5 w-28"/><div className="skeleton h-2.5 w-36"/>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-2.5 w-full"/><div className="skeleton h-2.5 w-5/6"/><div className="skeleton h-2.5 w-4/6"/>
      </div>
    </div>
  );
}

export default function AISuggestions({data,loading,error,source}) {
  if (loading) return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-2 h-2 rounded-full bg-cinema-red animate-ping"/>
        <p className="text-xs tracking-widest uppercase" style={{color:"rgba(255,255,255,0.4)"}}>AI analyst thinking…</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({length:6}).map((_,i)=><Skeleton key={i}/>)}
      </div>
    </div>
  );

  if (error) return (
    <div className="p-5 flex items-start gap-3 text-sm rounded-none"
      style={{border:"1px solid rgba(229,9,20,0.3)", background:"rgba(229,9,20,0.06)", color:"#ff6b6b"}}>
      <span className="text-lg">⚠</span>
      <div><p className="font-semibold mb-1">AI suggestions failed</p><p style={{color:"rgba(255,100,100,0.7)"}}>{error}</p></div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-8 h-8 flex items-center justify-center rounded-none"
              style={{background:"rgba(229,9,20,0.15)", border:"1px solid rgba(229,9,20,0.3)"}}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="#E50914" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10"/><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/>
              </svg>
            </div>
            <div className="absolute inset-0 bg-cinema-red/30 animate-ping rounded-full"/>
          </div>
          <div>
            <p className="font-semibold text-sm font-display tracking-wide text-red-glow">AI EXPERT SUGGESTIONS</p>
            <p className="text-xs" style={{color:"rgba(255,255,255,0.35)"}}>
              Powered by {source==="gemini"?"Google Gemini 1.5 Flash":"Smart Mock Analysis"}
            </p>
          </div>
        </div>
        <div className="px-3 py-1 text-xs font-semibold tracking-widest uppercase font-display"
          style={source==="gemini"
            ? {color:"#E50914", border:"1px solid rgba(229,9,20,0.35)", background:"rgba(229,9,20,0.08)"}
            : {color:"rgba(255,255,255,0.3)", border:"1px solid rgba(255,255,255,0.1)"}}>
          {source==="gemini"?"● LIVE AI":"● MOCK"}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {META.map((m,i)=>{
          const text=data.suggestions?.[m.key];
          if(!text) return null;
          return <Card key={m.key} meta={m} text={text} index={i}/>;
        })}
      </div>
    </div>
  );
}

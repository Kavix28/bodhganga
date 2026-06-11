import { useEffect, useState } from "react";
import api from "../../services/api";

export default function TickerStrip() {
  const [states, setStates] = useState([]);

  useEffect(() => {
    api.get("/states/available")
      .then(res => { const data = Array.isArray(res) ? res : (res?.data || []); setStates(data); })
      .catch(() => setStates([]));
  }, []);

  if (states.length === 0) return null;

  const items = [
    `? ${states.length} States Now Live`,
    ...states.map(s => `? ${s.name || s.id}`),
    `? More States Coming Soon`,
    `? ${states.length} States Now Live`,
    ...states.map(s => `? ${s.name || s.id}`),
    `? More States Coming Soon`,
  ].join("     ");

  return (
    <div className="w-full overflow-hidden bg-emerald-950 border-t border-b border-amber-500/30 py-2.5">
      <style>{`
        @keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .ticker-inner { display: inline-block; white-space: nowrap; animation: ticker 40s linear infinite; }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-inner text-amber-400 text-xs font-bold uppercase tracking-widest px-8">
        {items}
      </div>
    </div>
  );
}

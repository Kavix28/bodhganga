import { useEffect, useState } from "react";
import api from "../../services/api";

export default function TickerStrip() {
  const [stats, setStats] = useState({ states: 0, districts: 0, resources: 0, stateNames: [] });

  useEffect(() => {
    api.get("/states/available")
      .then(res => {
        const data = Array.isArray(res) ? res : (res?.data || []);
        const stateCount = data.length;
        const districtCount = data.reduce((acc, s) => acc + (s.districts?.length ?? 0), 0);
        const resourceCount = data.reduce((acc, s) => acc + (s.notesCount ?? 0), 0);
        const stateNames = data.map(s => s.name || s.id);
        setStats({ states: stateCount, districts: districtCount, resources: resourceCount, stateNames });
      })
      .catch(() => {});
  }, []);

  if (stats.states === 0) return null;

  const items = [
    `? ${stats.states} ${stats.states === 1 ? "State" : "States"} Covered`,
    `? ${stats.districts} ${stats.districts === 1 ? "District" : "Districts"} Covered`,
    `? ${stats.resources}+ Study Resources`,
    ...stats.stateNames.map(n => `? ${n}`),
    `? More States & Districts Coming Soon`,
    // repeat for seamless loop
    `? ${stats.states} ${stats.states === 1 ? "State" : "States"} Covered`,
    `? ${stats.districts} ${stats.districts === 1 ? "District" : "Districts"} Covered`,
    `? ${stats.resources}+ Study Resources`,
    ...stats.stateNames.map(n => `? ${n}`),
    `? More States & Districts Coming Soon`,
  ].join("     ");

  return (
    <div className="w-full overflow-hidden bg-emerald-950 border-t border-b border-amber-500/30 py-2.5">
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-inner {
          display: inline-block;
          white-space: nowrap;
          animation: ticker 45s linear infinite;
        }
        .ticker-inner:hover { animation-play-state: paused; }
      `}</style>
      <div className="ticker-inner text-amber-400 text-xs font-bold uppercase tracking-widest px-8">
        {items}
      </div>
    </div>
  );
}

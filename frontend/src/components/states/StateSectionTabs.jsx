import React from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Landmark, Map, Music } from 'lucide-react';

export default function StateSectionTabs({ stateSlug, districtSlug, activeSection, sectionAvailability, onSectionChange }) {
  const navigate = useNavigate();

  const TABS = [
    { id: 'history', label: 'History', icon: History, path: districtSlug ? `/state/${stateSlug}/district/${districtSlug}/products?section=history` : `/state/${stateSlug}/history` },
    { id: 'heritage-monuments', label: 'Heritage Sites & Monuments', icon: Landmark, path: districtSlug ? `/state/${stateSlug}/district/${districtSlug}/products?section=heritage-monuments` : `/state/${stateSlug}/heritage-monuments` },
    { id: 'geography', label: 'Geography', icon: Map, path: districtSlug ? `/state/${stateSlug}/district/${districtSlug}/products?section=geography` : `/state/${stateSlug}/geography` },
    { id: 'art-culture', label: 'Art & Culture', icon: Music, path: districtSlug ? `/state/${stateSlug}/district/${districtSlug}/products?section=art-culture` : `/state/${stateSlug}/art-culture` },
  ];

  const handleTabClick = (tab) => {
    if (onSectionChange) {
      onSectionChange(tab.id);
    } else {
      navigate(tab.path);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Tab Container */}
      <div className="bg-emerald-950/40 rounded-2xl p-1.5 border border-emerald-900/60 shadow-lg backdrop-blur-sm overflow-x-auto scrollbar-none">
        <div className="flex gap-2 min-w-max md:min-w-0 md:grid md:grid-cols-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            const availInfo = sectionAvailability ? sectionAvailability[tab.id] : null;
            const isAvailable = availInfo ? (availInfo.isAvailable || availInfo.count > 0) : null;
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`relative flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2.5 px-3 md:px-4 py-3 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-gold text-emerald-dark shadow-md font-extrabold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-dark' : 'text-gold'}`} />
                  <span>{tab.label}</span>
                </div>
                
                {/* Dynamic Status Badge */}
                {availInfo !== null && availInfo !== undefined && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 transition-all ${
                    isAvailable
                      ? isActive
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : isActive
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                        : 'bg-amber-500/15 text-amber-300/80 border border-amber-500/20'
                  }`}>
                    {isAvailable ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Available
                      </>
                    ) : (
                      'Coming Soon'
                    )}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

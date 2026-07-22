import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, History, Award, Landmark, Map, Music, ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function StateSectionTabs({ stateSlug, activeSection }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingTab, setPendingTab] = useState(null);

  const TABS = [
    { id: 'history', label: 'History', icon: History, path: `/state/${stateSlug}/history` },
    { id: 'heritage-monuments', label: 'Heritage Sites & Monuments', icon: Landmark, path: `/state/${stateSlug}/heritage-monuments` },
    { id: 'geography', label: 'Geography', icon: Map, path: `/state/${stateSlug}/geography` },
    { id: 'art-culture', label: 'Art & Culture', icon: Music, path: `/state/${stateSlug}/art-culture` },
  ];

  const handleTabClick = (tab) => {
    if (isAuthenticated) {
      navigate(tab.path);
    } else {
      setPendingTab(tab);
      setShowLoginModal(true);
    }
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    if (pendingTab) {
      // Pass the destination path to the login page so it redirects back after login
      navigate('/login', { 
        state: { 
          from: { pathname: pendingTab.path } 
        } 
      });
    } else {
      navigate('/login');
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
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`relative flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  isActive
                    ? 'bg-gold text-emerald-dark shadow-md font-extrabold'
                    : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-dark' : 'text-gold'}`} />
                <span>{tab.label}</span>
                
                {/* Lock indicator for logged-out state */}
                {!isAuthenticated && (
                  <Lock className={`w-3.5 h-3.5 absolute top-1 right-1.5 ${isActive ? 'text-emerald-dark/50' : 'text-white/30'}`} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Auth Gating Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-emerald-950 border border-gold/30 rounded-3xl w-full max-w-md shadow-2xl p-8 relative overflow-hidden select-none">
            {/* Background design elements */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-gold/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Lock Header */}
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center text-gold animate-pulse">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white font-serif tracking-tight">Premium Content Access</h3>
              <p className="text-xs text-white/60 leading-relaxed max-w-xs">
                To view <strong className="text-gold font-bold">History, Geography, Heritage, or Art & Culture</strong> modules, you need to log in with a verified student account.
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-emerald-900/40 border border-gold/10 p-4 rounded-2xl mb-6 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gold">
                <span>📚 What's Included:</span>
              </div>
              <ul className="text-[11px] text-white/70 space-y-1.5 list-disc list-inside">
                <li>Bilingual notes and curriculum-mapped timelines</li>
                <li>Geographical blueprints & historical analysis</li>
                <li>Heritage landmark notes & practice materials</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleLoginRedirect}
                className="w-full py-3.5 bg-gradient-to-r from-gold to-gold-dark hover:from-gold-dark hover:to-gold text-emerald-dark font-extrabold text-xs uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-gold/5 flex items-center justify-center gap-2"
              >
                <span>Login to continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-full py-3 border border-white/10 text-white/50 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

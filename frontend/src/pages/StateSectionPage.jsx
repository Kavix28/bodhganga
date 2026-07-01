import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, ArrowLeft, Calendar, FileText, Share2, Award, Compass } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../hooks/useAuth';
import StateSectionTabs from '../components/states/StateSectionTabs';
import Loader from '../components/common/Loader';
import EmptyState from '../components/ui/EmptyState';

const SECTION_TITLES = {
  'history': 'History & Timeline',
  'heritage-monuments': 'Heritage Sites & Monuments',
  'geography': 'Geography & Topography',
  'art-culture': 'Art & Culture',
};

const SECTION_ICONS = {
  'history': Calendar,
  'heritage-monuments': Award,
  'geography': Compass,
  'art-culture': BookOpen,
};

export default function StateSectionPage() {
  const { stateSlug, section } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // Gate content access on mount
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, location, navigate]);

  // Query 1: Fetch State details for titles & breadcrumb
  const { data: stateInfo, isLoading: isStateLoading } = useQuery({
    queryKey: ['stateInfo', stateSlug],
    queryFn: async () => {
      try {
        const res = await api.get(`/states/${stateSlug}`);
        return res?.data?.data || res?.data || res;
      } catch (err) {
        console.warn("Failed to fetch state info from backend, using slug.");
        return { name: stateSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) };
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  // Query 2: Fetch actual section content from backend
  // =========================================================================
  // TODO FOR BACKEND TEAM:
  // 1. Wire endpoints for states: GET /api/states/{stateSlug}/{section}
  //    (Where section is 'history', 'heritage-monuments', 'geography', 'art-culture')
  // 2. Return JSON shape: { title: "String", htmlContent: "HTML string notes" }
  // 3. Keep cache query key intact: ['stateContent', stateSlug, section]
  // =========================================================================
  const { data: sectionContent, isLoading: isContentLoading, error } = useQuery({
    queryKey: ['stateContent', stateSlug, section],
    queryFn: async () => {
      const res = await api.get(`/states/${stateSlug}/${section}`);
      return res?.data?.data || res?.data || res;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return <Loader fullScreen />;
  }

  const stateName = stateInfo?.name || stateSlug;
  const sectionTitle = SECTION_TITLES[section] || section;
  const IconComponent = SECTION_ICONS[section] || FileText;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div>
          <button
            onClick={() => navigate(`/state/${stateSlug}/districts`)}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to {stateName}
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold text-amber-400 font-serif tracking-tight">
                {stateName}
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Explore comprehensive curriculum notes on {sectionTitle}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 rounded-full shadow">
                Premium Section
              </span>
            </div>
          </div>
        </div>

        {/* Tab Bar Integration */}
        <StateSectionTabs stateSlug={stateSlug} activeSection={section} />

        {/* Main Content Area */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-10 shadow-xl relative overflow-hidden mt-6">
          {/* Watermark watermark grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.015)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

          {isStateLoading || isContentLoading ? (
            <div className="py-24 flex items-center justify-center">
              <Loader />
            </div>
          ) : sectionContent ? (
            // SUCCESS CASE (TODO FOR BACKEND: Once the API returns valid content payload,
            // this block will render it dynamically using the schema's htmlContent / title)
            <div className="space-y-6 relative z-10">
              <h2 className="text-xl font-bold font-serif text-amber-400 border-b border-gray-800 pb-3">
                {sectionContent.title || sectionTitle}
              </h2>
              <div 
                className="prose prose-invert max-w-none text-sm text-gray-300 leading-relaxed font-sans"
                dangerouslySetInnerHTML={{ __html: sectionContent.htmlContent || sectionContent.content }}
              />
            </div>
          ) : (
            // FALLBACK PLACEHOLDER CASE (Renders when API returns 404/no content)
            <div className="relative z-10 py-16 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-950/60 border border-gold/20 rounded-full flex items-center justify-center mx-auto mb-2 text-gold">
                <IconComponent className="w-9 h-9" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white font-serif tracking-tight">
                  {stateName} {sectionTitle}
                </h3>
                <p className="text-gray-400 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
                  We are currently curating hand-crafted notes, geographical maps, historical timelines, and previous exam questions for this section.
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-black uppercase tracking-widest text-amber-400">
                <span>🕐 Content Coming Soon</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

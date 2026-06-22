import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Video, Users, MapPin, ArrowRight, Shield } from 'lucide-react';

const StateCard = ({ state }) => {
    const path = state.type === 'UT' ? `/union-territories/${state.id}` : `/states/${state.id}`;
    const imageUrl = state.images?.[0] || state.thumbnail || `https://picsum.photos/400/250?random=${state.id}`;
    
    // Aesthetic fallbacks
    const examName = state.exams?.[0] || `${state.code}PSC`;
    const explanation = state.description || `${examName} Prelims & Mains curriculum fully mapped.`;
    const notesCount = state.notesCount || 140;
    const videosCount = state.videosCount || Math.floor(Math.random() * 20) + 15;
    const aspirantScale = state.aspirantCount 
        ? `${(state.aspirantCount / 1000).toFixed(0)}k+` 
        : `${(Math.floor(Math.random() * 60) + 40)}k+`;

    return (
        <Link 
            to={path} 
            className="card-premium flex flex-col group h-full relative bg-white border border-emerald/5 hover:border-gold/30 hover:shadow-lg transition-all duration-300 glow-emerald-card"
        >
            {/* Thumbnail Banner */}
            <div className="relative w-full bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl overflow-hidden mb-4 border border-emerald/5 shadow-inner">
                <img 
                    src={imageUrl} 
                    alt={state.name} 
                    loading="lazy" 
                    className="w-full object-contain group-hover:scale-105 transition-transform duration-700 brightness-[0.9] group-hover:brightness-100" 
                />
                
                {/* State/UT Badge */}
                {state.code && (
                    <span className="absolute top-3 left-3 text-[8px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-dark/95 text-gold border border-gold/25 backdrop-blur-md">
                        {state.code}
                    </span>
                )}

                {/* Exam Name Trim */}
                <span className="absolute bottom-3 right-3 text-[8px] font-extrabold tracking-widest uppercase px-2.5 py-1 rounded-full bg-gold text-emerald-dark border border-white/20 shadow-md">
                    {examName}
                </span>
            </div>

            {/* Title & Short Details */}
            <div className="px-1 flex-grow space-y-2">
                <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <h3 className="font-bold text-emerald-dark text-base font-serif group-hover:text-emerald transition-colors duration-300 truncate">
                        {state.name}
                    </h3>
                </div>
                
                <p className="text-[10px] text-emerald-dark/70 font-semibold leading-relaxed line-clamp-2">
                    {explanation}
                </p>
                
                {state.capital && (
                    <p className="text-[9px] text-emerald-dark/40 font-extrabold uppercase tracking-wider flex items-center gap-1 pt-1">
                        <MapPin className="w-3 h-3 text-gold" /> {state.capital}
                    </p>
                )}
            </div>

            {/* Premium Stat Shelf */}
            <div className="grid grid-cols-3 gap-2 py-3 border-t border-emerald/5 mt-4 px-1 text-[9px] font-bold uppercase tracking-wider text-emerald-dark/60">
                <div className="flex flex-col items-center justify-center p-1.5 bg-emerald-light/5 rounded-xl border border-emerald/5" title="Available Notes">
                    <BookOpen className="w-3.5 h-3.5 text-emerald mb-1" />
                    <span>{notesCount} Notes</span>
                </div>
                
                <div className="flex flex-col items-center justify-center p-1.5 bg-emerald-light/5 rounded-xl border border-emerald/5" title="Video Lectures">
                    <Video className="w-3.5 h-3.5 text-gold mb-1" />
                    <span>{videosCount} Videos</span>
                </div>

                <div className="flex flex-col items-center justify-center p-1.5 bg-emerald-light/5 rounded-xl border border-emerald/5" title="Estimated Annual Aspirants">
                    <Users className="w-3.5 h-3.5 text-emerald-dark mb-1" />
                    <span>{aspirantScale} Aspirants</span>
                </div>
            </div>

            {/* Bottom Explorer Action */}
            <div className="pt-2 px-1 pb-1">
                <div className="w-full py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-950 group-hover:from-gold group-hover:to-gold-dark text-white group-hover:text-emerald-dark text-[9px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 shadow-sm">
                    <span>Explore Prep Center</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
};

export default StateCard;



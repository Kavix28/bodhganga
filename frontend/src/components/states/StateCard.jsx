import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, HelpCircle, CheckCircle, MapPin } from 'lucide-react';

const StateCard = ({ state, type = 'state' }) => {
    const path = type === 'state' ? `/states/${state.id}` : `/union-territories/${state.id}`;
    const imageUrl = state.images?.[0] || state.image || 'https://picsum.photos/400/250';

    return (
        <Link to={path} className="card-premium flex flex-col group h-full relative bg-white border border-emerald/5 hover:border-gold/30 hover:shadow-lg transition-all duration-300">
            {/* Image section */}
            <div className="relative w-full h-44 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl overflow-hidden mb-4 border border-emerald/5 shadow-inner">
                <img 
                    src={imageUrl} 
                    alt={state.name} 
                    loading="lazy" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                
                {/* Territory code badge */}
                {state.code && (
                    <span className="absolute top-3 left-3 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-dark/90 text-gold border border-gold/25 backdrop-blur-md">
                        {state.code}
                    </span>
                )}
            </div>

            {/* Title */}
            <div className="px-1 flex-grow">
                <h3 className="font-bold text-emerald-dark text-lg mb-1.5 font-serif group-hover:text-emerald transition-colors duration-300">
                    {state.name}
                </h3>
                {state.capital && (
                    <p className="text-[10px] text-emerald-dark/50 font-bold uppercase tracking-wider mb-4 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold" /> {state.capital}
                    </p>
                )}
            </div>

            {/* Meta Stats */}
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-emerald-dark/60 mt-auto pt-3 border-t border-emerald/5 px-1 pb-1">
                <span title="Notes" className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald" /> {state.notesCount}
                </span>
                <span title="Questions" className="flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-gold" /> {state.questionsCount}
                </span>
                <span title="Solutions" className="flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-dark" /> {state.solutionsCount}
                </span>
            </div>
        </Link>
    );
};

export default StateCard;

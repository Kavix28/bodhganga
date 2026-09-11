import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Shield } from 'lucide-react';

import { getStateImage } from '../../utils/stateImageUtils';

const StateCard = ({ state }) => {
    const path = state.type === 'UT' ? `/union-territories/${state.id}` : `/states/${state.id}`;
    const imageUrl = getStateImage(state.id) || state.images?.[0] || state.thumbnail;
    const examName = state.exams?.[0] || `${state.code}PSC`;
    const explanation = state.description || `${examName} Prelims & Mains curriculum fully mapped.`;

    return (
        <Link
            to={path}
            className="card-premium flex flex-col group relative bg-white border border-emerald/5 hover:border-gold/30 hover:shadow-lg transition-all duration-300 glow-emerald-card rounded-2xl"
        >
            <div className="relative w-full">
                <img
                    src={imageUrl}
                    alt={state.name}
                    loading="lazy"
                    className="w-full h-48 object-cover block rounded-t-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 px-3 py-3">
                    <div className="flex items-center gap-1 mb-0.5">
                        <Shield className="w-3 h-3 text-gold flex-shrink-0" />
                        <h3 className="font-bold text-white text-sm font-serif truncate">{state.name}</h3>
                    </div>
                    {state.capital && (
                        <p className="text-[9px] text-white/60 font-bold uppercase tracking-wider flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 text-gold" /> {state.capital}
                        </p>
                    )}
                </div>
                {state.code && (
                    <span className="absolute top-2 left-2 text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full bg-black/70 text-gold border border-gold/25 backdrop-blur-md">
                        {state.code}
                    </span>
                )}
                <span className="absolute top-2 right-2 text-[8px] font-extrabold tracking-widest uppercase px-2 py-0.5 rounded-full bg-gold text-emerald-dark shadow-md">
                    {examName}
                </span>
            </div>
            <div className="px-3 py-3">
                <p className="text-[10px] text-emerald-dark/70 font-semibold leading-relaxed line-clamp-2">{explanation}</p>
            </div>
            <div className="px-3 pb-3 mt-auto">
                <div className="w-full py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 group-hover:from-gold group-hover:to-gold-dark text-white group-hover:text-emerald-dark text-[9px] font-extrabold uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5">
                    <span>Explore Prep Center</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>
        </Link>
    );
};

export default StateCard;





import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Video, Users, MapPin, ArrowRight, Shield } from 'lucide-react';

const StateCard = ({ state }) => {
    const path = state.type === 'UT' ? `/union-territories/${state.id}` : `/states/${state.id}`;
    const stateImageMap = {
  'andhra-pradesh': new URL('../../assets/states/andhra-pradesh-image.png', import.meta.url).href,
  'arunachal-pradesh': new URL('../../assets/states/arunachal-pradesh-image.png', import.meta.url).href,
  'assam': new URL('../../assets/states/assam-image.png', import.meta.url).href,
  'bihar': new URL('../../assets/states/bihar-image.png', import.meta.url).href,
  'chhattisgarh': new URL('../../assets/states/chhattisgarh-image.png', import.meta.url).href,
  'goa': new URL('../../assets/states/goa-image.png', import.meta.url).href,
  'gujarat': new URL('../../assets/states/gujarat-image.png', import.meta.url).href,
  'haryana': new URL('../../assets/states/haryana-image.png', import.meta.url).href,
  'himachal-pradesh': new URL('../../assets/states/himachal-pradesh-image.png', import.meta.url).href,
  'jharkhand': new URL('../../assets/states/jharkhand-image.png', import.meta.url).href,
  'karnataka': new URL('../../assets/states/karnataka-image.png', import.meta.url).href,
  'kerala': new URL('../../assets/states/kerala-image.png', import.meta.url).href,
  'madhya-pradesh': new URL('../../assets/states/madhya-pradesh-image.png', import.meta.url).href,
  'maharashtra': new URL('../../assets/states/maharashtra-image.png', import.meta.url).href,
  'manipur': new URL('../../assets/states/manipur-image.png', import.meta.url).href,
  'meghalaya': new URL('../../assets/states/meghalaya-image.png', import.meta.url).href,
  'mizoram': new URL('../../assets/states/mizoram-image.png', import.meta.url).href,
  'nagaland': new URL('../../assets/states/nagaland-image.png', import.meta.url).href,
  'odisha': new URL('../../assets/states/odisha-image.png', import.meta.url).href,
  'punjab': new URL('../../assets/states/punjab-image.png', import.meta.url).href,
  'rajasthan': new URL('../../assets/states/rajasthan-image.png', import.meta.url).href,
  'sikkim': new URL('../../assets/states/sikkim-image.png', import.meta.url).href,
  'tamil-nadu': new URL('../../assets/states/tamil-nadu-image.png', import.meta.url).href,
  'telangana': new URL('../../assets/states/telangana-image.png', import.meta.url).href,
  'tripura': new URL('../../assets/states/tripura-image.png', import.meta.url).href,
  'uttar-pradesh': new URL('../../assets/states/uttar-pradesh-image.png', import.meta.url).href,
  'uttarakhand': new URL('../../assets/states/uttarakhand-image.png', import.meta.url).href,
  'west-bengal': new URL('../../assets/states/west-bengal-image.png', import.meta.url).href,
  'delhi': new URL('../../assets/states/delhi-image.png', import.meta.url).href,
  'jammu-kashmir': new URL('../../assets/states/jammu-kashmir-image.png', import.meta.url).href,
  'ladakh': new URL('../../assets/states/ladakh-image.png', import.meta.url).href,
  'chandigarh': new URL('../../assets/states/chandigarh-image.png', import.meta.url).href,
  'puducherry': new URL('../../assets/states/puducherry-image.png', import.meta.url).href,
  'lakshadweep': new URL('../../assets/states/lakshadweep-image.png', import.meta.url).href,
  'andaman-nicobar': new URL('../../assets/states/andaman-image.png', import.meta.url).href,
};
const imageUrl = stateImageMap[state.id] || state.images?.[0] || state.thumbnail || `https://bodhganga-pdf-storage-prod.s3.eu-north-1.amazonaws.com/state-images/${state.id}.jpg`;
    
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
            <div className="relative w-full rounded-2xl overflow-hidden mb-4 border border-emerald/5 shadow-inner" style={{aspectRatio: '16/9'}}>
                <img 
                    src={imageUrl} 
                    alt={state.name} 
                    loading="lazy" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-[0.9] group-hover:brightness-100" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                {state.code && (
                    <span className="absolute top-3 left-3 text-[8px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-emerald-dark/95 text-gold border border-gold/25 backdrop-blur-md">
                        {state.code}
                    </span>
                )}
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





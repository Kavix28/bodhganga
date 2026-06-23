import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, Shield } from 'lucide-react';

import imgAndhraPradesh from '../../assets/states/andhra-pradesh-image.png';
import imgArunachalPradesh from '../../assets/states/arunachal-pradesh-image.png';
import imgAssam from '../../assets/states/assam-image.png';
import imgBihar from '../../assets/states/bihar-image.png';
import imgChhattisgarh from '../../assets/states/chhattisgarh-image.png';
import imgGoa from '../../assets/states/goa-image.png';
import imgGujarat from '../../assets/states/gujarat-image.png';
import imgHaryana from '../../assets/states/haryana-image.png';
import imgHimachalPradesh from '../../assets/states/himachal-pradesh-image.png';
import imgJharkhand from '../../assets/states/jharkhand-image.png';
import imgKarnataka from '../../assets/states/karnataka-image.png';
import imgKerala from '../../assets/states/kerala-image.png';
import imgMadhyaPradesh from '../../assets/states/madhya-pradesh-image.png';
import imgMaharashtra from '../../assets/states/maharashtra-image.png';
import imgManipur from '../../assets/states/manipur-image.png';
import imgMeghalaya from '../../assets/states/meghalaya-image.png';
import imgMizoram from '../../assets/states/mizoram-image.png';
import imgNagaland from '../../assets/states/nagaland-image.png';
import imgOdisha from '../../assets/states/odisha-image.png';
import imgPunjab from '../../assets/states/punjab-image.png';
import imgRajasthan from '../../assets/states/rajasthan-image.png';
import imgSikkim from '../../assets/states/sikkim-image.png';
import imgTamilNadu from '../../assets/states/tamil-nadu-image.png';
import imgTelangana from '../../assets/states/telangana-image.png';
import imgTripura from '../../assets/states/tripura-image.png';
import imgUttarPradesh from '../../assets/states/uttar-pradesh-image.png';
import imgUttarakhand from '../../assets/states/uttarakhand-image.png';
import imgWestBengal from '../../assets/states/west-bengal-image.png';
import imgDelhi from '../../assets/states/delhi-image.png';
import imgJammuKashmir from '../../assets/states/jammu-kashmir-image.png';
import imgLadakh from '../../assets/states/ladakh-image.png';
import imgChandigarh from '../../assets/states/chandigarh-image.png';
import imgPuducherry from '../../assets/states/puducherry-image.png';
import imgLakshadweep from '../../assets/states/lakshadweep-image.png';
import imgAndaman from '../../assets/states/andaman-image.png';
import imgDnhDd from '../../assets/states/dnh-dd-image.png';

const STATE_IMGS = {
  'andhra-pradesh': imgAndhraPradesh,
  'arunachal-pradesh': imgArunachalPradesh,
  'assam': imgAssam,
  'bihar': imgBihar,
  'chhattisgarh': imgChhattisgarh,
  'goa': imgGoa,
  'gujarat': imgGujarat,
  'haryana': imgHaryana,
  'himachal-pradesh': imgHimachalPradesh,
  'jharkhand': imgJharkhand,
  'karnataka': imgKarnataka,
  'kerala': imgKerala,
  'madhya-pradesh': imgMadhyaPradesh,
  'maharashtra': imgMaharashtra,
  'manipur': imgManipur,
  'meghalaya': imgMeghalaya,
  'mizoram': imgMizoram,
  'nagaland': imgNagaland,
  'odisha': imgOdisha,
  'punjab': imgPunjab,
  'rajasthan': imgRajasthan,
  'sikkim': imgSikkim,
  'tamil-nadu': imgTamilNadu,
  'telangana': imgTelangana,
  'tripura': imgTripura,
  'uttar-pradesh': imgUttarPradesh,
  'uttarakhand': imgUttarakhand,
  'west-bengal': imgWestBengal,
  'delhi': imgDelhi,
  'jammu-kashmir': imgJammuKashmir,
  'ladakh': imgLadakh,
  'chandigarh': imgChandigarh,
  'puducherry': imgPuducherry,
  'lakshadweep': imgLakshadweep,
  'andaman-nicobar': imgAndaman,
  'dnh-dd': imgDnhDd,
};

const StateCard = ({ state }) => {
    const path = state.type === 'UT' ? `/union-territories/${state.id}` : `/states/${state.id}`;
    const imageUrl = STATE_IMGS[state.id] || state.images?.[0] || state.thumbnail;
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
                    className="w-full h-auto block"
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





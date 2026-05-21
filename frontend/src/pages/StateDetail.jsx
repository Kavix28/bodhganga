import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import Breadcrumb from '../components/common/Breadcrumb';
import { FiExternalLink, FiPrinter } from 'react-icons/fi';
import { MapPin, Globe, BookOpen, Shield } from 'lucide-react';

const StateDetail = () => {
    const { id } = useParams();
    const [state, setState] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchStateDetail();
    }, [id]);

    const fetchStateDetail = async () => {
        try {
            setIsLoading(true);
            const res = await api.get(`/states/${id}`);
            setState(res.data.data || res.data);
        } catch (error) {
            console.error('Failed to load state detail:', error);
            setState(null);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center">
                <div className="text-center text-xs font-bold uppercase tracking-widest text-emerald-dark/50">
                    Retrieving regional curriculum...
                </div>
            </div>
        );
    }

    if (!state) {
        return (
            <div className="min-h-screen bg-ivory-light flex items-center justify-center">
                <div className="text-center text-xs font-bold uppercase tracking-widest text-emerald-dark/50">
                    Territory mapping not found.
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-ivory-light pb-20">
            {/* Breadcrumb Section */}
            <div className="bg-emerald-dark border-b border-gold/15 py-4 px-4">
                <div className="max-w-7xl mx-auto">
                    <Breadcrumb items={[
                        { label: 'States & UTs', path: '/states' },
                        { label: state.name, path: `/states/${state.id}` }
                    ]} />
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT SIDEBAR (4 cols) */}
                    <aside className="lg:col-span-4 space-y-6">
                        <div className="card-premium bg-white p-6 text-center space-y-6">
                            <div className="relative w-full h-56 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl overflow-hidden border border-emerald/5 shadow-inner">
                                <img 
                                    src={state.images?.[0] || "https://picsum.photos/400/250"} 
                                    alt={state.name} 
                                    loading="lazy"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex flex-col gap-3">
                                <a 
                                    href="#" 
                                    className="w-full py-3.5 border border-emerald/10 text-emerald font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-50/50 hover:border-emerald transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    State Portal <FiExternalLink className="w-3.5 h-3.5" />
                                </a>
                                <a 
                                    href="#" 
                                    className="w-full py-3.5 border border-emerald/10 text-emerald font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-50/50 hover:border-emerald transition-all duration-300 flex items-center justify-center gap-2"
                                >
                                    District Directory <FiExternalLink className="w-3.5 h-3.5" />
                                </a>
                            </div>
                        </div>
                    </aside>

                    {/* MAIN CONTENT (8 cols) */}
                    <main className="lg:col-span-8 card-premium bg-white p-8 sm:p-10 space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-emerald/5">
                            <div className="space-y-1">
                                <h1 className="text-3xl md:text-4xl font-bold text-emerald-dark font-serif tracking-tight">
                                    {state.name}
                                </h1>
                                <p className="text-xs text-gold font-bold uppercase tracking-widest flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5" /> Capital: {state.capital}
                                </p>
                            </div>
                            <div className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-emerald-dark/60">
                                <FiPrinter className="cursor-pointer hover:text-emerald text-base transition-colors" />
                                <span>A- A A+</span>
                            </div>
                        </div>

                        {/* Particulars Table */}
                        <div className="overflow-hidden border border-emerald/15 rounded-2xl shadow-sm">
                            <table className="w-full border-collapse">
                                <thead className="bg-emerald text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Particulars</th>
                                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-semibold text-emerald-dark divide-y divide-emerald/5">
                                    <tr className="bg-white">
                                        <td className="px-6 py-3.5 text-emerald-dark/60 text-xs font-bold uppercase tracking-wider">Area</td>
                                        <td className="px-6 py-3.5">{state.area || 'N/A'}</td>
                                    </tr>
                                    <tr className="bg-emerald-light/5">
                                        <td className="px-6 py-3.5 text-emerald-dark/60 text-xs font-bold uppercase tracking-wider">Population</td>
                                        <td className="px-6 py-3.5">{state.population || 'N/A'}</td>
                                    </tr>
                                    <tr className="bg-white">
                                        <td className="px-6 py-3.5 text-emerald-dark/60 text-xs font-bold uppercase tracking-wider">Capital</td>
                                        <td className="px-6 py-3.5">{state.capital}</td>
                                    </tr>
                                    <tr className="bg-emerald-light/5">
                                        <td className="px-6 py-3.5 text-emerald-dark/60 text-xs font-bold uppercase tracking-wider">Principal Languages</td>
                                        <td className="px-6 py-3.5">{state.language || 'N/A'}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Introduction / History Text */}
                        <div className="space-y-8 text-emerald-dark text-sm leading-relaxed font-medium">
                            <div className="space-y-3">
                                <h2 className="text-xl font-bold text-emerald-dark font-serif tracking-tight pb-2 border-b border-emerald/5">
                                    Introduction
                                </h2>
                                <p className="text-emerald-dark/80">
                                    {state.description || state.details?.description || `${state.name} is a vital and strategic region in India, featuring unique historical patterns and cultural depth.`}
                                </p>
                            </div>
                            
                            <div className="space-y-3">
                                <h2 className="text-xl font-bold text-emerald-dark font-serif tracking-tight pb-2 border-b border-emerald/5">
                                    History
                                </h2>
                                <p className="text-emerald-dark/80">
                                    {state.history || 'Comprehensive historical archive compilation currently in progress.'}
                                </p>
                            </div>
                            
                            {state.geography && (
                                <div className="space-y-3">
                                    <h2 className="text-xl font-bold text-emerald-dark font-serif tracking-tight pb-2 border-b border-emerald/5">
                                        Geography & Topography
                                    </h2>
                                    <p className="text-emerald-dark/80">{state.geography}</p>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default StateDetail;

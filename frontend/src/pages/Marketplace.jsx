import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Search, BookOpen, Download, Star, Filter } from 'lucide-react';
import api from '../services/api';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/common/SkeletonLoader';

const categories = ['All', 'Notes', 'Question Bank', 'Bundle', 'Mock Test'];

const Marketplace = () => {
    const { slug } = useParams();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('All');

    // Fetch from real API
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['products', slug],
        queryFn: () => slug
            ? api.get(`/products/state/${slug}`).then(r => r?.data || r || [])
            : api.get('/products').then(r => r?.data || r || []),
        staleTime: 5 * 60 * 1000,
    });

    const filtered = products.filter(p => {
        const matchSearch = (p.title || p.name || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = category === 'All' || p.category === category;
        return matchSearch && matchCat;
    });

    const stateLabel = slug
        ? [...indianStates, ...unionTerritories].find(s => s.id === slug)?.name || slug
        : null;

    return (
        <div className="min-h-screen bg-ivory">
            {/* Header */}
            <section className="bg-gradient-to-br from-emerald-700 to-emerald-900 text-white py-14">
                <div className="container-custom text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-4">
                        <ShoppingBag className="w-4 h-4 text-gold-300" />
                        <span className="text-sm font-semibold text-gold-200">Digital Store</span>
                    </div>
                    <h1 className="text-4xl font-bold mb-3 font-serif">
                        {stateLabel ? `${stateLabel} Study Materials` : 'Content Marketplace'}
                    </h1>
                    <p className="text-emerald-100 max-w-2xl mx-auto">
                        Premium study materials, question banks, and bundles for all competitive exams.
                    </p>
                </div>
            </section>

            <div className="container-custom py-10">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input type="text" placeholder="Search study materials..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            className="input pl-12" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button key={cat} onClick={() => setCategory(cat)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    category === cat
                                        ? 'bg-emerald-700 text-white'
                                        : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                                }`}>
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Products Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SkeletonLoader type="card" count={6} />
                    </div>
                ) : filtered.length === 0 ? (
                    <EmptyState
                        title="No Products Yet"
                        message="Study materials will appear here once published by our team."
                        icon={ShoppingBag}
                    />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map(product => (
                            <div key={product.id} className="heritage-card group">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                                        {product.category || 'Study Material'}
                                    </span>
                                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-gold-100 text-gold-700">
                                        {product.fileType || 'PDF'}
                                    </span>
                                </div>
                                <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center mb-4 shadow-md">
                                    <BookOpen className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="font-bold text-slate-800 mb-2 font-serif leading-snug">
                                    {product.title || product.name}
                                </h3>
                                {product.description && (
                                    <p className="text-sm text-slate-500 mb-3 line-clamp-2">{product.description}</p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                                    {product.rating && (
                                        <span className="flex items-center gap-1">
                                            <Star className="w-4 h-4 text-gold-500 fill-gold-500" />
                                            {product.rating}
                                        </span>
                                    )}
                                    {product.downloadCount && (
                                        <span className="flex items-center gap-1">
                                            <Download className="w-4 h-4" />
                                            {product.downloadCount.toLocaleString()}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                    <div>
                                        {product.price > 0
                                            ? <span className="text-2xl font-bold text-emerald-700">₹{product.price}</span>
                                            : <span className="text-2xl font-bold text-emerald-600">Free</span>}
                                    </div>
                                    <button className="btn-gold btn-sm">Buy Now</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Marketplace;

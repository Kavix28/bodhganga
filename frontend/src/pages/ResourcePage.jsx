import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FolderOpen, 
  Search, 
  MapPin, 
  ChevronLeft, 
  BookOpen, 
  SlidersHorizontal 
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import Breadcrumb from '../components/common/Breadcrumb';
import ResourceCard from '../components/common/ResourceCard';
import { indianStates } from '../data/states';
import { unionTerritories } from '../data/unionTerritories';

const ResourcePage = () => {
  const { stateSlug } = useParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('All');

  // Resolve state metadata dynamically
  const stateMeta = useMemo(() => {
    const allRegions = [...indianStates, ...unionTerritories];
    return allRegions.find(s => s.id === stateSlug) || {
      name: stateSlug.replace(/-/g, ' ').toUpperCase(),
      code: 'State'
    };
  }, [stateSlug]);

  useEffect(() => {
    fetchResources();
    window.scrollTo(0, 0);
  }, [stateSlug]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/state/${stateSlug}`);
      // The API response standard might wrap data in res.data or direct list
      const rawProducts = res.data?.data || res.data || res || [];
      setProducts(rawProducts);
    } catch (error) {
      console.error('Failed to load state resources:', error);
      toast.error('Failed to load regional resources');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique district names for filtering
  const districtList = useMemo(() => {
    const districts = new Set();
    products.forEach(p => {
      if (p.districtName) {
        districts.add(p.districtName);
      }
    });
    return ['All', ...Array.from(districts).sort()];
  }, [products]);

  // Filter products by search and district selection
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // 1. Search Query Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesTitle = p.title?.toLowerCase().includes(q);
        const matchesFileName = p.fileName?.toLowerCase().includes(q);
        const matchesDistrict = p.districtName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesFileName && !matchesDistrict) return false;
      }
      
      // 2. District Filter
      if (selectedDistrictFilter !== 'All') {
        if (p.districtName !== selectedDistrictFilter) return false;
      }

      return true;
    });
  }, [products, searchTerm, selectedDistrictFilter]);

  // Group filtered products by districtName
  const groupedProducts = useMemo(() => {
    const groups = {};
    filteredProducts.forEach(p => {
      const district = p.districtName || 'General';
      if (!groups[district]) {
        groups[district] = [];
      }
      groups[district].push(p);
    });
    
    // Sort keys alphabetically but keep 'General' at the end or top
    return Object.keys(groups)
      .sort((a, b) => {
        if (a === 'General') return 1;
        if (b === 'General') return -1;
        return a.localeCompare(b);
      })
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredProducts]);

  return (
    <div className="min-h-screen bg-ivory-light">
      
      {/* ── LUXURY HEADER BANNER ───────────────────────────────── */}
      <section className="bg-gradient-to-b from-emerald-dark to-emerald-950 text-white relative overflow-hidden py-16 px-6 border-b border-gold/15">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(201,169,97,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(201,169,97,0.03)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]" />
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald via-gold to-emerald" />
        
        <div className="relative max-w-7xl mx-auto space-y-5">
          <div className="mb-2">
            <Breadcrumb items={[
              { label: 'Explore Regions', path: '/states' },
              { label: stateMeta.name, path: `/states/${stateSlug}` },
              { label: 'Study Resources', path: `/states/${stateSlug}/resources` }
            ]} />
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-gold/20">
            <BookOpen className="w-3.5 h-3.5 text-gold animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest text-gold uppercase">Digital Repository</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">
              {stateMeta.name} Study Materials
            </h1>
            <p className="text-white/60 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Browse through hand-crafted syllabus files, documents, audio briefs, and worksheets indexed by administrative districts for {stateMeta.name} {stateMeta.type === 'UT' ? 'Union Territory' : 'State'} PSC preparation.
            </p>
          </div>

          <div className="pt-2">
            <Link 
              to={`/states/${stateSlug}`} 
              className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gold hover:text-white transition-colors duration-200"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Region Hub</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── CONTROLS: SEARCH & DISTRICT FILTER ─────────────────── */}
      <div className="max-w-7xl mx-auto px-6 pt-10 pb-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white p-4 rounded-2xl border border-emerald/10 shadow-sm">
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald/50" />
            <input
              type="text"
              placeholder="Search resource title or district..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 pl-11 pr-4 rounded-xl border border-emerald/10 focus:border-emerald bg-ivory-light/35 text-xs font-semibold transition-all duration-300 focus:ring-4 focus:ring-emerald/5 outline-none"
            />
          </div>

          {/* District Filter Dropdown */}
          {districtList.length > 2 && (
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald/65" />
              <select
                value={selectedDistrictFilter}
                onChange={(e) => setSelectedDistrictFilter(e.target.value)}
                className="py-2.5 px-4 rounded-xl border border-emerald/10 focus:border-emerald bg-white text-xs font-semibold outline-none cursor-pointer"
              >
                {districtList.map(dist => (
                  <option key={dist} value={dist}>
                    {dist === 'All' ? 'All Districts' : dist}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* ── RESOURCE GRID & LISTINGS ──────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {loading ? (
          // Loading Skeleton State
          <div className="space-y-10">
            {[1, 2].map(section => (
              <div key={section} className="space-y-4">
                <div className="h-6 bg-slate-200 rounded w-48 animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-100 space-y-4 animate-pulse">
                      <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                      </div>
                      <div className="h-10 bg-slate-200 rounded-xl" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedProducts).length > 0 ? (
          // Grouped Districts List
          Object.keys(groupedProducts).map(districtName => (
            <div key={districtName} className="space-y-6">
              {/* Section Header */}
              <div className="flex items-center gap-2 border-b border-gold/15 pb-3">
                <MapPin className="w-4 h-4 text-gold-dark" />
                <h2 className="text-lg font-serif font-bold text-emerald-950 uppercase tracking-wider">
                  {districtName} Region
                </h2>
                <span className="text-[10px] bg-emerald/5 border border-emerald/10 text-emerald-dark px-2.5 py-0.5 rounded-full font-bold">
                  {groupedProducts[districtName].length} {groupedProducts[districtName].length === 1 ? 'file' : 'files'}
                </span>
              </div>

              {/* District Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {groupedProducts[districtName].map(product => (
                  <ResourceCard
                    key={product.id}
                    title={product.title}
                    fileName={product.fileName}
                    fileType={product.fileType}
                    s3Url={product.s3Url}
                    districtName={product.districtName}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          // Empty State
          <div className="bg-white border border-emerald/10 rounded-3xl p-16 text-center max-w-xl mx-auto shadow-sm space-y-5">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald/5 flex items-center justify-center">
              <FolderOpen className="w-8 h-8 text-emerald" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-emerald-950">No resources found</h3>
              <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                We are currently indexing files for this region. Please check back later, or contact administration to request study materials for your district.
              </p>
            </div>
            {searchTerm || selectedDistrictFilter !== 'All' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDistrictFilter('All');
                }}
                className="btn-premium btn-premium-primary text-[10px] uppercase font-bold py-2.5 px-6 tracking-widest inline-block"
              >
                Clear Search & Filters
              </button>
            ) : (
              <Link
                to={`/states/${stateSlug}`}
                className="btn-premium btn-premium-primary text-[10px] uppercase font-bold py-2.5 px-6 tracking-widest inline-block"
              >
                Return to Region Hub
              </Link>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default ResourcePage;

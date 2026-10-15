import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
    Map as MapIcon,
    Folder,
    FileText,
    Upload,
    CheckCircle2,
    XCircle,
    Eye,
    EyeOff,
    Trash2,
    Search,
    RefreshCw,
    AlertTriangle,
    Plus,
    ChevronRight,
    Lock,
    Unlock,
    Landmark,
    FileImage,
    Music,
    Video,
    RotateCcw,
    X
} from 'lucide-react';
import {
    getAvailableStates,
    getDistricts,
    getDistrictResources,
    uploadAdminResource,
    updateAdminResourceStatus,
    archiveAdminResource
} from '../../services/adminService';
import { decodeMojibake } from '../../utils/formatters';
import {
    normalizeStateCategory,
    normalizeStateCategorySlug
} from '../../utils/categoryNormalization';

export const STATE_RESOURCE_CATEGORIES = ['Art & Culture', 'History', 'Heritage & Sites', 'Geography'];
export const DISTRICT_RESOURCE_ACCESS_TIERS = ['Free', 'Paid'];

export const deriveResourceTitle = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    return filename.replace(/\.[^/.]+$/, '').trim();
};

const getResourceTypeMeta = (res) => {
    const type = (res.type || res.contentType || '').toUpperCase();
    const ext = (res.fileExtension || '').toLowerCase();
    if (type === 'VIDEO' || ext === 'mp4') {
        return { label: 'VIDEO', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', icon: <Video className="w-3.5 h-3.5 text-cyan-400" /> };
    }
    if (type === 'AUDIO' || ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) {
        return { label: 'AUDIO', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', icon: <Music className="w-3.5 h-3.5 text-purple-400" /> };
    }
    if (type === 'IMAGE' || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        return { label: 'IMAGE', color: 'bg-sky-500/20 text-sky-300 border-sky-500/30', icon: <FileImage className="w-3.5 h-3.5 text-sky-400" /> };
    }
    return { label: 'PDF', color: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: <FileText className="w-3.5 h-3.5 text-rose-400" /> };
};

const AdminStateResources = () => {
    // Content Scope Switcher: 'STATE' | 'DISTRICT'
    const [contentScope, setContentScope] = useState('STATE');

    // Selection state
    const [states, setStates] = useState([]);
    const [selectedState, setSelectedState] = useState(null);
    const [selectedStateCategory, setSelectedStateCategory] = useState('History');
    const [districts, setDistricts] = useState([]);
    const [selectedDistrict, setSelectedDistrict] = useState(null);

    // Resources list state
    const [stateResources, setStateResources] = useState([]);
    const [districtResources, setDistrictResources] = useState([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [loadingResources, setLoadingResources] = useState(false);

    // UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [resourceTab, setResourceTab] = useState('ALL'); // 'ALL' | 'FREE' | 'PAID'
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);
    const [archiveCandidate, setArchiveCandidate] = useState(null);

    // Load available states on mount
    useEffect(() => {
        fetchStates();
    }, []);

    const fetchStates = async () => {
        setLoadingStates(true);
        try {
            const rawData = await getAvailableStates();
            const data = Array.isArray(rawData) ? rawData : [];
            setStates(data);
            if (data.length > 0 && !selectedState) {
                handleSelectState(data[0]);
            }
        } catch (err) {
            console.error('Failed to load states:', err);
            toast.error('Failed to load state catalog');
            setStates([]);
        } finally {
            setLoadingStates(false);
        }
    };

    const handleSelectState = async (state) => {
        setSelectedState(state);
        setSelectedDistrict(null);
        setDistrictResources([]);
        setStateResources([]);
        setLoadingDistricts(true);
        setLoadingResources(true);

        try {
            // Concurrently fetch districts and state-level resources
            const [rawDistricts, rawStateRes] = await Promise.all([
                getDistricts(state.stateSlug),
                getDistrictResources(state.stateSlug, 'general')
            ]);

            const distList = Array.isArray(rawDistricts) ? rawDistricts : [];
            setDistricts(distList);
            const stateResList = Array.isArray(rawStateRes) ? rawStateRes : [];
            setStateResources(stateResList);

            if (distList.length > 0) {
                setSelectedDistrict(distList[0]);
                fetchDistrictResources(state.stateSlug, distList[0].districtSlug);
            }
        } catch (err) {
            console.error('Failed to load state data:', err);
            toast.error('Failed to load state catalog items');
        } finally {
            setLoadingDistricts(false);
            setLoadingResources(false);
        }
    };

    const handleSelectDistrict = async (state, district) => {
        setSelectedDistrict(district);
        fetchDistrictResources(state.stateSlug, district.districtSlug);
    };

    const fetchDistrictResources = async (stateSlug, districtSlug) => {
        setLoadingResources(true);
        try {
            const rawData = await getDistrictResources(stateSlug, districtSlug);
            const data = Array.isArray(rawData) ? rawData : [];
            setDistrictResources(data);
        } catch (err) {
            console.error('Failed to load district resources:', err);
            toast.error('Failed to load district resources');
            setDistrictResources([]);
        } finally {
            setLoadingResources(false);
        }
    };

    const fetchStateResources = async (stateSlug) => {
        setLoadingResources(true);
        try {
            const rawData = await getDistrictResources(stateSlug, 'general');
            const data = Array.isArray(rawData) ? rawData : [];
            setStateResources(data);
        } catch (err) {
            console.error('Failed to load state resources:', err);
            toast.error('Failed to load state resources');
            setStateResources([]);
        } finally {
            setLoadingResources(false);
        }
    };

    const handleStatusToggle = async (resource) => {
        const nextStatus = !resource.isPublished;
        setStatusUpdatingId(resource.id);
        try {
            await updateAdminResourceStatus(resource.id, nextStatus);
            toast.success(nextStatus ? 'Resource published successfully' : 'Resource unpublished');
            const updater = (prev) => prev.map(r => r.id === resource.id ? { ...r, isPublished: nextStatus, published: nextStatus } : r);
            setStateResources(updater);
            setDistrictResources(updater);
        } catch (err) {
            console.error('Failed to toggle status:', err);
            toast.error(err?.message || 'Failed to update resource publication status');
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleConfirmArchive = async () => {
        if (!archiveCandidate) return;
        const resId = archiveCandidate.id;
        try {
            await archiveAdminResource(resId);
            toast.success('Resource archived successfully');
            setStateResources(prev => prev.filter(r => r.id !== resId));
            setDistrictResources(prev => prev.filter(r => r.id !== resId));
            setArchiveCandidate(null);
        } catch (err) {
            console.error('Failed to archive resource:', err);
            toast.error(err?.message || 'Failed to archive resource');
        }
    };

    const safeStates = Array.isArray(states) ? states : [];
    const safeDistricts = Array.isArray(districts) ? districts : [];

    const filteredStates = safeStates.filter(s =>
        (s?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s?.stateSlug || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredDistricts = safeDistricts.filter(d =>
        (d?.district || '').toLowerCase().includes(districtSearch.toLowerCase()) ||
        (d?.districtSlug || '').toLowerCase().includes(districtSearch.toLowerCase())
    );

    // State Resources filtered by selected category
    const selectedCategorySlug = normalizeStateCategorySlug(selectedStateCategory);
    const activeStateCategoryResources = stateResources.filter(r => {
        const rSlug = normalizeStateCategorySlug(r.categorySlug || r.sectionSlug || r.category);
        return rSlug === selectedCategorySlug;
    });

    // District Resources filtered by tab
    const freeDistrictResources = districtResources.filter(r => r.accessTier === 'FREE' || r.isFree || r.free || r.price === 0);
    const paidDistrictResources = districtResources.filter(r => r.accessTier === 'PAID' || (!r.isFree && !r.free && r.price > 0));

    const activeDistrictResources = districtResources.filter(r => {
        if (resourceTab === 'FREE') return r.accessTier === 'FREE' || r.isFree || r.free || r.price === 0;
        if (resourceTab === 'PAID') return r.accessTier === 'PAID' || (!r.isFree && !r.free && r.price > 0);
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
                <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-1">
                        <MapIcon className="w-4 h-4" />
                        <span>State & District Resource Management System</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Resource Catalog</h1>
                    <p className="text-xs text-gray-400 mt-1">
                        Authoritative management and multi-format file uploads across isolated State-Level and District-Level hierarchies.
                    </p>
                    <div className="flex items-center gap-2 mt-3 p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                        <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Looking to ingest Question Bank & Answer PDFs with OCR?</span>
                        <Link to="/admin/question-bank" className="ml-auto font-bold text-amber-400 hover:underline flex items-center gap-1">
                            Open Question Bank OCR Manager <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchStates}
                        disabled={loadingStates}
                        className="flex items-center gap-2 px-3.5 py-2 bg-gray-900/80 hover:bg-gray-700 text-gray-300 font-semibold text-xs rounded-xl border border-gray-700 transition-all"
                        title="Refresh States"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingStates ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>

                    {selectedState && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                        >
                            <Upload className="w-4 h-4 text-gray-950" />
                            <span>Upload Material</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Scope Switcher Banner */}
            <div className="bg-gray-950/70 p-3.5 rounded-2xl border border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-inner">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">Content Scope:</span>
                    <button
                        onClick={() => setContentScope('STATE')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                            contentScope === 'STATE'
                                ? 'bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/20'
                                : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-800'
                        }`}
                    >
                        <Landmark className="w-4 h-4" />
                        <span>State-Level Content</span>
                    </button>
                    <button
                        onClick={() => setContentScope('DISTRICT')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                            contentScope === 'DISTRICT'
                                ? 'bg-amber-500 text-gray-950 shadow-lg shadow-amber-500/20'
                                : 'bg-gray-900/80 text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-800'
                        }`}
                    >
                        <Folder className="w-4 h-4" />
                        <span>District-Level Content</span>
                    </button>
                </div>

                <div className="text-xs text-gray-400 font-mono">
                    {contentScope === 'STATE' ? (
                        <span className="text-amber-300">Target: /state/{selectedState?.stateSlug || ':state'}/{selectedCategorySlug}</span>
                    ) : (
                        <span className="text-emerald-300">Target: /state/{selectedState?.stateSlug || ':state'}/district/{selectedDistrict?.districtSlug || ':district'}/products</span>
                    )}
                </div>
            </div>

            {/* Main Workspace — 3 Panel Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Panel 1: State Selection */}
                <div className="lg:col-span-3 bg-gray-800/60 rounded-2xl border border-gray-700/80 p-4 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                        <div className="flex items-center gap-2 text-white font-bold text-sm">
                            <MapIcon className="w-4 h-4 text-amber-400" />
                            <span>1. Select State</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 text-amber-400 border border-gray-700">
                            {filteredStates.length} States
                        </span>
                    </div>

                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            placeholder="Filter states..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                        {loadingStates ? (
                            <div className="py-8 text-center text-xs text-gray-400">Loading states...</div>
                        ) : filteredStates.length === 0 ? (
                            <div className="py-8 text-center text-xs text-gray-500">No states found</div>
                        ) : (
                            filteredStates.map((state) => {
                                const isSelected = selectedState?.stateSlug === state.stateSlug;
                                return (
                                    <button
                                        key={state.stateSlug}
                                        onClick={() => handleSelectState(state)}
                                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                            isSelected
                                                ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md'
                                                : 'bg-gray-900/40 border-gray-800 text-gray-300 hover:bg-gray-700/50 hover:border-gray-700'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="font-semibold text-xs truncate">{state.name}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">
                                                {state.districtCount || 0} districts
                                            </div>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-gray-600'}`} />
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Panel 2: Contextual Scope Navigator */}
                {contentScope === 'STATE' ? (
                    /* STATE SCOPE: Category Selector */
                    <div className="lg:col-span-3 bg-gray-800/60 rounded-2xl border border-gray-700/80 p-4 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <Landmark className="w-4 h-4 text-amber-400" />
                                <span>2. State Category</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 text-amber-400 border border-gray-700">
                                4 Categories
                            </span>
                        </div>

                        <div className="space-y-2">
                            {STATE_RESOURCE_CATEGORIES.map((cat) => {
                                const catSlug = normalizeStateCategorySlug(cat);
                                const isSelected = selectedStateCategory === cat;
                                const count = stateResources.filter(r => normalizeStateCategorySlug(r.categorySlug || r.sectionSlug || r.category) === catSlug).length;

                                return (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedStateCategory(cat)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                            isSelected
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold shadow-md'
                                                : 'bg-gray-900/40 border-gray-800 text-gray-300 hover:bg-gray-700/50 hover:border-gray-700'
                                        }`}
                                    >
                                        <div className="min-w-0 pr-2">
                                            <div className="text-xs truncate">{cat}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">
                                                /state/{selectedState?.stateSlug || 'state'}/{catSlug}
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                            isSelected ? 'bg-amber-500 text-gray-950' : 'bg-gray-800 text-gray-400'
                                        }`}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[11px] text-gray-400 space-y-1">
                            <div className="font-semibold text-amber-400">Strict State Scope Isolation:</div>
                            <p>State materials are cataloged under <span className="text-amber-300 font-mono">districtSlug: "general"</span> and displayed exclusively on dedicated category pages.</p>
                        </div>
                    </div>
                ) : (
                    /* DISTRICT SCOPE: District Selector */
                    <div className="lg:col-span-3 bg-gray-800/60 rounded-2xl border border-gray-700/80 p-4 space-y-4 shadow-lg">
                        <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                            <div className="flex items-center gap-2 text-white font-bold text-sm">
                                <Folder className="w-4 h-4 text-amber-400" />
                                <span>2. Select District</span>
                            </div>
                            {selectedState && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-900 text-amber-400 border border-gray-700">
                                    {districts.length} Districts
                                </span>
                            )}
                        </div>

                        {!selectedState ? (
                            <div className="py-12 text-center text-xs text-gray-500">
                                Select a state first to view districts.
                            </div>
                        ) : (
                            <>
                                <div className="relative">
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
                                    <input
                                        type="text"
                                        placeholder={`Filter ${selectedState.name} districts...`}
                                        value={districtSearch}
                                        onChange={(e) => setDistrictSearch(e.target.value)}
                                        className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                                    />
                                </div>

                                <div className="space-y-1 max-h-[460px] overflow-y-auto pr-1">
                                    {loadingDistricts ? (
                                        <div className="py-8 text-center text-xs text-gray-400">Loading districts...</div>
                                    ) : filteredDistricts.length === 0 ? (
                                        <div className="py-4 text-center text-xs text-gray-500">No districts match search</div>
                                    ) : (
                                        filteredDistricts.map((district) => {
                                            const isSelected = selectedDistrict?.districtSlug === district.districtSlug;
                                            return (
                                                <button
                                                    key={district.districtSlug}
                                                    onClick={() => handleSelectDistrict(selectedState, district)}
                                                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                                                        isSelected
                                                            ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md'
                                                            : 'bg-gray-900/40 border-gray-800 text-gray-300 hover:bg-gray-700/50 hover:border-gray-700'
                                                    }`}
                                                >
                                                    <div className="min-w-0 pr-2">
                                                        <div className="font-semibold text-xs truncate">{decodeMojibake(district.district)}</div>
                                                        <div className="text-[10px] text-gray-500 font-mono">
                                                            {district.pdfCount || 0} files
                                                        </div>
                                                    </div>
                                                    <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-gray-600'}`} />
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Panel 3: Resource Listing & Lifecycle Management */}
                <div className="lg:col-span-6 bg-gray-800/60 rounded-2xl border border-gray-700/80 p-4 space-y-4 shadow-lg">
                    {contentScope === 'STATE' ? (
                        /* STATE RESOURCES PANEL */
                        <>
                            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                    <span>3. State Materials — {selectedStateCategory}</span>
                                </div>

                                {selectedState && (
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-gray-950" />
                                        <span>Upload {selectedStateCategory}</span>
                                    </button>
                                )}
                            </div>

                            {!selectedState ? (
                                <div className="py-20 text-center text-xs text-gray-500">
                                    Select a state to view study materials.
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-xl border border-gray-700/80">
                                        <div>
                                            <div className="font-bold text-white text-sm">
                                                {decodeMojibake(selectedState.name)} — {selectedStateCategory}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Cataloged Materials: <span className="text-amber-400 font-bold">{activeStateCategoryResources.length}</span> documents
                                            </div>
                                        </div>

                                        <div className="text-xs text-amber-400/80 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                                            districtSlug: "general"
                                        </div>
                                    </div>

                                    {loadingResources ? (
                                        <div className="py-16 text-center text-xs text-gray-400">Loading state materials...</div>
                                    ) : activeStateCategoryResources.length === 0 ? (
                                        <div className="py-16 text-center border-2 border-dashed border-gray-700/80 rounded-2xl p-6 bg-gray-900/30">
                                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-700">
                                                <FileText className="w-6 h-6 text-amber-400/60" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-white mb-1">
                                                No {selectedStateCategory} materials yet
                                            </h3>
                                            <p className="text-xs text-gray-400 max-w-sm mb-4 mx-auto">
                                                There are currently no active state study materials cataloged for {selectedStateCategory} in {decodeMojibake(selectedState.name)}.
                                            </p>
                                            <button
                                                onClick={() => setIsUploadModalOpen(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all"
                                            >
                                                <Plus className="w-4 h-4 text-gray-950" />
                                                <span>Upload First Document</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                            {activeStateCategoryResources.map((res) => {
                                                const isPublished = res.published || res.isPublished;
                                                const isUpdating = statusUpdatingId === res.id;
                                                const typeMeta = getResourceTypeMeta(res);

                                                return (
                                                    <div
                                                        key={res.id}
                                                        className="bg-gray-900/60 border border-gray-700/80 hover:border-gray-600 rounded-xl p-4 transition-all shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border ${typeMeta.color}`}>
                                                                        {typeMeta.icon}
                                                                        <span>{typeMeta.label}</span>
                                                                    </span>

                                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                                                        STATE CONTENT
                                                                    </span>

                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                                                                        isPublished
                                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                                    }`}>
                                                                        {isPublished ? <CheckCircle2 className="w-3 h-3 text-blue-400" /> : <XCircle className="w-3 h-3 text-gray-500" />}
                                                                        {isPublished ? 'PUBLISHED' : 'UNPUBLISHED'}
                                                                    </span>

                                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-800 text-amber-300 border border-gray-700">
                                                                        {res.category}
                                                                    </span>
                                                                </div>

                                                                <h4 className="font-semibold text-white text-sm line-clamp-1">
                                                                    {res.title}
                                                                </h4>
                                                                {res.description && (
                                                                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                                                                        {res.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* S3 Key / Hash Metadata */}
                                                        <div className="bg-gray-950/50 p-2 rounded-lg border border-gray-800 text-[11px] font-mono text-gray-400 space-y-0.5 mb-3">
                                                            <div className="truncate">
                                                                <span className="text-gray-500">S3 Key:</span> {res.s3Key}
                                                            </div>
                                                            {res.contentHash && (
                                                                <div className="truncate text-gray-500">
                                                                    SHA-256: {res.contentHash}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                                                            <div className="text-[11px] text-gray-500">
                                                                ID: <span className="font-mono text-gray-400">{res.id}</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleStatusToggle(res)}
                                                                    disabled={isUpdating}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                                                        isPublished
                                                                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                            : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                                    }`}
                                                                >
                                                                    {isUpdating ? (
                                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                    ) : isPublished ? (
                                                                        <EyeOff className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    )}
                                                                    <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => setArchiveCandidate(res)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                                                                    title="Archive resource"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Archive</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    ) : (
                        /* DISTRICT RESOURCES PANEL */
                        <>
                            <div className="flex items-center justify-between border-b border-gray-700 pb-3">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <FileText className="w-4 h-4 text-amber-400" />
                                    <span>3. District Resource Catalog</span>
                                </div>

                                {selectedDistrict && (
                                    <button
                                        onClick={() => setIsUploadModalOpen(true)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-gray-950" />
                                        <span>Upload</span>
                                    </button>
                                )}
                            </div>

                            {!selectedDistrict ? (
                                <div className="py-20 text-center text-xs text-gray-500">
                                    Select a district to view and manage cataloged resources.
                                </div>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-xl border border-gray-700/80">
                                        <div>
                                            <div className="font-bold text-white text-sm">
                                                {decodeMojibake(selectedDistrict.district)}, {decodeMojibake(selectedState?.name)}
                                            </div>
                                            <div className="text-[11px] text-gray-400">
                                                Total Cataloged: <span className="text-amber-400 font-bold">{districtResources.length}</span> resources
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 bg-gray-800 p-1 rounded-lg border border-gray-700">
                                            <button
                                                onClick={() => setResourceTab('ALL')}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                    resourceTab === 'ALL' ? 'bg-amber-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                All ({districtResources.length})
                                            </button>
                                            <button
                                                onClick={() => setResourceTab('FREE')}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                    resourceTab === 'FREE' ? 'bg-emerald-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Free ({freeDistrictResources.length})
                                            </button>
                                            <button
                                                onClick={() => setResourceTab('PAID')}
                                                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
                                                    resourceTab === 'PAID' ? 'bg-amber-500 text-gray-950 shadow' : 'text-gray-400 hover:text-white'
                                                }`}
                                            >
                                                Paid ({paidDistrictResources.length})
                                            </button>
                                        </div>
                                    </div>

                                    {loadingResources ? (
                                        <div className="py-16 text-center text-xs text-gray-400">Loading cataloged resources...</div>
                                    ) : districtResources.length === 0 ? (
                                        <div className="py-16 text-center border-2 border-dashed border-gray-700/80 rounded-2xl p-6 bg-gray-900/30">
                                            <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-gray-700">
                                                <FileText className="w-6 h-6 text-amber-400/60" />
                                            </div>
                                            <h3 className="text-sm font-semibold text-white mb-1">
                                                No resources uploaded yet
                                            </h3>
                                            <p className="text-xs text-gray-400 max-w-sm mb-4 mx-auto">
                                                There are currently no active resources cataloged for {decodeMojibake(selectedDistrict.district)}, {decodeMojibake(selectedState?.name)}.
                                            </p>
                                            <button
                                                onClick={() => setIsUploadModalOpen(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs rounded-xl shadow-md transition-all"
                                            >
                                                <Plus className="w-4 h-4 text-gray-950" />
                                                <span>Upload First Resource</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                            {activeDistrictResources.map((res) => {
                                                const isPublished = res.published || res.isPublished;
                                                const isFree = res.isFree || res.free;
                                                const isUpdating = statusUpdatingId === res.id;
                                                const typeMeta = getResourceTypeMeta(res);

                                                return (
                                                    <div
                                                        key={res.id}
                                                        className="bg-gray-900/60 border border-gray-700/80 hover:border-gray-600 rounded-xl p-4 transition-all shadow-md"
                                                    >
                                                        <div className="flex items-start justify-between gap-3 mb-2">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 border ${typeMeta.color}`}>
                                                                        {typeMeta.icon}
                                                                        <span>{typeMeta.label}</span>
                                                                    </span>

                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                                        isFree
                                                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                    }`}>
                                                                        {isFree ? 'FREE (₹0)' : 'PAID (₹99)'}
                                                                    </span>

                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                                                                        isPublished
                                                                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                                            : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                                    }`}>
                                                                        {isPublished ? <CheckCircle2 className="w-3 h-3 text-blue-400" /> : <XCircle className="w-3 h-3 text-gray-500" />}
                                                                        {isPublished ? 'PUBLISHED' : 'UNPUBLISHED'}
                                                                    </span>
                                                                </div>

                                                                <h4 className="font-semibold text-white text-sm line-clamp-1">
                                                                    {res.title}
                                                                </h4>
                                                                {res.description && (
                                                                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">
                                                                        {res.description}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            <div className="text-right">
                                                                <span className="text-sm font-bold text-white font-mono">
                                                                    {isFree ? '₹0' : '₹99'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* S3 Key / Hash Metadata */}
                                                        <div className="bg-gray-950/50 p-2 rounded-lg border border-gray-800 text-[11px] font-mono text-gray-400 space-y-0.5 mb-3">
                                                            <div className="truncate">
                                                                <span className="text-gray-500">S3 Key:</span> {res.s3Key}
                                                            </div>
                                                            {res.contentHash && (
                                                                <div className="truncate text-gray-500">
                                                                    SHA-256: {res.contentHash}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Action Buttons */}
                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                                                            <div className="text-[11px] text-gray-500">
                                                                ID: <span className="font-mono text-gray-400">{res.id}</span>
                                                            </div>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={() => handleStatusToggle(res)}
                                                                    disabled={isUpdating}
                                                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                                                        isPublished
                                                                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                                            : 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                                    }`}
                                                                >
                                                                    {isUpdating ? (
                                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                                    ) : isPublished ? (
                                                                        <EyeOff className="w-3.5 h-3.5" />
                                                                    ) : (
                                                                        <Eye className="w-3.5 h-3.5" />
                                                                    )}
                                                                    <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                                                                </button>

                                                                <button
                                                                    onClick={() => setArchiveCandidate(res)}
                                                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all"
                                                                    title="Archive resource"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                    <span>Archive</span>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── MULTI-FILE ADMIN UPLOAD MODAL ─────────────────────────────────────── */}
            {isUploadModalOpen && selectedState && (
                <AdminResourceUploadModal
                    initialScope={contentScope}
                    state={selectedState}
                    district={selectedDistrict}
                    states={safeStates}
                    districts={safeDistricts}
                    defaultCategory={selectedStateCategory}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={async () => {
                        await fetchStateResources(selectedState.stateSlug);
                        if (selectedDistrict) {
                            await fetchDistrictResources(selectedState.stateSlug, selectedDistrict.districtSlug);
                        }
                        fetchStates();
                    }}
                />
            )}

            {/* ── CONFIRM ARCHIVE DIALOG ────────────────────────────────────────── */}
            {archiveCandidate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 text-amber-400">
                            <AlertTriangle className="w-7 h-7" />
                            <h3 className="text-lg font-bold text-white">Archive Resource?</h3>
                        </div>

                        <p className="text-sm text-gray-300 leading-relaxed">
                            Are you sure you want to archive <span className="font-semibold text-white">"{archiveCandidate.title}"</span>?
                        </p>
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                            Archiving performs a soft-delete. The resource will no longer appear in public user resource listings.
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-700">
                            <button
                                onClick={() => setArchiveCandidate(null)}
                                className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmArchive}
                                className="px-5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg transition-all"
                            >
                                Archive Resource
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── ROBUST MULTI-FILE, MULTI-FORMAT ADMIN UPLOAD MODAL COMPONENT ──────────────
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg', 'webp', 'mp3', 'wav', 'm4a', 'aac', 'ogg', 'mp4'];
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB
const CONCURRENCY_LIMIT = 3;

const detectResourceType = (file) => {
    const mime = (file.type || '').toLowerCase();
    const ext = (file.name || '').split('.').pop().toLowerCase();

    if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp'].includes(ext)) return 'IMAGE';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'm4a', 'aac', 'ogg'].includes(ext)) return 'AUDIO';
    if (mime.startsWith('video/') || ext === 'mp4') return 'VIDEO';
    return 'DOCUMENT';
};

const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminResourceUploadModal = ({
    initialScope = 'STATE',
    state,
    district,
    states = [],
    districts = [],
    defaultCategory = 'History',
    onClose,
    onSuccess
}) => {
    // Explicit Scope Switcher in modal: 'STATE' | 'DISTRICT'
    const [scope, setScope] = useState(initialScope);

    // Selected state & district inside modal
    const [modalState, setModalState] = useState(state);
    const [modalDistricts, setModalDistricts] = useState(districts);
    const [modalDistrict, setModalDistrict] = useState(
        district?.districtSlug && district.districtSlug !== 'general' ? district : (districts.length > 0 ? districts[0] : null)
    );

    // State category: Art & Culture, History, Heritage & Sites, Geography
    const [stateCategory, setStateCategory] = useState(defaultCategory || 'History');

    // District tier: Free or Paid
    const [isFree, setIsFree] = useState(true);
    const [category, setCategory] = useState('Free');
    const isStateScope = scope === 'STATE';
    const isStateLevel = isStateScope;
    const [publish, setPublish] = useState(true);

    const [queue, setQueue] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadSummary, setUploadSummary] = useState(null);

    const activeUploadsRef = useRef(new Map());
    const queueRef = useRef(queue);
    queueRef.current = queue;

    const fileInputRef = useRef(null);

    // When modalState changes, reload its districts
    const handleStateChange = async (newStateSlug) => {
        const nextState = states.find(s => s.stateSlug === newStateSlug);
        if (!nextState) return;
        setModalState(nextState);
        try {
            const rawDistricts = await getDistricts(nextState.stateSlug);
            const distList = Array.isArray(rawDistricts) ? rawDistricts : [];
            setModalDistricts(distList);
            if (distList.length > 0) {
                setModalDistrict(distList[0]);
            } else {
                setModalDistrict(null);
            }
        } catch (err) {
            console.error('Failed to update districts for modal state:', err);
        }
    };

    // Filter out invalid files and add valid ones to queue
    const addFilesToQueue = (files) => {
        if (!files || files.length === 0) return;

        const newItems = [];
        const invalidFiles = [];

        Array.from(files).forEach((file, idx) => {
            const ext = file.name.split('.').pop().toLowerCase();

            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                invalidFiles.push(`${file.name} (unsupported format '.${ext}')`);
                return;
            }

            if (file.size > MAX_FILE_SIZE_BYTES) {
                invalidFiles.push(`${file.name} (exceeds 50MB limit)`);
                return;
            }

            const id = `file-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
            newItems.push({
                id,
                file,
                name: file.name,
                size: file.size,
                extension: ext,
                resourceType: detectResourceType(file),
                status: 'pending',
                progress: 0,
                errorMessage: null,
                isDuplicate: false,
            });
        });

        if (invalidFiles.length > 0) {
            toast.error(`Some files could not be added:\n${invalidFiles.join(', ')}`);
        }

        if (newItems.length > 0) {
            setQueue(prev => [...prev, ...newItems]);
            setUploadSummary(null);
        }
    };

    const handleFileSelect = (e) => {
        addFilesToQueue(e.target.files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer?.files) {
            addFilesToQueue(e.dataTransfer.files);
        }
    };

    // Single file upload worker
    const uploadFileItem = async (item) => {
        const controller = new AbortController();
        activeUploadsRef.current.set(item.id, controller);

        setQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading', progress: 0, errorMessage: null } : f));

        const fileTitle = deriveResourceTitle(item.name);
        const isStateScope = scope === 'STATE';

        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('stateSlug', modalState.stateSlug);
        formData.append('districtSlug', isStateScope ? 'general' : modalDistrict.districtSlug);
        formData.append('resourceScope', isStateScope ? 'STATE' : 'DISTRICT');
        formData.append('contentArea', isStateScope ? 'STATE_CONTENT' : (isFree ? 'FREE_DISTRICT_CONTENT' : 'PAID_DISTRICT_RESOURCES'));
        formData.append('category', isStateScope ? stateCategory : (isFree ? 'Free' : 'Paid'));
        formData.append('categorySlug', isStateScope ? normalizeStateCategorySlug(stateCategory) : (isFree ? 'free' : 'paid'));
        formData.append('sectionSlug', isStateScope ? normalizeStateCategorySlug(stateCategory) : (isFree ? 'free' : 'paid'));
        formData.append('isFree', isStateScope ? 'true' : (isFree ? 'true' : 'false'));
        formData.append('title', fileTitle);
        formData.append('description', description.trim());
        formData.append('publish', publish ? 'true' : 'false');

        try {
            const res = await uploadAdminResource(formData, {
                signal: controller.signal,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setQueue(prev => prev.map(f => f.id === item.id ? { ...f, progress: pct } : f));
                    }
                }
            });

            activeUploadsRef.current.delete(item.id);
            const isDuplicate = res?.isDuplicate;
            setQueue(prev => prev.map(f => f.id === item.id ? {
                ...f,
                status: 'success',
                progress: 100,
                isDuplicate: !!isDuplicate,
                errorMessage: isDuplicate ? 'Identical content cataloged' : null
            } : f));
        } catch (err) {
            activeUploadsRef.current.delete(item.id);
            if (err.name === 'CanceledError' || err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                setQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'cancelled', progress: 0, errorMessage: 'Upload cancelled by user' } : f));
            } else {
                const msg = err.error || err.message || 'Upload failed';
                console.error(`[AdminResourceUpload] Upload failed for ${item.name}:`, err);
                setQueue(prev => prev.map(f => f.id === item.id ? { ...f, status: 'failed', progress: 0, errorMessage: msg } : f));
            }
        }
    };

    // Concurrency Queue Runner
    const processQueue = useCallback(async () => {
        const currentQueue = queueRef.current;
        const pendingFiles = currentQueue.filter(item => item.status === 'pending');
        const uploadingCount = currentQueue.filter(item => item.status === 'uploading').length;

        if (pendingFiles.length === 0 && uploadingCount === 0) {
            setIsUploading(false);
            const successCount = currentQueue.filter(item => item.status === 'success').length;
            const failedCount = currentQueue.filter(item => item.status === 'failed').length;
            if (successCount > 0) {
                setUploadSummary({ successCount, failedCount });
                toast.success(`${successCount} resource file(s) processed successfully!`);
                onSuccess();
            } else if (failedCount > 0) {
                setUploadSummary({ successCount, failedCount });
                toast.error(`Failed to upload ${failedCount} file(s). See error details below.`);
            }
            return;
        }

        const slotsAvailable = CONCURRENCY_LIMIT - uploadingCount;
        if (slotsAvailable <= 0 || pendingFiles.length === 0) return;

        const filesToStart = pendingFiles.slice(0, slotsAvailable);
        for (const item of filesToStart) {
            uploadFileItem(item);
        }
    }, [onSuccess, scope, stateCategory, isFree, description, publish, modalState.stateSlug, modalDistrict]);

    useEffect(() => {
        if (isUploading) {
            processQueue();
        }
    }, [queue, isUploading, processQueue]);

    const handleStartUpload = () => {
        if (queue.length === 0) {
            toast.error('Please select at least one file to upload.');
            return;
        }
        if (scope === 'STATE' && !STATE_RESOURCE_CATEGORIES.includes(stateCategory)) {
            toast.error('Please select a valid State content category (Art & Culture, History, Heritage & Sites, Geography).');
            return;
        }
        if (scope === 'DISTRICT' && !modalDistrict) {
            toast.error('Please select a valid district for District-level content.');
            return;
        }
        setIsUploading(true);
    };

    const handleRetry = (fileId) => {
        setQueue(prev => prev.map(f => f.id === fileId ? { ...f, status: 'pending', progress: 0, errorMessage: null } : f));
        setIsUploading(true);
    };

    const handleCancel = (fileId) => {
        const controller = activeUploadsRef.current.get(fileId);
        if (controller) {
            controller.abort();
            activeUploadsRef.current.delete(fileId);
        } else {
            setQueue(prev => prev.map(f => f.id === fileId ? { ...f, status: 'cancelled', errorMessage: 'Upload cancelled' } : f));
        }
    };

    const handleRemoveFromQueue = (fileId) => {
        handleCancel(fileId);
        setQueue(prev => prev.filter(f => f.id !== fileId));
    };

    const handleClearCompleted = () => {
        setQueue(prev => prev.filter(f => f.status !== 'success'));
    };

    const pendingCount = queue.filter(f => f.status === 'pending').length;
    const uploadingCount = queue.filter(f => f.status === 'uploading').length;
    const successCount = queue.filter(f => f.status === 'success').length;
    const failedCount = queue.filter(f => f.status === 'failed').length;

    const isStateScope = scope === 'STATE';
    const canonicalStateCategorySlug = normalizeStateCategorySlug(stateCategory);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-5 relative max-h-[90vh] flex flex-col overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-gray-700 pb-4 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">
                                {isStateScope ? 'Upload State-Level Study Material' : 'Upload District Resource'}
                            </h3>
                            <p className="text-xs text-gray-400">
                                {decodeMojibake(modalState.name)} &bull; {isStateScope ? `Category: ${stateCategory}` : (modalDistrict ? decodeMojibake(modalDistrict.district) : 'Select District')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isUploading}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Main Scrollable Body */}
                <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                    {/* Content Scope Selector (State vs District) */}
                    <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-2">CONTENT SCOPE</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setScope('STATE')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                                    isStateScope
                                        ? 'bg-amber-500 text-gray-950 border-amber-500 shadow-md'
                                        : 'bg-gray-900/60 border-gray-700 text-gray-300 hover:border-gray-600'
                                }`}
                            >
                                <Landmark className="w-4 h-4" />
                                <span>State-Level Content</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setScope('DISTRICT')}
                                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all ${
                                    !isStateScope
                                        ? 'bg-amber-500 text-gray-950 border-amber-500 shadow-md'
                                        : 'bg-gray-900/60 border-gray-700 text-gray-300 hover:border-gray-600'
                                }`}
                            >
                                <Folder className="w-4 h-4" />
                                <span>District-Level Content</span>
                            </button>
                        </div>
                    </div>

                    {/* Destination Banner */}
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs space-y-1">
                        <div className="text-amber-400 font-bold flex items-center gap-1.5">
                            <span>Target Destination:</span>
                            <span className="text-white">
                                {isStateScope
                                    ? `State Content (${stateCategory}) — ${modalState.name}`
                                    : `District Content (${modalDistrict ? decodeMojibake(modalDistrict.district) : 'District'} - ${isFree ? 'Free' : 'Paid'}) — ${modalState.name}`}
                            </span>
                        </div>
                        <div className="text-gray-400 text-[11px]">
                            Appears exclusively on: <span className="text-amber-300 font-mono">
                                {isStateScope
                                    ? `/state/${modalState.stateSlug}/${canonicalStateCategorySlug}`
                                    : `/state/${modalState.stateSlug}/district/${modalDistrict?.districtSlug || 'district'}/products`}
                            </span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono pt-1 border-t border-gray-800">
                            Payload: stateSlug="{modalState.stateSlug}" | districtSlug="{isStateScope ? 'general' : modalDistrict?.districtSlug}" | scope="{isStateScope ? 'STATE' : 'DISTRICT'}"
                        </div>
                    </div>

                    {/* Metadata Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-900/50 p-4 rounded-xl border border-gray-700/80">
                        {/* State Dropdown */}
                        <div>
                            <label className="block text-xs text-gray-300 font-semibold mb-1.5">
                                Select State <span className="text-amber-400">*</span>
                            </label>
                            <select
                                value={modalState.stateSlug}
                                onChange={(e) => handleStateChange(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                            >
                                {states.map(s => (
                                    <option key={s.stateSlug} value={s.stateSlug}>
                                        {decodeMojibake(s.name)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* State Category OR District Selector */}
                        {isStateLevel ? (
                            <div>
                                <label className="block text-xs text-gray-300 font-semibold mb-1.5">
                                    State Category <span className="text-amber-400">*</span>
                                </label>
                                <select
                                    value={stateCategory}
                                    onChange={(e) => setStateCategory(e.target.value)}
                                    className="w-full bg-gray-900 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-amber-300 focus:outline-none focus:border-amber-400 font-bold"
                                >
                                    <option value="Art & Culture">Art & Culture</option>
                                    <option value="History">History</option>
                                    <option value="Heritage & Sites">Heritage & Sites</option>
                                    <option value="Geography">Geography</option>
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs text-gray-300 font-semibold mb-1.5">
                                    Select District <span className="text-amber-400">*</span>
                                </label>
                                <select
                                    value={modalDistrict?.districtSlug || ''}
                                    onChange={(e) => {
                                        const d = modalDistricts.find(item => item.districtSlug === e.target.value);
                                        setModalDistrict(d || null);
                                    }}
                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                                >
                                    {modalDistricts.map(d => (
                                        <option key={d.districtSlug} value={d.districtSlug}>
                                            {decodeMojibake(d.district)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* District Access Tier (ONLY visible for District Scope) */}
                        {!isStateLevel && (
                            <div className="md:col-span-2 space-y-2">
                                <label className="block text-xs text-gray-300 font-semibold">Select Access Tier</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsFree(true);
                                            setCategory('Free');
                                        }}
                                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                            isFree
                                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md'
                                                : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }`}
                                    >
                                        <Unlock className="w-4 h-4 text-emerald-400" />
                                        <span>FREE (₹0)</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsFree(false);
                                            setCategory('Paid');
                                        }}
                                        className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                                            !isFree
                                                ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                                                : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-600'
                                        }`}
                                    >
                                        <Lock className="w-4 h-4 text-amber-400" />
                                        <span>PAID (₹99)</span>
                                    </button>
                                </div>

                                <div className="pt-1">
                                    <label className="block text-xs text-gray-400 font-medium mb-1">Access Tier Option</label>
                                    <select
                                        value={category}
                                        onChange={(e) => {
                                            setCategory(e.target.value);
                                            setIsFree(e.target.value === 'Free');
                                        }}
                                        className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-semibold text-amber-300"
                                    >
                                        <option value="Free">Free</option>
                                        <option value="Paid">Paid</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Description */}
                        <div className="md:col-span-2">
                            <label className="block text-xs text-gray-300 font-semibold mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                placeholder="Brief summary of uploaded material..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                            />
                        </div>
                    </div>

                    {/* Publish Checkbox */}
                    <div className="flex items-center gap-2 px-1">
                        <input
                            type="checkbox"
                            id="publishImmediately"
                            checked={publish}
                            onChange={(e) => setPublish(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-gray-900 border-gray-700"
                        />
                        <label htmlFor="publishImmediately" className="text-xs text-gray-300">
                            Publish material immediately upon cataloging
                        </label>
                    </div>

                    {/* Multi-Format File Dropzone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            isDragging
                                ? 'border-amber-500 bg-amber-500/10 scale-[1.01]'
                                : 'border-gray-700 hover:border-amber-500/60 bg-gray-900/40 hover:bg-gray-900/80'
                        }`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.mp3,.wav,.m4a,.aac,.ogg,.mp4"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                        <div className="flex justify-center items-center gap-3 mb-2 text-amber-400">
                            <FileText className="w-6 h-6 text-rose-400" />
                            <FileImage className="w-6 h-6 text-sky-400" />
                            <Music className="w-6 h-6 text-purple-400" />
                            <Video className="w-6 h-6 text-cyan-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white">Upload Material Files *</h4>
                        <p className="text-xs text-gray-400 mt-1">
                            Drag & drop multiple files here or <span className="text-amber-400 font-semibold underline">Choose Files</span>
                        </p>
                        <p className="text-[11px] text-gray-500 mt-2 font-mono">
                            Supported: PDF, DOC, DOCX, JPG, JPEG, PNG, WEBP, MP3, WAV, M4A, AAC, OGG, MP4 &bull; Max size: 50MB per file
                        </p>
                    </div>

                    {/* Upload Summary Alert */}
                    {uploadSummary && (
                        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span>
                                    Batch complete: <strong className="font-bold text-white">{uploadSummary.successCount}</strong> uploaded successfully.
                                    {uploadSummary.failedCount > 0 && <span className="text-red-300 ml-1">({uploadSummary.failedCount} failed)</span>}
                                </span>
                            </div>
                            <button
                                onClick={handleClearCompleted}
                                className="text-[11px] font-bold text-amber-400 hover:underline"
                            >
                                Clear Completed
                            </button>
                        </div>
                    )}

                    {/* File Queue List */}
                    {queue.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold px-1">
                                <span>
                                    Queue ({queue.length} file{queue.length !== 1 ? 's' : ''})
                                    {uploadingCount > 0 && <span className="text-amber-400 ml-2 animate-pulse">&bull; Uploading {uploadingCount} (max {CONCURRENCY_LIMIT} concurrent)...</span>}
                                </span>
                                {successCount > 0 && (
                                    <button
                                        onClick={handleClearCompleted}
                                        className="text-[11px] text-gray-400 hover:text-amber-400"
                                    >
                                        Clear Uploaded ({successCount})
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {queue.map((item) => {
                                    const typeMeta = getResourceTypeMeta({ type: item.resourceType, fileExtension: item.extension });

                                    return (
                                        <div
                                            key={item.id}
                                            className="bg-gray-900/80 border border-gray-700/80 rounded-xl p-3 space-y-2 text-xs"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                    <span className={`p-1.5 rounded-lg border shrink-0 ${typeMeta.color}`}>
                                                        {typeMeta.icon}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-semibold text-white truncate" title={item.name}>
                                                            {item.name}
                                                        </div>
                                                        <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5 flex-wrap">
                                                            <span>{formatBytes(item.size)} &bull; {item.resourceType}</span>
                                                            <span className="text-amber-400 font-sans">&rarr; Title: &ldquo;{deriveResourceTitle(item.name)}&rdquo;</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Badge & Actions */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {item.status === 'pending' && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-800 text-gray-400 rounded">
                                                            Pending
                                                        </span>
                                                    )}
                                                    {item.status === 'uploading' && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30 animate-pulse">
                                                            Uploading {item.progress}%
                                                        </span>
                                                    )}
                                                    {item.status === 'success' && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30 flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                                            {item.isDuplicate ? 'Cataloged (Duplicate)' : 'Uploaded'}
                                                        </span>
                                                    )}
                                                    {item.status === 'failed' && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500/20 text-red-300 rounded border border-red-500/30 flex items-center gap-1">
                                                            <XCircle className="w-3 h-3 text-red-400" />
                                                            Failed
                                                        </span>
                                                    )}
                                                    {item.status === 'cancelled' && (
                                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-800 text-gray-500 rounded">
                                                            Cancelled
                                                        </span>
                                                    )}

                                                    {/* Retry Button */}
                                                    {item.status === 'failed' && (
                                                        <button
                                                            onClick={() => handleRetry(item.id)}
                                                            className="p-1 text-amber-400 hover:text-amber-300 hover:bg-gray-800 rounded transition-all"
                                                            title="Retry upload"
                                                        >
                                                            <RotateCcw className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}

                                                    {/* Remove / Cancel Button */}
                                                    <button
                                                        onClick={() => handleRemoveFromQueue(item.id)}
                                                        className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded transition-all"
                                                        title={item.status === 'success' ? 'Clear from queue' : 'Remove file'}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            {item.status === 'uploading' && (
                                                <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-amber-500 h-full transition-all duration-200"
                                                        style={{ width: `${item.progress}%` }}
                                                    ></div>
                                                </div>
                                            )}

                                            {/* Error Notification */}
                                            {item.errorMessage && item.status !== 'success' && (
                                                <div className="text-[11px] text-red-400 bg-red-500/10 p-1.5 rounded border border-red-500/20">
                                                    {item.errorMessage}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700 shrink-0">
                    <div className="text-xs text-gray-400 font-mono">
                        {pendingCount > 0 && <span>{pendingCount} pending</span>}
                        {uploadingCount > 0 && <span className="ml-2 text-amber-400">{uploadingCount} uploading</span>}
                        {successCount > 0 && <span className="ml-2 text-emerald-400">{successCount} done</span>}
                        {failedCount > 0 && <span className="ml-2 text-red-400">{failedCount} failed</span>}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isUploading}
                            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-all"
                        >
                            Close
                        </button>

                        <button
                            type="button"
                            onClick={handleStartUpload}
                            disabled={isUploading || queue.length === 0 || pendingCount === 0}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                        >
                            {isUploading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                                    <span>Uploading Queue...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 text-gray-950" />
                                    <span>Start Upload ({pendingCount})</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminStateResources;

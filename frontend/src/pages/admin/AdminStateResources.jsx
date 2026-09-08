import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {
    Map,
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
    Info
} from 'lucide-react';
import {
    getAvailableStates,
    getDistricts,
    getDistrictResources,
    uploadAdminResource,
    updateAdminResourceStatus,
    archiveAdminResource
} from '../../services/adminService';

const AdminStateResources = () => {
    // ── State variables ────────────────────────────────────────────────────────
    const [states, setStates] = useState([]);
    const [loadingStates, setLoadingStates] = useState(true);
    const [stateSearch, setStateSearch] = useState('');

    const [selectedState, setSelectedState] = useState(null);
    const [districts, setDistricts] = useState([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [districtSearch, setDistrictSearch] = useState('');

    const [selectedDistrict, setSelectedDistrict] = useState(null);
    const [resources, setResources] = useState([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [resourceTab, setResourceTab] = useState('ALL'); // 'ALL' | 'FREE' | 'PAID'

    // Modal States
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [archiveCandidate, setArchiveCandidate] = useState(null); // Resource to archive
    const [statusUpdatingId, setStatusUpdatingId] = useState(null);

    // ── Load States Master Data ────────────────────────────────────────────────
    const fetchStates = async () => {
        setLoadingStates(true);
        try {
            const data = await getAvailableStates();
            const stateList = Array.isArray(data) ? data : (data?.data || []);
            setStates(stateList);

            // If a state was previously selected, update its reference
            if (selectedState) {
                const updated = stateList.find(s => s.stateSlug === selectedState.stateSlug);
                if (updated) setSelectedState(updated);
            }
        } catch (err) {
            console.error('Failed to load states:', err);
            toast.error(err.message || 'Failed to load states from backend');
        } finally {
            setLoadingStates(false);
        }
    };

    useEffect(() => {
        fetchStates();
    }, []);

    // ── Load Districts when Selected State changes ──────────────────────────────
    const fetchDistricts = async (stateObj) => {
        if (!stateObj) return;
        setLoadingDistricts(true);
        setDistricts([]);
        setSelectedDistrict(null);
        setResources([]);
        try {
            const data = await getDistricts(stateObj.stateSlug);
            const distList = Array.isArray(data) ? data : (data?.data || []);
            setDistricts(distList);
        } catch (err) {
            console.error('Failed to load districts:', err);
            toast.error(err.message || 'Failed to load districts for state');
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleSelectState = (stateObj) => {
        setSelectedState(stateObj);
        fetchDistricts(stateObj);
    };

    // ── Load Resources when Selected District changes ──────────────────────────
    const fetchResources = async (stateSlug, districtSlug) => {
        if (!stateSlug || !districtSlug) return;
        setLoadingResources(true);
        try {
            const res = await getDistrictResources(stateSlug, districtSlug);
            const resList = res?.data || (Array.isArray(res) ? res : []);
            setResources(resList);
        } catch (err) {
            console.error('Failed to load resources:', err);
            toast.error(err.message || 'Failed to load district resources');
        } finally {
            setLoadingResources(false);
        }
    };

    const handleSelectDistrict = (distObj) => {
        setSelectedDistrict(distObj);
        fetchResources(selectedState.stateSlug, distObj.districtSlug);
    };

    // Refresh current view context
    const refreshCurrentView = async () => {
        await fetchStates();
        if (selectedState) {
            const data = await getDistricts(selectedState.stateSlug);
            const distList = Array.isArray(data) ? data : (data?.data || []);
            setDistricts(distList);
            if (selectedDistrict) {
                await fetchResources(selectedState.stateSlug, selectedDistrict.districtSlug);
            }
        }
    };

    // ── Action Handlers ────────────────────────────────────────────────────────
    const handleTogglePublish = async (resource) => {
        const newStatus = !resource.published && !resource.isPublished;
        setStatusUpdatingId(resource.id);
        try {
            await updateAdminResourceStatus(resource.id, newStatus);
            toast.success(`Resource ${newStatus ? 'published' : 'unpublished'} successfully.`);
            await fetchResources(selectedState.stateSlug, selectedDistrict.districtSlug);
            fetchStates();
        } catch (err) {
            console.error('Failed to update publication status:', err);
            toast.error(err.message || 'Failed to update publication status');
        } finally {
            setStatusUpdatingId(null);
        }
    };

    const handleConfirmArchive = async () => {
        if (!archiveCandidate) return;
        const targetId = archiveCandidate.id;
        try {
            await archiveAdminResource(targetId);
            toast.success('Resource archived successfully.');
            setArchiveCandidate(null);
            await fetchResources(selectedState.stateSlug, selectedDistrict.districtSlug);
            fetchStates();
        } catch (err) {
            console.error('Failed to archive resource:', err);
            toast.error(err.message || 'Failed to archive resource');
        }
    };

    // Filtered State List
    const filteredStates = states.filter(s =>
        s.name?.toLowerCase().includes(stateSearch.toLowerCase()) ||
        s.stateSlug?.toLowerCase().includes(stateSearch.toLowerCase())
    );

    // Filtered District List
    const filteredDistricts = districts.filter(d =>
        d.district?.toLowerCase().includes(districtSearch.toLowerCase()) ||
        d.districtSlug?.toLowerCase().includes(districtSearch.toLowerCase())
    );

    // Filtered Resource Lists
    const freeResources = resources.filter(r => r.isFree || r.free);
    const paidResources = resources.filter(r => !r.isFree && !r.free);

    return (
        <div className="p-6 space-y-6 text-gray-100 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-800/80 backdrop-blur border border-gray-700 p-6 rounded-2xl shadow-xl">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <Map className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">State Resources Management</h1>
                            <p className="text-sm text-gray-400">
                                Admin workflow for uploading, cataloging, and managing district-wise state PDF resources
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={refreshCurrentView}
                        className="flex items-center gap-2 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-xl transition-all shadow-md"
                        title="Refresh States and Resources"
                    >
                        <RefreshCw className="w-4 h-4" />
                        <span>Refresh</span>
                    </button>

                    {selectedState && selectedDistrict && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 text-sm font-semibold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Upload PDF</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-sm text-gray-400 bg-gray-900/60 px-4 py-3 rounded-xl border border-gray-800">
                <span className={`cursor-pointer hover:text-amber-400 ${!selectedState ? 'text-amber-400 font-semibold' : ''}`} onClick={() => { setSelectedState(null); setSelectedDistrict(null); setResources([]); }}>
                    All States ({states.length})
                </span>
                {selectedState && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <span className={`cursor-pointer hover:text-amber-400 ${!selectedDistrict ? 'text-amber-400 font-semibold' : ''}`} onClick={() => { setSelectedDistrict(null); setResources([]); }}>
                            {selectedState.name}
                        </span>
                    </>
                )}
                {selectedDistrict && (
                    <>
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                        <span className="text-amber-400 font-semibold">
                            {selectedDistrict.district}
                        </span>
                    </>
                )}
            </div>

            {/* Main Selection Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Panel: State Selector */}
                <div className={`${selectedState ? 'lg:col-span-3' : 'lg:col-span-12'} bg-gray-800/80 border border-gray-700 rounded-2xl p-5 shadow-xl transition-all`}>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-semibold text-white flex items-center gap-2">
                            <Map className="w-4 h-4 text-amber-400" />
                            <span>Select State</span>
                        </h2>
                        <span className="text-xs text-gray-400 bg-gray-700/60 px-2.5 py-1 rounded-full">
                            {states.length} Master States
                        </span>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-4">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filter states..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    {/* Loading State */}
                    {loadingStates ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                            <span className="text-xs">Loading canonical states...</span>
                        </div>
                    ) : filteredStates.length === 0 ? (
                        <div className="text-center py-8 text-sm text-gray-400">
                            No states matching "{stateSearch}"
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                            {filteredStates.map((st) => {
                                const isSelected = selectedState?.stateSlug === st.stateSlug;
                                return (
                                    <button
                                        key={st.stateSlug || st.id}
                                        onClick={() => handleSelectState(st)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                            isSelected
                                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md'
                                                : 'bg-gray-900/40 border-gray-700/60 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600'
                                        }`}
                                    >
                                        <div>
                                            <div className="font-medium text-sm text-white">{st.name}</div>
                                            <div className="text-xs text-gray-400 font-mono">{st.stateSlug}</div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                                                st.notesCount > 0
                                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                                            }`}>
                                                {st.notesCount || 0} PDFs
                                            </span>
                                            <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-gray-600'}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Middle Panel: District Selector (Visible when State selected) */}
                {selectedState && (
                    <div className={`${selectedDistrict ? 'lg:col-span-3' : 'lg:col-span-9'} bg-gray-800/80 border border-gray-700 rounded-2xl p-5 shadow-xl transition-all`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-semibold text-white flex items-center gap-2">
                                    <Folder className="w-4 h-4 text-amber-400" />
                                    <span>{selectedState.name} Districts</span>
                                </h2>
                                <p className="text-xs text-gray-400">Canonical districts from master catalog</p>
                            </div>
                            <span className="text-xs text-gray-400 bg-gray-700/60 px-2 py-1 rounded-full">
                                {districts.length} Districts
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Filter districts..."
                                value={districtSearch}
                                onChange={(e) => setDistrictSearch(e.target.value)}
                                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                            />
                        </div>

                        {/* Loading State */}
                        {loadingDistricts ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-400 space-y-2">
                                <RefreshCw className="w-6 h-6 animate-spin text-amber-400" />
                                <span className="text-xs">Loading canonical districts...</span>
                            </div>
                        ) : filteredDistricts.length === 0 ? (
                            <div className="text-center py-8 text-sm text-gray-400">
                                No districts matching "{districtSearch}"
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                                {filteredDistricts.map((d) => {
                                    const isSelected = selectedDistrict?.districtSlug === d.districtSlug;
                                    return (
                                        <button
                                            key={d.districtSlug}
                                            onClick={() => handleSelectDistrict(d)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                                                isSelected
                                                    ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-md'
                                                    : 'bg-gray-900/40 border-gray-700/60 text-gray-300 hover:bg-gray-700/50 hover:border-gray-600'
                                            }`}
                                        >
                                            <div>
                                                <div className="font-medium text-sm text-white">{d.district}</div>
                                                <div className="text-xs text-gray-400 font-mono">{d.districtSlug}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                                                    (d.count || 0) > 0
                                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                        : 'bg-gray-800 text-gray-500 border border-gray-700'
                                                }`}>
                                                    {d.count || 0} PDFs
                                                </span>
                                                <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-gray-600'}`} />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Right Panel: Resource Cards (Visible when District selected) */}
                {selectedState && selectedDistrict && (
                    <div className="lg:col-span-6 bg-gray-800/80 border border-gray-700 rounded-2xl p-5 shadow-xl">
                        {/* District Header & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-700/80 mb-4">
                            <div>
                                <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-amber-400" />
                                    <span>{selectedDistrict.district} Resources</span>
                                </h2>
                                <p className="text-xs text-gray-400">
                                    {selectedState.name} &bull; {resources.length} Total PDF Resources
                                </p>
                            </div>

                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs rounded-xl shadow-md transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Upload PDF</span>
                            </button>
                        </div>

                        {/* Tabs Filter */}
                        <div className="flex items-center gap-2 mb-4 bg-gray-900/60 p-1.5 rounded-xl border border-gray-800">
                            <button
                                onClick={() => setResourceTab('ALL')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    resourceTab === 'ALL'
                                        ? 'bg-gray-700 text-white shadow'
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                            >
                                All ({resources.length})
                            </button>
                            <button
                                onClick={() => setResourceTab('FREE')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    resourceTab === 'FREE'
                                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        : 'text-gray-400 hover:text-emerald-400'
                                }`}
                            >
                                FREE (₹0) ({freeResources.length})
                            </button>
                            <button
                                onClick={() => setResourceTab('PAID')}
                                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                                    resourceTab === 'PAID'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                        : 'text-gray-400 hover:text-amber-400'
                                }`}
                            >
                                PAID (₹99) ({paidResources.length})
                            </button>
                        </div>

                        {/* Loading State */}
                        {loadingResources ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400 space-y-3">
                                <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
                                <span className="text-sm">Fetching catalog resources...</span>
                            </div>
                        ) : resources.length === 0 ? (
                            /* Empty State - No Coming Soon */
                            <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-900/40 border border-dashed border-gray-700 rounded-xl p-6">
                                <div className="p-4 bg-gray-800 text-gray-400 rounded-full mb-3">
                                    <FileText className="w-8 h-8 text-amber-400/60" />
                                </div>
                                <h3 className="text-base font-semibold text-white mb-1">
                                    No resources uploaded yet
                                </h3>
                                <p className="text-xs text-gray-400 max-w-sm mb-4">
                                    There are currently no active PDF resources cataloged for {selectedDistrict.district}, {selectedState.name}.
                                </p>
                                <button
                                    onClick={() => setIsUploadModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-gray-950 font-semibold text-xs rounded-xl shadow-md transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Upload First PDF</span>
                                </button>
                            </div>
                        ) : (
                            /* Resource List */
                            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                                {(resourceTab === 'FREE' ? freeResources : resourceTab === 'PAID' ? paidResources : resources).map((res) => {
                                    const isPublished = res.published || res.isPublished;
                                    const isFree = res.isFree || res.free;
                                    const isUpdating = statusUpdatingId === res.id;

                                    return (
                                        <div
                                            key={res.id}
                                            className="bg-gray-900/60 border border-gray-700/80 hover:border-gray-600 rounded-xl p-4 transition-all shadow-md"
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-2">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        {/* Tier Badge */}
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                                            isFree
                                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                        }`}>
                                                            {isFree ? 'FREE (₹0)' : 'PAID (₹99)'}
                                                        </span>

                                                        {/* Status Badge */}
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1 ${
                                                            isPublished
                                                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                                : 'bg-gray-800 text-gray-400 border border-gray-700'
                                                        }`}>
                                                            {isPublished ? <CheckCircle2 className="w-3 h-3 text-blue-400" /> : <XCircle className="w-3 h-3 text-gray-500" />}
                                                            {isPublished ? 'PUBLISHED' : 'UNPUBLISHED'}
                                                        </span>

                                                        {/* Category */}
                                                        {res.category && (
                                                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                                                                {res.category}
                                                            </span>
                                                        )}
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

                                                {/* Price Display */}
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
                                                    {/* Toggle Publication Button */}
                                                    <button
                                                        onClick={() => handleTogglePublish(res)}
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

                                                    {/* Archive Button */}
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
                    </div>
                )}
            </div>

            {/* ── UPLOAD MODAL COMPONENT ───────────────────────────────────────── */}
            {isUploadModalOpen && selectedState && selectedDistrict && (
                <AdminResourceUploadModal
                    state={selectedState}
                    district={selectedDistrict}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={async () => {
                        setIsUploadModalOpen(false);
                        await fetchResources(selectedState.stateSlug, selectedDistrict.districtSlug);
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
                            Archiving performs a soft-delete. The PDF will no longer appear in public user resource listings.
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

// ── ADMIN UPLOAD MODAL COMPONENT ──────────────────────────────────────────────
const AdminResourceUploadModal = ({ state, district, onClose, onSuccess }) => {
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('Notes');
    const [description, setDescription] = useState('');
    const [isFree, setIsFree] = useState(true);
    const [publish, setPublish] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [duplicateMessage, setDuplicateMessage] = useState(null);

    const handleFileChange = (e) => {
        setErrorMessage(null);
        setDuplicateMessage(null);
        const file = e.target.files[0];
        if (!file) {
            setSelectedFile(null);
            return;
        }

        // Basic UX Validation
        if (!file.name.toLowerCase().endsWith('.pdf')) {
            setErrorMessage('Invalid file extension. Please select a valid PDF file (.pdf)');
            setSelectedFile(null);
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            setErrorMessage('File size exceeds 20MB limit.');
            setSelectedFile(null);
            return;
        }

        setSelectedFile(file);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);
        setDuplicateMessage(null);

        if (!title.trim()) {
            setErrorMessage('Resource Title is required.');
            return;
        }
        if (!selectedFile) {
            setErrorMessage('Please select a valid PDF file to upload.');
            return;
        }

        setUploading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('stateSlug', state.stateSlug);
        formData.append('districtSlug', district.districtSlug);
        formData.append('isFree', isFree ? 'true' : 'false');
        formData.append('category', category.trim());
        formData.append('title', title.trim());
        formData.append('description', description.trim());
        formData.append('publish', publish ? 'true' : 'false');

        try {
            const result = await uploadAdminResource(formData);

            if (result?.isDuplicate) {
                setDuplicateMessage(result.message || 'This resource already exists (identical content hash detected).');
                toast.info('Identical resource already exists in catalog.');
            } else {
                toast.success('Resource uploaded and cataloged successfully!');
                onSuccess();
            }
        } catch (err) {
            console.error('Upload Error:', err);
            const errText = err.error || err.message || 'Failed to upload resource.';
            setErrorMessage(errText);
            toast.error(errText);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 relative overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-700 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-base">Upload Admin Resource PDF</h3>
                            <p className="text-xs text-gray-400">
                                {state.name} &bull; {district.district}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={uploading}
                        className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-700 transition-all"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Upload Rejected: </span>
                            {errorMessage}
                        </div>
                    </div>
                )}

                {/* Duplicate Notification Banner */}
                {duplicateMessage && (
                    <div className="p-3 bg-blue-500/15 border border-blue-500/30 rounded-xl text-xs text-blue-300 flex items-start gap-2">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold">Duplicate Detected: </span>
                            {duplicateMessage}
                        </div>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 text-sm">
                    {/* Location Context (Read-Only) */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">State</label>
                            <input
                                type="text"
                                disabled
                                value={state.name}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">District</label>
                            <input
                                type="text"
                                disabled
                                value={district.district}
                                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-gray-300 font-medium"
                            />
                        </div>
                    </div>

                    {/* Access Tier Selector (Free vs Paid) */}
                    <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1.5">Access Tier</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setIsFree(true)}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
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
                                onClick={() => setIsFree(false)}
                                className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                    !isFree
                                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md'
                                        : 'bg-gray-900/60 border-gray-700 text-gray-400 hover:border-gray-600'
                                }`}
                            >
                                <Lock className="w-4 h-4 text-amber-400" />
                                <span>PAID (₹99)</span>
                            </button>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                            {isFree ? 'Resource is unlocked and free for all users.' : 'Resource requires ₹99 district access purchase.'}
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1">Resource Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Akola District General Knowledge Notes 2026"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                        />
                    </div>

                    {/* Category & File Input */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs text-gray-300 font-semibold mb-1">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                            >
                                <option value="Notes">Notes</option>
                                <option value="Question Bank">Question Bank</option>
                                <option value="Syllabus">Syllabus</option>
                                <option value="Official Gazette">Official Gazette</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-300 font-semibold mb-1">PDF File *</label>
                            <input
                                type="file"
                                accept=".pdf,application/pdf"
                                onChange={handleFileChange}
                                className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-2 py-1 text-xs text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs text-gray-300 font-semibold mb-1">Description (Optional)</label>
                        <textarea
                            rows="2"
                            placeholder="Brief summary of resource content..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-900/80 border border-gray-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                        ></textarea>
                    </div>

                    {/* Publish Checkbox */}
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="publishImmediately"
                            checked={publish}
                            onChange={(e) => setPublish(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-gray-900 border-gray-700"
                        />
                        <label htmlFor="publishImmediately" className="text-xs text-gray-300">
                            Publish resource immediately upon cataloging
                        </label>
                    </div>

                    {/* Form Footer */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-all"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={uploading}
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-gray-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all"
                        >
                            {uploading ? (
                                <>
                                    <RefreshCw className="w-4 h-4 animate-spin text-gray-950" />
                                    <span>Uploading & Cataloging...</span>
                                </>
                            ) : (
                                <>
                                    <Upload className="w-4 h-4 text-gray-950" />
                                    <span>Upload Resource</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminStateResources;

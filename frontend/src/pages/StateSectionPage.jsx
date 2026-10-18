import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import StateSectionTabs from "../components/states/StateSectionTabs";
import { decodeMojibake } from "../utils/formatters";
import { normalizeStateCategory, normalizeStateCategorySlug } from "../utils/categoryNormalization";

function ResourceModal({ resource, onClose }) {
  const [iframeLoading, setIframeLoading] = useState(true);
  const ext = (resource.fileExtension || "").toLowerCase();
  const rawUrl = resource.s3Url || resource.previewUrl || resource.url;
  const url = rawUrl ? rawUrl.split('/').map((part, i) => i < 3 ? part : encodeURIComponent(part)).join('/') : null;
  const title = resource.displayTitle || resource.title || resource.fileName;

  const officeExts = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"];
  const imageExts = ["png", "jpg", "jpeg", "webp"];
  const audioExts = ["mp3", "m4a", "wav", "aac", "ogg"];
  const videoExts = ["mp4"];

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const renderContent = () => {
    if (ext === "pdf") {
      const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      return (
        <div className="relative w-full h-full">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-lg z-10">
              <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-gray-400 text-sm">Loading document...</p>
            </div>
          )}
          <iframe
            src={googleUrl}
            className="w-full h-full rounded-lg"
            title={title}
            onLoad={() => setIframeLoading(false)}
          />
        </div>
      );
    }
    if (imageExts.includes(ext)) {
      return (
        <div className="w-full h-full flex items-center justify-center overflow-auto">
          <img src={url} alt={title} className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      );
    }
    if (audioExts.includes(ext)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
          <div className="text-6xl">🎵</div>
          <p className="text-white font-semibold text-center px-4">{title}</p>
          <audio controls className="w-full max-w-md" src={url}>
            Your browser does not support audio playback.
          </audio>
        </div>
      );
    }
    if (videoExts.includes(ext)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black rounded-lg p-4">
          <video controls className="max-w-full max-h-full rounded-lg shadow-lg" src={url}>
            Your browser does not support video playback.
          </video>
        </div>
      );
    }
    if (officeExts.includes(ext)) {
      const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`;
      return (
        <iframe
          src={officeUrl}
          className="w-full h-full rounded-lg"
          title={title}
        />
      );
    }
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">📎</div>
        <p className="text-gray-400">Preview not available for this file type.</p>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">📄</span>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
              <p className="text-gray-400 text-xs">Protected BodhGanga Study Material (View Only)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors text-lg"
            title="Close Viewer"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default function StateSectionPage() {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const sectionRaw = location.pathname.split("/").pop();
  const section = normalizeStateCategorySlug(sectionRaw) || "history";

  const titles = {
    history: "History",
    geography: "Geography",
    "art-culture": "Art & Culture",
    "heritage-sites": "Heritage & Sites",
  };

  const [products, setProducts] = useState([]);
  const [sectionAvailability, setSectionAvailability] = useState(null);
  const [selectedResource, setSelectedResource] = useState(null);
  const [stateName, setStateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isSubscribed = true;

    // Immediately clear previously loaded data and error on state/section transition
    setProducts([]);
    setError(null);
    setLoading(true);

    // Initial formatted state name derived safely from slug
    const formatted = stateSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    setStateName(decodeMojibake(formatted));

    const loadData = async () => {
      try {
        const prodRes = await api.get(`/products/state/${stateSlug}/category/${section}`);
        if (!isSubscribed) return;

        const prodList = Array.isArray(prodRes) ? prodRes : (prodRes?.data || []);
        setProducts(prodList);

        if (prodList.length > 0 && (prodList[0].state || prodList[0].stateName)) {
          setStateName(decodeMojibake(prodList[0].state || prodList[0].stateName));
        }
      } catch (err) {
        if (!isSubscribed) return;
        console.error("Failed to load state section data:", err);
        setError("Failed to load materials for this section.");
        setProducts([]);
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isSubscribed = false;
    };
  }, [stateSlug, section]);

  // Fetch category counts for tab badges
  useEffect(() => {
    let isSubscribed = true;
    const fetchCategoryCounts = async () => {
      try {
        const res = await api.get(`/products/state/${stateSlug}/categories/counts`);
        if (!isSubscribed) return;
        const countsList = Array.isArray(res) ? res : (res?.data || []);
        const map = {};
        countsList.forEach((item) => {
          map[item.categorySlug] = {
            count: Number(item.count || 0),
            isAvailable: Boolean(item.isAvailable || item.count > 0),
          };
        });
        setSectionAvailability(map);
      } catch (e) {
        console.warn("Could not fetch category counts:", e);
      }
    };

    fetchCategoryCounts();

    return () => {
      isSubscribed = false;
    };
  }, [stateSlug]);

  // Authoritative client-side validation to ensure zero scope or category leakage
  const sectionMaterials = products.filter((p) => {
    if (!p) return false;

    // 1. Strict State Match: Must belong exclusively to current state
    const pStateSlug = String(p.stateSlug || "").toLowerCase().trim();
    if (pStateSlug !== stateSlug.toLowerCase().trim()) return false;

    // 2. Strict State-Level Scope: Must be general state level, never a district
    const dSlug = String(p.districtSlug || "").toLowerCase().trim();
    if (!dSlug || (dSlug !== "general" && dSlug !== "state")) return false;

    // 3. Strict Category Match: Must match canonical category for current section
    const resolvedSlug = normalizeStateCategorySlug(p.categorySlug || p.sectionSlug || p.category);
    if (resolvedSlug !== section) return false;

    // 4. Publication and Archive Rules
    const isPublished = p.isPublished ?? p.published ?? true;
    const isArchived = p.isArchived ?? p.archived ?? false;
    const isDeleted = p.isDeleted ?? false;
    if (!isPublished || isArchived || isDeleted) return false;

    return true;
  });

  // Keep tab availability for current active tab synchronized with sectionMaterials.length
  const effectiveSectionAvailability = {
    ...sectionAvailability,
    [section]: {
      count: sectionMaterials.length,
      isAvailable: sectionMaterials.length > 0,
    },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {selectedResource && (
        <ResourceModal
          resource={selectedResource}
          onClose={() => setSelectedResource(null)}
        />
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(`/state/${stateSlug}/districts`)}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to Districts Directory
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-amber-400 capitalize">
                {stateName || stateSlug.replace(/-/g, " ")} — {titles[section] || section}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                State-level {titles[section] || section} study materials for {stateName || stateSlug}
              </p>
            </div>

            {/* Authoritative Dynamic Count Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all ${
                sectionMaterials.length > 0
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-sm"
                  : "bg-gray-800/80 text-gray-400 border-gray-700"
              }`}>
                {sectionMaterials.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                )}
                <span>
                  {sectionMaterials.length} {sectionMaterials.length === 1 ? "Material" : "Materials"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <StateSectionTabs
          stateSlug={stateSlug}
          activeSection={section}
          sectionAvailability={effectiveSectionAvailability}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-amber-400 text-sm font-semibold">Loading state materials…</p>
          </div>
        ) : error ? (
          <div className="max-w-xl mx-auto my-12 bg-gray-900 border border-red-800/40 rounded-2xl p-8 text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full inline-block">
              Notice
            </span>
            <h2 className="text-xl font-bold text-white">
              Unable to load {titles[section]} materials
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={() => navigate(`/state/${stateSlug}/districts`)}
              className="mt-2 px-6 py-2.5 bg-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              Back to District Directory →
            </button>
          </div>
        ) : sectionMaterials.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {titles[section]} Materials ({sectionMaterials.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionMaterials.map((res) => {
                const isFree = Boolean(res.isFree || res.free || res.price === 0);

                return (
                  <div
                    key={res.id || res._id || res.s3Key}
                    className="bg-gray-900 border border-gray-800 hover:border-amber-500/60 rounded-xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                          {res.category || titles[section]}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isFree
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          }`}
                        >
                          {isFree ? "FREE" : "PAID"}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm leading-snug line-clamp-2">
                        {res.title || res.displayTitle || res.fileName}
                      </h3>

                      {res.description && (
                        <p className="text-xs text-gray-400 line-clamp-2">{res.description}</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                      <span className="text-[11px] text-gray-500">
                        {res.type || res.fileExtension?.toUpperCase() || "PDF"}
                      </span>
                      {res.s3Url || res.previewUrl || res.url ? (
                        <button
                          type="button"
                          onClick={() => setSelectedResource(res)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          View Material →
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500">Available in App</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="max-w-xl mx-auto my-12 bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center space-y-4">
            <span className="text-xs font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full inline-block">
              0 Materials Available
            </span>
            <h2 className="text-xl font-bold text-white">
              No {titles[section]} materials available for {stateName} yet
            </h2>
            <p className="text-gray-400 text-xs leading-relaxed max-w-md mx-auto">
              State-level study materials for {titles[section]} are currently being prepared by our editorial team. You can explore district-specific resources in the District Directory.
            </p>
            <button
              onClick={() => navigate(`/state/${stateSlug}/districts`)}
              className="mt-2 px-6 py-2.5 bg-amber-500 text-gray-950 font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-colors inline-flex items-center gap-1.5"
            >
              Explore {stateName} District Directory →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
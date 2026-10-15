import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api";
import StateSectionTabs from "../components/states/StateSectionTabs";
import { decodeMojibake } from "../utils/formatters";
import { normalizeStateCategory, normalizeStateCategorySlug } from "../utils/categoryNormalization";

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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(`/state/${stateSlug}/districts`)}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to Districts Directory
          </button>
          <h1 className="text-3xl font-extrabold text-amber-400 capitalize">
            {stateName || stateSlug.replace(/-/g, " ")} — {titles[section] || section}
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            State-level {titles[section] || section} study materials for {stateName || stateSlug}
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <StateSectionTabs stateSlug={stateSlug} activeSection={section} />

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
                        <a
                          href={res.s3Url || res.previewUrl || res.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          View Material →
                        </a>
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
              State-Level Content
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
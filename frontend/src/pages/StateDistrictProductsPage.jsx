import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import toast from "react-hot-toast";
import ChambaMCQFeature from "../components/states/ChambaMCQFeature";

const FILE_ICONS = {
  pdf:  { icon: "📄", color: "text-red-400",    label: "PDF" },
  docx: { icon: "📝", color: "text-blue-400",   label: "DOCX" },
  doc:  { icon: "📝", color: "text-blue-400",   label: "DOC" },
  xlsx: { icon: "📊", color: "text-green-400",  label: "XLSX" },
  pptx: { icon: "📋", color: "text-orange-400", label: "PPTX" },
  png:  { icon: "🖼️", color: "text-purple-400", label: "Image" },
  jpg:  { icon: "🖼️", color: "text-purple-400", label: "Image" },
  jpeg: { icon: "🖼️", color: "text-purple-400", label: "Image" },
  webp: { icon: "🖼️", color: "text-purple-400", label: "Image" },
  mp3:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  m4a:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  wav:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  aac:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  ogg:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  mp4:  { icon: "🎬", color: "text-cyan-400",   label: "Video" },
};

function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ResourceModal({ resource, onClose }) {
  const ext = (resource.fileExtension || "").toLowerCase();
  const url  = resource.s3Url;
  const title = resource.displayTitle || resource.title || resource.fileName;
  const officeExts = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"];
  const imageExts  = ["png", "jpg", "jpeg", "webp"];
  const audioExts  = ["mp3", "m4a", "wav", "aac", "ogg"];
  const videoExts  = ["mp4"];

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl">{FILE_ICONS[ext]?.icon || "📎"}</span>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
              {resource.fileSize && (
                <p className="text-gray-500 text-xs">{formatSize(resource.fileSize)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-lg"
            >
              ✕
            </button>
          </div>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-hidden p-4">
          {ext === "pdf" ? (
            <iframe
              src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`}
              className="w-full h-full rounded-lg"
              title={title}
            />
          ) : imageExts.includes(ext) ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img src={url} alt={title} className="max-w-full max-h-full object-contain rounded-lg" />
            </div>
          ) : audioExts.includes(ext) ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-6">
              <div className="text-6xl">🎵</div>
              <p className="text-white font-semibold text-center px-4">{title}</p>
              <audio controls className="w-full max-w-md" src={url}>
                Your browser does not support audio.
              </audio>
            </div>
          ) : videoExts.includes(ext) ? (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-black rounded-lg p-4">
              <video controls className="max-w-full max-h-full rounded-lg shadow-lg" src={url}>
                Your browser does not support video playback.
              </video>
            </div>
          ) : officeExts.includes(ext) ? (
            <iframe
              src={`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`}
              className="w-full h-full rounded-lg"
              title={title}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
              <div className="text-6xl">📎</div>
              <p className="text-gray-400">Preview not available for this file type.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function StateDistrictProductsPage() {
  const { stateSlug, districtSlug } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get("section") || searchParams.get("tab") || "history";

  const [allResources, setAllResources] = useState([]);
  const [sectionAvailability, setSectionAvailability] = useState(null);
  const [districtName, setDistrictName] = useState("");
  const [stateName, setStateName]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [purchased, setPurchased]   = useState(false);
  const [selected, setSelected]     = useState(null);
  const { isAuthenticated, openAuthModal } = useAuth();
  const [mcqFlowState, setMcqFlowState] = useState(null);

  useEffect(() => {
    setMcqFlowState(null);
  }, [activeSection]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/products/state/${stateSlug}/district/${districtSlug}`);
        const products = Array.isArray(res) ? res : (res?.data || []);
        setAllResources(products);
        if (products.length > 0) {
          setDistrictName(products[0].district || products[0].districtName || districtSlug);
          setStateName(products[0].state   || products[0].stateName   || stateSlug);
        } else {
          const dFormatted = districtSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          const sFormatted = stateSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          setDistrictName(dFormatted);
          setStateName(sFormatted);
        }

        try {
          const secRes = await api.get(`/products/state/${stateSlug}/district/${districtSlug}/sections`);
          const secData = secRes?.data?.sections || secRes?.sections || null;
          if (secData) {
            setSectionAvailability(secData);
          }
        } catch (err) {
          console.error("Failed to load section availability:", err);
        }

        try {
          const pRes = await api.get("/payment/district/purchased");
          const list = Array.isArray(pRes) ? pRes : (pRes?.data || []);
          const normList = list.map(s => String(s).toLowerCase().trim());
          setPurchased(normList.includes(String(districtSlug).toLowerCase().trim()));
        } catch { /* unauthenticated */ }
      } catch (err) {
        console.error("Failed to load resources:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [stateSlug, districtSlug]);

  const handleOpenResource = async (resource) => {
    const key = resource.s3Key || resource.storageKey;
    if (!key) {
      toast.error("Resource storage key is missing.");
      return;
    }
    try {
      const res = await api.get(`/pdf/${key}`);
      const signedUrl = res.url || res.data?.url || (typeof res.data === 'string' ? res.data : null);
      if (signedUrl) {
        setSelected({ ...resource, s3Url: signedUrl });
      } else {
        toast.error("Failed to obtain secure viewing link.");
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Please login to access this resource.");
        if (openAuthModal) openAuthModal('welcome');
      } else if (err.response?.status === 403) {
        toast.error("District unlock required to access this paid resource.");
      } else {
        toast.error("Could not open resource.");
      }
    }
  };

  const freeRes = allResources.filter((r) => r.free || r.isFree || r.price === 0);
  const paidRes = allResources.filter((r) => !r.free && !r.isFree && r.price > 0);

  const getFilteredSectionResources = (sectionId) => {
    if (sectionId === "paid") return paidRes;
    return freeRes.filter((p) => {
      const cat = String(p.category || "").toLowerCase();
      const title = String(p.title || p.displayTitle || "").toLowerCase();
      const desc = String(p.description || "").toLowerCase();
      const combined = `${cat} ${title} ${desc}`;

      if (sectionId === "heritage-monuments") {
        return combined.includes("heritage") || combined.includes("monument") || combined.includes("landmark");
      }
      if (sectionId === "geography") {
        return combined.includes("geography") || combined.includes("geographic") || combined.includes("demography") || combined.includes("map");
      }
      if (sectionId === "art-culture") {
        return combined.includes("art") || combined.includes("culture") || combined.includes("tradition") || combined.includes("festival");
      }
      if (sectionId === "history") {
        const isOther = (combined.includes("heritage") || combined.includes("monument") || combined.includes("landmark")) ||
                        (combined.includes("geography") || combined.includes("geographic") || combined.includes("demography") || combined.includes("map")) ||
                        (combined.includes("art") || combined.includes("culture") || combined.includes("tradition") || combined.includes("festival"));
        return !isOther || combined.includes("history") || combined.includes("historical") || combined.includes("notes");
      }
      return true;
    });
  };

  const shown = getFilteredSectionResources(activeSection);
  const isPaidTab = activeSection === "paid";
  const sectionLabels = {
    history: "History",
    "heritage-monuments": "Heritage Sites & Monuments",
    geography: "Geography",
    "art-culture": "Art & Culture",
    paid: "Paid District Package (₹99)"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-amber-400 text-sm font-semibold">Loading resources…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {selected && (
        <ResourceModal resource={selected} onClose={() => setSelected(null)} />
      )}

      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(`/state/${stateSlug}/districts`)}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to Districts
          </button>
          <h1 className="text-3xl font-extrabold text-amber-400 mb-1">
            {districtName || districtSlug}
          </h1>
          <p className="text-gray-400 text-sm">{stateName || stateSlug}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* DISTRICT TESTING ZONE & PRACTICE TESTS */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-gray-900 to-amber-950/50 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
                District Testing Zone
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mt-2">
                {districtName} Exam Preparation & Practice MCQs
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Data-driven per-question classification for Foundation and Statement-Based district tests.
              </p>
            </div>
            <button
              onClick={() => navigate(`/test-series/${stateSlug}/${districtSlug}`)}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex-shrink-0"
            >
              Full Test Portal →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Foundation Test Card */}
            <div className="bg-gray-950/60 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-emerald-500 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Foundation Test</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Free 10 Questions</span>
                </div>
                <h3 className="text-base font-bold text-white">Direct Fact & Concept Test</h3>
                <p className="text-xs text-gray-400">
                  Tests foundational district knowledge, dates, facts, figures, and direct history/geography questions.
                </p>
              </div>
              <button
                onClick={() => navigate(`/test-series/${stateSlug}/${districtSlug}/quiz/foundation`)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Launch Foundation Test →
              </button>
            </div>

            {/* Statement-Based Test Card */}
            <div className="bg-gray-950/60 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-amber-500 transition-all">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Statement-Based Test</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">Free 10 Questions</span>
                </div>
                <h3 className="text-base font-bold text-white">Analytical Multi-Statement Test</h3>
                <p className="text-xs text-gray-400">
                  UPSC/State PCS level multi-statement logic questions with options like (1 and 2 only, all of the above).
                </p>
              </div>
              <button
                onClick={() => navigate(`/test-series/${stateSlug}/${districtSlug}/quiz/statement-based`)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Launch Statement-Based Test →
              </button>
            </div>
          </div>
        </div>

        {/* FREE DISTRICT RESOURCES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>📄 Free District Resources</span>
              <span className="text-xs font-semibold text-gray-500">({freeRes.length})</span>
            </h2>
          </div>

          {freeRes.length === 0 ? (
            <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-8 text-center space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Free Resources</span>
              <p className="text-sm text-gray-400">Free study notes and resources for {districtName} are currently being prepared.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freeRes.map((r) => {
                const ext  = (r.fileExtension || "").toLowerCase();
                const meta = FILE_ICONS[ext] || { icon: "📄", color: "text-gray-400", label: ext.toUpperCase() || "FILE" };
                const title = r.displayTitle || r.title || r.fileName;
                return (
                  <div
                    key={r.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{meta.icon}</span>
                        <span className={`text-[10px] font-bold uppercase ${meta.color} bg-gray-800 px-2 py-0.5 rounded`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-green-400 bg-green-900/40 border border-green-800 px-2 py-0.5 rounded ml-auto">
                          Free
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{title}</h3>
                    </div>
                    <button
                      onClick={() => handleOpenResource(r)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors mt-4"
                    >
                      View Resource
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAID DISTRICT PACKAGE SECTION */}
        <div className="space-y-4 pt-4 border-t border-gray-800">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span>🔒 Paid District Package & Question Bank</span>
              <span className="text-xs font-semibold text-gray-500">({paidRes.length})</span>
            </h2>
            {purchased && (
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
                Unlocked
              </span>
            )}
          </div>

          {!purchased && (
            <div className="bg-gradient-to-r from-gray-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏆</span>
                  <h3 className="text-xl font-bold text-white">Complete {districtName} Question Bank</h3>
                </div>
                <p className="text-xs text-gray-300 max-w-xl">
                  Unlock lifetime access to all parsed district MCQs, solution keys, foundation tests, and statement-based practice sets.
                </p>
              </div>
              <button
                onClick={() => navigate(`/test-series/${stateSlug}/${districtSlug}`)}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-black font-black text-xs uppercase tracking-wider rounded-xl shadow-lg hover:shadow-amber-500/20 transition-all flex-shrink-0"
              >
                Unlock District (₹49) →
              </button>
            </div>
          )}

          {paidRes.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paidRes.map((r) => {
                const ext  = (r.fileExtension || "").toLowerCase();
                const meta = FILE_ICONS[ext] || { icon: "📄", color: "text-gray-400", label: ext.toUpperCase() || "FILE" };
                const title = r.displayTitle || r.title || r.fileName;
                return (
                  <div
                    key={r.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{meta.icon}</span>
                        <span className={`text-[10px] font-bold uppercase ${meta.color} bg-gray-800 px-2 py-0.5 rounded`}>
                          {meta.label}
                        </span>
                        <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded ml-auto">
                          Paid
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">{title}</h3>
                    </div>
                    <button
                      onClick={() => handleOpenResource(r)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg text-xs uppercase tracking-wider transition-colors mt-4"
                    >
                      {purchased ? "View Resource" : "Unlock to Access"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

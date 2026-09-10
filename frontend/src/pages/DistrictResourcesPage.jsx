import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import ChambaMCQFeature from "../components/states/ChambaMCQFeature";

const FILE_ICONS = {
  pdf:  { icon: "📄", color: "text-red-400",    label: "PDF" },
  docx: { icon: "📝", color: "text-blue-400",   label: "DOCX" },
  doc:  { icon: "📝", color: "text-blue-400",   label: "DOC" },
  xlsx: { icon: "📊", color: "text-green-400",  label: "XLSX" },
  xls:  { icon: "📊", color: "text-green-400",  label: "XLS" },
  pptx: { icon: "📋", color: "text-orange-400", label: "PPTX" },
  png:  { icon: "🖼️", color: "text-purple-400", label: "Image" },
  jpg:  { icon: "🖼️", color: "text-purple-400", label: "Image" },
  jpeg: { icon: "🖼️", color: "text-purple-400", label: "Image" },
  webp: { icon: "🖼️", color: "text-purple-400", label: "Image" },
  m4a:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  mp3:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
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
  const [iframeLoading, setIframeLoading] = React.useState(true);
  const ext = (resource.fileExtension || "").toLowerCase();
  const url = resource.s3Url ? resource.s3Url.split('/').map((part, i) => i < 3 ? part : encodeURIComponent(part)).join('/') : null;
  const title = resource.displayTitle || resource.title || resource.fileName;

  const officeExts = ["docx", "doc", "xlsx", "xls", "pptx", "ppt"];
  const imageExts = ["png", "jpg", "jpeg", "webp"];
  const audioExts = ["mp3", "m4a", "wav", "aac", "ogg"];
  const videoExts = ["mp4"];

  const renderContent = () => {
    if (ext === "pdf") {
  const googleUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  return (
    <div className="relative w-full h-full">
      {iframeLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 rounded-lg z-10">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
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
    // Fallback
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
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-xl flex-shrink-0">
              {FILE_ICONS[ext]?.icon || "📎"}
            </span>
            <div className="min-w-0">
              <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
              {resource.fileSize && (
                <p className="text-gray-500 text-xs">{formatSize(resource.fileSize)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-4">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default function DistrictResourcesPage() {
  const { stateSlug, districtSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [allResources, setAllResources] = useState([]);
  const [sectionAvailability, setSectionAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState("");
  const [stateName, setStateName] = useState("");
  const [purchased, setPurchased] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const activeSection = searchParams.get("section") || searchParams.get("tab") || "history";
  const { isAuthenticated, openAuthModal } = useAuth();
  const [mcqFlowState, setMcqFlowState] = useState(null);

  useEffect(() => {
    setMcqFlowState(null);
  }, [activeSection]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/state/${stateSlug}/district/${districtSlug}`);
        const products = Array.isArray(res) ? res : (res?.data || []);
        setAllResources(products);
        if (products.length > 0) {
          setDistrictName(products[0].district || products[0].districtName || districtSlug);
          setStateName(products[0].state || products[0].stateName || stateSlug);
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
          setPurchased(list.includes(districtSlug));
        } catch { /* not logged in */ }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        setSelectedResource({ ...resource, s3Url: signedUrl });
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

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setSelectedResource(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const freeResources = allResources.filter(r => r.free || r.isFree || r.price === 0);
  const paidResources = allResources.filter(r => !r.free && !r.isFree && r.price > 0);

  const getFilteredSectionResources = (sectionId) => {
    if (sectionId === "paid") return paidResources;
    return freeResources.filter((p) => {
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

  const displayed = getFilteredSectionResources(activeSection);
  const isPaidTab = activeSection === "paid";
  const sectionLabels = {
    history: "History",
    "heritage-monuments": "Heritage Sites & Monuments",
    geography: "Geography",
    "art-culture": "Art & Culture",
    paid: "Paid District Package (₹99)"
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 animate-pulse">Loading resources...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      {selectedResource && (
        <ResourceModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}

      <div className="max-w-6xl mx-auto space-y-6">
        <button onClick={() => navigate(`/states-browse/${stateSlug}`)}
          className="text-gray-400 hover:text-amber-400 flex items-center gap-1 text-sm">
          ← Back to Districts
        </button>
        <div>
          <h1 className="text-3xl font-bold text-amber-400 mb-1">{districtName}</h1>
          <p className="text-gray-400">{stateName}</p>
        </div>

        {/* Section Tabs */}
        <StateSectionTabs
          stateSlug={stateSlug}
          districtSlug={districtSlug}
          activeSection={activeSection}
          sectionAvailability={sectionAvailability}
          onSectionChange={(secId) => setSearchParams({ section: secId })}
        />

        {/* Section View Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Active Section:</span>
            <span className="text-sm font-bold text-amber-400">
              {sectionLabels[activeSection] || activeSection}
            </span>
          </div>

          <button
            onClick={() => setSearchParams({ section: activeSection === "paid" ? "history" : "paid" })}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 ${
              activeSection === "paid"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-md"
                : "bg-gray-900/80 text-gray-400 border-gray-700 hover:text-amber-400 hover:border-gray-600"
            }`}
          >
            <span>🔒 Paid District Package ({paidResources.length})</span>
            {purchased && <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded">Unlocked</span>}
          </button>
        </div>

        {/* Paid tab locked state */}
        {isPaidTab && !purchased && paidResources.length > 0 && (
          <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Unlock {districtName}</h3>
            <p className="text-gray-400 mb-6">Get access to all {paidResources.length} paid resources for this district</p>
            <button
              onClick={() => navigate(`/states-browse/${stateSlug}`)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg transition-colors">
              Unlock District
            </button>
          </div>
        )}

        {/* Resources grid */}
        {(!isPaidTab || purchased) && (
          displayed.length === 0 ? (
            <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-12 text-center space-y-4 max-w-xl mx-auto shadow-xl my-6 animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto text-2xl">
                ⏳
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold uppercase tracking-widest rounded-full inline-block">
                Coming Soon
              </span>
              <h3 className="text-xl font-bold text-white font-serif">
                {sectionLabels[activeSection] || activeSection} — {districtName}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed max-w-md mx-auto">
                Study resources for <strong className="text-amber-400 font-semibold">{sectionLabels[activeSection] || activeSection}</strong> in <strong className="text-white font-semibold">{districtName}</strong> are currently being prepared by our editorial team and will be available soon.
              </p>
            </div>
          ) : (
            mcqFlowState ? (
              <ChambaMCQFeature
                onBack={() => setMcqFlowState(null)}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayed.map(r => {
                  const ext = (r.fileExtension || "").toLowerCase();
                  const meta = FILE_ICONS[ext] || { icon: "📎", color: "text-gray-400", label: ext.toUpperCase() || "FILE" };
                  const titleNorm = (r.title || r.displayTitle || r.fileName || "").toLowerCase();
                  const isChambaMCQ = (stateSlug === 'himachal-pradesh' && districtSlug.includes('chamba')) &&
                                       (titleNorm.includes("sample mcqs question bank chamba district") ||
                                        titleNorm.includes("chamba district practice mcq"));
                  return (
                    <div key={r.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500 transition-all duration-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{meta.icon}</span>
                        <span className={`text-xs font-bold uppercase ${meta.color} bg-gray-800 px-2 py-0.5 rounded`}>
                          {meta.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                        {r.displayTitle || r.title || r.fileName}
                      </h3>
                      {r.fileSize && <p className="text-xs text-gray-500 mb-3">{formatSize(r.fileSize)}</p>}
                      {isChambaMCQ ? (
                        <div className="flex gap-2 mt-3 w-full">
                          <button
                            onClick={() => handleOpenResource(r)}
                            className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-2.5 rounded-lg transition-colors text-xs md:text-sm">
                            View PDF
                          </button>
                          <button
                            onClick={() => {
                              if (!isAuthenticated) {
                                openAuthModal('welcome');
                              } else {
                                  setMcqFlowState('select-level');
                              }
                            }}
                            className="flex-1 text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-2.5 rounded-lg transition-colors text-xs md:text-sm">
                            Practice MCQs
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenResource(r)}
                          className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm mt-3">
                          View
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}




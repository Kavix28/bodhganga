import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

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
  const audioExts = ["mp3", "m4a", "wav"];

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
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
  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState("");
  const [stateName, setStateName] = useState("");
  const [purchased, setPurchased] = useState(false);
  const [selectedResource, setSelectedResource] = useState(null);
  const activeTab = searchParams.get("tab") || "free";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/products/state/${stateSlug}/district/${districtSlug}`);
        const products = Array.isArray(res) ? res : (res?.data || []);
        setAllResources(products);
        if (products.length > 0) {
          setDistrictName(products[0].district || products[0].districtName || districtSlug);
          setStateName(products[0].state || products[0].stateName || stateSlug);
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

  // Close modal on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") setSelectedResource(null); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const freeResources = allResources.filter(r => r.free || r.isFree || r.price === 0);
  const paidResources = allResources.filter(r => !r.free && !r.isFree && r.price > 0);
  const displayed = activeTab === "free" ? freeResources : paidResources;

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 animate-pulse">Loading resources...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      {selectedResource && (
        <ResourceModal resource={selectedResource} onClose={() => setSelectedResource(null)} />
      )}

      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(`/states-browse/${stateSlug}`)}
          className="text-gray-400 hover:text-amber-400 mb-6 flex items-center gap-1 text-sm">
          ← Back to Districts
        </button>
        <h1 className="text-3xl font-bold text-amber-400 mb-1">{districtName}</h1>
        <p className="text-gray-400 mb-6">{stateName}</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-gray-800">
          <button
            onClick={() => setSearchParams({ tab: "free" })}
            className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors
              ${activeTab === "free"
                ? "bg-green-900 text-green-300 border-b-2 border-green-400"
                : "text-gray-500 hover:text-white"}`}>
            Free ({freeResources.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: "paid" })}
            className={`px-5 py-2 text-sm font-semibold rounded-t-lg transition-colors
              ${activeTab === "paid"
                ? "bg-amber-900 text-amber-300 border-b-2 border-amber-400"
                : "text-gray-500 hover:text-white"}`}>
            Paid ({paidResources.length})
          </button>
        </div>

        {/* Paid tab locked state */}
        {activeTab === "paid" && !purchased && paidResources.length > 0 && (
          <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">Unlock {districtName}</h3>
            <p className="text-gray-400 mb-6">Get access to all {paidResources.length} paid resources for just ₹1</p>
            <button
              onClick={() => navigate(`/states-browse/${stateSlug}`)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg transition-colors">
              Unlock for ₹1
            </button>
          </div>
        )}

        {/* Resources grid */}
        {(activeTab === "free" || purchased) && (
          displayed.length === 0 ? (
            <div className="text-gray-500 text-center py-20">No resources in this section.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayed.map(r => {
                const ext = (r.fileExtension || "").toLowerCase();
                const meta = FILE_ICONS[ext] || { icon: "📎", color: "text-gray-400", label: ext.toUpperCase() || "FILE" };
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
                    <button
                      onClick={() => setSelectedResource(r)}
                      className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm mt-3">
                      View
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}




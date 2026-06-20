import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

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
  const audioExts  = ["mp3", "m4a", "wav"];

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
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
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors"
            >
              ⬇ Download
            </a>
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
            <iframe src={url} className="w-full h-full rounded-lg" title={title} />
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
              <a
                href={url}
                download
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-lg"
              >
                Download File
              </a>
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
  const activeTab = searchParams.get("tab") || "free";

  const [allResources, setAllResources] = useState([]);
  const [districtName, setDistrictName] = useState("");
  const [stateName, setStateName]   = useState("");
  const [loading, setLoading]       = useState(true);
  const [purchased, setPurchased]   = useState(false);
  const [selected, setSelected]     = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Use the existing district-level endpoint
        const res = await api.get(`/products/state/${stateSlug}/district/${districtSlug}`);
        const products = Array.isArray(res) ? res : (res?.data || []);
        setAllResources(products);
        if (products.length > 0) {
          setDistrictName(products[0].district || products[0].districtName || districtSlug);
          setStateName(products[0].state   || products[0].stateName   || stateSlug);
        }
        // Check purchase status (silently fail when not logged in)
        try {
          const pRes = await api.get("/payment/district/purchased");
          const list = Array.isArray(pRes) ? pRes : (pRes?.data || []);
          setPurchased(list.includes(districtSlug));
        } catch { /* unauthenticated */ }
      } catch (err) {
        console.error("Failed to load resources:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [stateSlug, districtSlug]);

  const freeRes = allResources.filter((r) => r.free || r.isFree || r.price === 0);
  const paidRes = allResources.filter((r) => !r.free && !r.isFree && r.price > 0);
  const shown   = activeTab === "free" ? freeRes : paidRes;

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-gray-800">
          <button
            onClick={() => setSearchParams({ tab: "free" })}
            className={[
              "px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors",
              activeTab === "free"
                ? "bg-green-900/60 text-green-300 border-b-2 border-green-500"
                : "text-gray-500 hover:text-white",
            ].join(" ")}
          >
            🟢 Free ({freeRes.length})
          </button>
          <button
            onClick={() => setSearchParams({ tab: "paid" })}
            className={[
              "px-5 py-2.5 text-sm font-bold rounded-t-lg transition-colors",
              activeTab === "paid"
                ? "bg-amber-900/60 text-amber-300 border-b-2 border-amber-500"
                : "text-gray-500 hover:text-white",
            ].join(" ")}
          >
            🔒 Paid ({paidRes.length})
          </button>
        </div>

        {/* Paid tab — locked state */}
        {activeTab === "paid" && !purchased && paidRes.length > 0 && (
          <div className="text-center py-16 border border-gray-800 rounded-xl bg-gray-900/60 mb-8">
            <div className="text-5xl mb-4">🔒</div>
            <h3 className="text-xl font-bold text-white mb-2">
              Unlock {districtName}
            </h3>
            <p className="text-gray-400 mb-6 text-sm">
              Get access to all {paidRes.length} paid resources for this district
            </p>
            <button
              onClick={() => navigate(`/states-browse/${stateSlug}`)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Unlock District →
            </button>
          </div>
        )}

        {/* Resources grid */}
        {(activeTab === "free" || purchased) && (
          shown.length === 0 ? (
            <div className="text-gray-600 text-center py-20">
              No resources in this section yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {shown.map((r) => {
                const ext  = (r.fileExtension || "").toLowerCase();
                const meta = FILE_ICONS[ext] || { icon: "📎", color: "text-gray-400", label: ext.toUpperCase() || "FILE" };
                const title = r.displayTitle || r.title || r.fileName;
                return (
                  <div
                    key={r.id}
                    className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-amber-500 transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{meta.icon}</span>
                      <span className={`text-[10px] font-bold uppercase ${meta.color} bg-gray-800 px-2 py-0.5 rounded`}>
                        {meta.label}
                      </span>
                      {(r.free || r.isFree || r.price === 0) && (
                        <span className="text-[10px] font-bold uppercase text-green-400 bg-green-900/40 border border-green-800 px-2 py-0.5 rounded ml-auto">
                          Free
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2 flex-1">
                      {title}
                    </h3>
                    {r.fileSize && (
                      <p className="text-xs text-gray-500 mb-3">{formatSize(r.fileSize)}</p>
                    )}
                    <button
                      onClick={() => setSelected(r)}
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-4 rounded-lg text-sm transition-colors mt-2"
                    >
                      View Resource
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

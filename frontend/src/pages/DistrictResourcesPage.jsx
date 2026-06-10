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
  m4a:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  mp3:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
  wav:  { icon: "🎵", color: "text-pink-400",   label: "Audio" },
};

function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const activeTab = searchParams.get("tab") || "free";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/api/products/state/${stateSlug}/district/${districtSlug}`);
        const products = res.data?.data || [];
        setAllResources(products);
        if (products.length > 0) {
          setDistrictName(products[0].district || products[0].districtName || districtSlug);
          setStateName(products[0].state || products[0].stateName || stateSlug);
        }
        try {
          const pRes = await api.get("/api/payment/district/purchased");
          const list = pRes.data?.data || [];
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
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(`/states/${stateSlug}`)}
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
            <p className="text-gray-400 mb-6">Get access to all {paidResources.length} paid resources for just ₹99</p>
            <button
              onClick={() => navigate(`/states/${stateSlug}`)}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 px-8 rounded-lg transition-colors">
              Unlock for ₹99
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
                    <a href={r.s3Url} target="_blank" rel="noopener noreferrer"
                      className="block w-full text-center bg-amber-500 hover:bg-amber-400 text-black font-semibold py-2 px-4 rounded-lg transition-colors text-sm mt-3">
                      View / Download
                    </a>
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
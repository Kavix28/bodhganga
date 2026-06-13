import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

const FILE_ICONS = {
  pdf:  { icon: "??", color: "text-red-400",    label: "PDF" },
  docx: { icon: "??", color: "text-blue-400",   label: "DOCX" },
  doc:  { icon: "??", color: "text-blue-400",   label: "DOC" },
  xlsx: { icon: "??", color: "text-green-400",  label: "XLSX" },
  xls:  { icon: "??", color: "text-green-400",  label: "XLS" },
  pptx: { icon: "??", color: "text-orange-400", label: "PPTX" },
  png:  { icon: "???", color: "text-purple-400", label: "Image" },
  jpg:  { icon: "???", color: "text-purple-400", label: "Image" },
  jpeg: { icon: "???", color: "text-purple-400", label: "Image" },
  webp: { icon: "???", color: "text-purple-400", label: "Image" },
  mp3:  { icon: "??", color: "text-pink-400",   label: "Audio" },
  m4a:  { icon: "??", color: "text-pink-400",   label: "Audio" },
  wav:  { icon: "??", color: "text-pink-400",   label: "Audio" },
};

function formatSize(bytes) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ResourcesPage() {
  const { stateSlug, districtSlug } = useParams();
  const navigate = useNavigate();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [districtName, setDistrictName] = useState("");
  const [stateName, setStateName] = useState("");
  const [redirect, setRedirect] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(
          `/api/products/state/${stateSlug}/district/${districtSlug}`
        );
        const products = res.data?.data || [];

        if (products.length > 0) {
          setDistrictName(products[0].district || products[0].districtName || districtSlug);
          setStateName(products[0].state || products[0].stateName || stateSlug);
        }

        const allFree = products.every(p => p.isFree === true);

        if (!allFree) {
          try {
            const pRes = await api.get("/payment/district/purchased");
            const purchased = pRes.data?.data || [];
            if (!purchased.includes(districtSlug)) {
              setRedirect({ to: `/store/${stateSlug}`, msg: "Please unlock this district to view resources" });
              return;
            }
          } catch {
            setRedirect({ to: "/login", msg: "Please log in to view these resources" });
            return;
          }
        }

        setResources(products);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [stateSlug, districtSlug]);

  useEffect(() => {
    if (redirect) {
      toast.error(redirect.msg);
      navigate(redirect.to);
    }
  }, [redirect, navigate]);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 animate-pulse">Loading resources...</div>
    </div>
  );

  if (redirect) return null;

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(`/store/${stateSlug}`)}
          className="text-gray-400 hover:text-amber-400 mb-6 flex items-center gap-1 text-sm">
          ? Back to Districts
        </button>
        <h1 className="text-3xl font-bold text-amber-400 mb-1">{districtName}</h1>
        <p className="text-gray-400 mb-8">
          {stateName} · {resources.length} resource{resources.length !== 1 ? "s" : ""}
        </p>
        {resources.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No resources found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resources.map(r => {
              const ext = (r.fileExtension || "").toLowerCase();
              const meta = FILE_ICONS[ext] || { icon: "??", color: "text-gray-400", label: ext.toUpperCase() };
              return (
                <div key={r.id}
                  className="bg-gray-900 border border-gray-800 rounded-xl p-5
                             hover:border-amber-500 transition-all duration-200">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{meta.icon}</span>
                    <span className={`text-xs font-bold uppercase ${meta.color} bg-gray-800 px-2 py-0.5 rounded`}>
                      {meta.label}
                    </span>
                    {r.isFree && (
                      <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full ml-auto">
                        Free
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                    {r.title || r.displayTitle || r.fileName}
                  </h3>
                  {r.fileSize && (
                    <p className="text-xs text-gray-500 mb-3">{formatSize(r.fileSize)}</p>
                  )}
                  <a href={r.s3Url} target="_blank" rel="noopener noreferrer"
                    className="block w-full text-center bg-amber-500 hover:bg-amber-400
                               text-black font-semibold py-2 px-4 rounded-lg
                               transition-colors text-sm mt-3">
                    View / Download
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

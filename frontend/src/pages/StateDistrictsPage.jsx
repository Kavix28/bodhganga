import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StateDistrictsPage() {
  const { stateSlug } = useParams();
  const navigate = useNavigate();
  const [districts, setDistricts] = useState([]);
  const [stateName, setStateName] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch all published drive products for this state
        const res = await api.get(`/products/state/${stateSlug}`);
        const products = Array.isArray(res)
          ? res
          : res?.data?.content || res?.data || [];

        if (products.length > 0) {
          setStateName(products[0].state || products[0].stateName || stateSlug);
        }

        // Group by districtSlug → count free and paid per district
        const districtMap = {};
        products.forEach((p) => {
          const dSlug = p.districtSlug;
          const dName = p.district || p.districtName || dSlug;
          if (!dSlug) return;
          if (!districtMap[dSlug]) {
            districtMap[dSlug] = { districtSlug: dSlug, districtName: dName, free: 0, paid: 0, total: 0 };
          }
          districtMap[dSlug].total++;
          if (p.free || p.isFree || p.price === 0) districtMap[dSlug].free++;
          else districtMap[dSlug].paid++;
        });

        setDistricts(Object.values(districtMap).sort((a, b) => a.districtName.localeCompare(b.districtName)));
      } catch (err) {
        console.error("Failed to load districts:", err);
        setError("Could not load district data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [stateSlug]);

  const filtered = districts.filter((d) =>
    d.districtName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-amber-400 text-sm font-semibold">Loading districts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate("/state")}
            className="text-gray-500 hover:text-amber-400 text-sm mb-4 flex items-center gap-1 transition-colors"
          >
            ← Back to All States
          </button>
          <h1 className="text-3xl font-extrabold text-amber-400 mb-1">{stateName || stateSlug}</h1>
          <p className="text-gray-400 text-sm">
            Select a district to access study materials
          </p>
          {!loading && (
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider mt-2">
              {districts.length} district{districts.length !== 1 ? "s" : ""} available
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {error ? (
          <div className="text-red-400 text-center py-20 space-y-3">
            <div className="text-4xl">⚠️</div>
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-amber-400 underline text-sm"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {/* Search */}
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search districts…"
              className="w-full max-w-sm bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 mb-8 transition-colors"
            />

            {filtered.length === 0 ? (
              <div className="text-gray-600 text-center py-20">
                {search ? `No districts matching "${search}"` : "No districts found for this state."}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map((d) => (
                  <DistrictCard
                    key={d.districtSlug}
                    district={d}
                    onClick={() =>
                      navigate(`/state/${stateSlug}/district/${d.districtSlug}/products`)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function DistrictCard({ district, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-gray-900 border border-gray-800 hover:border-amber-500 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/10 hover:-translate-y-0.5 group"
    >
      <div className="flex justify-between items-start mb-2">
        <h2 className="text-sm font-bold text-white leading-snug">{district.districtName}</h2>
        <span className="text-amber-400 text-base group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-2">
          →
        </span>
      </div>

      {/* Resource count badges */}
      <div className="flex gap-2 flex-wrap mt-3">
        {district.free > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-green-900/60 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
            {district.free} Free
          </span>
        )}
        {district.paid > 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-900/60 text-amber-400 border border-amber-800 px-2 py-0.5 rounded-full">
            {district.paid} Paid
          </span>
        )}
        {district.total === 0 && (
          <span className="text-[10px] font-bold uppercase tracking-wider bg-gray-800 text-gray-500 px-2 py-0.5 rounded-full">
            No resources
          </span>
        )}
      </div>
    </div>
  );
}


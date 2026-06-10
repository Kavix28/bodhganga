import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function StatePage() {
  const [states, setStates] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/api/states/available")
      .then(res => {
        const data = res.data?.data || res.data;
        setStates(Array.isArray(data) ? data : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-amber-400 text-lg animate-pulse">Loading states...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white px-4 py-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">Study Resources</h1>
        <p className="text-gray-400 mb-8">Select your state to explore district-wise study material</p>
        {states.length === 0 ? (
          <div className="text-gray-500 text-center py-20">No states available yet.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {states.map(state => (
              <div
                key={state.stateSlug || state.slug}
                onClick={() => navigate(`/store/${state.stateSlug || state.slug}`)}
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 cursor-pointer hover:border-amber-500 hover:bg-gray-800 transition-all duration-200"
              >
                <h2 className="text-xl font-bold text-white mb-2">
                  {state.stateName || state.name}
                </h2>
                <div className="flex gap-4 text-sm text-gray-400 mb-4">
                  <span>{state.districtCount ?? "—"} Districts</span>
                  <span>{state.resourceCount ?? "—"} Resources</span>
                </div>
                <div className="flex items-center text-amber-400 text-sm font-medium">
                  Explore <span className="ml-1">→</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
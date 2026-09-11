import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { getStateImage } from "../utils/stateImageUtils";
const GRADS = [
  "from-emerald-900 to-teal-800",
  "from-amber-900 to-orange-800",
  "from-blue-900 to-indigo-800",
  "from-purple-900 to-violet-800",
  "from-rose-900 to-pink-800",
  "from-cyan-900 to-sky-800",
  "from-lime-900 to-green-800",
  "from-red-900 to-rose-800",
];

function StateCard({ state, onClick }) {
  const name = state.name || state.stateName || state.id || "";
  const slug = state.id || state.stateSlug || "";
  const count = state.notesCount || 0;
  const isAvailable = state.isAvailable ?? (count > 0);
  const [imgErr, setImgErr] = useState(false);
  const grad = GRADS[name.charCodeAt(0) % GRADS.length];

  return (
    <div
      onClick={isAvailable ? onClick : undefined}
      className={[
        "rounded-xl overflow-hidden border transition-all duration-200 group relative h-full flex flex-col",
        isAvailable
          ? "border-gray-700 hover:border-amber-500 cursor-pointer hover:shadow-lg hover:shadow-amber-500/10"
          : "border-gray-800 opacity-50 cursor-not-allowed",
      ].join(" ")}
    >
      {!imgErr ? (
        <img
          src={getStateImage(slug) || `${S3}/${slug}-image.png`}
          alt={name}
          onError={() => setImgErr(true)}
          className="w-full h-48 object-cover block"
        />
      ) : (
        <div className={`w-full h-48 bg-gradient-to-br ${grad} flex items-center justify-center`}>
          <span className="text-4xl font-bold text-white/20 font-serif">
            {name.charAt(0)}
          </span>
        </div>
      )}
      <div className="absolute top-2 right-2">
        {isAvailable ? (
          <span className="text-xs bg-amber-500 text-black px-2 py-0.5 rounded-full font-bold shadow">
            Available
          </span>
        ) : (
          <span className="text-xs bg-gray-800/90 text-gray-400 border border-gray-700 px-2 py-0.5 rounded-full font-bold shadow">
            Coming Soon
          </span>
        )}
      </div>
      <div className="px-4 py-3 bg-gray-900">
        <div className="flex justify-between items-center">
          <h2 className="text-sm font-bold text-white">{name}</h2>
          {isAvailable ? (
            <span className="text-amber-400 text-xs group-hover:translate-x-0.5 transition-transform">
              &rarr;
            </span>
          ) : (
            <span className="text-gray-600 text-xs">Soon</span>
          )}
        </div>
        <p className="text-white/60 text-xs mt-0.5">
          {isAvailable ? `${count} resource${count !== 1 ? "s" : ""}` : "Content being prepared"}
        </p>
      </div>
    </div>
  );
}

export default function StatesPage() {
  const [states, setStates] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/states/available")
      .then((res) => {
        // /api/states/available returns List<State> directly (no ApiResponseDTO wrapper)
        const data = Array.isArray(res) ? res : (res?.data ?? []);
        setStates(data);
      })
      .catch((err) => {
        console.error("Failed to load states:", err);
        setError("Failed to load states. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      states.filter((s) => {
        const name = s.name || s.stateName || s.id || "";
        return name.toLowerCase().includes(search.toLowerCase());
      }),
    [states, search]
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="px-4 pt-10 pb-6 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">
          States &amp; Union Territories
        </h1>
        <p className="text-gray-400 mb-6">
          Select your state to explore district-wise study material
        </p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search states or UTs..."
          className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="px-4 pb-16 max-w-6xl mx-auto">
        {loading ? (
          <div className="text-amber-400 animate-pulse py-20 text-center">
            Loading states...
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-20">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-gray-500 text-center py-20">
            {search
              ? `No states matching "${search}".`
              : "No states available yet."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 auto-rows-fr">
            {filtered.map((state) => {
              const slug = state.id || state.stateSlug || "";
              return (
                <StateCard
                  key={slug}
                  state={state}
                  onClick={() => navigate("/states-browse/" + slug)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}





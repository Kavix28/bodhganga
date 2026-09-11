import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
//change
import StateNavbar from "../components/states/StateNavbar";

import { getStateImage } from "../utils/stateImageUtils";

const ALL_REGIONS = [
  { name: "Andhra Pradesh", slug: "andhra-pradesh", type: "STATE", region: "South" },
  { name: "Arunachal Pradesh", slug: "arunachal-pradesh", type: "STATE", region: "North-East" },
  { name: "Assam", slug: "assam", type: "STATE", region: "North-East" },
  { name: "Bihar", slug: "bihar", type: "STATE", region: "East" },
  { name: "Chhattisgarh", slug: "chhattisgarh", type: "STATE", region: "Central" },
  { name: "Goa", slug: "goa", type: "STATE", region: "West" },
  { name: "Gujarat", slug: "gujarat", type: "STATE", region: "West" },
  { name: "Haryana", slug: "haryana", type: "STATE", region: "North" },
  { name: "Himachal Pradesh", slug: "himachal-pradesh", type: "STATE", region: "North" },
  { name: "Jharkhand", slug: "jharkhand", type: "STATE", region: "East" },
  { name: "Karnataka", slug: "karnataka", type: "STATE", region: "South" },
  { name: "Kerala", slug: "kerala", type: "STATE", region: "South" },
  { name: "Madhya Pradesh", slug: "madhya-pradesh", type: "STATE", region: "Central" },
  { name: "Maharashtra", slug: "maharashtra", type: "STATE", region: "West" },
  { name: "Manipur", slug: "manipur", type: "STATE", region: "North-East" },
  { name: "Meghalaya", slug: "meghalaya", type: "STATE", region: "North-East" },
  { name: "Mizoram", slug: "mizoram", type: "STATE", region: "North-East" },
  { name: "Nagaland", slug: "nagaland", type: "STATE", region: "North-East" },
  { name: "Odisha", slug: "odisha", type: "STATE", region: "East" },
  { name: "Punjab", slug: "punjab", type: "STATE", region: "North" },
  { name: "Rajasthan", slug: "rajasthan", type: "STATE", region: "North" },
  { name: "Sikkim", slug: "sikkim", type: "STATE", region: "North-East" },
  { name: "Tamil Nadu", slug: "tamil-nadu", type: "STATE", region: "South" },
  { name: "Telangana", slug: "telangana", type: "STATE", region: "South" },
  { name: "Tripura", slug: "tripura", type: "STATE", region: "North-East" },
  { name: "Uttar Pradesh", slug: "uttar-pradesh", type: "STATE", region: "North" },
  { name: "Uttarakhand", slug: "uttarakhand", type: "STATE", region: "North" },
  { name: "West Bengal", slug: "west-bengal", type: "STATE", region: "East" },
  { name: "Delhi", slug: "delhi", type: "UT", region: "North" },
  { name: "Jammu & Kashmir", slug: "jammu-and-kashmir", type: "UT", region: "North" },
  { name: "Ladakh", slug: "ladakh", type: "UT", region: "North" },
  { name: "Puducherry", slug: "puducherry", type: "UT", region: "South" },
  { name: "Chandigarh", slug: "chandigarh", type: "UT", region: "North" },
  { name: "Lakshadweep", slug: "lakshadweep", type: "UT", region: "South" },
  { name: "Andaman & Nicobar Islands", slug: "andaman-and-nicobar-islands", type: "UT", region: "East" },
  { name: "Dadra & Nagar Haveli and Daman & Diu", slug: "dnh-dd", type: "UT", region: "West" },
];

const GRADIENTS = [
  ["#1a4731", "#0f5132"],
  ["#1e3a5f", "#1d4ed8"],
  ["#4a1942", "#7e22ce"],
  ["#5c2800", "#c2410c"],
  ["#1a3a1a", "#15803d"],
  ["#3b1f00", "#b45309"],
  ["#1a1a3e", "#4338ca"],
  ["#2d1b69", "#6d28d9"],
];



function getGradient(name) {
  const idx = name.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

const REGIONS_FILTER = ["All", "North", "South", "East", "West", "Central", "North-East"];
const TYPE_FILTERS = [
  { id: "all", label: "All Regions (36)" },
  { id: "STATE", label: "28 States" },
  { id: "UT", label: "8 UTs" },
];

function StateCard({ region, isActive, productCount, onClick }) {
  const [g1, g2] = getGradient(region.name);
  const img = getStateImage(region.slug);
  return (
    <div
      onClick={isActive ? onClick : undefined}
      className={[
        "relative rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col justify-between",
        isActive
          ? "border-amber-500/30 cursor-pointer hover:border-amber-400/60 hover:shadow-lg hover:shadow-amber-900/20 hover:-translate-y-0.5"
          : "border-gray-800/80 opacity-60 cursor-not-allowed bg-gray-900/40",
      ].join(" ")}
    >
      <div className="w-full relative">
        {img ? (
          <img src={img} alt={region.name} className={`w-full h-auto block ${!isActive ? "filter grayscale brightness-75" : ""}`} />
        ) : (
          <div className="w-full" style={{aspectRatio:"16/9", background:`linear-gradient(135deg, ${g1}, ${g2})`}} />
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        <div className="absolute top-2 right-2">
          {isActive ? (
            <span className="text-[9px] font-black uppercase tracking-widest bg-amber-500 text-black px-1.5 py-0.5 rounded-md shadow">
              ACTIVE
            </span>
          ) : (
            <span className="text-[9px] font-black uppercase tracking-widest bg-gray-800/90 text-gray-400 border border-gray-700/60 px-1.5 py-0.5 rounded-md shadow">
              COMING SOON
            </span>
          )}
        </div>
      </div>
      <div
        className="px-3.5 py-3 flex items-center justify-between gap-2"
        style={{ background: `linear-gradient(135deg, ${g1}cc, ${g2}cc)` }}
      >
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">{region.name}</h2>
          <p className="text-xs text-gray-300/90 mt-0.5">
            {isActive
              ? productCount > 0
                ? `${productCount} resource${productCount !== 1 ? "s" : ""}`
                : "Resources available"
              : "Content being prepared"}
          </p>
        </div>
        {isActive ? (
          <span className="text-amber-400 text-lg flex-shrink-0 font-bold">→</span>
        ) : (
          <span className="text-gray-500 text-xs flex-shrink-0 font-medium">Soon</span>
        )}
      </div>
    </div>
  );
}

export default function AllStatesPage() {
  const navigate = useNavigate();
  const [productCounts, setProductCounts] = useState({});
  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("All");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/states/available");
        const stateList = Array.isArray(res) ? res : (res?.data || []);
        const counts = {};
        const avail = {};
        stateList.forEach((s) => {
          const slug = s.stateSlug || s.id || (s.name ? s.name.toLowerCase().replace(/\s+/g, "-") : "");
          if (slug) {
            counts[slug] = s.notesCount || 0;
            avail[slug] = s.isAvailable ?? ((s.notesCount || 0) > 0);
          }
        });
        setProductCounts(counts);
        setAvailability(avail);
      } catch (err) {
        console.error("Failed to load canonical states:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return ALL_REGIONS.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (regionFilter !== "All" && r.region !== regionFilter) return false;
      if (search.trim()) return r.name.toLowerCase().includes(search.toLowerCase());
      return true;
    });
  }, [search, typeFilter, regionFilter]);

  const { availableStates, comingSoonStates } = useMemo(() => {
    const available = [];
    const comingSoon = [];
    filtered.forEach((r) => {
      const count = productCounts[r.slug] || 0;
      const isAvail = availability[r.slug] ?? (count > 0);
      if (isAvail) {
        available.push(r);
      } else {
        comingSoon.push(r);
      }
    });
    return { availableStates: available, comingSoonStates: comingSoon };
  }, [filtered, availability, productCounts]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
            <span>IN</span>
            <span>BodhGanga Academy · NDDE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            States & Union Territories
          </h1>
          <p className="text-gray-400 text-sm max-w-xl">
            Select your state to explore district-wise study material - notes, maps, MCQs and more curated for every major PSC examination.
          </p>
          {!loading && (
            <div className="flex gap-6 mt-5 text-xs font-bold uppercase tracking-wider text-gray-500">
              <span><span className="text-amber-400 text-base font-extrabold">{availableStates.length}</span> Available Now</span>
              <span>·</span>
              <span><span className="text-gray-400 text-base font-extrabold">{comingSoonStates.length}</span> Coming Soon</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-4 space-y-4">
        <div className="flex gap-1.5 bg-gray-900 p-1 rounded-xl border border-gray-800 inline-flex">
          {TYPE_FILTERS.map((t) => (
            <button key={t.id} onClick={() => setTypeFilter(t.id)}
              className={["px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all",
                typeFilter === t.id ? "bg-amber-500 text-black shadow" : "text-gray-400 hover:text-white"].join(" ")}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search states or UTs..."
            className="w-full sm:max-w-xs bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 transition-colors" />
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600">Zone:</span>
            {REGIONS_FILTER.map((r) => (
              <button key={r} onClick={() => setRegionFilter(r)}
                className={["px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                  regionFilter === r ? "bg-gray-700 text-amber-400 border border-amber-500/50" : "bg-gray-900 text-gray-500 border border-gray-800 hover:border-gray-600 hover:text-gray-300"].join(" ")}>
                {r}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
          Showing {filtered.length} regions ({availableStates.length} available, {comingSoonStates.length} coming soon)
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-20 space-y-12">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-gray-900 border border-gray-800 animate-pulse">
                <div className="w-full bg-gray-800 rounded-t-2xl" style={{aspectRatio:"16/9"}} />
                <div className="px-4 py-3 space-y-2">
                  <div className="h-3 bg-gray-800 rounded w-3/4" />
                  <div className="h-2 bg-gray-800 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <p className="font-bold">No states match your search</p>
            <button onClick={() => { setSearch(""); setRegionFilter("All"); setTypeFilter("all"); }}
              className="mt-4 text-amber-400 text-sm underline">Clear filters</button>
          </div>
        ) : (
          <>
            {/* AVAILABLE NOW SECTION */}
            {availableStates.length > 0 && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-amber-400 flex items-center gap-2 tracking-tight">
                      <span>👑</span> Available Now
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Study materials are currently available for these states. Start exploring now!
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full self-start sm:self-center">
                    Showing {availableStates.length} state{availableStates.length !== 1 ? 's' : ''} with available resources
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {availableStates.map((r) => {
                    const count = productCounts[r.slug] || 0;
                    return (
                      <StateCard
                        key={r.slug}
                        region={r}
                        isActive={true}
                        productCount={count}
                        onClick={() => navigate(`/state/${r.slug}/districts`)}
                      />
                    );
                  })}
                </div>
              </section>
            )}

            {/* COMING SOON SECTION */}
            {comingSoonStates.length > 0 && (
              <section className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-800">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-300 flex items-center gap-2 tracking-tight">
                      <span>⌛</span> Coming Soon
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                      Study materials for these states are under preparation. We'll notify you once they're available!
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 bg-gray-800/80 border border-gray-700 px-3 py-1 rounded-full self-start sm:self-center">
                    Showing {comingSoonStates.length} state{comingSoonStates.length !== 1 ? 's' : ''}/UTs coming soon
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {comingSoonStates.map((r) => {
                    const count = productCounts[r.slug] || 0;
                    return (
                      <StateCard
                        key={r.slug}
                        region={r}
                        isActive={false}
                        productCount={count}
                        onClick={() => {}}
                      />
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}








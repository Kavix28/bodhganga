import { useEffect, useState } from "react";
import { Map, MapPin, BookOpen, Gift, Gem } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

import { getStateImage } from "../utils/stateImageUtils";

const ALL_STATES = [
  { name: "Andhra Pradesh", slug: "andhra-pradesh" },
  { name: "Arunachal Pradesh", slug: "arunachal-pradesh" },
  { name: "Assam", slug: "assam" },
  { name: "Bihar", slug: "bihar" },
  { name: "Chhattisgarh", slug: "chhattisgarh" },
  { name: "Goa", slug: "goa" },
  { name: "Gujarat", slug: "gujarat" },
  { name: "Haryana", slug: "haryana" },
  { name: "Himachal Pradesh", slug: "himachal-pradesh" },
  { name: "Jharkhand", slug: "jharkhand" },
  { name: "Karnataka", slug: "karnataka" },
  { name: "Kerala", slug: "kerala" },
  { name: "Madhya Pradesh", slug: "madhya-pradesh" },
  { name: "Maharashtra", slug: "maharashtra" },
  { name: "Manipur", slug: "manipur" },
  { name: "Meghalaya", slug: "meghalaya" },
  { name: "Mizoram", slug: "mizoram" },
  { name: "Nagaland", slug: "nagaland" },
  { name: "Odisha", slug: "odisha" },
  { name: "Punjab", slug: "punjab" },
  { name: "Rajasthan", slug: "rajasthan" },
  { name: "Sikkim", slug: "sikkim" },
  { name: "Tamil Nadu", slug: "tamil-nadu" },
  { name: "Telangana", slug: "telangana" },
  { name: "Tripura", slug: "tripura" },
  { name: "Uttar Pradesh", slug: "uttar-pradesh" },
  { name: "Uttarakhand", slug: "uttarakhand" },
  { name: "West Bengal", slug: "west-bengal" },
  { name: "Andaman & Nicobar", slug: "andaman-nicobar" },
  { name: "Chandigarh", slug: "chandigarh" },
  { name: "Delhi", slug: "delhi" },
  { name: "DNH & DD", slug: "dnh-dd" },
  { name: "Jammu & Kashmir", slug: "jammu-kashmir" },
  { name: "Ladakh", slug: "ladakh" },
  { name: "Lakshadweep", slug: "lakshadweep" },
  { name: "Puducherry", slug: "puducherry" },
];

const GRADIENTS = [
  ["#1a1a2e", "#16213e"], ["#0f3460", "#533483"],
  ["#1b262c", "#0f4c75"], ["#2d132c", "#ee4540"],
  ["#1a1a2e", "#e94560"], ["#0a3d62", "#1e3799"],
  ["#1b1b2f", "#162447"], ["#191a19", "#1e5128"],
];

function getGradient(name) {
  const idx = name.charCodeAt(0) % GRADIENTS.length;
  return GRADIENTS[idx];
}

function CountUp({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = Math.ceil(target / 40);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setVal(target); clearInterval(timer); }
      else setVal(start);
    }, 30);
    return () => clearInterval(timer);
  }, [target]);
  return <>{val}</>;
}

export default function ExplorePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeStates, setActiveStates] = useState({});
  const [districtCounts, setDistrictCounts] = useState({});
  const [stats, setStats] = useState({ states: 0, districts: 0, total: 0, free: 0, paid: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/products", {
          params: { importedFromDrive: true, published: true, size: 1000 },
        });
        const products = res.data?.content || res.data || [];
        const stateSet = new Set();
        const districtSet = new Set();
        const dCounts = {};
        let free = 0, paid = 0;
        products.forEach((p) => {
          const ss = p.stateSlug || p.state_slug;
          const ds = p.districtSlug || p.district_slug;
          if (ss) { stateSet.add(ss); dCounts[ss] = (dCounts[ss] || new Set()); if (ds) dCounts[ss].add(ds); }
          if (ds) districtSet.add(ds);
          if (p.free) free++; else paid++;
        });
        const activeMap = {};
        stateSet.forEach(s => activeMap[s] = true);
        setActiveStates(activeMap);
        const dcFinal = {};
        Object.keys(dCounts).forEach(s => dcFinal[s] = dCounts[s].size);
        setDistrictCounts(dcFinal);
        setStats({ states: stateSet.size, districts: districtSet.size, total: products.length, free, paid });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const activeList = ALL_STATES.filter(s => activeStates[s.slug]);
  const plannedList = ALL_STATES.filter(s => !activeStates[s.slug]);

  const STATS = [
    { label: "States Covered", value: stats.states, icon: <Map className="w-6 h-6 text-amber-400 mx-auto" />, color: "text-amber-400" },
    { label: "Districts Live", value: stats.districts, icon: <MapPin className="w-6 h-6 text-blue-400 mx-auto" />, color: "text-blue-400" },
    { label: "Study Materials", value: stats.total, icon: <BookOpen className="w-6 h-6 text-green-400 mx-auto" />, color: "text-green-400" },
    { label: "Free Resources", value: stats.free, icon: <Gift className="w-6 h-6 text-emerald-400 mx-auto" />, color: "text-emerald-400" },
    { label: "Paid Resources", value: stats.paid, icon: <Gem className="w-6 h-6 text-purple-400 mx-auto" />, color: "text-purple-400" },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">
            <span>&#x1F1EE;&#x1F1F3;</span>
            <span>BodhGanga Academy</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Explore BodhGanga</h1>
          <p className="text-gray-400 text-sm max-w-xl">Live stats, coverage map and roadmap for district-wise study materials across India.</p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {STATS.map((s) => (
            <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <div className="mb-1">{s.icon}</div>
              <div className={`text-2xl font-extrabold ${s.color}`}>
                {loading ? "—" : <CountUp target={s.value} />}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* States Grid */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 mb-6 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse inline-block" />
          Active States
        </h2>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-gray-900 animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {activeList.map((s) => {
                const [g1, g2] = getGradient(s.name);
                const img = getStateImage(s.slug);
                return (
                  <div key={s.slug} onClick={() => navigate(`/state/${s.slug}/districts`)}
                    className="relative rounded-2xl border border-amber-500/30 overflow-hidden cursor-pointer hover:border-amber-400/60 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
                    <div className="relative">
                      {img ? (
                        <img src={img} alt={s.name} className="w-full h-auto block object-top" />
                      ) : (
                        <div className="w-full h-32" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }} />
                      )}
                      <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest bg-amber-500 text-black px-1.5 py-0.5 rounded-md">ACTIVE</span>
                    </div>
                    <div className="px-3 py-3 flex items-center justify-between gap-2" style={{ background: `linear-gradient(135deg, ${g1}cc, ${g2}cc)` }}><div><h3 className="text-sm font-bold text-white leading-tight">{s.name}</h3><p className="text-xs text-gray-400 mt-0.5">{districtCounts[s.slug] || 0} district{districtCounts[s.slug] !== 1 ? "s" : ""}</p></div><span className="text-amber-400 text-lg flex-shrink-0">→</span></div>
                  </div>
                );
              })}
            </div>

            <h2 className="text-xs font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gray-700 inline-block" />
              Coming Soon
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-10">
              {plannedList.map((s) => {
                const [g1, g2] = getGradient(s.name);
                const img = getStateImage(s.slug);
                return (
                  <div key={s.slug} className="relative rounded-2xl border border-gray-800 overflow-hidden opacity-50 cursor-not-allowed">
                    <div className="relative">
                      {img ? (
                        <img src={img} alt={s.name} className="w-full h-auto block object-top" />
                      ) : (
                        <div className="w-full h-32" style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }} />
                      )}
                      <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-widest bg-gray-800/80 text-gray-400 px-1.5 py-0.5 rounded-md">COMING SOON</span>
                    </div>
                    <div className="px-3 py-3 flex items-center justify-between gap-2" style={{ background: `linear-gradient(135deg, ${g1}cc, ${g2}cc)` }}><div><h3 className="text-sm font-bold text-white leading-tight">{s.name}</h3><p className="text-xs text-gray-400 mt-0.5">Content being prepared</p></div><span className="text-gray-600 text-xs flex-shrink-0">Soon</span></div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}